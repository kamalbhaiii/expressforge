"""
White-box tests for template_engine.render_templates().
Tests verify output file presence, content correctness, and Phase 2 feature rendering.
"""
import json

import pytest

from app.models.config import GenerateConfig, Route, RouteRequestBody, RouteField, RouteResponseShape
from app.services.template_engine import render_templates


def cfg(**kwargs) -> GenerateConfig:
    defaults: dict = {
        "project_name": "test-api",
        "language": "javascript",
        "port": 3000,
        "auth": [],
        "database": [],
        "middleware": [],
        "file_upload": [],
        "email": [],
        "queues": [],
        "websockets": [],
        "include_docker": False,
        "include_tests": False,
        "include_swagger": False,
        "routes": [],
    }
    return GenerateConfig(**{**defaults, **kwargs})


# ── Base files ─────────────────────────────────────────────────────────────────

def test_base_files_always_present():
    files = render_templates(cfg())
    for f in ["src/app.js", "package.json", ".env.example", ".gitignore", "README.md"]:
        assert f in files, f"Expected {f} in output"


def test_typescript_extension():
    files = render_templates(cfg(language="typescript"))
    assert "src/app.ts" in files
    assert "src/app.js" not in files


def test_port_in_app_file():
    files = render_templates(cfg(port=4000))
    assert "4000" in files["src/app.js"]


def test_project_name_in_package_json():
    files = render_templates(cfg())
    pkg = json.loads(files["package.json"].replace('"_placeholder": "1"', '"_placeholder": "1"'))
    assert pkg["name"] == "test-api"


# ── Auth ───────────────────────────────────────────────────────────────────────

def test_jwt_auth_files():
    files = render_templates(cfg(auth=["jwt"]))
    assert "src/config/jwt.js" in files
    assert "src/routes/auth.js" in files


def test_session_auth_files():
    files = render_templates(cfg(auth=["session"]))
    assert "src/config/session.js" in files


def test_oauth_google_files():
    files = render_templates(cfg(auth=["oauth_google"]))
    assert "src/config/oauth.js" in files
    assert "src/routes/auth_oauth.js" in files


def test_api_key_auth_files():
    files = render_templates(cfg(auth=["api_key"]))
    assert "src/config/apiKey.js" in files


def test_magic_link_auth_files():
    files = render_templates(cfg(auth=["magic_link"]))
    assert "src/config/magicLink.js" in files


def test_multi_auth_strategies():
    files = render_templates(cfg(auth=["jwt", "session"]))
    assert "src/config/jwt.js" in files
    assert "src/config/session.js" in files


# ── Database ───────────────────────────────────────────────────────────────────

def test_mongodb_files():
    files = render_templates(cfg(database=["mongodb"]))
    assert "src/config/database.js" in files
    assert "src/models/user.js" in files


def test_postgres_prisma_files():
    files = render_templates(cfg(database=["postgres_prisma"]))
    assert "prisma/schema.prisma" in files
    assert "src/config/database.js" in files


def test_mysql_prisma_files():
    files = render_templates(cfg(database=["mysql_prisma"]))
    assert "prisma/schema.prisma" in files


def test_postgres_sequelize_files():
    files = render_templates(cfg(database=["postgres_sequelize"]))
    assert "src/config/database.js" in files
    assert "src/models/user.js" in files


def test_redis_database_files():
    files = render_templates(cfg(database=["redis"]))
    assert "src/config/redis.js" in files


# ── Docker & Tests ─────────────────────────────────────────────────────────────

def test_docker_files_when_requested():
    files = render_templates(cfg(include_docker=True))
    assert "Dockerfile" in files
    assert "docker-compose.yml" in files


def test_no_docker_by_default():
    files = render_templates(cfg())
    assert "Dockerfile" not in files


def test_test_files_when_requested():
    files = render_templates(cfg(include_tests=True))
    assert "tests/setup.js" in files
    assert "tests/health.test.js" in files


def test_no_test_files_by_default():
    files = render_templates(cfg())
    assert "tests/setup.js" not in files


# ── Phase 2 — File upload ─────────────────────────────────────────────────────

def test_multer_local_upload():
    files = render_templates(cfg(file_upload=["multer_local"]))
    assert "src/config/upload.js" in files
    assert "diskStorage" in files["src/config/upload.js"]


def test_multer_s3_upload():
    files = render_templates(cfg(file_upload=["multer_s3"]))
    assert "src/config/upload.js" in files
    assert "S3Client" in files["src/config/upload.js"]


