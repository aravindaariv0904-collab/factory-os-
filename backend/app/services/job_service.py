"""Processing job lifecycle management."""
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.platform import ProcessingJob


class JobService:
    @staticmethod
    async def create(
        db: AsyncSession,
        *,
        job_type: str,
        organization_id: str,
        created_by: str,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        factory_id: Optional[str] = None,
    ) -> ProcessingJob:
        job = ProcessingJob(
            job_type=job_type,
            status="QUEUED",
            progress=0.0,
            organization_id=organization_id,
            factory_id=factory_id,
            resource_type=resource_type,
            resource_id=resource_id,
            created_by=created_by,
        )
        db.add(job)
        await db.flush()
        return job

    @staticmethod
    async def get(db: AsyncSession, job_id: str, organization_id: str) -> Optional[ProcessingJob]:
        result = await db.execute(
            select(ProcessingJob).where(
                ProcessingJob.id == job_id,
                ProcessingJob.organization_id == organization_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def mark_running(
        db: AsyncSession,
        job: ProcessingJob,
        celery_task_id: Optional[str] = None,
        progress: float = 0.0,
    ) -> ProcessingJob:
        job.status = "RUNNING"
        job.progress = progress
        if celery_task_id:
            job.celery_task_id = celery_task_id
        await db.flush()
        return job

    @staticmethod
    async def mark_completed(
        db: AsyncSession,
        job: ProcessingJob,
        result: Optional[dict[str, Any]] = None,
    ) -> ProcessingJob:
        job.status = "COMPLETED"
        job.progress = 100.0
        job.result = result
        job.error_message = None
        await db.flush()
        return job

    @staticmethod
    async def mark_failed(
        db: AsyncSession,
        job: ProcessingJob,
        error_message: str,
    ) -> ProcessingJob:
        job.status = "FAILED"
        job.error_message = error_message
        await db.flush()
        return job


job_service = JobService()
