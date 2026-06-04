from pydantic import BaseModel
from typing import List, Dict

class TickerCount(BaseModel):
    ticker: str
    count: int

class TopPerformingTicker(BaseModel):
    ticker: str
    return_percentage: float
    win_rate: float

class PortfolioDataPoint(BaseModel):
    date: str
    value: float
    benchmark: float

class TokenUsageDataPoint(BaseModel):
    date: str
    tokens: int

class StatusCount(BaseModel):
    completed: int = 0
    failed: int = 0
    running: int = 0
    pending: int = 0

class SentimentCount(BaseModel):
    BUY: int = 0
    HOLD: int = 0
    SELL: int = 0

class DeliveryStats(BaseModel):
    success: int = 0
    failed: int = 0
    total: int = 0
    success_rate: float = 0.0

class DashboardMetricsResponse(BaseModel):
    total_tokens_used: int
    total_cost_usd: float
    avg_cost_per_report_usd: float
    total_tickers_queried: int
    total_reports_created: int
    total_jobs_created: int
    total_jobs_run: int
    tokens_per_model: Dict[str, int]
    avg_report_duration_seconds: int
    win_rate_percentage: float
    avg_roi_percentage: float
    sentiment_distribution: SentimentCount
    delivery_stats: DeliveryStats
    top_tickers: List[TickerCount]
    top_performing_tickers: List[TopPerformingTicker]
    portfolio_history: List[PortfolioDataPoint]
    token_usage_history: List[TokenUsageDataPoint]
    reports_by_status: StatusCount
