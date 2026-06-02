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
)

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
        backend_url: str = None,
        language: str = "en",
        api_key: str = None,
    ):
        self.language = normalize_language(language)
        try:
            llm_client = create_llm_client(
                provider=provider, model=model, base_url=backend_url, api_key=api_key
            )
            self.llm = llm_client.get_llm()
            self.llm_with_tools = self.llm.bind_tools(
                [
                    run_financial_research,
                    get_user_guide,
                    get_current_stock_price,
                    get_current_datetime,
                ]
            )
        except Exception as e:
            logger.error(f"Failed to initialize Orchestrator LLM: {e}")
            raise e

    async def stream_response(
        self, chat_history: List[Any], user_message: str, callbacks: list = None
    ):
        """
        Stream response and decide whether to answer directly or hand off.
        chat_history is expected to be a list of ORM ChatMessage objects or dicts with 'role' and 'content'.
        """
        system_prompt = SystemMessage(
            content=(
                "You are the Lead Orchestrator of the TradingAgents Framework, an elite Multi-Agent Financial Intelligence Platform designed for production-grade quantitative analysis.\n"
                "Your role is to deeply reason about user requests, evaluate the optimal execution path, and deliver precise, professional results without unnecessary verbosity.\n\n"
                "CORE PRINCIPLES:\n"
                "1. Intelligent Reasoning: Before responding, internally analyze the user's intent, the complexity of the task, and the tools available. Decide if the request needs a direct answer or a tool handoff.\n"
                "2. Professionalism & Brevity: Respond with high-quality, actionable insights. Do not output your internal reasoning steps, do not mention system constraints, and avoid overly generic financial disclaimers. Be direct.\n"
                "3. Autonomous Inference: If user intent is clear but some non-critical parameters are missing (e.g., they ask for 'AAPL analysis' without a date), intelligently infer them (e.g., assume today's date) rather than rigidly asking for clarification, to minimize friction.\n\n"
                "CAPABILITIES & TOOL USAGE:\n"
                "1. Direct Answering: Answer general finance, macro/micro economic questions, or explain trading concepts directly.\n"
                "2. System Guide: Call `get_user_guide` ONLY when the user explicitly asks for system instructions or how to use the platform.\n"
                "3. Deep Research: Call `run_financial_research` for requests requiring deep analysis, market evaluation, or specific ticker investigation (e.g., AAPL, BTC-USD).\n\n"
                "DEEP RESEARCH ROUTING LOGIC:\n"
                "- The `run_financial_research` tool requires a `ticker` and an `analysis_date` (YYYY-MM-DD).\n"
                "- If the user provides a ticker but no analysis_date, DO NOT ask them for it. Automatically infer and use the current date by calling `get_current_datetime` and extracting the date portion.\n"
                "- Use `get_current_datetime` when you need the current date/time context to safely infer missing analysis dates or timelines.\n"
                "- Only ask the user for clarification if the ticker itself is missing or ambiguous.\n"
                "- Once you have the ticker and analysis_date, execute the tool immediately.\n\n"
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

        config = {"tags": ["orchestrator"]}
        if callbacks:
            config["callbacks"] = callbacks

        try:
            while True:
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
                        yield {"type": "handoff", "args": tool_call["args"]}
                        handoff_triggered = True
                        break
                    elif tool_call["name"] == "get_user_guide":
                        try:
                            # Provide a mask/citation to the agent instead of raw huge text
                            mask = "[TradingAgents User Guide](citation:user_guide)"
                            tool_msg = ToolMessage(
                                tool_call_id=tool_call["id"],
                                name=tool_call["name"],
                                content=f"Success. The guide is available via this mask: {mask}. Please respond to the user concisely and include this exact mask in your response so the frontend can render it."
                            )
                            messages.append(tool_msg)
                        except Exception as e:
                            logger.error(f"Failed to process user guide tool: {e}")
                            messages.append(ToolMessage(tool_call_id=tool_call["id"], name=tool_call["name"], content="Failed to load user guide."))
                    elif tool_call["name"] == "get_current_stock_price":
                        try:
                            result = get_current_stock_price.invoke(tool_call["args"])
                            messages.append(ToolMessage(tool_call_id=tool_call["id"], name=tool_call["name"], content=str(result)))
                        except Exception as e:
                            logger.error(f"Failed to process get_current_stock_price tool: {e}")
                            messages.append(ToolMessage(tool_call_id=tool_call["id"], name=tool_call["name"], content="Failed to fetch stock price."))
                    elif tool_call["name"] == "get_current_datetime":
                        try:
                            result = get_current_datetime.invoke(tool_call["args"])
                            messages.append(ToolMessage(tool_call_id=tool_call["id"], name=tool_call["name"], content=str(result)))
                        except Exception as e:
                            logger.error(f"Failed to process get_current_datetime tool: {e}")
                            messages.append(ToolMessage(tool_call_id=tool_call["id"], name=tool_call["name"], content="Failed to fetch current date/time."))
                
                if handoff_triggered:
                    break

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
