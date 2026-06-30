# Junel AI Assistant

Junel is a personal, work-focused AI assistant. You sign in with your **ERPNext** account, chat with an AI agent (powered by the [Cursor SDK](https://www.npmjs.com/package/@cursor/sdk)), and the agent can act on your ERP data through the **ERPNext MCP server**. Your profile, rules, skills, contacts, and MCP configuration are stored locally in the browser and injected into every conversation as context.

The UI uses a **Playful Neo-Brutalism** design language — see [`docs/DESIGN.md`](docs/DESIGN.md).

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [How it works](#how-it-works)
  - [Authentication (ERPNext)](#authentication-erpnext)
  - [The AI agent](#the-ai-agent)
  - [Agent context](#agent-context)
  - [MCP servers](#mcp-servers)
  - [Local storage](#local-storage)
- [Pages & routes](#pages--routes)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Development notes & gotchas](#development-notes--gotchas)
- [Troubleshooting](#troubleshooting)

---

## Features

- **ERPNext sign-in** with email/password and 2FA (OTP) support, via the Frappe login API.
- **Streaming chat** with an AI agent over Server-Sent Events (SSE).
- **ERPNext MCP integration** — the agent can query/act on your ERP using your live session (SID).
- **Personalization** — profile, communication style ("personality"), proactive mode.
- **Knowledge base** — always-on **rules**, toggleable **skills**, and a raw **MCP JSON editor**.
- **Contacts** included in agent context.
- **Local-first** — everything is stored in `localStorage`; no database, no server-side user accounts.
- **Neo-brutalist desktop-friendly UI** (Tailwind 4, Plus Jakarta Sans).

---

## Tech stack

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS 4, Plus Jakarta Sans, Material Symbols |
| AI | `@cursor/sdk` (model `composer-2.5`) |
| Integration | ERPNext / Frappe via MCP (stdio) |
| Markdown | `react-markdown` + `remark-gfm` |
| Runtime / pkg mgr | Bun |
| State | Browser `localStorage` (key `junel-storage`) |

> This is **Next.js 16** — APIs and conventions differ from older versions. When unsure, read `node_modules/next/dist/docs/`.

---

## Quick start

### Prerequisites

- [Bun](https://bun.sh) installed
- A **Cursor API key** — https://cursor.com/dashboard/integrations
- Access to an **ERPNext** site
- The **ERPNext MCP server** built locally (see [MCP servers](#mcp-servers))

### Install & run

```bash
bun install

# create your env file
# (Windows PowerShell)
ni .env

# add at minimum:
#   CURSOR_API_KEY=sk-...

bun dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login` until you sign in with ERPNext.

### Production

```bash
bun run build
bun start            # serves the last build
# bun start --port 3001   # custom port
```

---

## Environment variables

Create a `.env` file in the project root.

| Variable | Required | Used by | Notes |
| -------- | -------- | ------- | ----- |
| `CURSOR_API_KEY` | **Yes** | `/api/agent`, `scripts/agent.mjs` | Without it the agent returns an error. |
| `ERPNEXT_MCP_URL` | **Yes** (HTTP MCP) | Login + agent MCP | Public Streamable HTTP endpoint for the ERPNext MCP server (e.g. `https://mcp.yourdomain.com/mcp`). |
| `NEXT_PUBLIC_ERPNEXT_MCP_URL` | No | Client migration | Browser-side fallback when `ERPNEXT_MCP_URL` is unset at build time. |
| `NEXT_PUBLIC_ERPNEXT_URL` | No | Login form default | Pre-fills the ERP URL in the UI. Defaults to `https://erp.livro.systems`. |
| `ERPNEXT_URL` | No | Server-side default | Fallback ERP URL on the server. |

> **Security:** the ERPNext session `SID` is stored **inline** in the browser's MCP config (localStorage) so the MCP server can authenticate. Treat the browser profile as sensitive. Sign out to clear it.

---

## How it works

```
Browser (localStorage state)
   │  prepareAgentRequest(data, message)
   ▼
POST /api/agent  ──(SSE stream)──► streamAgentMessage()  ──► @cursor/sdk Agent
   │                                          │
   │                                          └─► MCP servers (e.g. ERPNext) via HTTP
   ▼
ChatMessage components render streamed text (Markdown)
```

### Authentication (ERPNext)

1. The user submits ERP URL + email + password on `/login`.
2. `POST /api/erpnext/login` calls Frappe `/api/method/login`.
3. If 2FA is enabled, the API returns `verificationRequired` + `tmpId`; the UI prompts for the OTP and re-submits.
4. On success the server returns the session `sid`, the logged-in `user`, and a CSRF token, plus a ready-to-use MCP entry.
5. The client calls `applyErpnextSession()` which:
   - saves an `erpnext` link `{ url, email, user, sid, linkedAt }`, and
   - merges an `erpnext` server into the MCP config (`enabledKeys` includes `"erpnext"`).
6. `isErpnextLoggedIn(data)` (truthy `sid` **and** `erpnext` enabled in MCP) gates the dashboard.

Sign out → `clearErpnextSession()` removes the link, the `erpnext` MCP server, and clears chat.

Relevant files: `lib/erpnext/login.ts`, `lib/erpnext/mcp-config.ts`, `app/api/erpnext/login/route.ts`, `components/molecules/erpnext-login-form.tsx`, `components/organisms/login-console.tsx`.

### The AI agent

- `app/api/agent/route.ts` (Node runtime) accepts `{ message, agentId?, systemContext?, mcpServers? }` and streams SSE `data:` events.
- `lib/agent/stream-agent.ts` creates/resumes a Cursor SDK `Agent` (model `composer-2.5`), sends the prompt, and yields events:
  - `meta` (agentId + runId), `text` (streamed chunks), `error`, `done`.
- The `agentId` is persisted in chat state so follow-up messages **resume** the same agent; if resume fails it transparently creates a new agent.

### Agent context

`lib/junel/agent-context.ts` builds a system prompt from your local data and prepends it to each message:

- **Profile** (name, email, title, company, timezone, bio)
- **Contacts**
- **Enabled rules** ("Follow these user rules…")
- **Enabled skills**
- **Personality** hint + **proactive mode** flag
- A note to format replies in Markdown

`lib/junel/prepare-agent-request.ts` assembles `{ message, agentId, systemContext, mcpServers }` from the store.

### MCP servers

MCP servers are stored as JSON (same shape as `~/.cursor/mcp.json`) in the Knowledge page editor. Two forms are accepted:

```jsonc
// HTTP (created automatically at sign-in)
{
  "erpnext": {
    "type": "http",
    "url": "https://mcp.yourdomain.com/mcp",
    "headers": {
      "Authorization": "Bearer <ERPNEXT_SID>",
      "X-ERPNext-URL": "https://erp.livro.systems"
    }
  }
}
```

- `lib/junel/mcp.ts` parses/normalizes JSON into the SDK shape (`stdio` with `command`/`args`/`env`, or `http`/`sse` with `url`/`headers`).
- Only servers whose key is in `enabledKeys` are sent to the agent (`toSdkMcpServers`).
- The **ERPNext** entry is created automatically at sign-in with the live `SID` and school URL in headers (`buildErpnextMcpEntry`). You generally don't edit it by hand.

> **ERPNext MCP server** is a separate project. Deploy it with `MCP_TRANSPORT=http` and point `ERPNEXT_MCP_URL` at its `/mcp` endpoint. The school ERP URL is **not** on the server — Junel sends `X-ERPNext-URL` per user session.

### Local storage

All state lives under the `junel-storage` key. Shape (`lib/junel/storage/types.ts`):

```ts
type JunelStorage = {
  version: 1;
  profile: UserProfile;          // name, email, title, company, timezone, bio, avatarUrl
  contacts: Contact[];
  settings: { personality: string; proactiveMode: boolean };
  rules: JunelRule[];            // name, preview, scope, enabled
  skills: JunelSkill[];          // name, description, category?, enabled
  mcp: { serversJson: string; enabledKeys: string[] };
  erpnext?: { url; email; user; sid; linkedAt };
  chat: { agentId?: string; messages: ChatMessage[] };
};
```

`lib/junel/storage/store.ts` loads/normalizes/saves and migrates legacy shapes. Defaults (seed rules/skills) come from `lib/junel/storage/defaults.ts` + `lib/junel/constants.ts`. The React context wrapper is `components/providers/junel-store-provider.tsx` (`useJunelStore()` → `{ data, ready, persist, clearChat }`).

---

## Pages & routes

| Route | File | Purpose |
| ----- | ---- | ------- |
| `/` | `app/(junel)/page.tsx` → `DashboardConsole` | Chat. Redirects to `/login` if not signed in. |
| `/login` | `app/login/page.tsx` → `LoginConsole` | Standalone ERPNext sign-in (no sidebar). |
| `/knowledge` | `app/(junel)/knowledge/page.tsx` | Rules, skills, MCP JSON editor. |
| `/settings` | `app/(junel)/settings/page.tsx` | Profile (name required, email synced from ERP), preferences, contacts. |
| `/productivity` | `app/(junel)/productivity/page.tsx` | Placeholder (calendar/tasks — coming soon). |
| `POST /api/agent` | `app/api/agent/route.ts` | SSE agent stream. |
| `POST /api/erpnext/login` | `app/api/erpnext/login/route.ts` | ERP login + OTP verify. |

The `(junel)` route group shares `JunelShell` (sidebar + mobile nav). `/login` is intentionally outside it.

---

## Project structure

```
app/
├── layout.tsx                 # root: Plus Jakarta Sans, Material Symbols, globals.css
├── globals.css                # Neo-Brutalism theme tokens + utilities
├── (junel)/                   # authed app shell (sidebar)
│   ├── layout.tsx             # wraps children in <JunelShell>
│   ├── page.tsx               # Dashboard (chat)
│   ├── knowledge/page.tsx
│   ├── settings/page.tsx
│   └── productivity/page.tsx
├── login/page.tsx             # standalone login
└── api/
    ├── agent/route.ts         # AI agent SSE
    └── erpnext/login/route.ts # ERP auth

components/
├── ui/                        # primitives: button, switch, badge, icon, markdown-preview…
├── molecules/                 # chat-input, chat-message, *-form, *-row, nav-link…
├── organisms/                 # *-console (page sections) + junel-shell
└── providers/junel-store-provider.tsx

lib/
├── agent/stream-agent.ts      # Cursor SDK streaming
├── erpnext/                   # login.ts, mcp-config.ts, constants.ts
├── junel/
│   ├── agent-context.ts       # system prompt builder
│   ├── prepare-agent-request.ts
│   ├── mcp.ts                 # MCP JSON parse/normalize
│   ├── constants.ts           # nav, seed rules/skills, personalities
│   └── storage/               # types.ts, store.ts, defaults.ts
└── utils/                     # cn.ts, random-id.ts (HTTP-safe UUID)

scripts/agent.mjs              # run the agent from the CLI
docs/                          # DESIGN.md, PROJECT-STRUCTURE.md
```

---

## Scripts

```bash
bun dev          # start dev server (Turbopack)
bun run build    # production build
bun start        # serve the last production build
bun run lint     # eslint
bun run agent -- "your prompt here"   # one-shot CLI agent (needs CURSOR_API_KEY)
```

---

## Development notes & gotchas

- **Tailwind spacing tokens override defaults.** This project defines custom `@theme` spacing (`xs/sm/md/lg/xl`). That means utilities like `max-w-md` resolve to a *spacing token*, not Tailwind's default width. **Use explicit widths** like `max-w-[28rem]`, `max-w-[48rem]`, `max-w-[60rem]`.
- **`crypto.randomUUID` fails on non-secure (HTTP) origins** (e.g. LAN `http://192.168.x.x:3000`). Always use `randomId()` from `lib/utils/random-id.ts`.
- **Custom CSS classes can't take Tailwind variant prefixes.** `focus:nb-shadow-...` won't work because `nb-shadow-*` isn't a Tailwind utility. Use the dedicated `.nb-focus` / `.nb-focus-within` classes (plain CSS `:focus`/`:focus-within`).
- **Neo-brutal shadows/borders** live in `globals.css`: `.nb-border`, `.nb-shadow-sm|md|lg`, `.nb-press-sm|md`, `.nb-card`, `.nb-input`, `.nb-chip`. Borders/shadows belong to **button variants**, sizes only set dimensions.
- **`@cursor/sdk` is server-external** (`next.config.ts` `serverExternalPackages`). Agent code runs only in the Node runtime route.
- **`bun start` serves the last build** — rebuild after changes before testing production.

---

## Troubleshooting

| Symptom | Cause / fix |
| ------- | ----------- |
| Agent replies "CURSOR_API_KEY is not configured" | Set `CURSOR_API_KEY` in `.env` and restart. |
| Stuck on `/login` after signing in | The `erpnext` MCP server isn't enabled, or `sid` missing. Re-sign in; check the Knowledge MCP editor shows `erpnext` enabled. |
| ERP MCP tools do nothing | Check `ERPNEXT_MCP_URL`, sign in again (refresh SID), and confirm MCP JSON includes `X-ERPNext-URL` for your school. |
| "no session cookie was returned" on login | The Frappe site didn't set the `sid` cookie — check the ERP URL and credentials. |
| Layout looks oversized / cramped | Don't reuse Tailwind width tokens that collide with custom spacing (see gotchas). |
| Single characters render vertically in chat | A `max-w-*` mapped to a tiny spacing token — use an explicit `max-w-[...]`. |

---

## License

Private / internal project.
