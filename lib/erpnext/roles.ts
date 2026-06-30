function normalizeRoles(message: unknown): string[] {
  if (!Array.isArray(message)) return [];
  return message.filter((role): role is string => typeof role === "string" && Boolean(role.trim())).map((role) => role.trim());
}

/** Load Frappe role names for the logged-in user (best-effort). */
export async function fetchErpUserRoles(baseUrl: string, sid: string, user: string): Promise<string[]> {
  const url = baseUrl.trim().replace(/\/$/, "");
  const cookie = `sid=${sid}`;
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    Cookie: cookie,
  };

  try {
    const res = await fetch(`${url}/api/method/frappe.core.doctype.user.user.get_roles`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user }),
    });
    if (res.ok) {
      const data = (await res.json()) as { message?: unknown };
      const roles = normalizeRoles(data.message);
      if (roles.length) return roles;
    }
  } catch {
    // ponytail: fall through
  }

  try {
    const res = await fetch(`${url}/api/resource/User/${encodeURIComponent(user)}?fields=${encodeURIComponent(JSON.stringify(["roles"]))}`, {
      headers: { Accept: "application/json", Cookie: cookie },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { data?: { roles?: Array<{ role?: string }> } };
    const roles = data.data?.roles?.map((row) => row.role?.trim()).filter(Boolean) as string[] | undefined;
    return roles ?? [];
  } catch {
    return [];
  }
}
