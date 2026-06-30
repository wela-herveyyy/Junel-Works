export const DEFAULT_ERPNEXT_URL =
  process.env.NEXT_PUBLIC_ERPNEXT_URL?.trim() || "https://erp.livro.systems";

/** Remote ERPNext MCP gateway — school URL is sent per client via `X-ERPNext-URL`. */
export function erpnextMcpUrl() {
  return (
    process.env.ERPNEXT_MCP_URL?.trim() ||
    process.env.NEXT_PUBLIC_ERPNEXT_MCP_URL?.trim() ||
    ""
  );
}

/** Frappe desk route slug — matches /app/sprint-backlogs */
export const SPRINT_BACKLOGS_ROUTE = "sprint-backlogs";

export const SPRINT_BACKLOG_ASSIGNEE_FIELDS = ["dev_assignee", "current_assignee", "qa_assignee"] as const;
