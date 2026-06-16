from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.job import GenerationJob


async def create_job(db: AsyncSession, job: GenerationJob) -> GenerationJob:
    db.add(job)
    await db.flush()
    await db.refresh(job)
    return job


async def get_job(db: AsyncSession, job_id: str) -> GenerationJob | None:
    result = await db.execute(select(GenerationJob).where(GenerationJob.id == job_id))
    return result.scalar_one_or_none()
