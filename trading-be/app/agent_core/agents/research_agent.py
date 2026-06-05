import asyncio
import json
import logging
import datetime
import warnings
from typing import Dict, Any, AsyncGenerator, Optional, List, Literal
from concurrent.futures import ThreadPoolExecutor

# Suppress the harmless Pydantic v2 serialization warnings triggered by
# OpenAI Responses API storing a parsed Pydantic instance in AIMessage.parsed
# (declared as `None` in LangChain's schema). The value is correct — only the
# type annotation in LangChain's AIMessage is stale. Pydantic v2 always emits
# these from pydantic/main.py, so we filter by module for reliability.
warnings.filterwarnings(
    "ignore",
    message="Pydantic serializer warnings.*",
    category=UserWarning,
    module="pydantic",
)

from pydantic import BaseModel, Field, field_validator

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from app.agent_core.common.date import normalize_analysis_date
from tradingagents.llm_clients import create_llm_client
from langchain_core.messages import HumanMessage, AIMessageChunk
from app.routers.v1.agent_reports.models.non_relational import AgentLog
from tradingagents.graph.checkpointer import thread_id
from langchain_core.messages import AIMessage, ToolMessage, HumanMessage
from tradingagents.agents.utils.agent_utils import _normalize_language_name
from langgraph.prebuilt import create_react_agent
from app.agent_core.tools import (
    get_current_stock_price,
    get_current_datetime,
    scrape_links,
    query_past_report,
    search_web,
)

logger = logging.getLogger(__name__)

# All possible recommendation values across the full 5-tier scale used by agents
# PortfolioRating: Buy / Overweight / Hold / Underweight / Sell  (Research Manager, Portfolio Manager)
# TraderAction:    Buy / Hold / Sell                             (Trader)
# Plus capitalization variants the LLM may produce
ANY_RECOMMENDATION = Literal[
    "BUY",
    "OVERWEIGHT",
    "HOLD",
    "UNDERWEIGHT",
    "SELL",
    "Buy",
    "Overweight",
    "Hold",
    "Underweight",
    "Sell",
    "STRONG BUY",
    "STRONG SELL",
    "ACCUMULATE",
    "REDUCE",
    "AVOID",
    "NEUTRAL",
]


# Normalize any 5-tier / trader rating → canonical BUY / HOLD / SELL for the frontend
def _normalize_rec(v: str) -> str:
    mapping = {
        "buy": "BUY",
        "strong buy": "BUY",
        "overweight": "BUY",
        "accumulate": "BUY",
        "hold": "HOLD",
        "neutral": "HOLD",
        "equal-weight": "HOLD",
        "equal weight": "HOLD",
        "sell": "SELL",
        "strong sell": "SELL",
        "underweight": "SELL",
        "reduce": "SELL",
        "avoid": "SELL",
    }
    return mapping.get(str(v).lower().strip(), str(v).upper().strip())


class AgentOutputSchema(BaseModel):
    team: Literal["Analyst", "Research", "Execution"]
    agent: str
    # Accept full 5-tier scale + trader actions; store as-is for display
    recommendation: str = Field(description="Investment recommendation from this agent")
    confidence: int = Field(ge=0, le=100)
    summary: str

    @field_validator("recommendation", mode="before")
    @classmethod
    def normalize_agent_rec(cls, v: str) -> str:
        return _normalize_rec(v)


class ForecastDaySchema(BaseModel):
    day: str = Field(description="e.g. D+1, D+2")
    signal: Literal["UP", "DOWN", "FLAT"]
    low: Optional[float] = None
    high: Optional[float] = None
    price: Optional[float] = None


