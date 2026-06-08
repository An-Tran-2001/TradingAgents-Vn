from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from typing import List, Tuple
from app.routers.v1.agent_reports.models.relational import Report, ReportDelivery
from fastapi import Depends
from app.dependencies.db import get_db
from sqlalchemy.orm import selectinload

class ReportRepository:
    def __init__(self, db: AsyncSession = Depends(get_db)):
        self.db = db

    async def get_tickers_with_reports(self) -> List[str]:
        # Get unique tickers, excluding archived reports
        stmt = select(Report.ticker).where(Report.status != "archived").distinct().order_by(Report.ticker)
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_ticker_summaries(self):
        stmt = (
            select(
                Report.ticker,
                func.count(Report.id).label("report_count"),
                func.max(Report.report_date).label("latest_report_date")
            )
            .where(Report.status != "archived")
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
            .where(Report.status != "archived")
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

    async def archive_report(self, report_id: int) -> bool:
        stmt = select(Report).where(Report.id == report_id)
        result = await self.db.execute(stmt)
        report = result.scalars().first()
        if report:
            report.status = "archived"
            await self.db.commit()
            return True
        return False

    async def archive_ticker(self, ticker: str) -> int:
        from sqlalchemy import update
        stmt = update(Report).where(Report.ticker == ticker).values(status="archived")
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount

    async def get_all_deliveries(self, skip: int = 0, limit: int = 100) -> List[Tuple[ReportDelivery, Report]]:
        stmt = (
            select(ReportDelivery, Report)
            .join(Report, ReportDelivery.report_id == Report.id)
            .order_by(desc(ReportDelivery.sent_at))
            .offset(skip)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return result.all() # returns a list of tuples (ReportDelivery, Report)

    async def get_delivery_by_id(self, delivery_id: int) -> ReportDelivery | None:
        stmt = select(ReportDelivery).where(ReportDelivery.id == delivery_id)
        result = await self.db.execute(stmt)
        return result.scalars().first()

    async def resend_delivery(self, delivery_id: int) -> bool:
        delivery = await self.get_delivery_by_id(delivery_id)
        if delivery:
            delivery.status = "PENDING"
            delivery.error_message = None
            await self.db.commit()
            return True
        return False

    async def create_delivery(self, report_id: int, channel: str, recipient: str, trigger_source: str = "MANUAL_CLICK") -> ReportDelivery:
        delivery = ReportDelivery(
            report_id=report_id,
            channel=channel,
            recipient=recipient,
            trigger_source=trigger_source,
            status="PENDING"
        )
        self.db.add(delivery)
        await self.db.commit()
        await self.db.refresh(delivery)
        return delivery
