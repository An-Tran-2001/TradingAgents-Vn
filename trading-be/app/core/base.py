# This file is used to import all SQLAlchemy models so that Alembic and 
# SQLAlchemy's Base.metadata.create_all() can discover them.

from app.core.database import Base

# Import all models here
from app.routers.v1.auth.models.relational import User, UserSetting
from app.routers.v1.agent_chats.models.relational import ChatSession, ChatMessage
from app.routers.v1.agent_reports.models.relational import Report, ReportAgentOutput, ReportForecast, ReportDelivery
from app.routers.v1.jobs.models.relational import Job
from app.routers.v1.portfolio.models.relational import Portfolio, Position
from app.routers.v1.orders.models.relational import Order
