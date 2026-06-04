from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.routers.v1.auth.models.relational import User

from app.routers.v1.jobs.schemas.job import JobCreate, JobUpdate, JobResponse
from app.routers.v1.jobs.repositories.job_repository import JobRepository
from app.routers.v1.jobs.services.job_service import JobService

router = APIRouter()

def get_job_service(db: AsyncSession = Depends(get_db)) -> JobService:
    repo = JobRepository(db)
    return JobService(repo)

@router.get("/", response_model=List[JobResponse], summary="Get all jobs for current user")
async def get_jobs(
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    return await service.get_jobs(current_user.id)

from app.routers.v1.jobs.schemas.job import JobMetricsResponse

@router.get("/metrics", response_model=JobMetricsResponse, summary="Get metrics for current user jobs")
async def get_jobs_metrics(
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    return await service.get_metrics(current_user.id)

@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED, summary="Create a new job")
async def create_job(
    job_in: JobCreate,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    return await service.create_job(current_user.id, job_in)

@router.put("/{job_id}", response_model=JobResponse, summary="Update an existing job")
async def update_job(
    job_id: int,
    job_in: JobUpdate,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    updated_job = await service.update_job(job_id, current_user.id, job_in)
    if not updated_job:
        raise HTTPException(status_code=404, detail="Job not found")
    return updated_job

@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a job")
async def delete_job(
    job_id: int,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    success = await service.delete_job(job_id, current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Job not found")
    return None

@router.get("/{job_id}/logs", summary="Get logs for latest job execution")
async def get_job_logs(
    job_id: int,
    current_user: User = Depends(get_current_user),
    service: JobService = Depends(get_job_service)
):
    logs = await service.get_job_logs(job_id, current_user.id)
    if logs is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return logs
