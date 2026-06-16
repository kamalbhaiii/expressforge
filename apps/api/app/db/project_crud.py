"""CRUD for saved projects."""

import re
import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project


def _slugify(name: str) -> str:
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug[:200] or "project"


async def _unique_slug(db: AsyncSession, user_id: uuid.UUID, base_slug: str) -> str:
    slug = base_slug
    counter = 1
    while True:
        result = await db.execute(
            select(Project).where(Project.user_id == user_id, Project.slug == slug)
        )
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


async def list_projects(db: AsyncSession, user_id: uuid.UUID) -> list[Project]:
    result = await db.execute(
        select(Project).where(Project.user_id == user_id).order_by(Project.updated_at.desc())
    )
    return list(result.scalars().all())


async def get_project(db: AsyncSession, project_id: uuid.UUID, user_id: uuid.UUID) -> Project | None:
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == user_id)
    )
    return result.scalar_one_or_none()


async def create_project(
    db: AsyncSession, user_id: uuid.UUID, name: str, config: dict, routes: list
) -> Project:
    slug = await _unique_slug(db, user_id, _slugify(name))
    project = Project(user_id=user_id, name=name, slug=slug, config=config, routes=routes)
    db.add(project)
    await db.flush()
    await db.refresh(project)
    return project


async def update_project(
    db: AsyncSession,
    project: Project,
    name: str | None,
    config: dict | None,
    routes: list | None,
) -> Project:
    if name is not None:
        project.name = name
        project.slug = await _unique_slug(db, project.user_id, _slugify(name))
    if config is not None:
        project.config = config
    if routes is not None:
        project.routes = [r if isinstance(r, dict) else r.model_dump() for r in routes]
    project.updated_at = datetime.utcnow()
    await db.flush()
    await db.refresh(project)
    return project


async def delete_project(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
    await db.flush()


async def record_generation(db: AsyncSession, project: Project) -> None:
    project.last_generated_at = datetime.utcnow()
    project.generation_count += 1
    await db.flush()


async def duplicate_project(db: AsyncSession, project: Project) -> Project:
    new_name = f"{project.name} (copy)"
    return await create_project(db, project.user_id, new_name, project.config, project.routes)
