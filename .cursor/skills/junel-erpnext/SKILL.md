---
name: junel-erpnext
description: >
  Query and act on ERPNext / Frappe data through Junel's remote HTTP MCP server.
  Use when the user asks about DocTypes, records, tasks, leave, customers, or
  anything on their ERP site. The MCP server already has ERPNEXT_URL configured;
  authenticate with the user's session SID as Bearer token.
---

# Junel ERPNext MCP

Junel connects to ERPNext through a **remote HTTP MCP server**. The ERP site URL
(for example `erp.livro.systems`) is configured in the MCP server's environment —
do not ask the user for it unless auth fails.

## Auth model

- MCP config shape: HTTP URL + `Authorization: Bearer <ERPNEXT_SID>`
- The SID comes from the user's Frappe login session
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