class ReportExtractionSchema(BaseModel):
    change: float = Field(
        default=0.0, description="Percentage change today or from entry"
    )
    agents_count: int = Field(default=0)
    # Normalized to BUY / HOLD / SELL for frontend display
    recommendation: str = Field(
        description="Final recommendation: BUY, OVERWEIGHT, HOLD, UNDERWEIGHT, or SELL"
    )
    confidence: int = Field(default=50, ge=0, le=100)
    current_price: Optional[float] = Field(default=None)
    target_price: Optional[float] = Field(default=None)
    stop_loss: Optional[float] = Field(default=None)
    risk_reward: Optional[float] = Field(default=None)
    summary: str = Field(default="")
    bull_points: List[str] = Field(default_factory=list)
    bear_points: List[str] = Field(default_factory=list)
    agent_outputs: List[AgentOutputSchema] = Field(default_factory=list)
    forecasts: List[ForecastDaySchema] = Field(default_factory=list)

    @field_validator("recommendation", mode="before")
    @classmethod
    def normalize_recommendation(cls, v: str) -> str:
        return _normalize_rec(v)


# Node Name to Readable Agent Name Mapping
AGENT_NAME_MAPPING = {
    "Market Analyst": "Technical Analyst",
    "Sentiment Analyst": "Sentiment Analyst",
    "News Analyst": "News Analyst",
    "Fundamentals Analyst": "Fundamentals Analyst",
    "Bull Researcher": "Bull Researcher",
    "Bear Researcher": "Bear Researcher",
    "Research Manager": "Research Manager",
    "Aggressive Analyst": "Risk Management",
    "Neutral Analyst": "Risk Management",
    "Conservative Analyst": "Risk Management",
    "Portfolio Manager": "Portfolio Manager",
    "Trader": "Trader",
    "System": "System",
    # Mappings for tool nodes
    "tools_market": "Technical Analyst",
    "tools_social": "Sentiment Analyst",
    "tools_news": "News Analyst",
    "tools_fundamentals": "Fundamentals Analyst",
    # Legacy mappings just in case
    "analyst_market": "Technical Analyst",
    "analyst_fundamentals": "Fundamentals Analyst",
    "analyst_social": "Sentiment Analyst",
    "analyst_news": "News Analyst",
    "research_bull": "Bull Researcher",
    "research_bear": "Bear Researcher",
    "research_judge": "Research Manager",
    "risk_aggressive": "Risk Management",
    "risk_conservative": "Risk Management",
    "risk_neutral": "Risk Management",
    "risk_judge": "Portfolio Manager",
    "trader": "Trader",
    "generate_reports": "System",
}


def classify_and_format_message(msg, node_name: str) -> list:
    """
    Classify a message from state_update["messages"] and return list of formatted event dicts.
    """
    events = []

    # 1. Process Tool Calls in AIMessages
    if hasattr(msg, "tool_calls") and msg.tool_calls:
        for tool_call in msg.tool_calls:
            if isinstance(tool_call, dict):
                tc_name = tool_call.get("name", "")
                tc_args = tool_call.get("args", {})
            else:
                tc_name = getattr(tool_call, "name", "")
                tc_args = getattr(tool_call, "args", {})

            # Format arguments cleanly
            if isinstance(tc_args, dict):
                formatted_args = []
                for k, v in tc_args.items():
                    val_str = repr(v)
                    if len(val_str) > 40:
                        val_str = val_str[:37] + "..."
                    formatted_args.append(f"{k}={val_str}")
                args_str = ", ".join(formatted_args)
            else:
                args_str = str(tc_args)
                if len(args_str) > 60:
                    args_str = args_str[:57] + "..."

            events.append(
                {
                    "type": "message",
                    "node": node_name,
                    "content": f"**Action**: call tool `{tc_name}({args_str})`",
                    "log_type": "Action",
                }
            )

    # 2. Process message content
    raw_content = getattr(msg, "content", None)
    content_str = ""
    if raw_content:
        if isinstance(raw_content, str):
            content_str = raw_content.strip()
        elif isinstance(raw_content, list):
            parts = []
            for item in raw_content:
                if isinstance(item, dict) and item.get("type") == "text":
                    parts.append(item.get("text", "").strip())
                elif isinstance(item, str):
                    parts.append(item.strip())
            content_str = "\n".join(p for p in parts if p)
        elif isinstance(raw_content, dict):
            content_str = raw_content.get("text", "").strip() or str(raw_content)
        else:
            content_str = str(raw_content).strip()

    if content_str and content_str != "Continue":
        if isinstance(msg, ToolMessage) or "ToolMessage" in msg.__class__.__name__:
            # Tool message output - summarize and prevent "data rác"
            tool_name = getattr(msg, "name", None) or getattr(msg, "tool_name", "tool")
            content_len = len(content_str)
            snippet = content_str
            if content_len > 150:
                snippet = content_str[:147] + "..."

            # Escape newlines to keep snippet clean in table format
            snippet = snippet.replace("\n", " ")
            formatted_content = f"**Tool Output**: `{tool_name}` returned: {snippet} ({content_len} bytes)"
            events.append(
                {
                    "type": "message",
                    "node": node_name,
                    "content": formatted_content,
                    "log_type": "Tool",
                }
            )
        elif isinstance(msg, AIMessage) or "AIMessage" in msg.__class__.__name__:
            events.append(
                {
                    "type": "message",
                    "node": node_name,
                    "content": content_str,
                    "log_type": "Reasoning",
                }
            )
        elif isinstance(msg, HumanMessage) or "HumanMessage" in msg.__class__.__name__:
            events.append(
                {
                    "type": "message",
                    "node": node_name,
                    "content": content_str,
                    "log_type": "User",
                }
            )
        else:
            events.append(
                {
                    "type": "message",
                    "node": node_name,
                    "content": content_str,
                    "log_type": "System",
                }
            )

    return events


