import { fetchErpUserRoles } from "@/lib/erpnext/roles";

export const runtime = "nodejs";

type Body = {
  url?: string;
  sid?: string;
  user?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  const sid = body.sid?.trim();
  const user = body.user?.trim();

  if (!url || !sid || !user) {
    return Response.json({ error: "url, sid, and user are required" }, { status: 400 });
  }

  try {
    const roles = await fetchErpUserRoles(url, sid, user);
    return Response.json({ ok: true, roles });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Could not load roles" },
      { status: 502 },
    );
  }
}