def test_multer_cloudinary_upload():
    files = render_templates(cfg(file_upload=["multer_cloudinary"]))
    assert "src/config/upload.js" in files
    assert "cloudinary" in files["src/config/upload.js"]


def test_file_upload_in_package_json():
    files = render_templates(cfg(file_upload=["multer_local"]))
    assert "multer" in files["package.json"]


def test_s3_packages_in_package_json():
    files = render_templates(cfg(file_upload=["multer_s3"]))
    assert "multer-s3" in files["package.json"]
    assert "@aws-sdk/client-s3" in files["package.json"]


def test_cloudinary_packages_in_package_json():
    files = render_templates(cfg(file_upload=["multer_cloudinary"]))
    assert "cloudinary" in files["package.json"]


# ── Phase 2 — Email ───────────────────────────────────────────────────────────

def test_nodemailer_smtp_email():
    files = render_templates(cfg(email=["nodemailer_smtp"]))
    assert "src/config/email.js" in files
    assert "nodemailer" in files["src/config/email.js"]
    assert "nodemailer" in files["package.json"]


def test_resend_email():
    files = render_templates(cfg(email=["resend"]))
    assert "src/config/email.js" in files
    assert "Resend" in files["src/config/email.js"]
    assert "resend" in files["package.json"]


def test_resend_env_in_env_example():
    files = render_templates(cfg(email=["resend"]))
    assert "RESEND_API_KEY" in files[".env.example"]


def test_smtp_env_in_env_example():
    files = render_templates(cfg(email=["nodemailer_smtp"]))
    assert "SMTP_HOST" in files[".env.example"]


# ── Phase 2 — Queues ──────────────────────────────────────────────────────────

def test_bullmq_queue():
    files = render_templates(cfg(queues=["bullmq"]))
    assert "src/config/queue.js" in files
    assert "bullmq" in files["src/config/queue.js"]
    assert "bullmq" in files["package.json"]


def test_node_cron_queue():
    files = render_templates(cfg(queues=["node_cron"]))
    assert "src/config/cron.js" in files
    assert "node-cron" in files["src/config/cron.js"]
    assert "node-cron" in files["package.json"]


def test_multi_queue_providers():
    files = render_templates(cfg(queues=["bullmq", "node_cron"]))
    assert "src/config/queue.js" in files
    assert "src/config/cron.js" in files


# ── Phase 2 — WebSockets ──────────────────────────────────────────────────────

def test_socket_io_websocket():
    files = render_templates(cfg(websockets=["socket_io"]))
    assert "src/config/socket.js" in files
    assert "socket.io" in files["src/config/socket.js"]
    assert "socket.io" in files["package.json"]
    assert "initSocketIO" in files["src/app.js"]


def test_ws_websocket():
    files = render_templates(cfg(websockets=["ws"]))
    assert "src/config/socket.js" in files
    assert "WebSocketServer" in files["src/config/socket.js"]
    assert "ws" in files["package.json"]


# ── Phase 2 — Validation middleware ───────────────────────────────────────────

def test_zod_validation():
    files = render_templates(cfg(middleware=["zod"]))
    assert "src/middleware/validate.js" in files
    assert "zod" in files["package.json"]


def test_joi_validation():
    files = render_templates(cfg(middleware=["joi"]))
    assert "src/middleware/validate.js" in files
    assert "joi" in files["package.json"]


def test_express_validator():
    files = render_templates(cfg(middleware=["express_validator"]))
    assert "src/middleware/validate.js" in files
    assert "express-validator" in files["package.json"]


# ── Phase 2 — Logging middleware ──────────────────────────────────────────────

def test_winston_logger():
    files = render_templates(cfg(middleware=["winston"]))
    assert "src/config/logger.js" in files
    assert "winston" in files["src/config/logger.js"]
    assert "winston" in files["package.json"]
    assert "requestLogger" in files["src/app.js"]


def test_pino_logger():
    files = render_templates(cfg(middleware=["pino"]))
    assert "src/config/logger.js" in files
    assert "pino" in files["src/config/logger.js"]
    assert "pino" in files["package.json"]


# ── Phase 2 — Swagger ─────────────────────────────────────────────────────────

def test_swagger_via_flag():
    files = render_templates(cfg(include_swagger=True))
    assert "src/config/swagger.js" in files
    assert "swagger-jsdoc" in files["package.json"]
    assert "setupSwagger" in files["src/app.js"]
    assert "/api-docs" in files["src/config/swagger.js"]