class ResearchAgentRunner:
    """Wrapper around TradingAgentsGraph to run it and stream UI-friendly events."""

    def __init__(self, config: Dict[str, Any], callbacks: list = None):
        """
        config should contain:
        - ticker
        - asset_type
        - analysis_date
        - llm_provider
        - model
        - active_teams
        """
        self.config = {**DEFAULT_CONFIG, **config}
        # Normalize analysis_date early so the graph always gets a YYYY-MM-DD date.
        if self.config.get("analysis_date"):
            normalized_date = normalize_analysis_date(self.config["analysis_date"])
            if normalized_date:
                self.config["analysis_date"] = normalized_date
            else:
                self.config.pop("analysis_date", None)

        # Map generic 'model' from UI to graph-specific llm keys
        if "deep_think_model" in config and config["deep_think_model"]:
            self.config["deep_think_llm"] = config["deep_think_model"]
        elif "model" in config:
            self.config["deep_think_llm"] = config["model"]

        if "quick_think_model" in config and config["quick_think_model"]:
            self.config["quick_think_llm"] = config["quick_think_model"]
        elif "model" in config:
            self.config["quick_think_llm"] = config["model"]

        self.callbacks = callbacks or []

        # Determine selected analysts from config (e.g. ["fundamentals", "news", "social", "market"])
        self.selected_analysts = [
            team.lower()
            for team in self.config.get(
                "active_teams", ["fundamentals", "sentiment", "news", "technical"]
            )
        ]

        # Fix mapping from frontend names to backend names if needed
        frontend_to_backend = {"sentiment": "social", "technical": "market"}
        self.selected_analysts = [
            frontend_to_backend.get(a, a) for a in self.selected_analysts
        ]

        # Ensure required directories exist
        import os

        os.makedirs(self.config.get("data_cache_dir", "./data/cache"), exist_ok=True)
        os.makedirs(self.config.get("results_dir", "./data/results"), exist_ok=True)

    async def run_and_stream(
        self, report_id: Optional[int] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Runs the TradingAgentsGraph and yields JSON stream events for the UI.
        Saves intermediate reasoning into MongoDB via AgentLog.
        """
        ticker = self.config.get("ticker", "AAPL")
        asset_type = self.config.get("asset_type", "stock")
        trade_date = self.config.get(
            "analysis_date"
        ) or datetime.datetime.now().strftime("%Y-%m-%d")
        trade_date = normalize_analysis_date(
            trade_date
        ) or datetime.datetime.now().strftime("%Y-%m-%d")

        # Initialize Graph in thread to prevent blocking event loop
        loop = asyncio.get_running_loop()
        graph_runner = TradingAgentsGraph(
            selected_analysts=self.selected_analysts,
            debug=True,  # Must be True to yield chunks
            config=self.config,
            callbacks=self.callbacks,
        )

        # Setup initial state manually to stream it chunk by chunk
        graph_runner.ticker = ticker
        past_context = graph_runner.memory_log.get_past_context(ticker)
        instrument_context = graph_runner.resolve_instrument_context(ticker, asset_type)
        init_agent_state = graph_runner.propagator.create_initial_state(
            ticker,
            trade_date,
            asset_type=asset_type,
            past_context=past_context,
            instrument_context=instrument_context,
        )
        args = graph_runner.propagator.get_graph_args()

        # Add detailed LangSmith tracing configurations
        run_name = f"ResearchPipeline_{ticker}_{trade_date}"
        tags = ["research_pipeline", asset_type, ticker]
        metadata = {
            "ticker": ticker,
            "asset_type": asset_type,
            "trade_date": trade_date,
            "report_id": report_id,
            "selected_analysts": self.selected_analysts,
            "deep_think_llm": self.config.get("deep_think_llm"),
            "quick_think_llm": self.config.get("quick_think_llm"),
        }

        args.setdefault("config", {}).update(
            {"run_name": run_name, "tags": tags, "metadata": metadata}
        )

        if graph_runner.config.get("checkpoint_enabled"):
            tid = thread_id(ticker, str(trade_date))
            args.setdefault("config", {}).setdefault("configurable", {})[
                "thread_id"
            ] = tid

        # Run stream in an executor and queue events
        queue = asyncio.Queue()
        args.setdefault("config", {}).setdefault("configurable", {})["stream_queue"] = queue
        args.setdefault("config", {}).setdefault("configurable", {})["loop"] = loop

        def stream_worker():
            try:
                # Resolve pending first (as in original propagate)
                graph_runner._resolve_pending_entries(ticker)

                final_state = (
                    init_agent_state.copy()
                    if isinstance(init_agent_state, dict)
                    else {}
                )
                args["stream_mode"] = "updates"

                processed_msg_ids = set()

                for chunk in graph_runner.graph.stream(init_agent_state, **args):
                    for node_name, state_update in chunk.items():
                        if isinstance(state_update, dict):
                            final_state.update(state_update)

                            has_messages = (
                                "messages" in state_update and state_update["messages"]
                            )
                            if has_messages:
                                for msg in state_update["messages"]:
                                    msg_id = getattr(msg, "id", None)
                                    if not msg_id:
                                        msg_id = f"{msg.__class__.__name__}_{hash(str(getattr(msg, 'content', '')))}"

                                    if msg_id in processed_msg_ids:
                                        continue
                                    processed_msg_ids.add(msg_id)

                                    events = classify_and_format_message(msg, node_name)
                                    for ev in events:
                                        loop.call_soon_threadsafe(queue.put_nowait, ev)
                            else:
                                # Extract non-message updates (chunks)
                                content = ""
                                log_type = "Reasoning"

                                if "investment_debate_state" in state_update:
                                    debate = state_update["investment_debate_state"]
                                    if node_name == "Bull Researcher":
                                        content = debate.get("current_response", "")
                                        log_type = "Reasoning"
                                    elif node_name == "Bear Researcher":
                                        content = debate.get("current_response", "")
                                        log_type = "Reasoning"
                                    elif node_name == "Research Manager":
                                        content = debate.get("judge_decision", "")
                                        log_type = "Synthesis"

                                elif "risk_debate_state" in state_update:
                                    risk = state_update["risk_debate_state"]
                                    if node_name == "Aggressive Analyst":
                                        content = risk.get(
                                            "current_aggressive_response", ""
                                        )
                                        log_type = "Reasoning"
                                    elif node_name == "Neutral Analyst":
                                        content = risk.get(
                                            "current_neutral_response", ""
                                        )
                                        log_type = "Reasoning"
                                    elif node_name == "Conservative Analyst":
                                        content = risk.get(
                                            "current_conservative_response", ""
                                        )
                                        log_type = "Reasoning"
                                    elif node_name == "Portfolio Manager":
                                        content = risk.get("judge_decision", "")
                                        log_type = "Synthesis"

                                if content and content.strip():
                                    loop.call_soon_threadsafe(
                                        queue.put_nowait,
                                        {
                                            "type": "message",
                                            "node": node_name,
                                            "content": content.strip(),
                                            "log_type": log_type,
                                        },
                                    )
                        else:
                            # Fallback if chunk is not in 'updates' format (e.g., 'values' mode is forced somehow)
                            # In values mode, chunk is the state dict itself, so node_name is a state key.
                            final_state[node_name] = state_update
                            if (
                                node_name == "messages"
                                and isinstance(state_update, list)
                                and len(state_update) > 0
                            ):
                                for msg in state_update:
                                    msg_id = getattr(msg, "id", None)
                                    if not msg_id:
                                        msg_id = f"{msg.__class__.__name__}_{hash(str(getattr(msg, 'content', '')))}"

                                    if msg_id in processed_msg_ids:
                                        continue
                                    processed_msg_ids.add(msg_id)

                                    events = classify_and_format_message(msg, "System")
                                    for ev in events:
                                        loop.call_soon_threadsafe(queue.put_nowait, ev)

                # Log final state
                graph_runner.curr_state = final_state
                graph_runner._log_state(trade_date, final_state)
                graph_runner.memory_log.store_decision(
                    ticker=ticker,
                    trade_date=trade_date,
                    final_trade_decision=final_state.get("final_trade_decision", ""),
                )

                # Perform structured extraction
                try:
                    # Notify frontend that synthesis is starting
                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        {
                            "type": "message",
                            "node": "System",
                            "content": "📊 **Synthesis Phase**: Generating executive summary and structured report from all agent outputs...",
                            "log_type": "System",
                        },
                    )

                    client_kwargs = {
                        "provider": self.config.get("llm_provider", "openai"),
                        "model": self.config.get("deep_think_llm", "gpt-4o"),
                        "api_key": self.config.get("api_key"),
                        "base_url": self.config.get("backend_url"),
                    }
                    if "azure_endpoint" in self.config:
                        client_kwargs["azure_endpoint"] = self.config["azure_endpoint"]
                    if "azure_deployment" in self.config:
                        client_kwargs["azure_deployment"] = self.config["azure_deployment"]

                    llm_client = create_llm_client(**client_kwargs).get_llm()

                    trader_plan = final_state.get("trader_investment_plan", "")
                    # investment_debate_state.judge_decision = Research Manager's verdict
                    research_verdict = final_state.get(
                        "investment_debate_state", {}
                    ).get("judge_decision", "")
                    # risk_debate_state.judge_decision = Portfolio Manager's final decision
                    pm_decision = final_state.get("risk_debate_state", {}).get(
                        "judge_decision", ""
                    )

                    focused_context = f"""
--- RESEARCH MANAGER'S VERDICT ---
{research_verdict}

--- TRADER'S EXECUTION PLAN ---
{trader_plan}

--- PORTFOLIO MANAGER'S FINAL DECISION ---
{pm_decision}
"""
                    lang = _normalize_language_name(
                        self.config.get(
                            "output_language", self.config.get("language", "English")
                        )
                    )
                    lang_instruction = (
                        f" Write your entire response in {lang}."
                        if lang.lower() != "english"
                        else ""
                    )

                    eval_prompt = f"""You are the Chief Editor of a premium financial research firm. 
Your task is to write a concise 2-paragraph executive summary for {ticker} directed at the client.
CRITICAL INSTRUCTION: You MUST NOT formulate your own opinion. You MUST strictly reflect and synthesize:
1. The Research Manager's verdict on the Bull/Bear debate
2. The Trader's specific execution plan (timing, sizing, entry/exit)
3. The Portfolio Manager's FINAL APPROVAL or REJECTION — this is the authoritative decision.

If the Portfolio Manager concluded 'Underweight', 'Reject', or 'Hold', your summary MUST reflect that exact sentiment.

{focused_context}

Use your tools ONLY to fetch the current live price and date to ground the report. Speak directly to the user.{lang_instruction}"""

                    eval_tools = [
                        get_current_stock_price,
                        get_current_datetime,
                        query_past_report,
                        search_web,
                        scrape_links,
                    ]
                    react_agent = create_react_agent(llm_client, tools=eval_tools)

                    result = react_agent.invoke({"messages": [("user", eval_prompt)]})
                    final_msg = result["messages"][-1]

                    if isinstance(final_msg.content, list):
                        agent_eval_text = "".join(
                            [
                                c.get("text", "")
                                for c in final_msg.content
                                if isinstance(c, dict) and "text" in c
                            ]
                        )
                    else:
                        agent_eval_text = str(final_msg.content)

                    # 2. Extract structured JSON using the agent_eval_text as additional context
                    structured_llm = llm_client.with_structured_output(
                        ReportExtractionSchema
                    )

                    analyst_context = f"""
--- FUNDAMENTALS ---
{final_state.get('fundamentals_report', '')}
--- TECHNICALS ---
{final_state.get('market_report', '')}
--- SENTIMENT ---
{final_state.get('sentiment_report', '')}
--- NEWS ---
{final_state.get('news_report', '')}
"""

                    prompt = f"""Extract a structured financial report for ticker {ticker}.

The agents in this system use a 5-tier rating scale:
  Buy / Overweight / Hold / Underweight / Sell  (Research Manager & Portfolio Manager)
  Buy / Hold / Sell                              (Trader)

For the 'recommendation' field of each agent_output and the top-level recommendation:
  - Map to: BUY (for Buy/Overweight/Accumulate/Strong Buy)
  - Map to: HOLD (for Hold/Neutral/Equal-weight)
  - Map to: SELL (for Sell/Underweight/Reduce/Avoid/Strong Sell)

The top-level 'recommendation' MUST reflect the Portfolio Manager's final rating (authoritative).
Do NOT invent a new opinion — extract directly from the Portfolio Manager's decision below.

Context (Decision Chain — use this for recommendation & summary):
{focused_context}

Context (Analyst Reports — use for bull/bear points, agent_outputs, forecasts):
{analyst_context}

Chief Editor's Summary (use as the 'summary' field):
{agent_eval_text}

For forecasts: synthesize 5 trading days (D+1 through D+5) with signal UP/DOWN/FLAT.
For agent_outputs: map each analyst/researcher/trader to their team (Analyst/Research/Execution).
If numerical price fields (price, low, high) for the forecast are not explicitly mentioned in the context, you MUST estimate plausible numerical values based on the current price, target price, and the forecasted signal trend. Do NOT leave them as null."""
                    result_json = structured_llm.invoke([HumanMessage(content=prompt)])
                    report_dict = result_json.model_dump()
                    final_state["structured_report"] = report_dict

                    # 3. Format JSON into Markdown and send to UI
                    cp = report_dict.get("current_price")
                    tp = report_dict.get("target_price")
                    sl = report_dict.get("stop_loss")
                    rr = report_dict.get("risk_reward")

                    md_lines = []
                    md_lines.append(f"### 📊 Executive Summary")
                    md_lines.append(f"{report_dict.get('summary', '')}\n")
                    md_lines.append(
                        f"**Recommendation:** {report_dict.get('recommendation', 'HOLD')} (Confidence: {report_dict.get('confidence', 0)}%)"
                    )
                    price_parts = []
                    if cp:
                        price_parts.append(f"Current: ${cp:,.2f}")
                    if tp:
                        price_parts.append(f"Target: ${tp:,.2f}")
                    if sl:
                        price_parts.append(f"Stop Loss: ${sl:,.2f}")
                    if rr:
                        price_parts.append(f"R/R: {rr}x")
                    if price_parts:
                        md_lines.append(" | ".join(price_parts))

                    if report_dict.get("bull_points"):
                        md_lines.append("### 🟢 Bull Points")
                        for bp in report_dict["bull_points"]:
                            md_lines.append(f"- {bp}")
                        md_lines.append("")

                    if report_dict.get("bear_points"):
                        md_lines.append("### 🔴 Bear Points")
                        for bp in report_dict["bear_points"]:
                            md_lines.append(f"- {bp}")
                        md_lines.append("")

                    if report_dict.get("forecasts"):
                        md_lines.append("### 🔮 5-Day Forecast")
                        md_lines.append("| Day | Signal | Price | Low | High |")
                        md_lines.append("|---|---|---|---|---|")
                        for f in report_dict["forecasts"]:
                            p = (
                                f"${f['price']}"
                                if f.get("price") is not None
                                else "N/A"
                            )
                            l = f"${f['low']}" if f.get("low") is not None else "N/A"
                            h = f"${f['high']}" if f.get("high") is not None else "N/A"
                            md_lines.append(
                                f"| {f['day']} | {f['signal']} | {p} | {l} | {h} |"
                            )
                        md_lines.append("")

                    if report_dict.get("agent_outputs"):
                        md_lines.append("### 🤖 Agent Outputs")
                        for ao in report_dict["agent_outputs"]:
                            md_lines.append(
                                f"**{ao['agent']}** ({ao['team']} Team): {ao['recommendation']} ({ao['confidence']}%)"
                            )
                            md_lines.append(f"> {ao['summary']}\n")

                    markdown_content = "\n".join(md_lines)

                    loop.call_soon_threadsafe(
                        queue.put_nowait,
                        {
                            "type": "agent_log_chunk",
                            "agent": "System",
                            "content": markdown_content,
                        },
                    )
                except Exception as ex:
                    logger.error(f"Failed to extract structured report: {ex}")

                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "done", "final_state": final_state}
                )
            except Exception as e:
                logger.error(f"Error in TradingAgentsGraph stream: {e}", exc_info=True)
                loop.call_soon_threadsafe(
                    queue.put_nowait, {"type": "error", "message": str(e)}
                )

        # Start thread
        executor = ThreadPoolExecutor(max_workers=1)
        future = loop.run_in_executor(executor, stream_worker)

        step_counter = 1

        while True:
            event = await queue.get()

            if event["type"] == "done":
                # Yield final report completion event
                # Clean final_state to ensure it is JSON serializable (remove LangChain messages, etc)
                raw_state = event.get("final_state", {}).copy()
                if "messages" in raw_state:
                    del raw_state["messages"]

                try:
                    serializable_state = json.loads(json.dumps(raw_state, default=str))
                except Exception as e:
                    logger.error(f"Failed to serialize final state: {e}")
                    serializable_state = raw_state

                yield {"type": "pipeline_complete", "final_state": serializable_state}
                break
            elif event["type"] == "error":
                yield {"type": "pipeline_error", "content": event["message"]}
                break
            elif event["type"] in ["text_chunk", "agent_log_chunk", "orchestrator_tool_start", "orchestrator_tool_end"]:
                if event["type"] == "agent_log_chunk":
                    # Save to MongoDB so it can be viewed later
                    log_entry = AgentLog(
                        report_id=report_id,
                        team="System",
                        agent_name=event.get("agent", "System"),
                        log_type="Synthesis",
                        content=event.get("content", ""),
                        meta_data={"node": "generate_reports"},
                    )
                    await log_entry.insert()
                yield event
                continue

            # Emit Agent Log event for UI
            if event["type"] == "message":
                node_name = event["node"]
                agent_readable = AGENT_NAME_MAPPING.get(node_name, node_name)
                content = event.get("content", "")
                log_type = event.get("log_type", "Reasoning")

                if not content or content.strip() == "":
                    continue

                # Save to MongoDB
                log_entry = AgentLog(
                    report_id=report_id,
                    team="Research Pipeline",
                    agent_name=agent_readable,
                    log_type=log_type,
                    content=content,
                    meta_data={
                        "node": node_name,
                        "model": self.config.get("deep_think_llm", "unknown"),
                    },
                )
                await log_entry.insert()

                # Stream to frontend
                yield {
                    "type": "agent_log",
                    "step": step_counter,
                    "agent": agent_readable,
                    "log_type": log_type,
                    "content": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S"),
                }
                step_counter += 1

        executor.shutdown(wait=False)
