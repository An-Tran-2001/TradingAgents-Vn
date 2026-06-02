import json
import logging
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.routers.v1.agent_chats.models.relational import ChatSession, ChatMessage
from app.routers.v1.agent_chats.repositories.chat import ChatSessionRepository, ChatMessageRepository
from app.routers.v1.agent_reports.repositories.report import ReportRepository
from app.agent_core.agents.orchestrator import OrchestratorAgent
from app.agent_core.agents.research_agent import ResearchAgentRunner
from app.agent_core.common.callbacks import MongoStatsCallbackHandler
from app.dependencies.db import get_db

logger = logging.getLogger(__name__)

class ChatService:
    def __init__(
        self, 
        chat_session_repo: ChatSessionRepository = Depends(),
        chat_message_repo: ChatMessageRepository = Depends(),
        report_repo: ReportRepository = Depends()
    ):
        self.chat_session_repo = chat_session_repo
        self.chat_message_repo = chat_message_repo
        self.report_repo = report_repo

    async def get_session(self, session_id: int):
        return await self.chat_session_repo.get_with_messages(session_id)

    async def create_session(self, user_id: int, title: str = None, ticker: str = None):
        sess = await self.chat_session_repo.create(obj_in={
            "user_id": user_id, 
            "title": title or "New Chat", 
            "ticker": ticker
        })
        return await self.get_session(sess.id)

    async def get_user_sessions(self, user_id: int):
        return await self.chat_session_repo.get_by_user_id(user_id)
    
    async def get_session_messages(self, session_id: int):
        return await self.chat_message_repo.get_by_session_id(session_id)

    async def chat_stream(self, session_id: int, user_id: int, request_data: dict):
        session = await self.get_session(session_id)
        if not session:
            yield f"data: {json.dumps({'type': 'error', 'content': 'Session not found'})}\n\n"
            return
        
        await self.chat_message_repo.create(obj_in={
            "session_id": session.id, 
            "role": "user", 
            "content": request_data["message"]
        })
        
        chat_history = await self.get_session_messages(session_id)
        
        provider = request_data.get("llm_provider", "openai")
        model = request_data.get("model", "gpt-4o")
        
        try:
            orchestrator = OrchestratorAgent(provider=provider, model=model)
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': f'Agent Initialization Failed: {e}'})}\n\n"
            return
        
        callback = MongoStatsCallbackHandler(user_id=user_id, message_id=session_id)
        response = await orchestrator.get_response(chat_history[:-1], request_data["message"], callbacks=[callback])
        
        if response["type"] == "text":
            content = response["content"]
            await self.chat_message_repo.create(obj_in={
                "session_id": session.id, 
                "role": "assistant", 
                "content": content, 
                "agent_name": "Orchestrator"
            })
            yield f"data: {json.dumps({'type': 'text', 'content': content})}\n\n"
            
        elif response["type"] == "handoff":
            ticker = response["args"].get("ticker", request_data.get("ticker", "AAPL"))
            yield f"data: {json.dumps({'type': 'handoff', 'content': f'Starting financial research for {ticker}...'})}\n\n"
            
            if not session.ticker or session.title == "New Chat":
                await self.chat_session_repo.update(db_obj=session, obj_in={
                    "ticker": ticker,
                    "title": f"Analysis for {ticker}"
                })
                
            config = request_data.copy()
            config["ticker"] = ticker
            
            researcher = ResearchAgentRunner(config=config, callbacks=[callback])
            
            final_state = None
            async for event in researcher.run_and_stream(report_id=None):
                yield f"data: {json.dumps(event)}\n\n"
                if event.get("type") == "pipeline_complete":
                    final_state = event.get("final_state")
                    
            if final_state:
                final_content = "Research Complete. A detailed report has been generated."
                assistant_msg = await self.chat_message_repo.create(obj_in={
                    "session_id": session.id, 
                    "role": "assistant", 
                    "content": final_content, 
                    "agent_name": "Research Team"
                })
                
                try:
                    await self.report_repo.create(obj_in={
                        "user_id": user_id,
                        "message_id": assistant_msg.id,
                        "ticker": ticker,
                        "status": "completed",
                        "summary": final_state.get("investment_plan", ""),
                    })
                except Exception as e:
                    logger.error(f"Failed to save Report to DB: {e}")
