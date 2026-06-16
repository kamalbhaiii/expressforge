/**
 * Shared TypeScript types used across the application.
 * Single source of truth for all domain types.
 */

// ── Auth types ────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  totp_enabled: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  requires_totp?: boolean;
  requires_device_approval?: boolean;
  totp_session_token?: string;
}

export interface DeviceInfo {
  id: string;
  label: string;
  trusted: boolean;
  created_at: string;
  last_seen_at: string;
}

// ── Config builder types ───────────────────────────────────────────────────────

export type AuthStrategy =
  | "jwt"
  | "session"
  | "oauth_google"
  | "api_key"
  | "magic_link"
  | "basic_auth"
  | "rbac"
  | "jwt_refresh";

export type DatabaseOption =
  | "mongodb"
  | "postgres_prisma"
  | "mysql_prisma"
  | "postgres_sequelize"
  | "sqlite_prisma"
  | "redis"
  | "multi_db";

export type MiddlewareOption =
  | "cors"
  | "helmet"
  | "rate_limit"
  | "morgan"
  | "compression"
  | "body_parser"
  | "cookie_parser"
  | "multer"
  | "zod"
  | "joi"
  | "express_validator"
  | "winston"
  | "pino"
  | "swagger_ui";

export type FileUploadOption = "multer_local" | "multer_s3" | "multer_cloudinary";
export type EmailOption = "nodemailer_smtp" | "resend";
export type QueueOption = "bullmq" | "node_cron";
export type WebSocketOption = "socket_io" | "ws";

export interface GenerateConfig {
  project_name: string;
  language: "javascript" | "typescript";
  port: number;
  auth: string[];
  database: string[];
  middleware: string[];
  file_upload: string[];
  email: string[];
  queues: string[];
  websockets: string[];
  include_docker: boolean;
  include_tests: boolean;
  include_swagger: boolean;
}

export interface AIConfig {
  provider: "anthropic" | "openai" | "gemini";
  api_key: string;
}

// ── Route Builder types ────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface FieldSchema {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "uuid";
  required: boolean;
  validation?: string;
}

export interface RouteRequestBody {
  type: "json" | "formdata" | "none";
  fields: FieldSchema[];
}

export interface RouteResponseShape {
  success_code: number;
  shape: "json_object" | "json_array" | "empty";
  example?: string;
}

export interface Route {
  id: string;
  method: HttpMethod;
  path: string;
  tag: string;
  summary: string;
  middleware: string[];
  request_body: RouteRequestBody;
  response: RouteResponseShape;
  handler_mode: "template" | "ai";
  handler_code?: string;
  auth_required: boolean;
  rate_limited: boolean;
}

// ── Project types ─────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  slug: string;
  config: GenerateConfig;
  routes: Route[];
  routes_count: number;
  created_at: string;
  updated_at: string;
  last_generated_at: string | null;
  generation_count: number;
}
