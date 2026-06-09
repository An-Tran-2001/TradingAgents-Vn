import asyncio
import os
import sys

# Add the parent directory to sys.path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import app.core.base # Ensure all models are loaded
from app.core.database import AsyncSessionLocal
from app.routers.v1.auth.models.relational import User, UserSetting
from app.core.security import get_password_hash
from sqlalchemy import select

async def seed_admin():
    email = os.getenv("DEFAULT_ADMIN_EMAIL", "admin@tradingagents.com")
    password = os.getenv("DEFAULT_ADMIN_PASSWORD", "admin123")
    
    async with AsyncSessionLocal() as session:
        async with session.begin():
            # Check if user exists
            stmt = select(User).where(User.email == email)
            result = await session.execute(stmt)
            user = result.scalars().first()
            
            if not user:
                print(f"Creating default admin account: {email}")
                new_user = User(
                    email=email,
                    password_hash=get_password_hash(password),
                    is_active=True
                )
                session.add(new_user)
                await session.flush()
                
                # Add settings
                new_setting = UserSetting(user_id=new_user.id)
                session.add(new_setting)
                print("Admin account created successfully.")
            else:
                print(f"Admin account {email} already exists.")

if __name__ == "__main__":
    asyncio.run(seed_admin())
