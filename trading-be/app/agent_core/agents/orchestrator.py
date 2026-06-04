import os
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
            ]

            if self.websearch:
                if "openai" in self.provider.lower():
                    # Enable native OpenAI web search (Responses API)
                    tools.append({"type": "web_search"})
                else:
                    tools.append(search_web)

            self.llm_with_tools = self.llm.bind_tools(tools)
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
                    elif tool_call["name"] == "get_current_stock_price":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "get_current_stock_price",
                                "args": tool_call["args"],
                            }
                            result = get_current_stock_price.invoke(tool_call["args"])
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=str(result),
                                )
                            )
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "get_current_stock_price",
                                "result": str(result),
                            }
                        except Exception as e:
                            logger.error(
                                f"Failed to process get_current_stock_price tool: {e}"
                            )
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to fetch stock price.",
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
                                }
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
                    elif tool_call["name"] == "scrape_links":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "scrape_links",
                                "args": tool_call["args"],
                            }
                            # Using await since the tool is async and stream_response is async
                            result = await scrape_links.ainvoke(tool_call["args"])
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=str(result),
                                )
                            )
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "scrape_links",
                                "result": str(result),
                            }
                        except Exception as e:
                            logger.error(f"Failed to process scrape_links tool: {e}")
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to scrape links.",
                                )
                            )
                    elif tool_call["name"] == "query_past_report":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "query_past_report",
                                "args": tool_call["args"],
                            }
                            # Using await since the tool is async
                            result = await query_past_report.ainvoke(tool_call["args"])
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=str(result),
                                )
                            )
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "query_past_report",
                                "result": str(result),
                            }
                        except Exception as e:
                            logger.error(f"Failed to process query_past_report tool: {e}")
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to query past report.",
                                )
                            )
                    elif tool_call["name"] == "get_current_datetime":
                        try:
                            yield {
                                "type": "orchestrator_tool_start",
                                "tool": "get_current_datetime",
                                "args": tool_call["args"],
                            }
                            result = get_current_datetime.invoke(tool_call["args"])
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content=str(result),
                                )
                            )
                            yield {
                                "type": "orchestrator_tool_end",
                                "tool": "get_current_datetime",
                                "result": str(result),
                            }
                        except Exception as e:
                            logger.error(
                                f"Failed to process get_current_datetime tool: {e}"
                            )
                            messages.append(
                                ToolMessage(
                                    tool_call_id=tool_call["id"],
                                    name=tool_call["name"],
                                    content="Failed to fetch current date/time.",
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
