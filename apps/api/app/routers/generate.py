import time

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.crud import create_job
from app.db.database import get_db
from app.models.config import GenerateConfig
from app.models.job import GenerationJob
from app.models.user import User
from app.services.generator import GeneratorService

router = APIRouter(tags=["generate"])


@router.post("/generate")
async def generate_project(
    config: GenerateConfig,
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
) -> Response:
    start = time.monotonic()
    success = False

    try:
        zip_bytes = await GeneratorService.run(config)
        success = True
        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{config.project_name}.zip"',
                "X-Generated-By": "ExpressForge",
            },
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Generation failed") from exc
    finally:
        duration_ms = int((time.monotonic() - start) * 1000)
        job = GenerationJob(
            auth=config.auth,
            database=config.database,
            language=config.language,
            middleware=config.middleware,
            include_docker=config.include_docker,
            include_tests=config.include_tests,
            success=success,
            duration_ms=duration_ms,
        )
        try:
            await create_job(db, job)
        except Exception:
            # Non-blocking — analytics must never break the response
            pass
