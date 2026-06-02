from sqlalchemy.ext.asyncio import AsyncSession

class ServiceBase:
    def __init__(self, db: AsyncSession):
        self.db = db
