# ExpressForge

**Visual Express.js Backend Builder — configure, build routes, generate, download, run.**

Select your stack, define routes visually, download a production-ready Express.js ZIP → `npm install && npm run dev`. No hosted backend, no vendor lock-in. Every line of generated code is yours.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Monorepo Structure](#monorepo-structure)
- [Feature Scope](#feature-scope)
- [Local Development](#local-development)
- [Environment Variables](#environment-variables)
- [Running Tests](#running-tests)
- [CI/CD](#cicd)
- [Architecture](#architecture)
- [Security](#security)
- [Deployment](#deployment)
- [Changelog](#changelog)

---

## Overview

ExpressForge is a full-stack web application where developers configure backend features, define REST routes visually, and download a production-ready Express.js project ZIP.

**What makes it different:**
- **Visual Route Builder** — drag-and-drop route list, form-based configuration (method, path, auth, body schema), and optional AI-generated handler code (BYOK).
- **CRUD Scaffold** — one click generates 5 REST routes (list, get, create, update, delete) for any resource.
- **Saved Projects** — authenticated users can save, reload, duplicate, and manage multiple projects.
- **Secure accounts** — Argon2id password hashing, TOTP 2FA, Magic Device Fingerprint, account lockout, email verification.
- **Multi-select everything** — pick multiple auth strategies, databases, middleware, file upload adapters, email providers, queue libraries, and WebSocket implementations.
- **BYOK AI** — supply your own LLM key for AI-generated route handler code. Key never stored.
- **Single env file per environment** — `.env.development`, `.env.staging`, `.env.production`. No per-service config fragmentation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| UI Components | Radix UI (Dialog, Dropdown, Select, Tabs, Toast, Avatar), @dnd-kit (drag-and-drop) |
| Backend | FastAPI (Python 3.11), Jinja2, SQLAlchemy (async + asyncpg) |
| Auth (Platform) | Argon2id · AES-256-GCM (TOTP) · Fernet (email) · HS256 JWT · TOTP 2FA (RFC 6238) · Device Fingerprint |
| Email | Resend API |
| Session Cache | Redis (async via `redis.asyncio`) — rate limiting, session cache, TOTP setup temp store |
| AI (BYOK) | Anthropic `claude-sonnet-4-6` · OpenAI `gpt-4o-mini` · Gemini `gemini-1.5-flash` |
| Database | PostgreSQL (users, projects, devices, jobs) |
| ZIP Generation | Python `zipfile` stdlib — fully in-memory, no disk writes |
| Local Dev | Docker + Docker Compose v2 (API + Web + Postgres + Redis) |
| CI/CD | GitHub Actions |

---

## Monorepo Structure

```
expressforge/
├── apps/
│   ├── web/                              # Next.js 14 frontend
│   │   ├── app/
│   │   │   ├── layout.tsx               # Root layout + ToastProvider
│   │   │   ├── page.tsx                 # Landing page (public)
│   │   │   ├── dashboard/page.tsx       # Project grid (auth-protected)
│   │   │   ├── builder/page.tsx         # Config + Route Builder (auth-protected)
│   │   │   ├── project/[id]/page.tsx    # Load saved project into builder
│   │   │   ├── generate/page.tsx        # Download success page
│   │   │   └── auth/
│   │   │       ├── login/page.tsx
│   │   │       ├── register/page.tsx
│   │   │       ├── verify-email/page.tsx
│   │   │       ├── device-approval/page.tsx
│   │   │       ├── totp/page.tsx
│   │   │       ├── forgot-password/page.tsx
│   │   │       └── reset-password/page.tsx
│   │   │   └── settings/
│   │   │       ├── profile/page.tsx
│   │   │       └── security/page.tsx    # 2FA setup, trusted devices, change password
│   │   ├── components/
│   │   │   ├── ui/                      # Button, Card, Badge, Dialog, Toast,
│   │   │   │                            #   Skeleton, Tabs, Select, Avatar, DropdownMenu
│   │   │   ├── Nav.tsx                  # Shared authenticated/public navbar
│   │   │   ├── auth/
│   │   │   │   ├── AuthForm.tsx         # Reusable login/register form
│   │   │   │   └── AuthModal.tsx        # Modal wrapper around AuthForm
│   │   │   ├── dashboard/
│   │   │   │   └── ProjectCard.tsx      # Project card with actions
│   │   │   ├── builder/
│   │   │   │   ├── RouteCanvas.tsx      # dnd-kit route list with grouping
│   │   │   │   ├── RouteCard.tsx        # Sortable route row
│   │   │   │   ├── RouteFormPanel.tsx   # Route settings (method, path, body, response)
│   │   │   │   ├── HandlerEditor.tsx    # Code editor + AI generate tab
│   │   │   │   └── CRUDScaffoldModal.tsx
│   │   │   └── config-builder/
│   │   │       ├── ProjectNameInput.tsx
│   │   │       ├── AuthPicker.tsx        # Multi-select: 5 strategies
│   │   │       ├── DatabasePicker.tsx    # Multi-select: 6 options
│   │   │       ├── MiddlewarePicker.tsx  # Multi-select: 14 options (Phase 2)
│   │   │       ├── FeatureSelector.tsx   # Docker + Tests + Swagger toggles
│   │   │       ├── Phase2Pickers.tsx     # FileUpload, Email, Queues, WebSockets
│   │   │       ├── AIConfigPicker.tsx    # BYOK provider + key input
│   │   │       └── PreviewPane.tsx       # Live file-tree preview
│   │   └── lib/
│   │       ├── http.ts                  # Axios instance + silent JWT refresh interceptor
│   │       ├── api.ts                   # Generate + project CRUD + AI handler calls
│   │       ├── auth.ts                  # All auth calls + device fingerprint
│   │       ├── types.ts                 # Single source of truth for all domain types
│   │       ├── store.ts                 # Zustand config store (extended for Phase 2)
│   │       ├── authStore.ts             # Zustand auth state (persisted)
│   │       ├── routeStore.ts            # Zustand route builder state + AI generation
│   │       └── utils.ts
│   │
│   └── api/                             # FastAPI backend
│       ├── app/
│       │   ├── main.py                  # App entrypoint + CORS + Redis lifecycle
│       │   ├── core/
│       │   │   ├── config.py            # Pydantic-settings (all Phase 2 vars)
│       │   │   ├── security.py          # Argon2id · AES-256-GCM · Fernet · JWT · TOTP
│       │   │   ├── redis.py             # Async Redis client + rate limiting helpers
│       │   │   ├── email.py             # Resend transactional email templates
│       │   │   └── deps.py              # FastAPI dependencies (get_current_user)
│       │   ├── routers/
│       │   │   ├── auth.py              # Full Phase 2 auth router (20+ endpoints)
│       │   │   ├── projects.py          # Project CRUD + /generate + /duplicate
│       │   │   ├── ai.py                # POST /ai/generate-handler
│       │   │   ├── generate.py          # POST /generate (quick, no save)
│       │   │   └── health.py
│       │   ├── models/
│       │   │   ├── user.py              # Extended User model (TOTP, lockout, profile)
│       │   │   ├── device.py            # Device, DeviceToken, TOTPBackupCode, EmailVerification, PasswordResetToken
│       │   │   ├── project.py           # Project (JSONB config + routes, slug, generation count)
│       │   │   ├── job.py               # GenerationJob (user_id FK)
│       │   │   ├── auth.py              # Pydantic schemas for all auth flows
│       │   │   └── schemas.py           # Route builder + project Pydantic schemas
│       │   ├── db/
│       │   │   ├── database.py          # Async SQLAlchemy engine
│       │   │   ├── user_crud.py         # User CRUD (Argon2id, lockout, TOTP)
│       │   │   ├── device_crud.py       # Device + token CRUD
│       │   │   └── project_crud.py      # Project CRUD + slug generation
│       │   └── services/
│       │       ├── generator.py
│       │       ├── template_engine.py
│       │       ├── ai_service.py
│       │       ├── ai_providers.py
│       │       └── zip_builder.py
│       └── tests/
│
├── .github/workflows/
│   ├── ci.yml                           # Lint + test (Postgres + Redis services)
│   ├── deploy-api.yml                   # Render redeploy on push to main
│   └── deploy-web.yml                   # Vercel deploy on push to main
├── .env.example                         # Unified env template (all Phase 2 vars)
├── docker-compose.yml                   # Local dev: API + Web + Postgres + Redis
├── docker-compose.test.yml              # CI: API + Postgres + Redis (ephemeral)
└── vercel.json
```

---

## Feature Scope

### Authentication (multi-select)

| Strategy | Package |
|---|---|
| `jwt` | `jsonwebtoken` |
| `session` | `express-session`, `connect-pg-simple` |
| `oauth_google` | `passport`, `passport-google-oauth20` |
| `api_key` | built-in |
| `magic_link` | `nodemailer`, `crypto` |

### Database (multi-select)

| Option | ORM / Driver |
|---|---|
| `mongodb` | Mongoose |
| `postgres_prisma` | Prisma |
| `mysql_prisma` | Prisma |
| `postgres_sequelize` | Sequelize |
| `sqlite_prisma` | Prisma |
| `redis` | ioredis |

### Middleware (multi-select — 14 options)

cors · helmet · rate_limit · morgan · compression · body_parser · cookie_parser · multer · **zod** · **joi** · **express_validator** · **winston** · **pino** · **swagger_ui**

### File Upload (pick one)

`multer_local` · `multer_s3` · `multer_cloudinary`

### Email (pick one)

`nodemailer_smtp` · `resend`

### Queues & Jobs (multi-select)

`bullmq` · `node_cron`

### WebSockets (pick one)

`socket_io` · `ws`

### Project Options

| Option | Default |
|---|---|
| Language | JavaScript or TypeScript |
| Port | 3000 |
| Docker | `Dockerfile` + `docker-compose.yml` |
| Tests | Jest setup + route tests |
| Swagger UI | `/api-docs` endpoint |

### Visual Route Builder

- Drag-and-drop route reordering (@dnd-kit)
- Per-route: method, path, tag, summary, auth required, rate limited
- Request body: JSON / multipart fields with type + required flag
- Response: status code + shape (object / array / empty)
- Handler: write code manually or AI-generate from a description
- CRUD Scaffold: one click → 5 routes for any resource

### AI Enhancement (BYOK)

| Provider | Model |
|---|---|
| Anthropic | `claude-sonnet-4-6` |
| OpenAI | `gpt-4o-mini` |
| Gemini | `gemini-1.5-flash` |

Used for: README generation, `.env.example` comments, and route handler code generation. Key never stored.

---

## Local Development

### Prerequisites

- Docker + Docker Compose v2
- Node.js 20+
- Python 3.11+

### Quick Start

```bash
# 1. Clone
git clone https://github.com/kamalbhaiii/expressforge.git
cd expressforge

# 2. Create your dev env file
cp .env.example .env.development

# 3. Generate required secrets
python -c "import secrets; print('JWT_SECRET=' + secrets.token_hex(64))"
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
python -c "import secrets; print('TOTP_ENCRYPTION_KEY=' + secrets.token_hex(32))"

# 4. Add a Resend API key to .env.development
# RESEND_API_KEY=re_your_key_here

# 5. Start all services (API + Web + Postgres + Redis)
docker compose up -d

# Frontend → http://localhost:3000
# API      → http://localhost:8000
# API docs → http://localhost:8000/docs  (dev only)
```

### Without Docker

```bash
# Start Redis (required for auth rate limiting)
redis-server

# Terminal 1 — API
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload

# Terminal 2 — Frontend
cd apps/web
npm install
npm run dev
```

---

## Environment Variables

All services share a **single `.env.<ENVIRONMENT>` file** at the repo root.

| Variable | Required | Description |
|---|---|---|
| `ENVIRONMENT` | No | `development` / `staging` / `production` / `test` |
| `DATABASE_URL` | Yes | `postgresql+asyncpg://...` |
| `REDIS_URL` | Yes | `redis://localhost:6379` |
| `JWT_SECRET` | Yes | Long random string for HS256 JWT signing |
| `ENCRYPTION_KEY` | Yes | Fernet key — email field-level encryption |
| `TOTP_ENCRYPTION_KEY` | Yes | 32-byte hex — AES-256-GCM for TOTP secrets |
| `RESEND_API_KEY` | Yes | Resend transactional email API key |
| `EMAIL_FROM` | No | Sender address (default: `noreply@expressforge.dev`) |
| `APP_URL` | No | Frontend URL for email links (default: `http://localhost:3000`) |
| `AI_ENABLED` | No | Set `false` to disable all AI server-side |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `NEXT_PUBLIC_API_URL` | No | FastAPI public URL (browser-side) |

---

## Running Tests

### Backend

```bash
cd apps/api
pytest tests/ -v --cov=app --cov-report=term-missing
```

### Frontend

```bash
cd apps/web
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # Production build check
```

---

## CI/CD

| Trigger | Workflow | Action |
|---|---|---|
| PR → `main` or `dev` | `ci.yml` | Lint + pytest (with Postgres + Redis) + Next.js build |
| Push → `main` (api changes) | `deploy-api.yml` | Render redeploy |
| Push → `main` (web changes) | `deploy-web.yml` | Vercel CLI deploy |

### Required GitHub Secrets

| Secret | Used by |
|---|---|
| `CI_ENCRYPTION_KEY` | `ci.yml` — Fernet key for tests |
| `CI_TOTP_ENCRYPTION_KEY` | `ci.yml` — AES-256 key for TOTP tests |
| `RENDER_API_KEY` + `RENDER_SERVICE_ID` | `deploy-api.yml` |
| `VERCEL_TOKEN` + `VERCEL_ORG_ID` + `VERCEL_PROJECT_ID` | `deploy-web.yml` |

---

## Architecture

### Phase 2 Auth Flow

```
POST /auth/login  { email, password, device_fingerprint, device_label }
  ├── Redis rate limit: 5 attempts / 15 min per IP
  ├── Argon2id verify (always runs — timing attack prevention)
  ├── Account lockout check (5 failures → 30-min lock + email)
  ├── New device fingerprint?
  │     └── Send device approval email → return { requires_device_approval: true }
  ├── TOTP enabled?
  │     └── Return { requires_totp: true, totp_session_token: <10-min JWT> }
  └── Return { access_token (30m), refresh_token (7d) }

POST /auth/totp/verify  { totp_session_token, code }
  └── Validates TOTP session JWT → verifies TOTP/backup code → issues real tokens

POST /auth/device-approval  { token }
  └── Validates 15-min signed token → marks device trusted → issues tokens (or TOTP step)
```

### Project Persistence

```
POST /projects         → Create project (name, config, routes as JSONB)
GET  /projects         → List user's projects (summary cards)
GET  /projects/:id     → Load full project (config + routes array)
PUT  /projects/:id     → Overwrite config + routes
POST /projects/:id/generate  → Generate + download ZIP (records generation_count)
POST /projects/:id/duplicate → Duplicate with "(copy)" suffix slug
DELETE /projects/:id   → Soft delete
```

---

## Security

| Concern | Implementation |
|---|---|
| **Password hashing** | Argon2id (PHC winner): time_cost=3, memory_cost=64MB, parallelism=1 |
| **Email at rest** | Fernet (AES-128-CBC + HMAC-SHA256) field-level encryption — ciphertext is stored in `email_encrypted` |
| **Email lookup** | HMAC-SHA256 (`email_hash`) used as a deterministic lookup index — Fernet is non-deterministic so querying by ciphertext would never match |
| **TOTP secrets at rest** | AES-256-GCM (separate key from Fernet) |
| **Account lockout** | 5 failed logins → 30-min lock + email alert |
| **Device fingerprint** | djb2 hash of UA + language + timezone + screen + hardware; new device → email approval |
| **TOTP 2FA** | RFC 6238 (pyotp) + 8 hashed backup codes |
| **Timing attacks** | Argon2id always runs on login even for unknown emails |
| **Rate limiting** | Redis sliding window: 5 login attempts/15min per IP |
| **JWT** | Short-lived access (30m) + refresh (7d); `type` claim validated on every endpoint |
| **BYOK AI keys** | Never stored. Used per-request only |
| **CORS** | Restricted to `ALLOWED_ORIGINS` |
| **API docs** | Disabled in `ENVIRONMENT=production` |

---

## Deployment

### Render (API)

- **Runtime:** Python 3.11, Docker
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Add-ons:** PostgreSQL (managed) + Redis (managed)
- Set all environment variables from `.env.example` in the Render dashboard

### Vercel (Frontend)

- **Framework preset:** Next.js
- **Root directory:** `apps/web`
- **Environment variable:** `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`
- `vercel.json` at repo root configures the build

---

## Changelog

### v2.1.0 — June 2026 (Phase 2 Template Engine + Deep Testing)

**Phase 2 template engine complete**
- 16 new Jinja2 templates covering all Phase 2 feature groups: file upload (`multer_local`, `multer_s3`, `multer_cloudinary`), email (`nodemailer_smtp`, `resend`), queues (`bullmq`, `node_cron`), WebSockets (`socket_io`, `ws`), validation middleware (`zod`, `joi`, `express_validator`), logging middleware (`winston`, `pino`), Swagger (`swagger-jsdoc` + `swagger-ui-express`), and custom routes
- `app.j2` updated: HTTP server (`createServer(app)`) created unconditionally so WS can attach; `initSocketIO` called after `httpServer.listen`; Swagger `setupSwagger(app)` called before routes; custom routes imported and mounted at `/api`
- `package.json.j2` updated with all Phase 2 npm packages and TypeScript types
- `.env.example.j2` updated with Phase 2 env vars (S3, Cloudinary, SMTP, Resend, Redis)
- `template_engine.py` rewritten with static template maps (`_FILE_UPLOAD_TEMPLATES`, `_EMAIL_TEMPLATES`, `_QUEUE_TEMPLATES`, `_WEBSOCKET_TEMPLATES`, `_VALIDATION_TEMPLATES`, `_LOGGING_TEMPLATES`) and `_OUTPUT_MAP`; `_resolve_templates()` handles all Phase 2 groups with `seen_outputs` deduplication (first-match-wins)

**Testing — black-box + white-box**
- 68 new white-box unit tests in `test_template_engine.py` covering all Phase 2 template groups, TypeScript variants, custom routes (GET/POST/DELETE with handler code), AI overrides, and middleware injection in `app.js`
- 57 new black-box HTTP tests in `test_generate.py` using `auth_client` fixture; tests cover all Phase 2 config combinations, validation rejection of invalid options, kitchen-sink full-config test, TypeScript Phase 2 test
- `test_auth.py` updated to use unique emails per test run (no cross-run 409 collisions)
- `test_ai_service.py` updated for Phase 2 `GenerateConfig` (array-based API); AI tests properly patch `settings` module reference
- `conftest.py` rewritten: session-scoped event loop, `_init_db` session fixture, session-scoped `client` and `auth_client` (auto-registers test user); `MAX_JOBS_PER_HOUR` env default to bypass rate limits in test env

**Test infrastructure**
- `pytest`, `pytest-asyncio`, `pytest-cov`, `httpx` added to `requirements.txt`
- Rate limiting bypassed in `test` environment: `settings.is_test` guard on `/generate` middleware and `/auth/login` route
- `ai_service.py` Phase 2 prompt builders updated to handle `auth: list[str]` and `database: list[str]` (Phase 1 used strings; `.get()` with a list key would raise `TypeError: unhashable type`)
- Coverage threshold set to 60% (realistic given deep auth flows, device management, project CRUD, and AI provider code are not yet integration-tested)
- All 129 tests pass ✓

---

### v2.0.1 — June 2026 (Bugfixes)

**Docker build fixes (Next.js web image)**
- `AuthModal` in `app/page.tsx` was missing required `isOpen` prop — TypeScript error stopped the build
- `settings/profile/page.tsx` passed `null` where `string | undefined` was required — fixed call site
- Lucide icon components don't accept `title` prop — wrapped `ShieldCheck` and `Gauge` in `<span title="...">` in `RouteCard.tsx`
- `routeStore.ts` used an inline `{ provider: string }` type instead of the `AIConfig` union type — caused type mismatch with `generateHandler()` in `api.ts`
- Four auth pages (`/auth/totp`, `/auth/device-approval`, `/auth/verify-email`, `/auth/reset-password`) used `useSearchParams()` without a `<Suspense>` boundary — Next.js 14 requires all `useSearchParams()` callers to be wrapped in `<Suspense>` for static prerendering

**Backend auth fix (Internal Server Error on register/login)**
- Root cause: `users` table was created by Phase 1 schema — missing columns `display_name`, `avatar_url`, `totp_enabled`, `totp_secret_encrypted`, `failed_attempts`, `locked_until`, and `email_hash`
- Phase 2 columns added via `ALTER TABLE` migration
- `password_hash` column widened from `VARCHAR(60)` (bcrypt) to `TEXT` (Argon2id hashes are longer)
- **Core auth bug**: Fernet encryption is non-deterministic (random IV per call). The login lookup `WHERE email_encrypted = $1` would never match because re-encrypting the same email produces a different ciphertext on every call. Fixed by adding a deterministic `email_hash` column: HMAC-SHA256 of `lower(email)` keyed on `JWT_SECRET`. Registration writes both `email_encrypted` (for reading back the email) and `email_hash` (for lookup). Login queries by `email_hash`. Unique constraint moved from `email_encrypted` to `email_hash`
- Backfill script run to populate `email_hash` for existing users by decrypting `email_encrypted` and re-hashing

---

### v2.0.0 — June 2026 (Phase 2)

**Auth upgrades**
- Replaced bcrypt with **Argon2id** (PHC winner — time_cost=3, memory_cost=64MB)
- **TOTP 2FA** (RFC 6238 via pyotp) — secrets encrypted at rest with AES-256-GCM, 8 backup codes
- **Magic Device Fingerprint** — djb2 hash; new device triggers email approval (15-min signed token)
- **Account lockout** — 5 failures → 30-min lock + automated email notification
- **Redis rate limiting** — sliding window (INCR + EXPIRE) on login endpoint
- **Email verification** flow with Resend transactional emails
- **Password reset** flow with single-use signed token
- **TOTP session token** — 10-min intermediate HS256 JWT between password verify and TOTP verify steps
- Settings pages: `/settings/profile` + `/settings/security` (2FA setup, trusted devices, change password)
- Auth pages: `/auth/login`, `/auth/register`, `/auth/verify-email`, `/auth/device-approval`, `/auth/totp`, `/auth/forgot-password`, `/auth/reset-password`

**Visual Route Builder**
- Drag-and-drop route list (@dnd-kit) with tag grouping
- Per-route form: method, path, tag, summary, auth required, rate limited
- Request body builder: JSON / multipart fields with type + required flag
- Response shape configuration (status code + body shape)
- Handler editor with manual code and AI-generate tab (BYOK)
- CRUD Scaffold modal: one click → 5 REST routes for any resource

**Project Persistence**
- `projects` table: JSONB config + routes, slug, generation count
- Dashboard page (`/dashboard`): project grid with search + sort
- Project detail page (`/project/[id]`): loads saved project into builder
- API: GET/POST/PUT/DELETE/generate/duplicate per project

**Phase 2 config options**
- File upload: `multer_local`, `multer_s3`, `multer_cloudinary`
- Email: `nodemailer_smtp`, `resend`
- Queues: `bullmq`, `node_cron`
- WebSockets: `socket_io`, `ws`
- Middleware: `zod`, `joi`, `express_validator`, `winston`, `pino`, `swagger_ui` added (14 total)
- Swagger UI toggle in Extras

**Infrastructure**
- Redis added to `docker-compose.yml` and `docker-compose.test.yml`
- GitHub Actions `ci.yml` updated with Redis service + `TOTP_ENCRYPTION_KEY`
- Nav component with Avatar + DropdownMenu (authenticated/unauthenticated states)
- Radix UI: Dialog, Dropdown, Select, Tabs, Toast, Avatar, Progress, Separator
- `ToastProvider` in root layout

---

### v1.2.0 — June 2026

- Multi-select auth strategies + databases (any combination in one project)
- Landing page with hero, how-it-works, features, CTA, footer
- Protected builder — `/builder` requires authentication
- Silent JWT refresh interceptor (axios) with request queuing
- Expanded middleware: 8 options (body_parser, cookie_parser, multer added)
- New auth templates: `api_key`, `magic_link`
- New database template: Redis (ioredis)

---

### v1.1.0 — June 2026

- BYOK AI (Anthropic, OpenAI, Gemini) for README + env comments
- User authentication (register, login, refresh, `/me`)
- Fernet email encryption at rest

---

### v1.0.0 — June 2026 (Phase 1 MVP)

- Visual config builder with live file-tree preview
- Auth: JWT, Session, Google OAuth
- Database: MongoDB, PostgreSQL+Prisma, MySQL+Prisma, PostgreSQL+Sequelize
- In-memory rate limiting + generation job logging
- GitHub Actions CI/CD + Docker Compose
