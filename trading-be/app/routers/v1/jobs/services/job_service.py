from app.routers.v1.jobs.repositories.job_repository import JobRepository
from app.routers.v1.jobs.schemas.job import JobCreate, JobUpdate, JobResponse
from typing import List, Optional
from datetime import datetime


class JobService:
    def __init__(self, repo: JobRepository):
        self.repo = repo

    async def _format_job_response(self, job) -> JobResponse:
        from datetime import datetime, timedelta, timezone

        now = datetime.now(timezone.utc)
        start = job.start_date
        if start.tzinfo is None:
            start = start.replace(tzinfo=timezone.utc)

        history = await self.repo.get_job_history(job.id)
        last_run = await self.repo.get_latest_report_date(job.id)

        if job.status == "paused":
            next_run = "-"
        else:
            if now < start:
                next_run = start.strftime("%Y-%m-%d %H:%M")
                last_run = "Never"
            else:
                # Basic frequency parsing to compute next run
                freq = job.frequency.lower()
                if "hour" in freq and "4" not in freq:
                    delta = timedelta(hours=1)
                elif "4 hours" in freq:
                    delta = timedelta(hours=4)
                elif "daily" in freq:
                    delta = timedelta(days=1)
                elif "weekly" in freq:
                    delta = timedelta(weeks=1)
                else:
                    delta = timedelta(days=1)  # Fallback

                # Calculate last run and next run
                elapsed = now - start
                runs = int(elapsed.total_seconds() // delta.total_seconds())
                next_run = start.strftime("%Y-%m-%d %H:%M")

        return JobResponse(
            id=job.id,
            user_id=job.user_id,
            ticker=job.ticker,
            frequency=job.frequency,
            depth=job.depth,
            reasoning_effort=job.reasoning_effort,
            agents=job.agents,
            start_date=job.start_date,
            end_date=job.end_date,
            status=job.status,
            config=job.config,
            created_at=job.created_at,
            last_run=last_run,
            next_run=next_run,
            history=history,
        )

    async def get_jobs(self, user_id: int) -> List[JobResponse]:
        jobs = await self.repo.get_jobs(user_id)
        return [await self._format_job_response(job) for job in jobs]

    async def get_job(self, job_id: int, user_id: int) -> Optional[JobResponse]:
        job = await self.repo.get_job(job_id, user_id)
        if not job:
            return None
        return await self._format_job_response(job)

    async def create_job(self, user_id: int, job_in: JobCreate) -> JobResponse:
        job = await self.repo.create_job(user_id, job_in)
        return await self._format_job_response(job)

    async def update_job(
        self, job_id: int, user_id: int, job_in: JobUpdate
    ) -> Optional[JobResponse]:
        job = await self.repo.update_job(job_id, user_id, job_in)
        if not job:
            return None
        return await self._format_job_response(job)

    async def delete_job(self, job_id: int, user_id: int) -> bool:
        return await self.repo.delete_job(job_id, user_id)

    async def get_metrics(self, user_id: int):
        from app.routers.v1.jobs.schemas.job import JobMetricsResponse, DurationData
        from app.routers.v1.agent_reports.models.non_relational import TokenUsage
        from datetime import datetime, timedelta, timezone

        # 1. Get real SQL metrics (active jobs, reports, errors)
        metrics = await self.repo.get_job_metrics(user_id)
        active_jobs = metrics.get("active_jobs", 0)
        total_reports = metrics.get("total_reports", 0)
        failed_reports = metrics.get("failed_reports", 0)

        # 2. Get real MongoDB token usages for the last 24h
        twenty_four_hours_ago = datetime.now(timezone.utc) - timedelta(hours=24)
        token_usages = await TokenUsage.find(
            TokenUsage.user_id == user_id, TokenUsage.timestamp >= twenty_four_hours_ago
        ).to_list()

        token_usage_24h = sum(usage.total_tokens for usage in token_usages)
        cost_24h = round(token_usage_24h * 0.000003, 4)

        # 3. Use real 0s for duration chart since we don't have historical execution durations yet
        duration_chart = [
            {"name": "Mon", "duration": 0},
            {"name": "Tue", "duration": 0},
            {"name": "Wed", "duration": 0},
            {"name": "Thu", "duration": 0},
            {"name": "Fri", "duration": 0},
            {"name": "Sat", "duration": 0},
            {"name": "Sun", "duration": 0},
        ]

        return JobMetricsResponse(
            token_usage_24h=token_usage_24h,
            cost_24h=cost_24h,
            warnings=failed_reports,
            critical_errors=0,
            duration_chart=[DurationData(**d) for d in duration_chart],
        )

    async def get_job_logs(self, job_id: int, user_id: int):
        from sqlalchemy import select
        from app.routers.v1.agent_reports.models.relational import Report
        from app.routers.v1.agent_reports.models.non_relational import AgentLog

        # Verify job belongs to user
        job = await self.repo.get_job(job_id, user_id)
        if not job:
            return None

        # Get latest report id
        stmt = (
            select(Report.id)
            .where(Report.job_id == job_id)
            .order_by(Report.report_date.desc())
            .limit(1)
        )
        result = await self.repo.db.execute(stmt)
        latest_report_id = result.scalars().first()

        if not latest_report_id:
            return []

        # Get logs from MongoDB for this report
        logs = (
            await AgentLog.find(AgentLog.report_id == latest_report_id)
            .sort(+AgentLog.timestamp)
            .to_list()
        )

        # Format for UI
        formatted_logs = []
        for i, log in enumerate(logs):
            meta = log.meta_data or {}
            formatted_logs.append(
                {
                    "step": i + 1,
                    "time": log.timestamp.strftime("%H:%M:%S"),
                    "agent": log.agent_name,
                    "type": log.log_type,
                    "content": log.content,
                    "model": meta.get("model", "unknown")
                }
            )

        return formatted_logs
