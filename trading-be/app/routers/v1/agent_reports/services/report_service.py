from app.routers.v1.agent_reports.repositories.report_repository import ReportRepository
from app.routers.v1.agent_reports.schemas.report import TickerSummarySchema, ReportDetailSchema, AgentLogSchema, ReportBaseSchema
from app.routers.v1.agent_reports.models.non_relational import AgentLog
from typing import List
from fastapi import Depends

class ReportService:
    def __init__(self, repo: ReportRepository = Depends()):
        self.repo = repo

    async def get_all_tickers(self) -> List[TickerSummarySchema]:
        tickers = await self.repo.get_tickers_with_reports()
        result = []
        for ticker in tickers:
            reports = await self.repo.get_reports_by_ticker(ticker)
            report_count = len(reports)
            if report_count == 0: continue
            
            latest_report = reports[0]
            latest_report_date = latest_report.report_date
            latest_rec = latest_report.recommendation or "HOLD"
            
            # Simple mock mapping for name/type based on ticker for demonstration
            # In a real scenario, this might come from a Company/Asset table
            name = f"{ticker} Inc."
            asset_type = "US Stock"
            if ticker == "BTC":
                name = "Bitcoin"
                asset_type = "Crypto"
            elif ticker == "HPG":
                name = "Hoa Phat Group"
                asset_type = "VN Stock"
                
            result.append(
                TickerSummarySchema(
                    ticker=ticker,
                    name=name,
                    type=asset_type,
                    currency="$" if asset_type != "VN Stock" else "₫",
                    report_count=report_count,
                    latest_report_date=latest_report_date,
                    latest_recommendation=latest_rec
                )
            )
        return result

    async def get_reports_for_ticker(self, ticker: str) -> List[ReportDetailSchema]:
        reports = await self.repo.get_reports_by_ticker(ticker)
        return [ReportDetailSchema.model_validate(r) for r in reports]

    async def get_report_detail(self, report_id: int) -> ReportDetailSchema | None:
        report = await self.repo.get_report_by_id(report_id)
        if not report:
            return None
        return ReportDetailSchema.model_validate(report)

    async def get_report_logs(self, report_id: int) -> List[AgentLogSchema]:
        logs = await AgentLog.find(AgentLog.report_id == report_id).to_list()
        
        result = []
        for log in logs:
            result.append(
                AgentLogSchema(
                    id=str(log.id),
                    timestamp=log.timestamp,
                    team=log.team,
                    agent_name=log.agent_name,
                    log_type=log.log_type,
                    content=log.content,
                    meta_data=log.meta_data
                )
            )
        # Sort logs by timestamp ascending to simulate execution order
        result.sort(key=lambda x: x.timestamp)
        return result
