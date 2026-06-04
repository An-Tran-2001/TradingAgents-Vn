from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from app.core.database import AsyncSessionLocal
from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User
from app.routers.v1.agent_reports.models.relational import Report, ReportDelivery
from app.routers.v1.jobs.models.relational import Job
from app.routers.v1.agent_reports.models.non_relational import TokenUsage
from .schemas import DashboardMetricsResponse, TickerCount, StatusCount, SentimentCount, DeliveryStats, TopPerformingTicker, PortfolioDataPoint, TokenUsageDataPoint
import re

router = APIRouter()

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

PRICING = {
    "gpt-4o": {"prompt": 5.0, "completion": 15.0},
    "gpt-4-turbo": {"prompt": 10.0, "completion": 30.0},
    "gpt-3.5-turbo": {"prompt": 0.5, "completion": 1.5},
    "claude-3-opus-20240229": {"prompt": 15.0, "completion": 75.0},
    "claude-3-sonnet-20240229": {"prompt": 3.0, "completion": 15.0},
    "claude-3-haiku-20240307": {"prompt": 0.25, "completion": 1.25},
    "unknown": {"prompt": 1.0, "completion": 2.0},
}

@router.get("/dashboard", response_model=DashboardMetricsResponse)
async def get_dashboard_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # MongoDB metrics
    pipeline = [
        {"$group": {
            "_id": "$model", 
            "total": {"$sum": "$total_tokens"},
            "prompt": {"$sum": "$prompt_tokens"},
            "completion": {"$sum": "$completion_tokens"}
        }}
    ]
    tokens_agg = await TokenUsage.aggregate(pipeline).to_list()
    
    tokens_per_model = {}
    total_tokens_used = 0
    total_cost_usd = 0.0
    
    for item in tokens_agg:
        model = item.get("_id") or "unknown"
        total = item.get("total", 0)
        prompt = item.get("prompt", 0)
        completion = item.get("completion", 0)
        
        tokens_per_model[model] = total
        total_tokens_used += total
        
        price_map = PRICING.get(model, PRICING["unknown"])
        cost = (prompt / 1_000_000) * price_map["prompt"] + (completion / 1_000_000) * price_map["completion"]
        total_cost_usd += cost
        
    # PostgreSQL metrics
    
    total_reports_result = await db.execute(select(func.count(Report.id)))
    total_reports_created = total_reports_result.scalar() or 0
    
    avg_cost_per_report_usd = (total_cost_usd / total_reports_created) if total_reports_created > 0 else 0.0
    
    total_tickers_result = await db.execute(select(func.count(func.distinct(Report.ticker))))
    total_tickers_queried = total_tickers_result.scalar() or 0
    
    total_jobs_result = await db.execute(select(func.count(Job.id)))
    total_jobs_created = total_jobs_result.scalar() or 0
    
    jobs_run_result = await db.execute(select(func.count(func.distinct(Report.job_id))).where(Report.job_id.is_not(None)))
    total_jobs_run = jobs_run_result.scalar() or 0
    
    # Financial Metrics (Mocked for MVP until Backtesting module is fully integrated)
    win_rate_percentage = 62.5
    avg_roi_percentage = 14.2
    
    top_performing_tickers = [
        TopPerformingTicker(ticker="NVDA", return_percentage=42.5, win_rate=80.0),
        TopPerformingTicker(ticker="BTC", return_percentage=25.8, win_rate=70.0),
        TopPerformingTicker(ticker="TSLA", return_percentage=18.9, win_rate=60.0),
        TopPerformingTicker(ticker="MSFT", return_percentage=15.2, win_rate=68.0),
        TopPerformingTicker(ticker="AAPL", return_percentage=12.4, win_rate=65.0),
    ]
    
    portfolio_history = [
        PortfolioDataPoint(date="Jan", value=10000, benchmark=10000),
        PortfolioDataPoint(date="Feb", value=10250, benchmark=10100),
        PortfolioDataPoint(date="Mar", value=10600, benchmark=10150),
        PortfolioDataPoint(date="Apr", value=10400, benchmark=9900),
        PortfolioDataPoint(date="May", value=11000, benchmark=10200),
        PortfolioDataPoint(date="Jun", value=11420, benchmark=10400),
    ]
    
    token_usage_history = [
        TokenUsageDataPoint(date="Mon", tokens=120500),
        TokenUsageDataPoint(date="Tue", tokens=250000),
        TokenUsageDataPoint(date="Wed", tokens=180000),
        TokenUsageDataPoint(date="Thu", tokens=300500),
        TokenUsageDataPoint(date="Fri", tokens=420000),
        TokenUsageDataPoint(date="Sat", tokens=150000),
        TokenUsageDataPoint(date="Sun", tokens=280000),
    ]
    
    # Reports by status
    status_result = await db.execute(
        select(Report.status, func.count(Report.id)).group_by(Report.status)
    )
    status_counts = status_result.all()
    reports_by_status = StatusCount()
    for status, count in status_counts:
        if status == "completed":
            reports_by_status.completed = count
        elif status == "failed":
            reports_by_status.failed = count
        elif status == "running":
            reports_by_status.running = count
        elif status == "pending":
            reports_by_status.pending = count
            
    # Sentiment Distribution
    sentiment_result = await db.execute(
        select(Report.recommendation, func.count(Report.id))
        .where(Report.recommendation.is_not(None))
        .group_by(Report.recommendation)
    )
    sentiment_counts = sentiment_result.all()
    sentiment_dist = SentimentCount()
    for rec, count in sentiment_counts:
        rec_upper = rec.upper() if rec else ""
        if "BUY" in rec_upper:
            sentiment_dist.BUY += count
        elif "SELL" in rec_upper:
            sentiment_dist.SELL += count
        elif "HOLD" in rec_upper:
            sentiment_dist.HOLD += count
            
    # Latency (Duration)
    durations_result = await db.execute(select(Report.duration).where(Report.duration.is_not(None)))
    durations = durations_result.scalars().all()
    total_seconds = 0
    valid_count = 0
    for d in durations:
        m = 0
        s = 0
        m_match = re.search(r'(\d+)\s*m', d.lower())
        s_match = re.search(r'(\d+)\s*s', d.lower())
        if m_match:
            m = int(m_match.group(1))
        if s_match:
            s = int(s_match.group(1))
        
        if m > 0 or s > 0:
            total_seconds += (m * 60) + s
            valid_count += 1
    avg_report_duration_seconds = int(total_seconds / valid_count) if valid_count > 0 else 0
    
    # Delivery Stats
    delivery_result = await db.execute(
        select(ReportDelivery.status, func.count(ReportDelivery.id))
        .group_by(ReportDelivery.status)
    )
    d_counts = delivery_result.all()
    delivery_stats = DeliveryStats()
    for status, count in d_counts:
        delivery_stats.total += count
        if status.upper() == "SUCCESS":
            delivery_stats.success += count
        elif status.upper() == "FAILED":
            delivery_stats.failed += count
            
    if delivery_stats.total > 0:
        delivery_stats.success_rate = (delivery_stats.success / delivery_stats.total) * 100
            
    # Top 5 tickers
    top_tickers_result = await db.execute(
        select(Report.ticker, func.count(Report.id))
        .group_by(Report.ticker)
        .order_by(desc(func.count(Report.id)))
        .limit(5)
    )
    top_tickers = [TickerCount(ticker=t, count=c) for t, c in top_tickers_result.all()]
    
    return DashboardMetricsResponse(
        total_tokens_used=total_tokens_used,
        total_cost_usd=round(total_cost_usd, 4),
        avg_cost_per_report_usd=round(avg_cost_per_report_usd, 4),
        total_tickers_queried=total_tickers_queried,
        total_reports_created=total_reports_created,
        total_jobs_created=total_jobs_created,
        total_jobs_run=total_jobs_run,
        tokens_per_model=tokens_per_model,
        avg_report_duration_seconds=avg_report_duration_seconds,
        win_rate_percentage=win_rate_percentage,
        avg_roi_percentage=avg_roi_percentage,
        sentiment_distribution=sentiment_dist,
        delivery_stats=delivery_stats,
        top_tickers=top_tickers,
        top_performing_tickers=top_performing_tickers,
        portfolio_history=portfolio_history,
        token_usage_history=token_usage_history,
        reports_by_status=reports_by_status
    )
