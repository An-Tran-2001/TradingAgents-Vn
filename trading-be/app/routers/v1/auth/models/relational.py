from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    settings = relationship("UserSetting", back_populates="user", uselist=False)
    chat_sessions = relationship("ChatSession", back_populates="user")
    reports = relationship("Report", back_populates="user")
    jobs = relationship("Job", back_populates="user")
    portfolio = relationship("Portfolio", back_populates="user", uselist=False)

class UserSetting(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    api_keys = Column(JSON, nullable=True) # JSON object mapping provider -> keys
    llm_provider = Column(String, default="openai")
    deep_think_model = Column(String, default="gpt-4o")
    quick_think_model = Column(String, default="gpt-4o-mini")
    language = Column(String, default="English")
    max_debate_rounds = Column(Integer, default=1)
    max_risk_rounds = Column(Integer, default=1)
    temperature = Column(Float, default=0.0)
    llm_backend_url = Column(String, nullable=True)
    checkpoint_enabled = Column(Boolean, default=False)

    user = relationship("User", back_populates="settings")
