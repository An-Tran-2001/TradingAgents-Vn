import asyncio
import json
import logging
import datetime
from typing import Dict, Any, AsyncGenerator, Optional
from concurrent.futures import ThreadPoolExecutor

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG
from app.routers.v1.agent_reports.models.non_relational import AgentLog

logger = logging.getLogger(__name__)

# Node Name to Readable Agent Name Mapping
AGENT_NAME_MAPPING = {
    "analyst_market": "Market Analyst",
    "analyst_fundamentals": "Fundamentals Analyst",
    "analyst_social": "Sentiment Analyst",
    "analyst_news": "News Analyst",
    "research_bull": "Bull Researcher",
    "research_bear": "Bear Researcher",
    "research_judge": "Research Manager",
    "risk_aggressive": "Aggressive Analyst",
    "risk_conservative": "Conservative Analyst",
    "risk_neutral": "Neutral Analyst",
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
        trade_date = self.config.get("analysis_date", datetime.datetime.now().strftime("%Y-%m-%d"))

        # Initialize Graph in thread to prevent blocking event loop
        loop = asyncio.get_running_loop()
        graph_runner = TradingAgentsGraph(
            selected_analysts=self.selected_analysts,
            debug=True, # Must be True to yield chunks
            config=self.config,
            callbacks=self.callbacks
        )

        # Setup initial state manually to stream it chunk by chunk
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
                
                final_state = {}
                for chunk in graph_runner.graph.stream(init_agent_state, **args):
                    if len(chunk.get("messages", [])) == 0:
                        # Some chunks only update state, not messages. We can still emit them.
                        for node_name, state_update in chunk.items():
                            if isinstance(state_update, dict):
                                final_state.update(state_update)
                                queue.put_nowait({"type": "chunk", "node": node_name, "state": state_update})
                    else:
                        for node_name, state_update in chunk.items():
                            final_state.update(state_update)
                            if "messages" in state_update and state_update["messages"]:
                                last_msg = state_update["messages"][-1]
                                queue.put_nowait({
                                    "type": "message",
                                    "node": node_name,
                                    "content": last_msg.content,
                                    "name": last_msg.name or node_name
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
                yield {
                    "type": "pipeline_complete",
                    "final_state": event["final_state"]
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
                
                content = event.get("content", "State updated.")
                
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
