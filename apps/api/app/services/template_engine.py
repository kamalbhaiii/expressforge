from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

from app.models.config import GenerateConfig

_TEMPLATES_DIR = Path(__file__).parent.parent / "templates"

# ── Static template maps ───────────────────────────────────────────────────────

_BASE_TEMPLATES = [
    "base/app.j2",
    "base/package.json.j2",
    "base/.env.example.j2",
    "base/.gitignore.j2",
    "base/README.md.j2",
]

_AUTH_TEMPLATES: dict[str, list[str]] = {
    "jwt":          ["auth/jwt.j2", "routes/auth_jwt.j2", "models/user.j2"],
    "session":      ["auth/session.j2", "routes/auth_session.j2"],
    "oauth_google": ["auth/oauth_google.j2", "routes/auth_oauth.j2"],
    "api_key":      ["auth/api_key.j2", "routes/auth_api_key.j2"],
    "magic_link":   ["auth/magic_link.j2", "routes/auth_magic_link.j2"],
}

_DATABASE_TEMPLATES: dict[str, list[str]] = {
    "mongodb":            ["database/mongoose.j2", "models/user_mongo.j2"],
    "postgres_prisma":    ["database/prisma.j2", "schema/schema.prisma.j2"],
    "mysql_prisma":       ["database/prisma.j2", "schema/schema.prisma.j2"],
    "postgres_sequelize": ["database/sequelize.j2", "models/user_seq.j2"],
    "sqlite_prisma":      ["database/prisma.j2", "schema/schema.prisma.j2"],
    "redis":              ["database/redis.j2"],
}

_FILE_UPLOAD_TEMPLATES: dict[str, list[str]] = {
    "multer_local":       ["file_upload/multer_local.j2"],
    "multer_s3":          ["file_upload/multer_s3.j2"],
    "multer_cloudinary":  ["file_upload/multer_cloudinary.j2"],
}

_EMAIL_TEMPLATES: dict[str, list[str]] = {
    "nodemailer_smtp": ["email/nodemailer_smtp.j2"],
    "resend":          ["email/resend.j2"],
}

_QUEUE_TEMPLATES: dict[str, list[str]] = {
    "bullmq":    ["queues/bullmq.j2"],
    "node_cron": ["queues/node_cron.j2"],
}

_WEBSOCKET_TEMPLATES: dict[str, list[str]] = {
    "socket_io": ["websockets/socket_io.j2"],
    "ws":        ["websockets/ws.j2"],
}

_VALIDATION_TEMPLATES: dict[str, list[str]] = {
    "zod":               ["middleware/validation_zod.j2"],
    "joi":               ["middleware/validation_joi.j2"],
    "express_validator": ["middleware/validation_express_validator.j2"],
}

_LOGGING_TEMPLATES: dict[str, list[str]] = {
    "winston": ["middleware/logger_winston.j2"],
    "pino":    ["middleware/logger_pino.j2"],
}

# ── Output path mapping ────────────────────────────────────────────────────────

_OUTPUT_MAP: dict[str, str] = {
    # Base
    "base/app.j2":              "src/app.{ext}",
    "base/package.json.j2":     "package.json",
    "base/.env.example.j2":     ".env.example",
    "base/.gitignore.j2":       ".gitignore",
    "base/README.md.j2":        "README.md",
    # Auth
    "auth/jwt.j2":              "src/config/jwt.{ext}",
    "auth/session.j2":          "src/config/session.{ext}",
    "auth/oauth_google.j2":     "src/config/oauth.{ext}",
    "auth/api_key.j2":          "src/config/apiKey.{ext}",
    "auth/magic_link.j2":       "src/config/magicLink.{ext}",
    "routes/auth_jwt.j2":       "src/routes/auth.{ext}",
    "routes/auth_session.j2":   "src/routes/auth_session.{ext}",
    "routes/auth_oauth.j2":     "src/routes/auth_oauth.{ext}",
    "routes/auth_api_key.j2":   "src/routes/auth_api_key.{ext}",
    "routes/auth_magic_link.j2":"src/routes/auth_magic_link.{ext}",
    # Models
    "models/user.j2":           "src/models/user.{ext}",
    "models/user_mongo.j2":     "src/models/user.{ext}",
    "models/user_seq.j2":       "src/models/user.{ext}",
    # Database
    "database/mongoose.j2":     "src/config/database.{ext}",
    "database/prisma.j2":       "src/config/database.{ext}",
    "database/sequelize.j2":    "src/config/database.{ext}",
    "database/redis.j2":        "src/config/redis.{ext}",
    "schema/schema.prisma.j2":  "prisma/schema.prisma",
    # Docker
    "docker/Dockerfile.j2":     "Dockerfile",
    "docker/docker-compose.j2": "docker-compose.yml",
    # Tests
    "tests/setup.j2":           "tests/setup.{ext}",
    "tests/health.test.j2":     "tests/health.test.{ext}",
    # File upload
    "file_upload/multer_local.j2":      "src/config/upload.{ext}",
    "file_upload/multer_s3.j2":         "src/config/upload.{ext}",
    "file_upload/multer_cloudinary.j2": "src/config/upload.{ext}",
    # Email
    "email/nodemailer_smtp.j2": "src/config/email.{ext}",
    "email/resend.j2":          "src/config/email.{ext}",
    # Queues
    "queues/bullmq.j2":    "src/config/queue.{ext}",
    "queues/node_cron.j2": "src/config/cron.{ext}",
    # WebSockets
    "websockets/socket_io.j2": "src/config/socket.{ext}",
    "websockets/ws.j2":        "src/config/socket.{ext}",
    # Middleware helpers
    "middleware/validation_zod.j2":              "src/middleware/validate.{ext}",
    "middleware/validation_joi.j2":              "src/middleware/validate.{ext}",
    "middleware/validation_express_validator.j2":"src/middleware/validate.{ext}",
    "middleware/logger_winston.j2": "src/config/logger.{ext}",
    "middleware/logger_pino.j2":    "src/config/logger.{ext}",
    # Swagger
    "swagger/swagger.j2": "src/config/swagger.{ext}",
    # Custom routes
    "routes/custom_routes.j2": "src/routes/routes.{ext}",
}


