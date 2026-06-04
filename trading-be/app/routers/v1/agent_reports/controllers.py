from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.routers.v1.agent_reports.services.report_service import ReportService
from app.routers.v1.agent_reports.schemas.report import TickerSummarySchema, ReportDetailSchema, AgentLogSchema, ReportBaseSchema
from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User

router = APIRouter()

@router.get("/tickers", response_model=List[TickerSummarySchema], summary="Get all tickers with their reports")
async def get_tickers(
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    # Depending on requirements, we might filter by user_id
    # For now, fetching all reports across the system, or you can filter in the service later
    return await service.get_all_tickers()

@router.get("/tickers/{ticker}", response_model=List[ReportDetailSchema], summary="Get reports by ticker")
async def get_reports_by_ticker(
    ticker: str,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    return await service.get_reports_for_ticker(ticker)

@router.get("/{report_id}", response_model=ReportDetailSchema, summary="Get report details by ID")
async def get_report_details(
    report_id: int,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    report = await service.get_report_detail(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/{report_id}/logs", response_model=List[AgentLogSchema], summary="Get execution logs for a report")
async def get_report_logs(
    report_id: int,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    # Verify report exists first
    report = await service.get_report_detail(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return await service.get_report_logs(report_id)

@router.delete("/{report_id}", summary="Soft delete a report")
async def delete_report(
    report_id: int,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    success = await service.delete_report(report_id)
    if not success:
        raise HTTPException(status_code=404, detail="Report not found or already archived")
    return {"message": "Report deleted successfully"}

@router.delete("/tickers/{ticker}", summary="Soft delete all reports for a ticker")
async def delete_ticker_reports(
    ticker: str,
    current_user: User = Depends(get_current_user),
    service: ReportService = Depends()
):
    count = await service.delete_ticker_reports(ticker)
    if count == 0:
        raise HTTPException(status_code=404, detail="No reports found for this ticker")
    return {"message": f"Successfully deleted {count} reports for {ticker}"}
