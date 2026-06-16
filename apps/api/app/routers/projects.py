"""Projects CRUD router — all endpoints require authentication."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.project_crud import (
    create_project,
    delete_project,
    duplicate_project,
    get_project,
    list_projects,
    record_generation,
    update_project,
)
from app.models.project import Project
from app.models.schemas import ProjectCreate, ProjectResponse, ProjectUpdate
from app.models.user import User
from app.services.generator import GeneratorService
from app.models.config import GenerateConfig

router = APIRouter(prefix="/projects", tags=["projects"])


def _project_response(project: Project) -> ProjectResponse:
    return ProjectResponse(
        id=str(project.id),
        name=project.name,
        slug=project.slug,
        config=project.config,
        routes=project.routes or [],
        routes_count=len(project.routes) if project.routes else 0,
        created_at=project.created_at,
        updated_at=project.updated_at,
        last_generated_at=project.last_generated_at,
        generation_count=project.generation_count,
    )


@router.get("", response_model=list[ProjectResponse])
async def list_user_projects(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    projects = await list_projects(db, user.id)
    return [_project_response(p) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_user_project(
    body: ProjectCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    routes_data = [r.model_dump() for r in body.routes]
    project = await create_project(db, user.id, body.name, body.config, routes_data)
    return _project_response(project)


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_user_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _project_response(project)


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_user_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = await update_project(db, project, body.name, body.config, body.routes)
    return _project_response(project)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def patch_user_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project = await update_project(db, project, body.name, body.config, body.routes)
    return _project_response(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    await delete_project(db, project)


@router.post("/{project_id}/generate")
async def generate_from_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    try:
        config = GenerateConfig(**project.config)
    except Exception:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid project config")

    config.custom_routes = project.routes or []
    zip_bytes = await GeneratorService.run(config)
    await record_generation(db, project)

    return StreamingResponse(
        iter([zip_bytes]),
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{config.project_name}.zip"'},
    )


@router.post("/{project_id}/duplicate", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def duplicate_user_project(
    project_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    project = await get_project(db, project_id, user.id)
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    new_project = await duplicate_project(db, project)
    return _project_response(new_project)
