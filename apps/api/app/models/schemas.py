"""Pydantic schemas for projects and route builder."""

import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class FieldSchema(BaseModel):
    name: str
    type: Literal["string", "number", "boolean", "date", "uuid"]
    required: bool = True
    validation: str | None = None


class RouteRequestBody(BaseModel):
    type: Literal["json", "formdata", "none"] = "none"
    fields: list[FieldSchema] = []


class RouteResponse(BaseModel):
    success_code: int = 200
    shape: Literal["json_object", "json_array", "empty"] = "json_object"
    example: str | None = None


class Route(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    method: Literal["GET", "POST", "PUT", "PATCH", "DELETE"]
    path: str
    tag: str = "default"
    summary: str = ""
    middleware: list[str] = []
    request_body: RouteRequestBody = Field(default_factory=RouteRequestBody)
    response: RouteResponse = Field(default_factory=RouteResponse)
    handler_mode: Literal["template", "ai"] = "template"
    handler_code: str | None = None
    auth_required: bool = False
    rate_limited: bool = False


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    config: dict = Field(default_factory=dict)
    routes: list[Route] = []


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    config: dict | None = None
    routes: list[Route] | None = None


class ProjectResponse(BaseModel):
    id: str
    name: str
    slug: str
    config: dict
    routes: list[dict]
    routes_count: int
    created_at: datetime
    updated_at: datetime
    last_generated_at: datetime | None
    generation_count: int


class AIHandlerRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=1000)
    route: Route
    project_config: dict


class AIHandlerResponse(BaseModel):
    handler_code: str
    imports_needed: list[str] = []
    warnings: list[str] = []
