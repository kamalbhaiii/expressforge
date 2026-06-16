import re
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.services.ai_providers import SUPPORTED_PROVIDERS

AuthStrategy = Literal["jwt", "session", "oauth_google", "api_key", "magic_link", "basic_auth", "rbac", "jwt_refresh"]
DatabaseOption = Literal[
    "mongodb",
    "postgres_prisma",
    "mysql_prisma",
    "postgres_sequelize",
    "sqlite_prisma",
    "redis",
    "multi_db",
]
MiddlewareOption = Literal[
    "cors", "helmet", "rate_limit", "morgan", "compression",
    "body_parser", "cookie_parser", "multer",
    "zod", "joi", "express_validator", "winston", "pino", "swagger_ui",
]
FileUploadOption = Literal["multer_local", "multer_s3", "multer_cloudinary"]
EmailOption = Literal["nodemailer_smtp", "resend"]
QueueOption = Literal["bullmq", "node_cron"]
WebSocketOption = Literal["socket_io", "ws"]


class AIConfig(BaseModel):
    """BYOK — user supplies their own LLM provider and API key."""

    provider: Literal["anthropic", "openai", "gemini"] = "anthropic"
    api_key: str = Field(default="", max_length=512)

    @field_validator("provider")
    @classmethod
    def validate_provider(cls, v: str) -> str:
        if v not in SUPPORTED_PROVIDERS:
            raise ValueError(
                f"provider must be one of: {', '.join(sorted(SUPPORTED_PROVIDERS))}"
            )
        return v


class RouteField(BaseModel):
    name: str
    type: str = "string"
    required: bool = True


class RouteRequestBody(BaseModel):
    type: Literal["json", "formdata", "none"] = "none"
    fields: list[RouteField] = []


class RouteResponseShape(BaseModel):
    success_code: int = 200
    shape: Literal["json_object", "json_array", "empty"] = "json_object"


class Route(BaseModel):
    id: str = ""
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"] = "GET"
    path: str = "/"
    tag: str = "default"
    summary: str = ""
    middleware: list[str] = []
    request_body: RouteRequestBody = RouteRequestBody()
    response: RouteResponseShape = RouteResponseShape()
    handler_mode: Literal["template", "ai"] = "template"
    handler_code: str | None = None
    auth_required: bool = False
    rate_limited: bool = False


class GenerateConfig(BaseModel):
    project_name: str = Field(..., min_length=1, max_length=64)
    language: Literal["javascript", "typescript"] = "javascript"
    port: int = Field(3000, ge=1024, le=65535)

    # Multi-select
    auth: list[AuthStrategy] = []
    database: list[DatabaseOption] = []
    middleware: list[MiddlewareOption] = []

    # Phase 2 feature groups
    file_upload: list[FileUploadOption] = []
    email: list[EmailOption] = []
    queues: list[QueueOption] = []
    websockets: list[WebSocketOption] = []

    include_docker: bool = False
    include_tests: bool = False
    include_swagger: bool = False

    # Route builder — list of custom routes
    routes: list[Route] = []

    # BYOK — optional, omit to skip AI enhancement
    ai: AIConfig | None = None

    @field_validator("project_name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        if not re.match(r"^[a-z0-9-]+$", v):
            raise ValueError(
                "project_name must be kebab-case (lowercase letters, digits, hyphens only)"
            )
        return v

    @property
    def file_ext(self) -> str:
        return "ts" if self.language == "typescript" else "js"
