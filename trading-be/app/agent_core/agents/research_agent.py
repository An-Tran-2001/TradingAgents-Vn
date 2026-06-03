import asyncio
import json
import logging
import datetime
from typing import Dict, Any, AsyncGenerator, Optional, List, Literal
from concurrent.futures import ThreadPoolExecutor

from pydantic import BaseModel, Field

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from app.agent_core.common.date import normalize_analysis_date
from app.routers.v1.agent_reports.models.non_relational import AgentLog
from tradingagents.llm_clients import create_llm_client
from langchain_core.messages import HumanMessage, AIMessageChunk
from langgraph.prebuilt import create_react_agent
from app.agent_core.tools import (
    get_current_stock_price,
    get_current_datetime,
    scrape_links,
    query_past_report,
)

logger = logging.getLogger(__name__)

class AgentOutputSchema(BaseModel):
    team: Literal["Analyst", "Research", "Execution"]
    agent: str
    recommendation: Literal["BUY", "HOLD", "SELL"]
    confidence: int = Field(ge=0, le=100)
    summary: str

class ForecastDaySchema(BaseModel):
    day: str = Field(description="e.g. D+1, D+2")
    signal: Literal["UP", "DOWN", "FLAT"]
    low: float
    high: float
    price: float

class ReportExtractionSchema(BaseModel):
    change: float = Field(description="Percentage change today or from entry")
    agents_count: int
    recommendation: Literal["BUY", "HOLD", "SELL"]
    confidence: int = Field(ge=0, le=100)
    current_price: float
    target_price: float
    stop_loss: float
    risk_reward: float
    summary: str
    bull_points: List[str]
    bear_points: List[str]
    agent_outputs: List[AgentOutputSchema]
    forecasts: List[ForecastDaySchema]

