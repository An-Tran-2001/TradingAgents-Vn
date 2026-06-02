import logging
from typing import List, Dict, Any
from langchain_core.tools import tool
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from tradingagents.llm_clients import create_llm_client

logger = logging.getLogger(__name__)

@tool
def run_financial_research(ticker: str, analysis_date: str = None) -> str:
    """Use this tool when the user asks for a financial analysis, research, or report on a specific ticker (e.g. AAPL, BTC-USD)."""
    return "HANDOFF_TO_RESEARCH"

class OrchestratorAgent:
    """
    Main Agent that handles direct user chats and hands off to the Research Agent
    when a deep financial analysis is requested.
    """

    def __init__(self, provider: str = "openai", model: str = "gpt-4o", backend_url: str = None):
        try:
            llm_client = create_llm_client(provider=provider, model=model, base_url=backend_url)
            self.llm = llm_client.get_llm()
            self.llm_with_tools = self.llm.bind_tools([run_financial_research])
        except Exception as e:
            logger.error(f"Failed to initialize Orchestrator LLM: {e}")
            raise e

    async def get_response(self, chat_history: List[Any], user_message: str, callbacks: list = None) -> Dict[str, Any]:
        """
        Process user message and decide whether to answer directly or hand off.
        chat_history is expected to be a list of ORM ChatMessage objects or dicts with 'role' and 'content'.
        """
        system_prompt = SystemMessage(content=(
            "You are the Trading Orchestrator Agent. "
            "You can answer casual conversation, answer system questions, or explain concepts directly. "
            "If the user asks you to analyze, research, or generate a report for a specific ticker (e.g. AAPL, BTC), "
            "you MUST use the run_financial_research tool."
        ))
        
        messages = [system_prompt]
        
        for msg in chat_history:
            role = msg.role if hasattr(msg, "role") else msg.get("role")
            content = msg.content if hasattr(msg, "content") else msg.get("content")
            
            if role == "user":
                messages.append(HumanMessage(content=content))
            elif role == "assistant":
                messages.append(AIMessage(content=content))
        
        messages.append(HumanMessage(content=user_message))
        
        try:
            response = await self.llm_with_tools.ainvoke(
                messages, 
                config={"callbacks": callbacks} if callbacks else None
            )
            
            # Check if handoff tool was called
            if getattr(response, "tool_calls", None):
                for tool_call in response.tool_calls:
                    if tool_call["name"] == "run_financial_research":
                        return {"type": "handoff", "args": tool_call["args"]}
            
            return {"type": "text", "content": response.content}
            
        except Exception as e:
            logger.error(f"Orchestrator error: {e}")
            return {"type": "text", "content": f"I encountered an error while thinking: {str(e)}"}
