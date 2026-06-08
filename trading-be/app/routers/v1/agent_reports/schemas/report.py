from pydantic import BaseModel, ConfigDict
from typing import List, Optional, Any
from datetime import datetime
from typing import Optional, Dict, Any

class AgentLogSchema(BaseModel):
    id: Optional[str] = None
    timestamp: datetime
    team: str
    agent_name: str
    log_type: str
    content: str
    meta_data: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
class ReportAgentOutputSchema(BaseModel):
    id: int
    team_name: str
    agent_name: str
    recommendation: str
    confidence: int
    summary: str

    model_config = ConfigDict(from_attributes=True)

class ReportForecastSchema(BaseModel):
    id: int
    day_offset: str
    price_low: float
    price_high: float
    price_target: float
    signal: str

    model_config = ConfigDict(from_attributes=True)

class ReportBaseSchema(BaseModel):
    id: int
    ticker: str
    status: str
    report_date: datetime
    current_price: Optional[float] = None
    change: Optional[float] = None
    agents_count: Optional[int] = None
    duration: Optional[str] = None
    recommendation: Optional[str] = None
    confidence: Optional[int] = None
    target_price: Optional[float] = None
    stop_loss: Optional[float] = None
    risk_reward: Optional[float] = None
    summary: Optional[str] = None
    bull_points: Optional[list] = None
    bear_points: Optional[list] = None

    model_config = ConfigDict(from_attributes=True)

class ReportDetailSchema(ReportBaseSchema):
    agent_outputs: List[ReportAgentOutputSchema] = []
    forecasts: List[ReportForecastSchema] = []

class ReportDeliveryCreateSchema(BaseModel):
    report_id: int
    channel: str
    recipient: str

class ReportDeliverySchema(BaseModel):
    id: int
    report_id: int
    channel: str
    recipient: str
    trigger_source: str
    status: str
    error_message: Optional[str] = None
    sent_at: datetime

    model_config = ConfigDict(from_attributes=True)

class DeliveryWithReportSchema(ReportDeliverySchema):
    ticker: str
    content: Optional[str] = None
    report_name: Optional[str] = None

class TickerSummarySchema(BaseModel):
    ticker: str
    name: str = "" # Will map from DB or external source later if needed
    type: str = "US Stock" # Placeholder for now
    currency: str = "$" # Placeholder
    report_count: int = 0
    latest_report_date: Optional[datetime] = None
    latest_recommendation: Optional[str] = "HOLD"

    model_config = ConfigDict(from_attributes=True)
