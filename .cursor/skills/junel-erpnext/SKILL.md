---
name: junel-erpnext
description: >
  Query and act on ERPNext / Frappe data through Junel's remote HTTP MCP server.
  Use when the user asks about DocTypes, records, tasks, leave, customers, or
  anything on their ERP site. Junel sends the school ERP URL and session SID on
  each MCP request.
---

# Junel ERPNext MCP

Junel connects to ERPNext through a **remote HTTP MCP server**. Each school has its
own ERPNext instance — Junel passes the signed-in site URL on every MCP call.

## Auth model

- MCP config shape: HTTP URL + headers:
  - `Authorization: Bearer <ERPNEXT_SID>`
  - `X-ERPNext-URL: <school ERP base URL>` — from the user's Junel sign-in (shown in agent context as **Site**)
- The SID and school URL come from the user's Frappe login session
- **All ERP desk links** must use the Site URL from agent context — never assume `erp.livro.systems`
- If tools fail with auth errors, tell the user to sign out and sign in again

## How to work

1. Prefer MCP tools over guessing ERP schema
2. Use cached DocType tools when available before raw field lists
3. Keep answers grounded in tool results — cite record names and statuses
4. For write actions (create/update/submit), confirm destructive steps briefly
5. Format replies in Markdown with lists and tables when helpful

## Common intents

| User asks | Approach |
| --------- | -------- |
| Sprint / tasks | List or filter Sprint Backlog records for the user |
| Leave | Draft or check leave applications |
| Customer / item lookup | Search DocType via MCP tools |
| "What's in ERP?" | Start with high-level tool discovery, then narrow |

## Boundaries

- Never expose SID, API keys, or passwords in chat
- Don't invent ERP field names — fetch schema via MCP when unsure
- If MCP is disabled, tell the user to enable **erpnext** under Knowledge → MCP
