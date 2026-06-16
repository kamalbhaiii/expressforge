from app.models.config import GenerateConfig
from app.services.ai_service import enhance_with_ai
from app.services.template_engine import render_templates
from app.services.zip_builder import build_zip


class GeneratorService:
    """Orchestrates: AI enhancement → template rendering → ZIP assembly."""

    @staticmethod
    async def run(config: GenerateConfig) -> bytes:
        # BYOK — pass the user's AI config through; no-op if absent
        ai_overrides = await enhance_with_ai(config, ai_config=config.ai)

        files = render_templates(config, ai_overrides=ai_overrides)
        return build_zip(config.project_name, files)
