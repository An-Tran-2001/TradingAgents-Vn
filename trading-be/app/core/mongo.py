from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db_client = MongoDB()

from beanie import init_beanie
from app.routers.v1.agent_reports.models.non_relational import AgentLog, TokenUsage

async def connect_to_mongo():
    db_client.client = AsyncIOMotorClient(settings.MONGO_URI)
    db_client.db = db_client.client[settings.MONGO_DB]
    
    # Initialize Beanie with the Document models
    await init_beanie(
        database=db_client.db, 
        document_models=[AgentLog, TokenUsage]
    )
    
    print("Connected to MongoDB and initialized Beanie.")

async def close_mongo_connection():
    if db_client.client:
        db_client.client.close()
        print("Closed MongoDB connection.")

def get_mongo_db():
    return db_client.db
