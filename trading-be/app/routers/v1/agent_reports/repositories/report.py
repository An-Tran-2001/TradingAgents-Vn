from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.repository import BaseRepository
from app.routers.v1.agent_reports.models.relational import Report
from app.dependencies.db import get_db

class ReportRepository(BaseRepository[Report]):
    def __init__(self, db: AsyncSession = Depends(get_db)):
        super().__init__(Report, db)
