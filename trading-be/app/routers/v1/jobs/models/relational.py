from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ticker = Column(String, index=True, nullable=False)
    frequency = Column(String, nullable=False) # e.g. "Daily (00:00 UTC)"
    depth = Column(String, default="Medium")
    reasoning_effort = Column(String, default="Medium")
    agents = Column(JSON, nullable=False) # JSON list of agent names
    start_date = Column(DateTime(timezone=True), nullable=False)
    end_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String, default="active") # active, paused
    config = Column(JSON, nullable=True) # Analysis Configuration params
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="jobs")
    reports = relationship("Report", back_populates="job")
