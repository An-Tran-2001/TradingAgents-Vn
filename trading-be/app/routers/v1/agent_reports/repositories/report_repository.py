from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List
from app.routers.v1.agent_reports.models.relational import Report
from fastapi import Depends
from app.dependencies.db import get_db
from sqlalchemy.orm import selectinload

class ReportRepository:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def get_tickers_with_reports(self) -> List[str]:
        # Get unique tickers
        stmt = select(Report.ticker).distinct().order_by(Report.ticker)
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_ticker_summaries(self):
        stmt = (
            select(
                Report.ticker,
                func.count(Report.id).label("report_count"),
                func.max(Report.report_date).label("latest_report_date")
            )
            .group_by(Report.ticker)
            .order_by(desc("latest_report_date"))
        )
        result = await self.db.execute(stmt)
        return result.all()

    async def get_reports_by_ticker(self, ticker: str) -> List[Report]:
        # Fetch reports for a ticker, joined with outputs and forecasts
        stmt = (
            select(Report)
            .options(selectinload(Report.agent_outputs), selectinload(Report.forecasts))
            .where(Report.ticker == ticker)
            .order_by(desc(Report.report_date))
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().unique().all())

    async def get_report_by_id(self, report_id: int) -> Report | None:
        stmt = (
            select(Report)
            .options(selectinload(Report.agent_outputs), selectinload(Report.forecasts))
            .where(Report.id == report_id)
        )
        result = await self.db.execute(stmt)
        return result.scalars().first()
