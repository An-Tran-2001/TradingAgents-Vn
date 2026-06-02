import logging
from typing import Any, Dict, List, Optional
from langchain_core.callbacks import AsyncCallbackHandler
from langchain_core.outputs import LLMResult
from langchain_core.messages import AIMessage
from app.routers.v1.agent_reports.models.non_relational import TokenUsage, AgentLog

logger = logging.getLogger(__name__)

class MongoStatsCallbackHandler(AsyncCallbackHandler):
    """Callback handler that tracks LLM token usage and saves to MongoDB asynchronously."""

    def __init__(self, user_id: int, message_id: Optional[int] = None, report_id: Optional[int] = None):
        super().__init__()
        self.user_id = user_id
        self.message_id = message_id
        self.report_id = report_id

    async def on_llm_end(self, response: LLMResult, **kwargs: Any) -> None:
        """Extract token usage from LLM response and save to MongoDB."""
        try:
            generation = response.generations[0][0]
        except (IndexError, TypeError):
            return

        usage_metadata = None
        if hasattr(generation, "message"):
            message = generation.message
            if isinstance(message, AIMessage) and hasattr(message, "usage_metadata"):
                usage_metadata = message.usage_metadata

        if usage_metadata:
            prompt_tokens = usage_metadata.get("input_tokens", 0)
            completion_tokens = usage_metadata.get("output_tokens", 0)
            total_tokens = usage_metadata.get("total_tokens", prompt_tokens + completion_tokens)
            
            # Extract model name if possible
            model_name = "unknown"
            if "invocation_params" in kwargs and "model" in kwargs["invocation_params"]:
                model_name = kwargs["invocation_params"]["model"]
            elif hasattr(response, "llm_output") and response.llm_output and "model_name" in response.llm_output:
                model_name = response.llm_output["model_name"]
                
            try:
                usage = TokenUsage(
                    user_id=self.user_id,
                    message_id=self.message_id,
                    report_id=self.report_id,
                    model=model_name,
                    prompt_tokens=prompt_tokens,
                    completion_tokens=completion_tokens,
                    total_tokens=total_tokens
                )
                await usage.insert()
            except Exception as e:
                logger.error(f"Failed to save TokenUsage to MongoDB: {e}")
