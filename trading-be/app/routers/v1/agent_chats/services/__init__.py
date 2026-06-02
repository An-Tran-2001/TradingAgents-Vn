import datetime
import json
import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.routers.v1.agent_chats.models.relational import ChatSession, ChatMessage
from app.routers.v1.agent_chats.repositories.chat import (
    ChatSessionRepository,
    ChatMessageRepository,
)
from app.routers.v1.agent_reports.repositories.report import ReportRepository
from app.routers.v1.users.repositories.setting import SettingRepository
from app.agent_core.agents.orchestrator import OrchestratorAgent
from app.agent_core.agents.research_agent import ResearchAgentRunner
from app.agent_core.common.callbacks import MongoStatsCallbackHandler
from app.agent_core.common.date import normalize_analysis_date
from app.agent_core.common.language import normalize_language
from app.dependencies.db import get_db
from app.routers.v1.agent_reports.models.non_relational import AgentLog

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(
        self,
        chat_session_repo: ChatSessionRepository = Depends(),
        chat_message_repo: ChatMessageRepository = Depends(),
        report_repo: ReportRepository = Depends(),
        setting_repo: SettingRepository = Depends(),
    ):
        self.chat_session_repo = chat_session_repo
        self.chat_message_repo = chat_message_repo
        self.report_repo = report_repo
        self.setting_repo = setting_repo

    async def get_session(self, session_id: int):
        session = await self.chat_session_repo.get_with_messages(session_id)
        if session and session.messages:
            for msg in session.messages:
                if msg.report and msg.report.status == "completed":
                    # Attempt to fetch AgentLogs from MongoDB
                    try:
                        logs = await AgentLog.find(
                            AgentLog.report_id == msg.report.id
                        ).to_list()
                        if logs and msg.content.startswith('{"type": "final_report"'):
                            parsed = json.loads(msg.content)
                            parsed["logs"] = [
                                {
                                    "step": idx + 1,
                                    "time": log.timestamp.strftime("%H:%M:%S"),
                                    "agent": log.agent_name,
                                    "log_type": log.log_type,
                                    "content": log.content,
                                }
                                for idx, log in enumerate(logs)
                            ]
                            msg.content = json.dumps(parsed, ensure_ascii=False)
                    except Exception as e:
                        logger.error(
                            f"Failed to fetch AgentLog for message {msg.id}: {e}"
                        )
        return session

    async def create_session(self, user_id: int, title: str = None, ticker: str = None):
        sess = await self.chat_session_repo.create(
            obj_in={"user_id": user_id, "title": title or "New Chat", "ticker": ticker}
        )
        return await self.get_session(sess.id)

    async def update_session(self, session_id: int, title: str):
        session = await self.chat_session_repo.get(session_id)
        if not session:
            return None
        return await self.chat_session_repo.update(
            db_obj=session, obj_in={"title": title}
        )

    async def delete_session(self, session_id: int):
        return await self.chat_session_repo.delete(id=session_id)

    async def get_user_sessions(self, user_id: int):
        return await self.chat_session_repo.get_by_user_id(user_id)

    async def get_session_messages(self, session_id: int):
        return await self.chat_message_repo.get_by_session_id(session_id)

    async def chat_stream(self, session_id: int, user_id: int, request_data: dict):
        session = await self.get_session(session_id)
        if not session:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Session not found'})}\n\n"
            return

        await self.chat_message_repo.create(
            obj_in={
                "session_id": session.id,
                "role": "user",
                "content": request_data["message"],
            }
        )

        chat_history = request_data.get("chat_history")
        if chat_history is None:
            db_history = await self.get_session_messages(session_id)
            chat_history = [
                {"role": msg.role, "content": msg.content} for msg in db_history
            ]
            # Exclude the just-added user message which is already at the end
            chat_history = chat_history[:-1]

        provider = request_data.get("llm_provider", "openai")
        base_model = request_data.get("model", "gpt-4o")
        quick_model = request_data.get("quick_think_model") or base_model
        language = normalize_language(
            request_data.get("language") or request_data.get("output_language")
        )

        user_settings = await self.setting_repo.get_by_user_id(user_id)
        api_key = None
        if user_settings and user_settings.api_keys:
            # The UI saves the key either directly under the provider or as {provider}_API_KEY depending on the config logic
            api_key = user_settings.api_keys.get(provider)

        try:
            orchestrator = OrchestratorAgent(
                provider=provider, model=quick_model, language=language, api_key=api_key
            )
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Agent Initialization Failed: {e}'})}\n\n"
            return

        callback = MongoStatsCallbackHandler(user_id=user_id, message_id=session_id)

        final_text = ""
        async for event in orchestrator.stream_response(
            chat_history, request_data["message"], callbacks=[callback]
        ):
            if event["type"] == "text_chunk":
                yield f"data: {json.dumps({'type': 'text_chunk', 'content': event['content']})}\n\n"

            elif event["type"] == "done":
                final_text = event.get("full_content", "")

            elif event["type"] == "handoff":
                ticker = event["args"].get("ticker", request_data.get("ticker", "AAPL"))
                analysis_date = normalize_analysis_date(
                    event["args"].get("analysis_date")
                    or event["args"].get("date")
                    or request_data.get("analysis_date")
                    or request_data.get("date")
                )
                if analysis_date is None:
                    analysis_date = datetime.datetime.now().strftime("%Y-%m-%d")

                yield f"data: {json.dumps({'type': 'handoff', 'content': f'Starting financial research for {ticker}...'})}\n\n"

                if not session.ticker or session.title == "New Chat":
                    await self.chat_session_repo.update(
                        db_obj=session,
                        obj_in={"ticker": ticker, "title": f"Analysis for {ticker}"},
                    )

                config = request_data.copy()
                config["ticker"] = ticker
                config["output_language"] = language
                if api_key:
                    config["api_key"] = api_key
                config["analysis_date"] = analysis_date

                # Create the Assistant Message and Report beforehand
                assistant_msg = await self.chat_message_repo.create(
                    obj_in={
                        "session_id": session.id,
                        "role": "assistant",
                        "content": json.dumps(
                            {"type": "final_report", "state": {}}, ensure_ascii=False
                        ),
                        "agent_name": "Research Team",
                    }
                )

                report = await self.report_repo.create(
                    obj_in={
                        "user_id": user_id,
                        "message_id": assistant_msg.id,
                        "ticker": ticker,
                        "status": "running",
                    }
                )

                researcher = ResearchAgentRunner(config=config, callbacks=[callback])

                final_state = None
                async for res_event in researcher.run_and_stream(report_id=report.id):
                    yield f"data: {json.dumps(res_event)}\n\n"
                    if res_event.get("type") == "pipeline_complete":
                        final_state = res_event.get("final_state")

                if final_state:
                    final_text = json.dumps(
                        {"type": "final_report", "state": final_state},
                        ensure_ascii=False,
                    )
                    try:
                        await self.chat_message_repo.update(
                            db_obj=assistant_msg, obj_in={"content": final_text}
                        )
                        await self.report_repo.update(
                            db_obj=report,
                            obj_in={
                                "status": "completed",
                                "summary": final_state.get("investment_plan", ""),
                            },
                        )
                    except Exception as e:
                        logger.error(f"Failed to update Report and Message in DB: {e}")

                    # Already saved, clear final_text to prevent double saving
                    final_text = ""

        if final_text:
            await self.chat_message_repo.create(
                obj_in={
                    "session_id": session.id,
                    "role": "assistant",
                    "content": final_text,
                    "agent_name": "Orchestrator",
                }
            )