def test_swagger_via_middleware():
    files = render_templates(cfg(middleware=["swagger_ui"]))
    assert "src/config/swagger.js" in files


def test_project_name_in_swagger():
    files = render_templates(cfg(include_swagger=True))
    assert "test-api" in files["src/config/swagger.js"]


# ── Phase 2 — Custom routes ───────────────────────────────────────────────────

def test_custom_routes_generated():
    routes = [
        Route(
            id="1", method="GET", path="/users", tag="users",
            summary="List users",
            response=RouteResponseShape(success_code=200, shape="json_array"),
        )
    ]
    files = render_templates(cfg(routes=routes))
    assert "src/routes/routes.js" in files
    assert "/users" in files["src/routes/routes.js"]
    assert "router.get" in files["src/routes/routes.js"]


def test_custom_routes_post_with_body():
    route = Route(
        id="2", method="POST", path="/items", tag="items",
        summary="Create item",
        request_body=RouteRequestBody(
            type="json",
            fields=[RouteField(name="title", type="string", required=True)],
        ),
        response=RouteResponseShape(success_code=201, shape="json_object"),
    )
    files = render_templates(cfg(routes=[route]))
    content = files["src/routes/routes.js"]
    assert "router.post" in content
    assert "/items" in content
    assert "title" in content


def test_custom_routes_with_handler_code():
    route = Route(
        id="3", method="DELETE", path="/items/:id", tag="items",
        handler_mode="ai",
        handler_code="res.status(204).send();",
        response=RouteResponseShape(success_code=204, shape="empty"),
    )
    files = render_templates(cfg(routes=[route]))
    assert "res.status(204).send();" in files["src/routes/routes.js"]


def test_custom_routes_mounted_in_app():
    routes = [Route(id="4", method="GET", path="/ping")]
    files = render_templates(cfg(routes=routes))
    assert "customRoutes" in files["src/app.js"]
    assert "/api" in files["src/app.js"]


def test_no_routes_file_when_routes_empty():
    files = render_templates(cfg(routes=[]))
    assert "src/routes/routes.js" not in files


# ── AI override ────────────────────────────────────────────────────────────────

def test_ai_override_replaces_file():
    files = render_templates(cfg(), ai_overrides={"README.md": "# AI README"})
    assert files["README.md"] == "# AI README"


# ── Middleware in app.js ───────────────────────────────────────────────────────

def test_cors_in_app_js():
    files = render_templates(cfg(middleware=["cors"]))
    assert "cors" in files["src/app.js"]


def test_helmet_in_app_js():
    files = render_templates(cfg(middleware=["helmet"]))
    assert "helmet" in files["src/app.js"]


def test_no_cors_in_app_js_by_default():
    files = render_templates(cfg())
    assert "cors()" not in files["src/app.js"]


# ── Env example — Phase 2 vars ────────────────────────────────────────────────

def test_s3_env_in_env_example():
    files = render_templates(cfg(file_upload=["multer_s3"]))
    assert "AWS_ACCESS_KEY_ID" in files[".env.example"]
    assert "S3_BUCKET" in files[".env.example"]


def test_local_upload_env_in_env_example():
    files = render_templates(cfg(file_upload=["multer_local"]))
    assert "UPLOAD_DIR" in files[".env.example"]


def test_bullmq_redis_env_in_env_example():
    files = render_templates(cfg(queues=["bullmq"]))
    assert "REDIS_URL" in files[".env.example"]


# ── TypeScript Phase 2 ────────────────────────────────────────────────────────

def test_typescript_socket_io():
    files = render_templates(cfg(language="typescript", websockets=["socket_io"]))
    assert "src/config/socket.ts" in files
    assert "Server" in files["src/config/socket.ts"]


def test_typescript_zod_types():
    files = render_templates(cfg(language="typescript", middleware=["zod"]))
    assert "src/middleware/validate.ts" in files
    assert "ZodSchema" in files["src/middleware/validate.ts"]


def test_typescript_swagger():
    files = render_templates(cfg(language="typescript", include_swagger=True))
    assert "src/config/swagger.ts" in files
    assert "Express" in files["src/config/swagger.ts"]


def test_typescript_custom_routes():
    routes = [Route(id="5", method="GET", path="/ts-test")]
    files = render_templates(cfg(language="typescript", routes=routes))
    assert "src/routes/routes.ts" in files
    assert "Request, Response" in files["src/routes/routes.ts"]
