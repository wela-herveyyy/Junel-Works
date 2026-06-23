import { buildErpnextMcpEntry, loginErpnext, verifyErpnextOtp } from "@/lib/erpnext/login";

export const runtime = "nodejs";

type Body = {
  url?: string;
  email?: string;
  password?: string;
  tmpId?: string;
  otp?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = body.url?.trim();
  const email = body.email?.trim();
  const tmpId = body.tmpId?.trim();
  const otp = body.otp?.trim();

  if (!url) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  try {
    let session;
    if (tmpId && otp) {
      session = await verifyErpnextOtp(url, tmpId, otp);
    } else {
      const password = body.password;
      if (!email || !password) {
        return Response.json({ error: "email and password are required" }, { status: 400 });
      }
      const result = await loginErpnext(url, email, password);
      if ("verificationRequired" in result) {
        return Response.json({
          verificationRequired: true,
          tmpId: result.tmpId,
          verification: result.verification,
        });
      }
      session = result;
    }

    const mcpEntry = buildErpnextMcpEntry(session);
    return Response.json({
      ok: true,
      user: session.user,
      url: session.url,
      sid: session.sid,
      csrfToken: session.csrfToken,
      mcpEntry,
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 401 },
    );
  }
}
