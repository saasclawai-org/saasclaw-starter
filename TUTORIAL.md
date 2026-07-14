# 🧱 SaaSClaw Starter — Developer Tutorial

A hands-on walkthrough of the [SaaSClaw Starter](https://starter.saasclaw.ai) app — an open-source (AGPL-3.0) web interface for solo developers to build, deploy, and manage projects powered by the SaaSClaw engine.

> **📸 Screenshots are included!** All images in this tutorial are real screenshots from the [live demo](https://starter.saasclaw.ai).

> **Tech stack:** Vite + React 19 + TypeScript + Tailwind CSS v4 + Zustand + React Router v7
> **Backend:** Django + DRF + JWT auth
> **Live demo:** [starter.saasclaw.ai](https://starter.saasclaw.ai)

---

## 📋 Table of Contents

1. [Getting Started](#1-️-getting-started)
2. [Dashboard](#2-️-dashboard)
3. [Chat](#3-️-chat)
4. [Files](#4-️-files)
5. [Deploy](#5-️-deploy)
6. [Env Vars](#6-️-env-vars)
7. [Project Status](#7-️-project-status)
8. [Troubleshooting](#-troubleshooting)

---

## 1. 🚪 Getting Started

The starter app opens to a login screen. If you don't have an account yet, you can create one in seconds.

### Signing In

Navigate to [starter.saasclaw.ai](https://starter.saasclaw.ai) — you'll see the login page:

- **Heading:** "Welcome back"
- **Subtext:** "Sign in to SaaSClaw"
- **Fields:** Email + Password
- **Button:** "Sign in" (shows "Signing in..." while loading)
- **Link:** "Don't have an account? Create one"

![Login page](docs/screenshots/01-login.png)

**What to do:**

1. Enter your email in the **Email** field (placeholder: `you@example.com`)
2. Enter your password in the **Password** field (placeholder: `••••••••`)
3. Click **Sign in**

If credentials are invalid, a red error banner appears above the form with the error message.

### Creating an Account

Click the **"Create one"** link at the bottom of the login page to go to the registration screen:

- **Heading:** "Create account"
- **Subtext:** "Start building with SaaSClaw"
- **Fields:** Name (optional), Email, Password (min 8 chars)
- **Button:** "Create account" (shows "Creating account..." while loading)
- **Link:** "Already have an account? Sign in"

![Registration page](docs/screenshots/01-login.png)

**What to do:**

1. Enter your name (optional — used for display only)
2. Enter your email
3. Choose a password (minimum 8 characters)
4. Click **Create account**

On success, you're automatically logged in and redirected to the dashboard.

### Authentication Details

The app uses **JWT authentication** with access + refresh tokens:

- Tokens are stored in `localStorage` under the key `saasclaw-auth` (via Zustand's `persist` middleware)
- Every API request includes `Authorization: Bearer <token>` in the header
- All endpoints except `/auth/login/` and `/auth/register/` require a valid token
- If you're running your own instance in **single-user mode** (`SAASCLAW_SINGLE_USER=true`), login requires the password set in `SAASCLAW_SINGLE_USER_PASSWORD` (any non-empty password works if that env var is empty — for local dev only)

```bash
# Local dev setup (see README for full details)
git clone https://github.com/saasclawai-org/saasclaw-engine.git
cd saasclaw-engine
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Configure .env
echo 'SAASCLAW_SINGLE_USER=true' >> .env
echo 'SAASCLAW_SINGLE_USER_PASSWORD=yourpassword' >> .env

# Start the dev server
cd starter && npm install && npm run dev
```

---

## 2. 📊 Dashboard

After logging in, you land on the **Projects** dashboard. This is your project hub — create, view, and open projects from here.

### Layout

The dashboard has a two-part layout:

- **Sidebar** (left): SaaSClaw logo, list of your projects (with framework labels), and your account info at the bottom with a logout button
- **Main area**: Project grid + "New Project" button

![Dashboard](docs/screenshots/02-dashboard.png)

### Project Cards

Each project appears as a card in a responsive grid (1-3 columns depending on screen width). Each card shows:

- **Framework icon** (⚛️ React, 🚀 Astro, ▲ Next.js, 🐍 Django, 🌐 HTML, ⚡ Supabase, 📦 default)
- **Project name** (hover to highlight in primary color)
- **Project slug** (URL-safe identifier, shown below the name)
- **Status badge**: `active` (green), `draft` (yellow), or other (muted)
- **Description** (first 2 lines, if set)
- **Footer**: framework name, creation date (relative like "3m ago", "2d ago"), and a green "● Live" indicator if a preview domain exists

Click any card to open the project view.

### Creating a New Project

Click the **New Project** button (top-right of the dashboard) — a modal dialog appears:

![New Project modal](docs/screenshots/07-newproject.png)

**What to do:**

1. **Project Name** — Enter a name (e.g., `my-awesome-app`). This becomes the project slug used in URLs.
2. **Framework** — Pick from 6 options:
   - ⚛️ **React + Vite** — Modern React with Vite bundler
   - ▲ **Next.js Static** — Static export with Next.js
   - 🚀 **Astro** — Content-focused static site
   - 🐍 **Django** — Python web framework
   - 🌐 **HTML/CSS/JS** — Plain static site
   - ⚡ **React + Supabase** — React with Supabase backend
3. **Description** (optional) — What are you building? This shows on the project card.
4. Click **Create Project** (shows "Creating..." while working)

On success, the modal closes and you're navigated directly to the new project's view at `/{slug}`.

> **Tip:** You can also trigger the New Project modal by visiting `/?new=true` or clicking the **+** icon in the sidebar.

### Empty State

If you have no projects yet, the dashboard shows a friendly empty state:

- A sparkle icon
- "No projects yet"
- "Create your first project and start building with AI"
- A **Create Project** button

---

## 3. 💬 Chat

The Chat tab is where the magic happens — talk to an AI agent that can read and write files, run commands, and help you build your project.

### Opening the Chat

When you open a project (by clicking its card), you land on the **Chat** tab by default. The project view has a header bar with:

- **Project name** + framework badge
- **"● Live"** link (green, if a preview domain is deployed — click to visit)
- **Tab bar**: 💬 Chat · 📁 Files · 🚀 Deploy · 🔐 Env Vars

![Chat tab](docs/screenshots/03-chat.png)

### Chat Interface

The chat area has three parts:

#### Chat Header
- A **menu icon** (☰) to toggle the session sidebar
- Session label ("Chat")
- **"Thinking..."** indicator with a pulsing dot when the AI is generating

#### Messages Area
- **Empty state**: A 🛠️ icon with "What are we building?" and "Describe your project and I'll help you build it"
- **User messages**: Blue/primary-colored bubbles, right-aligned
- **Assistant messages**: Surface-colored bubbles with full **Markdown rendering** (tables, code blocks, lists, links) via `react-markdown` + `remark-gfm` + `rehype-highlight` (syntax highlighting)
- **Tool call messages**: Bordered cards with a `🔧 tool_name` badge and a collapsible code area showing the tool's result (truncated to 500 chars if long)

![Chat interface](docs/screenshots/03-chat.png)

#### Input Area
- **Textarea**: "Describe what you want to build..." — auto-expands (min 48px, max 200px)
- **Send button**: Paper plane icon, disabled when input is empty or no session
- **Stop button**: Red square icon — replaces Send while streaming, click to abort

**What to do:**

1. Type your message in the textarea (e.g., "Create a landing page with a hero section and a contact form")
2. Press **Enter** to send (use **Shift+Enter** for a new line)
3. The user message appears immediately, followed by an empty assistant bubble with a "Thinking..." indicator
4. As the AI streams its response, text appears in real-time via **SSE (Server-Sent Events)**
5. If the AI uses a tool (e.g., `write_file`, `read_file`, `shell`), a tool call card appears in the conversation
6. Click the red **Stop** button to abort generation at any time

### SSE Streaming

Chat responses use **Server-Sent Events** for real-time streaming. Here's how it works under the hood:

```
POST /api/v1/projects/{slug}/sessions/{session_id}/send/
Authorization: Bearer <token>
Content-Type: application/json

{ "message": "Create a landing page" }
```

The response is an SSE stream with `data:` lines:

```
data: {"type": "content", "content": "I'll create a landing page..."}
data: {"type": "content", "content": "Let me set up the files."}
data: {"type": "tool_call", "name": "write_file"}
data: {"type": "tool_result", "content": "File written: index.html"}
data: {"type": "content", "content": "Done! Your landing page..."}
data: [DONE]
```

The app handles three chunk types:
- `content` — Appended to the current assistant message
- `tool_call` — Creates a new tool message with the tool name
- `tool_result` — Fills in the tool message with the result

### Session Management

The chat sidebar (toggle with the ☰ icon) lets you:

- **View all chat sessions** for this project
- **Start a new chat** — Click the **+** icon
- **Switch between sessions** — Click any session in the list
- Each session shows its **title** and a **preview of the last message**

Sessions persist on the server, so your conversation history is preserved across page reloads.

> **Tip:** The AI automatically creates a session when you first open a project with no existing sessions. You don't need to manually create one.

---

## 4. 📁 Files

The Files tab lets you browse and read your project's file tree.

### Opening the File Browser

Click the **📁 Files** tab in the project header. The file browser opens with a split-pane layout:

- **Left pane** (256px): File tree with folder/file icons
- **Right pane**: File content viewer

![File browser](docs/screenshots/04-files.png)

### Browsing Files

The file tree shows all files in your project root:

- 📁 **Directories** — Click to expand (if supported by the API)
- 📄 **Files** — Click to open and view contents

Files are listed with their name. Clicking a directory does nothing (it's a display node); clicking a file loads its content.

### Reading a File

Click any file in the tree:

1. The file content loads via the API and appears in the right pane
2. A **header bar** shows the file path in monospace font
3. The file content displays in a `<pre>` block with monospace formatting

> **Note:** The file browser is currently **read-only**. To edit files, ask the AI agent in the Chat tab — it can use tools like `write_file` to make changes.

### Empty State

If no files exist yet (new project), the file tree shows "No files yet" and the content pane shows "Select a file to view".

---

## 5. 🚀 Deploy

The Deploy tab is where you build and ship your project. Trigger a deploy, check status, and review history — all in one place.

### Opening the Deploy Panel

Click the **🚀 Deploy** tab in the project header.

![Deploy panel](docs/screenshots/05-deploy.png)

### Triggering a Deploy

The top card shows:

- **Heading:** "Deploy"
- **Subtext:** "Build and deploy your project"
- **Button:** "Deploy" (with a rocket/circular icon)

**What to do:**

1. Click the **Deploy** button
2. The button shows a spinner and "Deploying..." text
3. The deploy request is sent to the API:
   ```
   POST /api/v1/projects/{slug}/deploy/
   Authorization: Bearer <token>
   { "environment": "preview" }
   ```
4. On success, a **Deploy Output** box appears showing the build result
5. If a URL is available, it appears as a clickable link below the button

### Deploy Status

After deploying, the current status is shown below the deploy button:

- 🟢 **completed / success / deployed / active** — Green text
- 🟡 **building / deploying / pending** — Yellow text
- 🔴 **failed / error** — Red text
- ⚪ **other** — Muted text

If a **deploy URL** exists, it's shown as a clickable link (opens in a new tab).

### Deploy Output

After a successful deploy, a **Deploy Output** card shows the raw build/deploy logs in a scrollable code block (max height 240px). This includes build output, file sizes, and any warnings.

### Deploy History

Below the deploy card, the **Deploy History** section lists all past deploys:

- Each entry shows **status** (color-coded), **environment** (e.g., "preview"), and **timestamp** (relative format)
- If a URL was generated, it appears as a clickable link
- History entries are displayed in a vertical list with cards

**Empty state:** If no deploys exist yet, you'll see "No deploys yet".

> **How it works:** Deploying triggers the engine to run a build (e.g., `npm run build` for Vite projects), then creates an nginx subdomain config to serve the built files. The preview domain is assigned automatically.

---

## 6. 🔐 Env Vars

The Env Vars tab lets you manage environment variables for your project — API keys, secrets, configuration values.

### Opening the Env Editor

Click the **🔐 Env Vars** tab in the project header.

![Env Vars](docs/screenshots/06-envvars.png)

### Adding a Variable

The top card contains the "add" form:

- **KEY** input — Monospace, 40px wide (e.g., `OPENAI_API_KEY`)
- **value** input — Full width (e.g., `sk-...`)
- **Secret** checkbox — Checked by default. When enabled, the value is masked as `••••••••` in the list
- **Add** button — Disabled if key is empty or while saving (shows "..." while saving)

**What to do:**

1. Enter the variable name in the **KEY** field
2. Enter the value in the **value** field
3. Check **Secret** if the value should be hidden (default: on)
4. Click **Add**

The variable is saved via the API and appears in the list below.

### Viewing Variables

Existing variables are listed below the add form:

- **Key** — Shown in monospace
- **Value** — If secret: `••••••••` (masked). If not secret: the actual value (truncated)
- **Secret badge** — Yellow "secret" label for secret variables
- **Delete button** — Click the ✕ icon to remove the variable

### Deleting a Variable

Click the **✕** button next to any variable to delete it. The variable is removed immediately.

> **Tip:** Mark sensitive values (API keys, passwords, tokens) as **Secret** so they're masked in the UI. The engine still passes the real values to your app at build/runtime.

**Empty state:** If no environment variables are set, you'll see "No environment variables set".

---

## 7. 📡 Project Status

The project status gives you infrastructure health at a glance. This information is visible in the **project header** of any tab within the project view.

### Status Indicators

In the project header bar (visible on all tabs):

- **Framework badge** — Shows the project's framework (e.g., `vite_react`, `astro`)
- **"● Live" indicator** — Green pill, only shown if a preview domain exists. Click to open the live site in a new tab.
- **Project status** — Shown on the dashboard card as a colored badge:
  - 🟢 `active` — Project is deployed and running
  - 🟡 `draft` — Project created but not yet deployed
  - ⚪ Other statuses — Shown in muted color

### Infrastructure API

The engine exposes infrastructure endpoints (used internally by the app):

```bash
# Get project status (all sections)
GET /api/v1/projects/{slug}/status/?section=all

# Get logs from a specific source
GET /api/v1/projects/{slug}/logs/{source}/?lines=50
```

These endpoints require JWT auth and return text/plain responses with status info or log output.

### Git Status

The app also has Git integration (available via the API):

```bash
# Check git status
GET /api/v1/projects/{slug}/git/status/

# View diff
GET /api/v1/projects/{slug}/git/diff/

# Commit changes
POST /api/v1/projects/{slug}/git/commit/
{ "message": "Add landing page" }

# View commit log
GET /api/v1/projects/{slug}/git/log/?limit=10
```

These are available to the AI agent in the Chat tab — you can ask it to check git status, review diffs, or commit changes.

---

## 🔧 Troubleshooting

### Can't log in

**Symptom:** "Signing in..." but nothing happens, or error message appears.

**Fixes:**
- Verify your email and password are correct
- If running your own instance, check that the engine is running and reachable
- In single-user mode, ensure `SAASCLAW_SINGLE_USER_PASSWORD` is set (or any non-empty password works if empty — local dev only)
- Check browser console for CORS errors — the engine's `CORS_ALLOWED_ORIGINS` must include your frontend URL
- **Remember:** django-cors-headers v4 uses `CORS_ALLOWED_ORIGINS` (not `CORS_ALLOW_ORIGINS`)

### Chat not responding

**Symptom:** Messages send but no response streams back.

**Fixes:**
- Check that the OpenClaw gateway is running (`OPENCLAW_API_URL` in the engine's `.env`)
- Verify `OPENCLAW_API_KEY` is set and valid
- Check the browser's Network tab — the SSE request to `/api/v1/projects/{slug}/sessions/{id}/send/` should stay open during streaming
- If you see a 401, your JWT may have expired — try logging out and back in
- If you see a 404 on the session endpoint, a new session may need to be created — refresh the page

### Deploy fails

**Symptom:** Deploy button shows "Deploying..." then an error appears.

**Fixes:**
- Check that the project has files to deploy (use the Files tab)
- For Vite/React projects, ensure there's a valid `package.json` and the build script works locally
- Check the deploy output box for error details
- Verify nginx is running on the server and the engine has permissions to write subdomain configs
- Check that the deploy worker (Celery) is running: `sudo systemctl status saasclaw-worker-deploy`

### File browser empty

**Symptom:** "No files yet" even after the AI has created files.

**Fixes:**
- Refresh the page — the file list is loaded on mount and may be stale
- Check the Network tab for API errors on `/api/v1/projects/{slug}/files/`
- Ensure the project workspace exists on the engine's filesystem

### Environment variables not saving

**Symptom:** "Add" button shows "..." but variable doesn't appear.

**Fixes:**
- Check the Network tab for the POST to `/api/v1/projects/{slug}/env/` — look for error responses
- Ensure the key name is non-empty and doesn't contain spaces
- The engine may have validation rules for env var keys — stick to uppercase with underscores

### Lost session / page refresh

**Symptom:** Chat history disappears on refresh.

**Fixes:**
- Sessions are stored server-side — on refresh, the app reloads sessions for the current project
- If no session loads, the app auto-creates one — this is normal
- Your JWT is persisted in localStorage (`saasclaw-auth` key) so you stay logged in

### CORS errors

**Symptom:** Browser console shows "Access-Control-Allow-Origin" errors.

**Fixes:**
- The engine must have your frontend URL in `CORS_ALLOWED_ORIGINS` (comma-separated, no trailing slashes)
- Example: `CORS_ALLOWED_ORIGINS=https://starter.saasclaw.ai,http://localhost:5173`
- After changing CORS settings, restart the engine (gunicorn)
- The nginx config must also allow the frontend origin

### SSE streaming not working

**Symptom:** Response comes back as a single block instead of streaming.

**Fixes:**
- Ensure nginx is configured with `proxy_buffering off` for the SSE endpoint
- The nginx location for SSE must use a regex (`~`) prefix:
  ```nginx
  location ~ /api/v1/projects/[^/]+/sessions/[^/]+/send/ {
      proxy_pass http://gunicorn;
      proxy_buffering off;
      proxy_cache off;
      proxy_set_header Connection '';
      proxy_http_version 1.1;
      chunked_transfer_encoding off;
  }
  ```
- Check that `X-Accel-Buffering: no` isn't being stripped by a proxy

---

## 📚 Further Reading

- **[README.md](./README.md)** — Full setup instructions, architecture diagram, and configuration reference
- **[SaaSClaw Engine](https://github.com/saasclawai-org/saasclaw-engine)** — Backend Django + DRF application
- **[Live App](https://starter.saasclaw.ai)** — Try it out right now

---

## 🧑‍💻 Quick Start (Local Dev)

```bash
# 1. Clone and set up the engine
git clone https://github.com/saasclawai-org/saasclaw-engine.git
cd saasclaw-engine
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# 2. Configure environment
cat > .env <<EOF
DATABASE_URL=postgres://saasclaw:password@localhost:5432/saasclaw
SECRET_KEY=dev-secret-key
SAASCLAW_SINGLE_USER=true
SAASCLAW_SINGLE_USER_PASSWORD=devpassword
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
OPENCLAW_API_URL=http://localhost:18789
OPENCLAW_API_KEY=your-api-key
EOF

# 3. Initialize database
python manage.py migrate

# 4. Start the engine
python manage.py runserver 0.0.0.0:8000

# 5. In another terminal, start the frontend
cd starter
npm install
npm run dev
```

Visit `http://localhost:5173` and log in with any email and your single-user password.

---

*Built with ⚛️ React 19, 🎨 Tailwind CSS v4, 🐻 Zustand, and 🟢 Django. Licensed under AGPL-3.0.*