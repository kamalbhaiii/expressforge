"""AI handler generation endpoint."""

import json
import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.config import get_settings
from app.core.deps import get_current_user
from app.models.schemas import AIHandlerRequest, AIHandlerResponse
from app.models.user import User
from app.services.ai_providers import get_provider

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/ai", tags=["ai"])

_SYSTEM_PROMPT = """You are an expert Express.js developer. Generate clean, production-ready handler code.

Rules:
1. Generate ONLY the async handler function body — not the router.get() wrapper, not imports
2. Use async/await throughout
3. Match the project's stack (auth strategy, database ORM, language)
4. Proper error handling with try/catch
5. No hallucinated packages — only use packages from the project config
6. TypeScript types if language is typescript
7. Return ONLY valid JSON with keys: handler_code (string), imports_needed (string[]), warnings (string[])
"""

def _build_prompt(req: AIHandlerRequest) -> str:
    config = req.project_config
    route = req.route

    stack_parts = []
    if config.get("database"):
        stack_parts.append(f"Database: {', '.join(config['database'])}")
    if config.get("auth"):
        stack_parts.append(f"Auth: {', '.join(config['auth'])}")
    stack_parts.append(f"Language: {config.get('language', 'javascript')}")

    return f"""Stack: {' | '.join(stack_parts)}

Route: {route.method} {route.path}
Summary: {route.summary}
Auth required: {route.auth_required}
Request body: {route.request_body.model_dump_json() if route.request_body else 'none'}
Expected response: {route.response.model_dump_json()} (HTTP {route.response.success_code})

User description: {req.description}

Generate the handler. Return JSON only."""


@router.post("/generate-handler", response_model=AIHandlerResponse)
async def generate_handler(
    body: AIHandlerRequest,
    _user: User = Depends(get_current_user),
) -> AIHandlerResponse:
    if not settings.ai_enabled:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI features are disabled",
        )

    # Try providers in priority order (Anthropic → OpenAI → Gemini)
    # User must supply their own key via project config
    ai_config = body.project_config.get("ai")
    if not ai_config or not ai_config.get("api_key"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide your AI API key in the project config to use AI handler generation",
        )

    try:
        provider = get_provider(ai_config["provider"], ai_config["api_key"])
        prompt = _build_prompt(body)
        raw = await provider.complete(
            system=_SYSTEM_PROMPT,
            user=prompt,
            timeout=settings.ai_timeout_seconds,
        )

        # Parse JSON response
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            # Fallback: treat the whole response as handler_code
            data = {"handler_code": raw, "imports_needed": [], "warnings": ["AI returned non-JSON"]}

        return AIHandlerResponse(
            handler_code=data.get("handler_code", ""),
            imports_needed=data.get("imports_needed", []),
            warnings=data.get("warnings", []),
        )

    except Exception as exc:
        logger.error("AI handler generation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(exc)[:200]}",
        )