# Node Name to Readable Agent Name Mapping
AGENT_NAME_MAPPING = {
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
        print(self.config)

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
            from tradingagents.graph.checkpointer import thread_id

            tid = thread_id(ticker, str(trade_date))
            args.setdefault("config", {}).setdefault("configurable", {})[
                "thread_id"
            ] = tid

        # Run stream in an executor and queue events
        queue = asyncio.Queue()

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

                for chunk in graph_runner.graph.stream(init_agent_state, **args):
                    for node_name, state_update in chunk.items():
                        if isinstance(state_update, dict):
                            final_state.update(state_update)
                            if "messages" in state_update and state_update["messages"]:
                                last_msg = state_update["messages"][-1]
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    {
                                        "type": "message",
                                        "node": node_name,
                                        "content": getattr(last_msg, "content", ""),
                                        "name": getattr(last_msg, "name", node_name),
                                    },
                                )
                            else:
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    {
                                        "type": "chunk",
                                        "node": node_name,
                                        "state": state_update,
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
                                last_msg = state_update[-1]
                                loop.call_soon_threadsafe(
                                    queue.put_nowait,
                                    {
                                        "type": "message",
                                        "node": "System",
                                        "content": getattr(last_msg, "content", ""),
                                        "name": getattr(last_msg, "name", "System"),
                                    },
                                )

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
                    llm_client = create_llm_client(
                        provider=self.config.get("llm_provider", "openai"),
                        model=self.config.get("deep_think_llm", "gpt-4o"),
                        api_key=self.config.get("api_key")
                    ).get_llm()
                    
                    trader_plan = final_state.get("trader_investment_plan", "")
                    pm_decision = final_state.get("investment_debate_state", {}).get("judge_decision", "")
                    risk_limits = final_state.get("risk_debate_state", {}).get("judge_decision", "")
                    
                    focused_context = f"""
--- TRADER'S FINAL EXECUTION PLAN ---
{trader_plan}

--- PORTFOLIO MANAGER'S STRATEGY ---
{pm_decision}

--- RISK MANAGER'S LIMITS ---
{risk_limits}
"""

                    eval_prompt = f"""You are the Chief Editor of a premium financial research firm. 
Your task is to write a concise 2-paragraph executive summary for {ticker} directed at the client.
CRITICAL INSTRUCTION: You MUST NOT formulate your own opinion. You MUST strictly reflect and synthesize the decisions already made by the Trader and Portfolio Manager below. If they concluded 'Underweight' or 'Hold', your summary must reflect that exact sentiment.

{focused_context}

Use your tools ONLY to fetch the current live price and date to ground the report. Speak directly to the user."""
                    
                    eval_tools = [
                        get_current_stock_price,
                        get_current_datetime,
                        scrape_links,
                        query_past_report,
                    ]
                    react_agent = create_react_agent(llm_client, tools=eval_tools)
                    
                    result = react_agent.invoke({"messages": [("user", eval_prompt)]})
                    final_msg = result["messages"][-1]
                    
                    if isinstance(final_msg.content, list):
                        agent_eval_text = "".join([c.get("text", "") for c in final_msg.content if isinstance(c, dict) and "text" in c])
                    else:
                        agent_eval_text = str(final_msg.content)
                        
                    # 2. Extract structured JSON using the agent_eval_text as additional context
                    structured_llm = llm_client.with_structured_output(ReportExtractionSchema)
                    
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
CRITICAL RULE: The final 'recommendation' (BUY/HOLD/SELL) MUST strictly align with the Trader's and Portfolio Manager's plans. 
- Overweight/Accumulate -> BUY
- Equal-weight/Neutral/Hold -> HOLD
- Underweight/Reduce/Avoid -> SELL

Context (Execution & Risk):
{focused_context}

Context (Analysts):
{analyst_context}

Chief Editor's Summary:
{agent_eval_text}

Ensure you synthesize 5 days of forecast data and map the individual analyst findings correctly to the required schema."""
                    result_json = structured_llm.invoke([HumanMessage(content=prompt)])
                    report_dict = result_json.model_dump()
                    final_state["structured_report"] = report_dict
                    
                    # 3. Format JSON into Markdown and send to UI
                    md_lines = []
                    md_lines.append(f"### 📊 Executive Summary")
                    md_lines.append(f"{report_dict.get('summary', '')}\n")
                    md_lines.append(f"**Recommendation:** {report_dict.get('recommendation', 'HOLD')} (Confidence: {report_dict.get('confidence', 0)}%)")
                    md_lines.append(f"**Current Price:** ${report_dict.get('current_price', 0)} | **Target Price:** ${report_dict.get('target_price', 0)} | **Stop Loss:** ${report_dict.get('stop_loss', 0)}")
                    md_lines.append(f"**Risk/Reward Ratio:** {report_dict.get('risk_reward', 0)}\n")
                    
                    if report_dict.get("bull_points"):
                        md_lines.append("### 🟢 Bull Points")
                        for bp in report_dict["bull_points"]: md_lines.append(f"- {bp}")
                        md_lines.append("")
                        
                    if report_dict.get("bear_points"):
                        md_lines.append("### 🔴 Bear Points")
                        for bp in report_dict["bear_points"]: md_lines.append(f"- {bp}")
                        md_lines.append("")
                        
                    if report_dict.get("forecasts"):
                        md_lines.append("### 🔮 5-Day Forecast")
                        md_lines.append("| Day | Signal | Price | Low | High |")
                        md_lines.append("|---|---|---|---|---|")
                        for f in report_dict["forecasts"]:
                            md_lines.append(f"| {f['day']} | {f['signal']} | ${f['price']} | ${f['low']} | ${f['high']} |")
                        md_lines.append("")
                        
                    if report_dict.get("agent_outputs"):
                        md_lines.append("### 🤖 Agent Outputs")
                        for ao in report_dict["agent_outputs"]:
                            md_lines.append(f"**{ao['agent']}** ({ao['team']} Team): {ao['recommendation']} ({ao['confidence']}%)")
                            md_lines.append(f"> {ao['summary']}\n")
                            
                    markdown_content = "\n".join(md_lines)
                    
                    loop.call_soon_threadsafe(
                        queue.put_nowait, {"type": "agent_log_chunk", "agent": "System", "content": markdown_content}
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
                    import json
                    serializable_state = json.loads(json.dumps(raw_state, default=str))
                except Exception as e:
                    logger.error(f"Failed to serialize final state: {e}")
                    serializable_state = raw_state

                yield {"type": "pipeline_complete", "final_state": serializable_state}
                break
            elif event["type"] == "error":
                yield {"type": "pipeline_error", "content": event["message"]}
                break
            elif event["type"] in ["text_chunk", "agent_log_chunk"]:
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
            if event["type"] in ["chunk", "message"]:
                node_name = event["node"]
                agent_readable = AGENT_NAME_MAPPING.get(node_name, node_name)

                content = event.get("content", "")
                if not content and "state" in event:
                    state_dict = event["state"]
                    # Extract from nested states
                    if "investment_debate_state" in state_dict:
                        debate = state_dict["investment_debate_state"]
                        if agent_readable == "Bull Researcher":
                            content = debate.get("bull_history", "")
                        elif agent_readable == "Bear Researcher":
                            content = debate.get("bear_history", "")
                        elif agent_readable == "Research Manager":
                            content = debate.get("judge_decision", "")
                    elif "risk_debate_state" in state_dict:
                        risk = state_dict["risk_debate_state"]
                        if agent_readable == "Aggressive Analyst":
                            content = risk.get("aggressive_history", "")
                        elif agent_readable == "Neutral Analyst":
                            content = risk.get("neutral_history", "")
                        elif agent_readable == "Conservative Analyst":
                            content = risk.get("conservative_history", "")
                        elif agent_readable == "Portfolio Manager":
                            content = risk.get("judge_decision", "")
                    elif "trader_investment_plan" in state_dict:
                        content = state_dict["trader_investment_plan"]
                    elif (
                        "market_report" in state_dict and node_name == "analyst_market"
                    ):
                        content = state_dict["market_report"]
                    elif (
                        "fundamentals_report" in state_dict
                        and node_name == "analyst_fundamentals"
                    ):
                        content = state_dict["fundamentals_report"]
                    elif (
                        "sentiment_report" in state_dict
                        and node_name == "analyst_social"
                    ):
                        content = state_dict["sentiment_report"]
                    elif "news_report" in state_dict and node_name == "analyst_news":
                        content = state_dict["news_report"]

                if not content or content.strip() == "":
                    content = "State updated."

                # Save to MongoDB
                log_entry = AgentLog(
                    report_id=report_id,
                    team="Research Pipeline",  # Can derive from node prefix
                    agent_name=agent_readable,
                    log_type=(
                        "Action"
                        if "Action" in content
                        else "Synthesis" if "Synthesis" in content else "Reasoning"
                    ),
                    content=content,
                    meta_data={"node": node_name},
                )
                await log_entry.insert()

                # Stream to frontend
                yield {
                    "type": "agent_log",
                    "step": step_counter,
                    "agent": agent_readable,
                    "log_type": "Agent",
                    "content": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S"),
                }
                step_counter += 1

        executor.shutdown(wait=False)
