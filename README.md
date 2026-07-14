# SaaSClaw Starter

A standalone, open-source web app for solo developers to build, deploy, and manage projects powered by the SaaSClaw engine.

**AGPL-3.0** — use it, modify it, share it. If you host it as a service, share your changes too.

## Quick Start

```bash
# Clone
git clone https://github.com/saasclawai-org/saasclaw-starter.git
cd saasclaw-starter

# Install
npm install

# Configure
cp .env.example .env
# Edit .env to point to your engine API

# Run
npm run dev
```

## Architecture

```
SaaSClaw Starter (React SPA)
       │
       │  REST + SSE
       ▼
SaaSClaw Engine (Django)
       │
       ├── Public API (/api/v1/*)
       ├── Agent loop (runner.py)
       ├── Tools (tools.py)
       └── Deploy pipeline
```

The starter app is a **pure client** — all logic, data, and agent execution live in the engine. It never touches the filesystem, never runs code, never accesses Django internals.

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

- **Vite** — fast dev server and builds
- **React 19** — UI framework
- **TypeScript** — type safety
- **Tailwind CSS v4** — styling
- **Zustand** — state management
- **React Router v7** — routing

## Self-Hosting

### Docker Compose

```yaml
services:
  engine:
    image: saasclaw/engine:latest
    environment:
      - DATABASE_URL=postgres://...
      - SAASCLAW_SINGLE_USER=true
    ports:
      - "8000:8000"

  starter:
    image: saasclaw/starter:latest
    environment:
      - VITE_API_URL=http://engine:8000/api/v1
    ports:
      - "3000:80"

  postgres:
    image: postgres:16
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

### Manual Setup

1. Set up the SaaSClaw engine (see engine docs)
2. Clone this repo
3. Copy `.env.example` to `.env` and set `VITE_API_URL`
4. Run `npm install && npm run build`
5. Serve `dist/` with nginx or any static server

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `/api/v1` | Engine API base URL |

## License

AGPL-3.0 — see [LICENSE](./LICENSE).

The SaaSClaw engine is also AGPL-3.0. The SaaSClaw Studio (the full multi-tenant dashboard) is proprietary and not included.