def _build_jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(_TEMPLATES_DIR)),
        undefined=StrictUndefined,
        trim_blocks=True,
        lstrip_blocks=True,
        autoescape=False,
    )


def _resolve_templates(config: GenerateConfig) -> list[tuple[str, str]]:
    """Return ordered (template_path, output_path) pairs, deduplicating output paths."""
    pairs: list[tuple[str, str]] = []
    ext = config.file_ext
    seen_outputs: set[str] = set()

    def add(tpl: str) -> None:
        out = _OUTPUT_MAP.get(tpl, tpl).replace("{ext}", ext)
        if out not in seen_outputs:
            pairs.append((tpl, out))
            seen_outputs.add(out)

    # Base
    for tpl in _BASE_TEMPLATES:
        add(tpl)

    # Auth
    for strategy in config.auth:
        for tpl in _AUTH_TEMPLATES.get(strategy, []):
            add(tpl)

    # Database
    for db in config.database:
        for tpl in _DATABASE_TEMPLATES.get(db, []):
            add(tpl)

    # File upload (pick one, first wins)
    for option in config.file_upload:
        for tpl in _FILE_UPLOAD_TEMPLATES.get(option, []):
            add(tpl)

    # Email (pick one, first wins)
    for option in config.email:
        for tpl in _EMAIL_TEMPLATES.get(option, []):
            add(tpl)

    # Queues (multi-select)
    for option in config.queues:
        for tpl in _QUEUE_TEMPLATES.get(option, []):
            add(tpl)

    # WebSockets (pick one, first wins)
    for option in config.websockets:
        for tpl in _WEBSOCKET_TEMPLATES.get(option, []):
            add(tpl)

    # Validation middleware (pick one, first wins)
    for mw in config.middleware:
        if mw in _VALIDATION_TEMPLATES:
            for tpl in _VALIDATION_TEMPLATES[mw]:
                add(tpl)

    # Logging middleware (pick one, first wins)
    for mw in config.middleware:
        if mw in _LOGGING_TEMPLATES:
            for tpl in _LOGGING_TEMPLATES[mw]:
                add(tpl)

    # Swagger
    if config.include_swagger or "swagger_ui" in config.middleware:
        add("swagger/swagger.j2")

    # Docker
    if config.include_docker:
        add("docker/Dockerfile.j2")
        add("docker/docker-compose.j2")

    # Tests
    if config.include_tests:
        add("tests/setup.j2")
        add("tests/health.test.j2")

    # Custom routes from route builder
    if config.routes:
        add("routes/custom_routes.j2")

    return pairs


def render_templates(
    config: GenerateConfig,
    ai_overrides: dict[str, str] | None = None,
) -> dict[str, str]:
    """Render all templates for config → {output_path: file_content}."""
    env = _build_jinja_env()

    # Build full context including Phase 2 fields
    ctx = config.model_dump()
    ctx["ext"] = config.file_ext
    # Serialize routes to plain dicts for Jinja
    ctx["routes"] = [r.model_dump() for r in config.routes]

    files: dict[str, str] = {}

    for tpl_path, out_path in _resolve_templates(config):
        if ai_overrides and out_path in ai_overrides:
            files[out_path] = ai_overrides[out_path]
            continue

        template = env.get_template(tpl_path)
        files[out_path] = template.render(**ctx)

    return files
