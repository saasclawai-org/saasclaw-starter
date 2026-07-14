# SaaSClaw Starter

A standalone, open-source web app for solo developers to build, deploy, and manage projects powered by the SaaSClaw engine.

**AGPL-3.0** — use it, modify it, share it. If you host it as a service, share your changes too.

## Prerequisites

- **Python 3.11+**
- **Node.js 22+**
- **PostgreSQL 16+**
- **Redis** (for agent queue)
- **nginx** (for production serving)
- **Git**

## Architecture

```
Browser → Starter SPA (Vite/React)
               │
               │  REST + SSE (/api/v1/*)
               ▼
         Engine (Django + Gunicorn)
               │
               ├── Public API (auth, projects, files, sessions, deploy)
               ├── Agent loop (runner.py → OpenClaw gateway)
               ├── Tools (write_file, read_file, shell, etc.)
               └── Deploy pipeline (npm build → nginx serve)
```

The starter app is a **pure client** — all logic, data, and agent execution live in the engine. It never touches the filesystem, never runs code, never accesses Django internals.

## Setup

### 1. Install the SaaSClaw Engine

The engine is a Django application that provides the API backend. Clone and configure it first:

```bash
# Clone the engine
git clone https://github.com/saasclawai-org/saasclaw-engine.git
cd saasclaw-engine

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Or install manually:
pip install django>=4.2 psycopg[binary]>=3.1 djangorestframework \
  djangorestframework-simplejwt django-cors-headers gevent gunicorn \
  redis httpx requests PyJWT
```

### 2. Configure the Engine

Create a `.env` file in the engine's app directory (or the Django project root):

```bash
# Required
DATABASE_URL=postgres://saasclaw:yourpassword@localhost:5432/saasclaw
SECRET_KEY=your-secret-key-here
SAASCLAW_SINGLE_USER=true

# Allowed hosts (add your domain)
ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
CSRF_TRUSTED_ORIGINS=http://localhost:5173,https://your-domain.com

# CORS for the starter app
CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:5173

# OpenClaw gateway (for agent chat)
OPENCLAW_API_URL=http://localhost:18789
OPENCLAW_API_KEY=your-openclaw-api-key
```

### 3. Initialize the Database

```bash
# Run migrations
python manage.py migrate

# Create a superuser (for single-user mode, this is your main user)
python manage.py createsuperuser
```

### 4. Start the Engine

```bash
# Development
python manage.py runserver 0.0.0.0:8000

# Production (gevent workers for SSE streaming)
gunicorn config.wsgi:application \
  --bind 127.0.0.1:8010 \
  --worker-class gevent \
  --workers 4 \
  --timeout 600
```

> **Important:** Use `gevent` workers in production. The default `gthread` worker buffers entire SSE responses before sending them, causing the chat to show only "Thinking..." until the agent finishes.

### 5. Install the Starter App

```bash
# Clone
git clone https://github.com/saasclawai-org/saasclaw-starter.git
cd saasclaw-starter

# Install
npm install

# Configure
cp .env.example .env
# Edit .env — point VITE_API_URL to your engine
#   Development:  VITE_API_URL=http://localhost:8000/api/v1
#   Production:   VITE_API_URL=https://your-domain.com/api/v1
```

### 6. Run

```bash
# Development (hot reload)
npm run dev

# Production build
npm run build
# Serve dist/ with nginx
```

### 7. nginx Configuration

Example nginx config for production:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Starter SPA
    root /path/to/saasclaw-starter/dist;
    index index.html;

    # API proxy
    location /api/v1/ {
        proxy_pass http://127.0.0.1:8010;
        proxy_read_timeout 600s;
        proxy_send_timeout 600s;
        proxy_buffering off;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }

    # SSE streaming — MUST use regex location (~ prefix)
    location ~ /api/v1/projects/[^/]+/sessions/[^/]+/send/ {
        proxy_pass http://127.0.0.1:8010;
        proxy_read_timeout 900s;
        proxy_send_timeout 900s;
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        proxy_redirect off;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

> **Note:** The SSE location block MUST use the `~` regex prefix. Without it, nginx treats the URL pattern as a literal string and the SSE streaming location won't match, causing chat to hang on "Thinking...".

## Docker Compose

For a self-contained setup with PostgreSQL:

```yaml
version: "3.8"

services:
  engine:
    build: ./saasclaw-engine
    environment:
      - DATABASE_URL=postgres://saasclaw:password@postgres:5432/saasclaw
      - SECRET_KEY=change-me-to-a-random-string
      - SAASCLAW_SINGLE_USER=true
      - ALLOWED_HOSTS=localhost,your-domain.com
      - CORS_ALLOWED_ORIGINS=https://your-domain.com,http://localhost:5173
      - OPENCLAW_API_URL=http://host.docker.internal:18789
      - OPENCLAW_API_KEY=your-key
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy

  starter:
    build: ./saasclaw-starter
    environment:
      - VITE_API_URL=http://localhost:8000/api/v1
    ports:
      - "3000:80"
    depends_on:
      - engine

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB=saasclaw
      - POSTGRES_USER=saasclaw
      - POSTGRES_PASSWORD=password
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U saasclaw"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## Environment Variables

### Engine

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SECRET_KEY` | Yes | Django secret key |
| `SAASCLAW_SINGLE_USER` | No | Set to `true` for single-user mode |
| `ALLOWED_HOSTS` | Yes | Comma-separated list of allowed hosts |
| `CSRF_TRUSTED_ORIGINS` | Yes | Comma-separated list of trusted origins |
| `CORS_ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed CORS origins |
| `OPENCLAW_API_URL` | Yes | OpenClaw gateway URL for agent chat |
| `OPENCLAW_API_KEY` | Yes | OpenClaw API key |

### Starter App

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Engine API base URL |

## Deployed Projects

When you deploy a project, the engine:

1. Detects the project type (Node.js, Django, or static)
2. Runs the build command (`npm run build`, `collectstatic`, or copies files)
3. Copies the build output to `/srv/saasclaw/projects/{slug}/web`
4. Creates an nginx site config for `{slug}.saasclaw.ai`
5. Reloads nginx

For this to work, you need:
- A wildcard DNS record: `*.saasclaw.ai → your server IP`
- A wildcard SSL certificate: `*.saasclaw.ai` (e.g., Let's Encrypt DNS-01 challenge)
- nginx with the wildcard cert configured for project subdomains

## What's Included

- 🗂 **Projects** — create, switch, manage projects
- 💬 **Chat** — full agent chat with streaming SSE, tool call rendering, markdown
- 📁 **Files** — browse and read project files
- 🚀 **Deploy** — trigger deploys, view status and history
- 🔐 **Env Vars** — manage secrets and environment variables
- 📊 **Project Status** — nginx, service, and deployment info

## What's NOT Included (Studio Only)

- Multi-tenant management
- Team/org management
- Billing and subscriptions
- Custom domains
- GitHub integration
- Admin dashboard

## Tech Stack

- **Engine:** Django 4.2+, Django REST Framework, SimpleJWT, gevent, PostgreSQL
- **Starter:** Vite, React 19, TypeScript, Tailwind CSS v4, Zustand, React Router v7

## License

AGPL-3.0 — see [LICENSE](./LICENSE).

The SaaSClaw engine is also AGPL-3.0. The SaaSClaw Studio (the full multi-tenant dashboard) is proprietary and not included.