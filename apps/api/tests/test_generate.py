"""
Black-box HTTP tests for POST /generate.
Tests cover Phase 1 and Phase 2 configuration options via the HTTP API.
All /generate calls require authentication — tests use auth_client fixture.
"""
import io
import zipfile

import pytest
from httpx import AsyncClient


def zip_names(content: bytes, project: str) -> list[str]:
    zf = zipfile.ZipFile(io.BytesIO(content))
    return [n[len(project) + 1:] for n in zf.namelist() if n.startswith(project + "/")]


# ── Health (no auth) ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health(client: AsyncClient) -> None:
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


# ── Minimal generate ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_minimal_returns_zip(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json=minimal_config)
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"


@pytest.mark.asyncio
async def test_generate_zip_contains_required_files(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json=minimal_config)
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    for f in ["src/app.js", "package.json", ".env.example", "README.md"]:
        assert f in names, f"Missing {f} in zip"


@pytest.mark.asyncio
async def test_content_disposition_header(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json=minimal_config)
    assert "test-api.zip" in res.headers["content-disposition"]


# ── Unauthenticated is rejected ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_requires_auth(client: AsyncClient, minimal_config: dict) -> None:
    res = await client.post("/generate", json=minimal_config)
    assert res.status_code in (401, 403)


# ── Validation errors ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_invalid_project_name_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "project_name": "My API!!"})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_uppercase_project_name_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "project_name": "MyApi"})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_port_too_low_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "port": 80})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_language_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "language": "python"})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_auth_option_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "auth": ["ftp_auth"]})
    assert res.status_code == 422


@pytest.mark.asyncio
async def test_invalid_file_upload_option_rejected(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "file_upload": ["ftp"]})
    assert res.status_code == 422


# ── Auth options ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("auth", [["jwt"], ["session"], ["oauth_google"], ["api_key"], ["magic_link"]])
async def test_generate_auth_options(auth_client: AsyncClient, minimal_config: dict, auth: list) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "auth": auth})
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"


@pytest.mark.asyncio
async def test_generate_jwt_config_file_in_zip(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "auth": ["jwt"]})
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/jwt.js" in names
    assert "src/routes/auth.js" in names


@pytest.mark.asyncio
async def test_generate_multi_auth_in_zip(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "auth": ["jwt", "session"]})
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/jwt.js" in names
    assert "src/config/session.js" in names


# ── Database options ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("database", [
    ["mongodb"], ["postgres_prisma"], ["mysql_prisma"], ["postgres_sequelize"], ["redis"]
])
async def test_generate_database_options(
    auth_client: AsyncClient, minimal_config: dict, database: list
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "database": database})
    assert res.status_code == 200


@pytest.mark.asyncio
async def test_generate_postgres_prisma_has_schema(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "database": ["postgres_prisma"]})
    names = zip_names(res.content, minimal_config["project_name"])
    assert "prisma/schema.prisma" in names


@pytest.mark.asyncio
async def test_generate_mongodb_has_model(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "database": ["mongodb"]})
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/models/user.js" in names


# ── Language options ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_typescript_project(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "language": "typescript", "auth": ["jwt"]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/app.ts" in names
    assert "src/app.js" not in names


# ── Docker & tests ────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_with_docker(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "include_docker": True})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "Dockerfile" in names
    assert "docker-compose.yml" in names


@pytest.mark.asyncio
async def test_generate_with_tests(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "include_tests": True})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "tests/setup.js" in names
    assert "tests/health.test.js" in names


# ── Middleware ────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_all_basic_middleware(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={
        **minimal_config,
        "middleware": ["cors", "helmet", "rate_limit", "morgan", "compression"],
    })
    assert res.status_code == 200


