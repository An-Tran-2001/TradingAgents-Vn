from fastapi import APIRouter

# Import controllers from modules here
from app.routers.v1.auth.controllers import router as auth_router
from app.routers.v1.users.controllers import router as users_router
from app.routers.v1.agent_chats.controllers import router as agent_chats_router
from app.routers.v1.config.controllers import router as config_router
from app.routers.v1.agent_reports.controllers import router as agent_reports_router
from app.routers.v1.jobs.controllers import router as jobs_router
from app.routers.v1.analytics.controllers import router as analytics_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(agent_chats_router)
api_router.include_router(config_router)
api_router.include_router(agent_reports_router, prefix="/agent_reports", tags=["Agent Reports"])
api_router.include_router(jobs_router, prefix="/jobs", tags=["Jobs"])
api_router.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
