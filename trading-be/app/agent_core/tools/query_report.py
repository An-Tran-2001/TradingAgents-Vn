import json
import logging
from typing import Optional
from langchain_core.tools import tool
from sqlalchemy.future import select

from app.core.database import AsyncSessionLocal
from app.routers.v1.agent_chats.models.relational import ChatMessage
from app.routers.v1.agent_reports.models.relational import Report
from app.routers.v1.agent_reports.models.non_relational import AgentLog

logger = logging.getLogger(__name__)

@tool
async def query_past_report(report_id: int, query_type: str = "summary") -> str:
    """
    Query a past financial research report from the database to answer user follow-up questions.
    Args:
        report_id (int): The ID of the report to query (provided in the system prompt history).
        query_type (str): The specific section to query. Options: 
            - "summary": The overall investment plan and executive summary.
            - "fundamentals": Fundamental analysis details.
            - "market": Technical and market analysis details.
            - "sentiment": Social sentiment and news analysis.
            - "risk": Risk management and debates.
            - "logs": Detailed internal reasoning and debate logs of all agents.
            - "full": The entire raw JSON state (use with caution, consumes many tokens).
    Returns:
        str: The requested section of the report formatted as text.
    """
    try:
        if query_type == "logs":
            logs = await AgentLog.find(AgentLog.report_id == report_id).to_list()
            if not logs:
                return f"No detailed reasoning logs found for report {report_id}."
            
            log_texts = []
            for idx, log in enumerate(logs):
                time_str = log.timestamp.strftime("%H:%M:%S")
                log_texts.append(f"[{time_str}] {log.agent_name} ({log.log_type}): {log.content}")
            
            return "\n".join(log_texts)

        async with AsyncSessionLocal() as session:
            report = await session.get(Report, report_id)
            if not report or not report.message_id:
                return f"Report {report_id} not found or has no attached data."
                
            msg = await session.get(ChatMessage, report.message_id)
            if not msg or not msg.content:
                return f"Data for report {report_id} not found."
            
            try:
                data = json.loads(msg.content)
                state = data.get("state", {})
                
                if query_type == "summary":
                    plan = state.get("investment_plan", state.get("trader_investment_plan", "No summary found."))
                    return f"Executive Summary & Investment Plan:\n{plan}"
                elif query_type == "fundamentals":
                    return state.get("fundamentals_report", "No fundamentals report found.")
                elif query_type == "market":
                    return state.get("market_report", "No market report found.")
                elif query_type == "sentiment" or query_type == "news":
                    sent = state.get("sentiment_report", "")
                    news = state.get("news_report", "")
                    return f"Sentiment:\n{sent}\n\nNews:\n{news}"
                elif query_type == "risk":
                    risk_debate = state.get("risk_debate_state", {})
                    return json.dumps(risk_debate, indent=2)
                elif query_type == "full":
                    return json.dumps(state, indent=2)
                else:
                    return f"Unknown query type '{query_type}'. Try 'summary', 'fundamentals', 'market', 'sentiment', 'risk', or 'logs'."
                    
            except json.JSONDecodeError:
                return "Failed to parse report data."
                
    except Exception as e:
        logger.error(f"Error querying past report {report_id}: {e}")
        return f"Error retrieving report: {str(e)}"
