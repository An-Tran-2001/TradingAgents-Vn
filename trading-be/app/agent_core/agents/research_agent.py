import asyncio
import json
import logging
import datetime
from typing import Dict, Any, AsyncGenerator, Optional
from concurrent.futures import ThreadPoolExecutor

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from app.agent_core.common.date import normalize_analysis_date
from app.routers.v1.agent_reports.models.non_relational import AgentLog

logger = logging.getLogger(__name__)

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
        self.selected_analysts = [team.lower() for team in self.config.get("active_teams", ["fundamentals", "sentiment", "news", "technical"])]
        
        # Fix mapping from frontend names to backend names if needed
        frontend_to_backend = {
            "sentiment": "social",
            "technical": "market"
        }
        self.selected_analysts = [frontend_to_backend.get(a, a) for a in self.selected_analysts]

        # Ensure required directories exist
        import os
        os.makedirs(self.config.get("data_cache_dir", "./data/cache"), exist_ok=True)
        os.makedirs(self.config.get("results_dir", "./data/results"), exist_ok=True)

    async def run_and_stream(self, report_id: Optional[int] = None) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Runs the TradingAgentsGraph and yields JSON stream events for the UI.
        Saves intermediate reasoning into MongoDB via AgentLog.
        """
        ticker = self.config.get("ticker", "AAPL")
        asset_type = self.config.get("asset_type", "stock")
        trade_date = self.config.get("analysis_date") or datetime.datetime.now().strftime("%Y-%m-%d")
        trade_date = normalize_analysis_date(trade_date) or datetime.datetime.now().strftime("%Y-%m-%d")

        # Initialize Graph in thread to prevent blocking event loop
        loop = asyncio.get_running_loop()
        graph_runner = TradingAgentsGraph(
            selected_analysts=self.selected_analysts,
            debug=True, # Must be True to yield chunks
            config=self.config,
            callbacks=self.callbacks
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

        if graph_runner.config.get("checkpoint_enabled"):
            from tradingagents.graph.checkpointer import thread_id
            tid = thread_id(ticker, str(trade_date))
            args.setdefault("config", {}).setdefault("configurable", {})["thread_id"] = tid

        # Run stream in an executor and queue events
        queue = asyncio.Queue()

        def stream_worker():
            try:
                # Resolve pending first (as in original propagate)
                graph_runner._resolve_pending_entries(ticker)
                
                final_state = init_agent_state.copy() if isinstance(init_agent_state, dict) else {}
                args["stream_mode"] = "updates"
                
                for chunk in graph_runner.graph.stream(init_agent_state, **args):
                    for node_name, state_update in chunk.items():
                        if isinstance(state_update, dict):
                            final_state.update(state_update)
                            if "messages" in state_update and state_update["messages"]:
                                last_msg = state_update["messages"][-1]
                                queue.put_nowait({
                                    "type": "message",
                                    "node": node_name,
                                    "content": getattr(last_msg, "content", ""),
                                    "name": getattr(last_msg, "name", node_name)
                                })
                            else:
                                queue.put_nowait({"type": "chunk", "node": node_name, "state": state_update})
                        else:
                            # Fallback if chunk is not in 'updates' format (e.g., 'values' mode is forced somehow)
                            # In values mode, chunk is the state dict itself, so node_name is a state key.
                            final_state[node_name] = state_update
                            if node_name == "messages" and isinstance(state_update, list) and len(state_update) > 0:
                                last_msg = state_update[-1]
                                queue.put_nowait({
                                    "type": "message",
                                    "node": "System",
                                    "content": getattr(last_msg, "content", ""),
                                    "name": getattr(last_msg, "name", "System")
                                })
                
                # Log final state
                graph_runner.curr_state = final_state
                graph_runner._log_state(trade_date, final_state)
                graph_runner.memory_log.store_decision(
                    ticker=ticker,
                    trade_date=trade_date,
                    final_trade_decision=final_state.get("final_trade_decision", "")
                )
                
                queue.put_nowait({"type": "done", "final_state": final_state})
            except Exception as e:
                logger.error(f"Error in TradingAgentsGraph stream: {e}", exc_info=True)
                queue.put_nowait({"type": "error", "message": str(e)})

        # Start thread
        executor = ThreadPoolExecutor(max_workers=1)
        future = loop.run_in_executor(executor, stream_worker)

        step_counter = 1
        
        while True:
            event = await queue.get()
            
            if event["type"] == "done":
                # Yield final report completion event
                # Clean final_state to ensure it is JSON serializable (remove LangChain messages, etc)
                raw_state = event.get("final_state", {})
                serializable_state = {}
                for k, v in raw_state.items():
                    if isinstance(v, (str, int, float, bool, type(None))):
                        serializable_state[k] = v
                    elif isinstance(v, dict):
                        serializable_state[k] = {
                            sk: sv for sk, sv in v.items() 
                            if isinstance(sv, (str, int, float, bool, type(None)))
                        }
                        
                yield {
                    "type": "pipeline_complete",
                    "final_state": serializable_state
                }
                break
            elif event["type"] == "error":
                yield {
                    "type": "pipeline_error",
                    "content": event["message"]
                }
                break
            
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
                        if node_name == "Bull Researcher": content = debate.get("bull_history", "")
                        elif node_name == "Bear Researcher": content = debate.get("bear_history", "")
                        elif node_name == "Research Manager": content = debate.get("judge_decision", "")
                    elif "risk_debate_state" in state_dict:
                        risk = state_dict["risk_debate_state"]
                        if node_name == "Aggressive Analyst": content = risk.get("aggressive_history", "")
                        elif node_name == "Neutral Analyst": content = risk.get("neutral_history", "")
                        elif node_name == "Conservative Analyst": content = risk.get("conservative_history", "")
                        elif node_name == "Portfolio Manager": content = risk.get("judge_decision", "")
                    elif "trader_investment_plan" in state_dict:
                        content = state_dict["trader_investment_plan"]
                    elif "market_report" in state_dict and node_name == "analyst_market":
                        content = state_dict["market_report"]
                    elif "fundamentals_report" in state_dict and node_name == "analyst_fundamentals":
                        content = state_dict["fundamentals_report"]
                    elif "sentiment_report" in state_dict and node_name == "analyst_social":
                        content = state_dict["sentiment_report"]
                    elif "news_report" in state_dict and node_name == "analyst_news":
                        content = state_dict["news_report"]
                        
                if not content or content.strip() == "":
                    content = "State updated."
                
                # Save to MongoDB
                log_entry = AgentLog(
                    report_id=report_id,
                    team="Research Pipeline", # Can derive from node prefix
                    agent_name=agent_readable,
                    log_type="Action" if "Action" in content else "Synthesis" if "Synthesis" in content else "Reasoning",
                    content=content,
                    meta_data={"node": node_name}
                )
                await log_entry.insert()

                # Stream to frontend
                yield {
                    "type": "agent_log",
                    "step": step_counter,
                    "agent": agent_readable,
                    "log_type": "Agent",
                    "content": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S")
                }
                step_counter += 1

        executor.shutdown(wait=False)
