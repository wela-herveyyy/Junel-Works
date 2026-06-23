import { SPRINT_BACKLOG_ASSIGNEE_FIELDS } from "@/lib/erpnext/constants";

export const runtime = "nodejs";

/** DocType candidates, tried in order. First existing one wins. Override with ERPNEXT_TASK_DOCTYPE. */
const DOCTYPE_CANDIDATES = [
  process.env.ERPNEXT_TASK_DOCTYPE?.trim(),
  "Sprint Backlogs",
  "Sprint Backlog",
].filter((value): value is string => Boolean(value));

type Body = {
  url?: string;
  sid?: string;
  /** Login email — primary filter for "my" Sprint Backlog records. */
  email?: string;
  user?: string;
};

export type ErpTask = {
  name: string;
  title: string;
  status: string | null;
  priority: string | null;
  modified: string | null;
};

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function pickTitle(doc: Record<string, unknown>): string {
  return (
    str(doc.subject) ??
    str(doc.title) ??
    str(doc.task_name) ??
    str(doc.task) ??
    str(doc.sprint_backlog) ??
    str(doc.description) ??
    str(doc.name) ??
    "Untitled"
  );
}

function normalizeDoc(doc: Record<string, unknown>): ErpTask {
  return {
    name: String(doc.name ?? ""),
    title: pickTitle(doc),
    status: str(doc.status) ?? str(doc.workflow_state),
    priority: str(doc.priority),
    modified: str(doc.modified),
  };
}

type FrappeBody = { data?: unknown; exception?: string; message?: string; _server_messages?: string };

function frappeMessage(data: FrappeBody): string {
  if (data.exception) {
    const match = data.exception.match(/:\s*(.+)$/);
    return (match?.[1] ?? data.exception).trim();
  }
  if (data._server_messages) {
    try {
      const msgs = JSON.parse(data._server_messages) as string[];
      const parsed = JSON.parse(msgs[0] ?? "{}") as { message?: string };
      if (parsed.message) return parsed.message.replace(/<[^>]+>/g, "").trim();
    } catch {
      /* ignore */
    }
  }
  return typeof data.message === "string" ? data.message : "";
}

async function loggedInUser(baseUrl: string, sid: string): Promise<string | null> {
  try {
    const res = await fetch(`${baseUrl}/api/method/frappe.auth.get_logged_user`, {
      headers: { Accept: "application/json", Cookie: `sid=${sid}` },
      cache: "no-store",
    });
    const data = (await res.json()) as { message?: string };
    return res.ok && data.message && data.message !== "Guest" ? data.message : null;
  } catch {
    return null;
  }
}

type FetchOutcome =
  | { kind: "ok"; tasks: ErpTask[] }
  | { kind: "not_found" }
  | { kind: "error"; status: number; message: string };

function buildAssigneeOrFilters(identity: { email?: string; user?: string }) {
  const values = [...new Set([identity.email?.trim(), identity.user?.trim()].filter(Boolean))] as string[];
  const filters: [string, string, string][] = [];
  for (const value of values) {
    for (const field of SPRINT_BACKLOG_ASSIGNEE_FIELDS) {
      filters.push([field, "=", value]);
    }
  }
  return filters;
}

async function fetchTasksFor(
  baseUrl: string,
  sid: string,
  identity: { email?: string; user?: string },
  doctype: string,
): Promise<FetchOutcome> {
  const params = new URLSearchParams({
    fields: JSON.stringify(["*"]),
    limit_page_length: "0",
    order_by: "modified desc",
  });

  const email = identity.email?.trim();
  const user = identity.user?.trim();

  const orFilters = buildAssigneeOrFilters({ email, user });
  if (orFilters.length) {
    params.set("or_filters", JSON.stringify(orFilters));
  }

  const res = await fetch(`${baseUrl}/api/resource/${encodeURIComponent(doctype)}?${params.toString()}`, {
    headers: { Accept: "application/json", Cookie: `sid=${sid}` },
    cache: "no-store",
  });

  const text = await res.text();
  let data: FrappeBody = {};
  try {
    data = JSON.parse(text) as FrappeBody;
  } catch {
    /* HTML error page */
  }

  if (res.ok) {
    const docs = Array.isArray(data.data) ? data.data : [];
    return { kind: "ok", tasks: docs.filter(isRecord).map(normalizeDoc).filter((t) => t.name) };
  }

  if (res.status === 404) return { kind: "not_found" };
  return { kind: "error", status: res.status, message: frappeMessage(data) };
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  const sid = body.sid?.trim();
  const email = body.email?.trim();
  const user = body.user?.trim();

  if (!url || !sid) {
    return Response.json({ error: "Not signed in to ERPNext" }, { status: 401 });
  }

  if (!email && !user) {
    return Response.json({ error: "email is required to load your tasks" }, { status: 400 });
  }

  const baseUrl = normalizeUrl(url);
  const identity = { email, user };

  try {
    const errors: { doctype: string; status: number; message: string }[] = [];
    const notFound: string[] = [];

    for (const doctype of DOCTYPE_CANDIDATES) {
      const outcome = await fetchTasksFor(baseUrl, sid, identity, doctype);
      if (outcome.kind === "ok") {
        return Response.json({ ok: true, tasks: outcome.tasks, doctype });
      }
      if (outcome.kind === "not_found") notFound.push(doctype);
      else errors.push({ doctype, status: outcome.status, message: outcome.message });
    }

    // Nothing succeeded — confirm whether the session itself is still valid.
    const sessionUser = await loggedInUser(baseUrl, sid);
    if (!sessionUser) {
      return Response.json({ error: "ERPNext session expired — sign in again" }, { status: 401 });
    }

    // Session is fine: surface a real permission/other error if we hit one.
    const permission = errors.find((e) => e.status === 403);
    const chosen = permission ?? errors[0];
    if (chosen) {
      const hint = chosen.status === 403 ? `No permission to read "${chosen.doctype}" as ${sessionUser}. ` : "";
      return Response.json(
        { error: `${hint}${chosen.message || `ERPNext error (${chosen.status})`}`, status: chosen.status },
        { status: 502 },
      );
    }

    return Response.json(
      {
        error: `Couldn't find your tasks DocType (tried: ${notFound.join(", ")}). Set ERPNEXT_TASK_DOCTYPE to the exact name shown in ERPNext.`,
      },
      { status: 404 },
    );
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "Failed to load tasks" }, { status: 500 });
  }
}
