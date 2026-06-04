from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class JobBase(BaseModel):
    ticker: str
    frequency: str
    depth: str = "Medium"
    reasoning_effort: str = "Medium"
    agents: List[str]
    start_date: datetime
    end_date: Optional[datetime] = None
    config: Optional[dict] = None

class JobCreate(JobBase):
    pass

class JobUpdate(BaseModel):
    ticker: Optional[str] = None
    frequency: Optional[str] = None
    depth: Optional[str] = None
    reasoning_effort: Optional[str] = None
    agents: Optional[List[str]] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class JobInDBBase(JobBase):
    id: int
    user_id: int
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class JobResponse(JobInDBBase):
    # Added fields for frontend display
    last_run: str = "Never"
    next_run: str = "Pending schedule"
    history: List[str] = []

class DurationData(BaseModel):
    name: str
    duration: int

class JobMetricsResponse(BaseModel):
    token_usage_24h: int
    cost_24h: float
    warnings: int
    critical_errors: int
    duration_chart: List[DurationData]
