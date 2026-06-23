import { DEFAULT_ERPNEXT_URL } from "./constants";

const SERVER_DEFAULT_ERP_URL = process.env.ERPNEXT_URL?.trim() || DEFAULT_ERPNEXT_URL;

export type ErpnextVerification = {
  prompt?: string;
  method?: string;
  setup?: boolean;
};

export type ErpnextLoginResult = {
  url: string;
  user: string;
  sid: string;
  csrfToken: string;
};

export type ErpnextLoginPending = {
  verificationRequired: true;
  tmpId: string;
  verification: ErpnextVerification;
};

type FrappeLoginResponse = {
  message?: string;
  verification?: ErpnextVerification & { token_delivery?: boolean };
  tmp_id?: string;
  exc?: string;
  exception?: string;
};

function normalizeUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

function parseSetCookies(headers: Headers): Record<string, string> {
  const cookies: Record<string, string> = {};
  const raw = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  const list = raw.length ? raw : [headers.get("set-cookie")].filter(Boolean) as string[];

  for (const header of list) {
    for (const part of header.split(/,(?=\s*\w+=)/)) {
      const pair = part.split(";")[0]?.trim();
      if (!pair) continue;
      const eq = pair.indexOf("=");
      if (eq > 0) cookies[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
    }
  }
  return cookies;
}

function cookieHeader(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function frappeError(data: FrappeLoginResponse, status: number) {
  if (data.exception) {
    const match = data.exception.match(/:\s*(.+)$/);
    if (match?.[1]) return match[1].trim();
  }
  if (data.exc) return data.exc;
  if (data.message && data.message !== "Logged In" && data.message !== "No App") {
    return data.message;
  }
  return `Login failed (${status})`;
}

async function postLogin(baseUrl: string, body: Record<string, string>) {
  const loginRes = await fetch(`${baseUrl}/api/method/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });

  const loginData = (await loginRes.json()) as FrappeLoginResponse;

  if (loginData.tmp_id && loginData.verification && loginData.message !== "Logged In") {
    return {
      kind: "pending" as const,
      tmpId: loginData.tmp_id,
      verification: {
        prompt: loginData.verification.prompt,
        method: loginData.verification.method,
        setup: loginData.verification.setup,
      },
    };
  }

  if (loginData.message !== "Logged In" && loginData.message !== "No App") {
    throw new Error(frappeError(loginData, loginRes.status));
  }

  const cookies = parseSetCookies(loginRes.headers);
  const sid = cookies.sid;
  if (!sid) throw new Error("Login succeeded but no session cookie was returned");

  return { kind: "session" as const, cookies, sid };
}

async function finishSession(baseUrl: string, cookies: Record<string, string>): Promise<ErpnextLoginResult> {
  const cookie = cookieHeader(cookies);

  const userRes = await fetch(`${baseUrl}/api/method/frappe.auth.get_logged_user`, {
    headers: { Accept: "application/json", Cookie: cookie },
  });
  const userData = (await userRes.json()) as { message?: string };
  const user = userData.message;
  if (!user || user === "Guest") throw new Error("Session is not authenticated");

  let csrfToken = "";
  try {
    const csrfRes = await fetch(`${baseUrl}/api/method/frappe.sessions.get_csrf_token`, {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    const csrfData = (await csrfRes.json()) as { message?: string };
    csrfToken = csrfData.message ?? "";
  } catch {
    // ponytail: MCP server can refresh CSRF later
  }

  return { url: baseUrl, user, sid: cookies.sid, csrfToken };
}

export function defaultErpnextUrl() {
  return SERVER_DEFAULT_ERP_URL;
}

export async function loginErpnext(
  url: string,
  email: string,
  password: string,
): Promise<ErpnextLoginResult | ErpnextLoginPending> {
  const baseUrl = normalizeUrl(url);
  if (!baseUrl) throw new Error("ERP URL is required");
  if (!email.trim()) throw new Error("Email is required");
  if (!password) throw new Error("Password is required");

  const result = await postLogin(baseUrl, { usr: email.trim(), pwd: password });
  if (result.kind === "pending") {
    return { verificationRequired: true, tmpId: result.tmpId, verification: result.verification };
  }

  return finishSession(baseUrl, result.cookies);
}

export async function verifyErpnextOtp(url: string, tmpId: string, otp: string): Promise<ErpnextLoginResult> {
  const baseUrl = normalizeUrl(url);
  if (!baseUrl) throw new Error("ERP URL is required");
  if (!tmpId.trim()) throw new Error("Session expired — sign in again");
  if (!otp.trim()) throw new Error("Verification code is required");

  const result = await postLogin(baseUrl, { tmp_id: tmpId.trim(), otp: otp.trim() });
  if (result.kind === "pending") {
    throw new Error("Incorrect or expired verification code");
  }

  return finishSession(baseUrl, result.cookies);
}

export function erpnextMcpServerPath() {
  return (
    "/mcp_erpNext/index.js"
  );
}

/** MCP env with inline SID — stored in localStorage, no credentials file. */
export function buildErpnextMcpEntry(session: { url: string; sid: string; csrfToken?: string }) {
  const env: Record<string, string> = {
    ERPNEXT_URL: session.url,
    ERPNEXT_SID: session.sid,
  };
  if (session.csrfToken) env.ERPNEXT_CSRF_TOKEN = session.csrfToken;

  return {
    command: "node",
    args: [erpnextMcpServerPath().replace(/\\/g, "/")],
    env,
  };
}
