import os
import sys
import threading
import asyncio
import logging
from typing import List, Dict, Any, Optional
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage, ToolMessage
from tradingagents.llm_clients import create_llm_client
from app.agent_core.common.language import normalize_language
from app.agent_core.tools import (
    run_financial_research,
    get_user_guide,
    get_current_stock_price,
    get_current_datetime,
    search_web,
    scrape_links,
    query_past_report,
)
from tradingagents.dataflows.vn_vendor import stream_vietnam_macro_data
from tradingagents.agents.utils.vietnam_tools import (
    get_vn_major_shareholders,
    get_vn_etf_flow,
    get_vn_sector_data,
    get_vn_market_breadth,
    get_vn_social_sentiment,
    get_vn_market_news,
    get_vietnam_macro,
    get_vn_official_announcements,
    get_vn_realtime_trading_data_tool,
)
from langsmith import traceable
import langsmith

logger = logging.getLogger(__name__)


class OrchestratorAgent:
    """
    Main Agent that handles direct user chats and hands off to the Research Agent
    when a deep financial analysis is requested.
    """

    def __init__(
        self,
        provider: str = "openai",
        model: str = "gpt-4o",
        backend_url: Optional[str] = None,
        language: str = "en",
        api_key: Optional[str] = None,
        websearch: bool = True,
        temperature: Optional[float] = None,
        timeout: Optional[int] = None,
        max_retries: Optional[int] = None,
        reasoning_effort: Optional[str] = None,
        thinking_level: Optional[str] = None,
        **kwargs,
    ):
        self.language = normalize_language(language)
        self.websearch = websearch
        self.provider = provider
        self.model = model
        self.api_key = api_key
        try:
            client_kwargs = {
                "provider": provider,
                "model": model,
                "base_url": backend_url,
                "api_key": api_key,
                "websearch": websearch,  # Forward websearch configuration to clients
            }
            if temperature is not None:
                client_kwargs["temperature"] = temperature
            if timeout is not None:
                client_kwargs["timeout"] = timeout
            if max_retries is not None:
                client_kwargs["max_retries"] = max_retries
            if reasoning_effort is not None:
                client_kwargs["reasoning_effort"] = reasoning_effort
            if thinking_level is not None:
                client_kwargs["thinking_level"] = thinking_level

            # Incorporate any additional generic kwargs for specific LLMs
            client_kwargs.update(kwargs)

            llm_client = create_llm_client(**client_kwargs)
            self.llm = llm_client.get_llm()

            tools = [
                run_financial_research,
                get_user_guide,
                get_current_stock_price,
                get_current_datetime,
                scrape_links,
                query_past_report,
                # Vietnam tools
                get_vn_major_shareholders,
                get_vn_etf_flow,
                get_vn_sector_data,
                get_vn_market_breadth,
                get_vn_social_sentiment,
                get_vn_market_news,
                get_vietnam_macro,
                get_vn_official_announcements,
                get_vn_realtime_trading_data_tool,
            ]

            if self.websearch:
                if "openai" in self.provider.lower():
                    # Enable native OpenAI web search (Responses API)
                    tools.append({"type": "web_search"})
                else:
                    tools.append(search_web)

            self.tools = tools
            self.llm_with_tools = self.llm.bind_tools(self.tools)
        except Exception as e:
            logger.error(f"Failed to initialize Orchestrator LLM: {e}")
            raise e

    @traceable(name="Orchestrator_Pipeline", run_type="chain")
    async def stream_response(
        self, chat_history: List[Any], user_message: str, callbacks: list = None
    ):
        """
        Stream response and decide whether to answer directly or hand off.
        chat_history is expected to be a list of ORM ChatMessage objects or dicts with 'role' and 'content'.
        """
        # Update current run tree with dynamic metadata
        rt = langsmith.get_current_run_tree()
        if rt:
            rt.name = f"Orchestrator_{self.provider}_{self.model}"
            rt.add_tags(["orchestrator", "chat", self.provider])
            rt.add_metadata(
                {
                    "provider": self.provider,
                    "model": self.model,
                    "language": self.language,
                    "websearch": self.websearch,
                }
            )
        system_prompt = SystemMessage(
            content=(
                "You are 'Trading Agents' is the Institutional Financial Intelligence System.\n"
                "Your mission is to help users make better financial and investment decisions by coordinating specialized agents, analyzing available information, and delivering accurate, actionable, and objective insights.\n\n"
                "EXECUTION RULES:\n"
                "1. Objective First: Understand the user's true objective before acting. Create an internal plan and choose the best execution path.\n"
                "2. Adaptive Tool Usage: Use tools only when they add value. If a tool fails (e.g., stock price for a crypto coin), DO NOT stop. Use alternative tools (like web search) or reasoning to find another way.\n"
                "3. Relentless Execution: Never give up on a single failure. Retry, switch strategies, and continue until the objective is achieved or all reasonable paths are exhausted.\n"
                "4. Partial Delivery: If full completion is impossible, deliver the best possible partial result.\n"
                "5. Autonomous Inference: Infer non-critical missing parameters (e.g., assume today's date if omitted) to reduce unnecessary clarification.\n"
                "6. Professionalism: Do not reveal internal reasoning, planning, or execution details. Verify the final response addresses the objective. Be concise, professional, and action-oriented.\n\n"
                "TICKER FORMATTING RULES:\n"
                "- When using tools for Vietnamese stocks (e.g., VCB, FPT, HPG), you MUST append `.VN` to the ticker (e.g., `VCB.VN`).\n"
                "- For US or Global stocks (e.g., AAPL), do not append any suffix unless specified.\n\n"
                f"CRITICAL: You MUST communicate and respond exclusively in the following language: {self.language}."
            )
        )

        messages = [system_prompt]

        for msg in chat_history:
            role = msg.role if hasattr(msg, "role") else msg.get("role")
            content = msg.content if hasattr(msg, "content") else msg.get("content")

            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))

        messages.append(HumanMessage(content=user_message))

        config = {"callbacks": callbacks} if callbacks else {}

        try:
            iteration = 0
            max_iterations = 15
            while iteration < max_iterations:
                iteration += 1
                stream = self.llm_with_tools.astream(messages, config=config)
                gathered = None

                async for chunk in stream:
                    if gathered is None:
                        gathered = chunk
                    else:
                        gathered = gathered + chunk

                    content = chunk.content
                    if content:
                        text = (
                            content
                            if isinstance(content, str)
                            else "".join(
                                [
                                    c.get("text", "")
                                    for c in content
                                    if isinstance(c, dict) and "text" in c
                                ]
                            )
                        )
                        if text:
                            yield {"type": "text_chunk", "content": text}

                messages.append(gathered)

                if not getattr(gathered, "tool_calls", None):
                    # No more tool calls, we are done
                    break

                handoff_triggered = False
                for tool_call in gathered.tool_calls:
                    if tool_call["name"] == "run_financial_research":
                        yield {
                            "type": "orchestrator_tool_start",
                            "tool": "run_financial_research",
                            "args": tool_call["args"],
                        }
                        yield {"type": "handoff", "args": tool_call["args"]}
                        handoff_triggered = True
                        break
                    elif tool_call["name"] == "get_user_guide":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "get_user_guide",
                                "args": tool_call["args"],
                            }
                            # Provide a mask/citation to the agent instead of raw huge text
                            mask = "[TradingAgents User Guide](citation:user_guide)"
                            tool_msg = ToolMessage(
                                tool_call_id=tool_call["id"],
                                name=tool_call["name"],
                                content=f"Success. The guide is available via this mask: {mask}. Please respond to the user concisely and include this exact mask in your response so the frontend can render it.",
                            )
                            messages.append(tool_msg)
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "get_user_guide",
                                "result": "Success. User Guide loaded.",
                            }
                        except Exception as e:
                            logger.error(f"Failed to process user guide tool: {e}")
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to load user guide.",
                                )
                            )
                    elif tool_call["name"] == "search_web":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "search_web",
                                "args": tool_call["args"],
                            }
                            result = search_web.invoke(
                                tool_call["args"],
                                config={
                                    "configurable": {
                                        "provider": self.provider,
                                        "model": self.model,
                                        "api_key": self.api_key,
                                    }
                                },
                            )
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=str(result),
                                )
                            )
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "search_web",
                                "result": str(result),
                            }
                        except Exception as e:
                            logger.error(f"Failed to process search_web tool: {e}")
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to perform web search.",
                                )
                            )
                    else:
                        # Fallback for dynamic tools (Vietnam tools, get_current_stock_price, scrape_links, etc.)
                        tool_func = None
                        for t in self.tools:
                            if hasattr(t, "name") and t.name == tool_call["name"]:
                                tool_func = t
                                break
                            elif (
                                isinstance(t, dict)
                                and t.get("type") == tool_call["name"]
                            ):
                                tool_func = t
                                break

                        if tool_func:
                            try:
                                yield {
                                    "type": "orchestrator_tool_start",
                                    "tool": tool_call["name"],
                                    "args": tool_call["args"],
                                }
                                if tool_call["name"] == "get_vietnam_macro":

                                    config_dict = {
                                        "configurable": {
                                            "provider": self.provider,
                                            "model": self.model,
                                            "api_key": self.api_key,
                                        }
                                    }
                                    
                                    if sys.platform == "win32":
                                        queue = asyncio.Queue()
                                        main_loop = asyncio.get_running_loop()
                                        
                                        def run_in_thread(loop, q, indicator, curr_date, config):
                                            new_loop = asyncio.ProactorEventLoop()
                                            asyncio.set_event_loop(new_loop)
                                            async def wrapper():
                                                try:
                                                    async for evt in stream_vietnam_macro_data(indicator, curr_date, config):
                                                        loop.call_soon_threadsafe(q.put_nowait, evt)
                                                except Exception as e:
                                                    logger.error(f"Error in macro background thread: {e}")
                                                finally:
                                                    loop.call_soon_threadsafe(q.put_nowait, None)
                                            try:
                                                new_loop.run_until_complete(wrapper())
                                            finally:
                                                new_loop.close()
                                                
                                        thread = threading.Thread(
                                            target=run_in_thread,
                                            args=(
                                                main_loop,
                                                queue,
                                                tool_call["args"]["indicator"],
                                                tool_call["args"].get("curr_date"),
                                                config_dict
                                            )
                                        )
                                        thread.start()
                                        
                                        while True:
                                            event = await queue.get()
                                            if event is None:
                                                break
                                            if event["type"] == "orchestrator_tool_start":
                                                yield event
                                            elif event["type"] == "final_result":
                                                result = event["content"]
                                    else:
                                        async for event in stream_vietnam_macro_data(
                                            tool_call["args"]["indicator"],
                                            tool_call["args"].get("curr_date"),
                                            config=config_dict,
                                        ):
                                            if event["type"] == "orchestrator_tool_start":
                                                yield event
                                            elif event["type"] == "final_result":
                                                result = event["content"]
                                else:
                                    # Call using ainvoke. LangChain handles both sync and async tools automatically
                                    result = await tool_func.ainvoke(
                                        tool_call["args"],
                                        config={
                                            "configurable": {
                                                "provider": self.provider,
                                                "model": self.model,
                                                "api_key": self.api_key,
                                            }
                                        },
                                    )

                                messages.append(
                                    ToolMessage(
                                        tool_call_id=tool_call["id"],
                                        name=tool_call["name"],
                                        content=str(result),
                                    )
                                )
                                yield {
                                    "type": "orchestrator_tool_end",
                                    "tool": tool_call["name"],
                                    "result": str(result),
                                }
                            except Exception as e:
                                logger.error(
                                    f"Failed to process {tool_call['name']}: {e}"
                                )
                                messages.append(
                                    ToolMessage(
                                        tool_call_id=tool_call["id"],
                                        name=tool_call["name"],
                                        content=f"Failed to execute {tool_call['name']}: {str(e)}",
                                    )
                                )
                        else:
                            logger.warning(f"Unhandled tool call: {tool_call['name']}")
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=f"Tool {tool_call['name']} not available or handled internally.",
                                )
                            )

                if handoff_triggered:
                    break

            if iteration >= max_iterations:
                yield {
                    "type": "text_chunk",
                    "content": "\n[System: Maximum reasoning iterations reached. Stopping to prevent infinite loop.]",
                }

            # Yield final done event to return the complete text
            final_text = ""
            if gathered and gathered.content:
                final_text = (
                    gathered.content
                    if isinstance(gathered.content, str)
                    else "".join(
                        [
                            c.get("text", "")
                            for c in gathered.content
                            if isinstance(c, dict) and "text" in c
                        ]
                    )
                )
            yield {"type": "done", "full_content": final_text}

        except Exception as e:
            logger.error(f"Orchestrator error: {e}")
            yield {
                "type": "text_chunk",
                "content": f"I encountered an error while thinking: {str(e)}",
            }
            yield {"type": "done", "full_content": f"Error: {str(e)}"}