# ── Phase 2 — File upload ─────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("option", ["multer_local", "multer_s3", "multer_cloudinary"])
async def test_generate_file_upload_options(
    auth_client: AsyncClient, minimal_config: dict, option: str
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "file_upload": [option]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/upload.js" in names


# ── Phase 2 — Email ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("option", ["nodemailer_smtp", "resend"])
async def test_generate_email_options(
    auth_client: AsyncClient, minimal_config: dict, option: str
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "email": [option]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/email.js" in names


# ── Phase 2 — Queues ──────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_bullmq_queue(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "queues": ["bullmq"]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/queue.js" in names


@pytest.mark.asyncio
async def test_generate_node_cron_queue(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "queues": ["node_cron"]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/cron.js" in names


@pytest.mark.asyncio
async def test_generate_multi_queue(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "queues": ["bullmq", "node_cron"]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/queue.js" in names
    assert "src/config/cron.js" in names


# ── Phase 2 — WebSockets ──────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("option", ["socket_io", "ws"])
async def test_generate_websocket_options(
    auth_client: AsyncClient, minimal_config: dict, option: str
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "websockets": [option]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/socket.js" in names


# ── Phase 2 — Validation middleware ───────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("validator", ["zod", "joi", "express_validator"])
async def test_generate_validation_middleware(
    auth_client: AsyncClient, minimal_config: dict, validator: str
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "middleware": [validator]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/middleware/validate.js" in names


# ── Phase 2 — Logging middleware ──────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.parametrize("logger", ["winston", "pino"])
async def test_generate_logging_middleware(
    auth_client: AsyncClient, minimal_config: dict, logger: str
) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "middleware": [logger]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/logger.js" in names


# ── Phase 2 — Swagger ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_swagger_via_flag(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "include_swagger": True})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/swagger.js" in names


@pytest.mark.asyncio
async def test_generate_swagger_via_middleware(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "middleware": ["swagger_ui"]})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/config/swagger.js" in names


# ── Phase 2 — Custom routes ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_with_custom_get_route(auth_client: AsyncClient, minimal_config: dict) -> None:
    routes = [{"id": "1", "method": "GET", "path": "/users", "tag": "users", "summary": "List users"}]
    res = await auth_client.post("/generate", json={**minimal_config, "routes": routes})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/routes/routes.js" in names


@pytest.mark.asyncio
async def test_generate_with_custom_post_route(auth_client: AsyncClient, minimal_config: dict) -> None:
    routes = [{
        "id": "2",
        "method": "POST",
        "path": "/items",
        "tag": "items",
        "request_body": {
            "type": "json",
            "fields": [{"name": "title", "type": "string", "required": True}],
        },
        "response": {"success_code": 201, "shape": "json_object"},
    }]
    res = await auth_client.post("/generate", json={**minimal_config, "routes": routes})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/routes/routes.js" in names


@pytest.mark.asyncio
async def test_generate_empty_routes_no_routes_file(auth_client: AsyncClient, minimal_config: dict) -> None:
    res = await auth_client.post("/generate", json={**minimal_config, "routes": []})
    assert res.status_code == 200
    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/routes/routes.js" not in names


# ── Phase 2 — Full kitchen-sink ───────────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_kitchen_sink(auth_client: AsyncClient, minimal_config: dict) -> None:
    """Full Phase 2 config with all features enabled."""
    routes = [
        {"id": "r1", "method": "GET", "path": "/products", "tag": "products"},
        {"id": "r2", "method": "POST", "path": "/products", "tag": "products", "auth_required": True},
    ]
    cfg = {
        **minimal_config,
        "project_name": "kitchen-sink",
        "language": "javascript",
        "auth": ["jwt"],
        "database": ["mongodb"],
        "middleware": ["cors", "helmet", "winston", "zod"],
        "file_upload": ["multer_local"],
        "email": ["resend"],
        "queues": ["bullmq"],
        "websockets": ["socket_io"],
        "include_swagger": True,
        "include_docker": True,
        "include_tests": True,
        "routes": routes,
    }
    res = await auth_client.post("/generate", json=cfg)
    assert res.status_code == 200

    names = zip_names(res.content, "kitchen-sink")
    assert "src/app.js" in names
    assert "src/config/jwt.js" in names
    assert "src/config/database.js" in names
    assert "src/config/upload.js" in names
    assert "src/config/email.js" in names
    assert "src/config/queue.js" in names
    assert "src/config/socket.js" in names
    assert "src/config/swagger.js" in names
    assert "src/config/logger.js" in names
    assert "src/middleware/validate.js" in names
    assert "src/routes/routes.js" in names
    assert "Dockerfile" in names
    assert "tests/setup.js" in names


# ── Phase 2 — TypeScript kitchen sink ────────────────────────────────────────

@pytest.mark.asyncio
async def test_generate_typescript_phase2(auth_client: AsyncClient, minimal_config: dict) -> None:
    routes = [{"id": "ts1", "method": "GET", "path": "/ts-route", "tag": "test"}]
    cfg = {
        **minimal_config,
        "language": "typescript",
        "websockets": ["socket_io"],
        "include_swagger": True,
        "middleware": ["zod", "winston"],
        "routes": routes,
    }
    res = await auth_client.post("/generate", json=cfg)
    assert res.status_code == 200

    names = zip_names(res.content, minimal_config["project_name"])
    assert "src/app.ts" in names
    assert "src/config/socket.ts" in names
    assert "src/config/swagger.ts" in names
    assert "src/config/logger.ts" in names
    assert "src/middleware/validate.ts" in names
    assert "src/routes/routes.ts" in names
