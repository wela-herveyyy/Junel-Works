import { parseMcpServersJson } from "@/lib/junel/mcp";
import { syncProfileFromErpLogin } from "@/lib/junel/profile";
import { buildErpnextMcpEntry } from "@/lib/erpnext/login";
import type { ErpnextLink, JunelMcpState, JunelStorage, SdkMcpServerConfig } from "@/lib/junel/storage/types";

function normalizeErpUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

function erpnextMcpNeedsRefresh(entry: SdkMcpServerConfig | undefined, erpnext: ErpnextLink) {
  if (!entry) return true;
  if (!("url" in entry) || !entry.url) return true;

  const headers = entry.headers ?? {};
  const erpUrl = normalizeErpUrl(erpnext.url);
  const headerUrl = headers["X-ERPNext-URL"]?.trim();

  return (
    headers.Authorization !== `Bearer ${erpnext.sid}` ||
    !headerUrl ||
    normalizeErpUrl(headerUrl) !== erpUrl
  );
}

export type ErpnextSessionInput = {
  url: string;
  email: string;
  user: string;
  sid: string;
  csrfToken?: string;
};

export function isErpnextLoggedIn(data: JunelStorage) {
  return Boolean(data.erpnext?.sid && data.mcp.enabledKeys.includes("erpnext"));
}

export function mergeErpnextMcp(mcp: JunelMcpState, erpnext: SdkMcpServerConfig): JunelMcpState {
  const parsed = parseMcpServersJson(mcp.serversJson);
  const servers = parsed.ok ? { ...parsed.servers } : {};
  servers.erpnext = erpnext;
  return {
    serversJson: JSON.stringify(servers, null, 2),
    enabledKeys: [...new Set([...mcp.enabledKeys, "erpnext"])],
  };
}

export function applyErpnextSession(
  prev: Pick<JunelStorage, "mcp" | "profile" | "erpnext">,
  session: ErpnextSessionInput,
  mcpEntry?: SdkMcpServerConfig,
) {
  const entry = mcpEntry ?? buildErpnextMcpEntry({ sid: session.sid, url: session.url });
  return {
    erpnext: {
      url: session.url,
      email: session.email,
      user: session.user,
      sid: session.sid,
      linkedAt: Date.now(),
    } satisfies ErpnextLink,
    mcp: mergeErpnextMcp(prev.mcp, entry),
    profile: syncProfileFromErpLogin(prev.profile, session, prev.erpnext),
  };
}

/** Upgrade legacy stdio entries and refresh HTTP configs missing `X-ERPNext-URL`. */
export function migrateErpnextMcpToHttp(mcp: JunelMcpState, erpnext?: ErpnextLink): JunelMcpState {
  if (!erpnext?.sid || !erpnext.url) return mcp;
  const parsed = parseMcpServersJson(mcp.serversJson);
  if (!parsed.ok) return mcp;
  if (!erpnextMcpNeedsRefresh(parsed.servers.erpnext, erpnext)) return mcp;
  try {
    return mergeErpnextMcp(mcp, buildErpnextMcpEntry({ sid: erpnext.sid, url: erpnext.url }));
  } catch {
    return mcp;
  }
}

export function clearErpnextSession(data: JunelStorage): JunelStorage {
  const parsed = parseMcpServersJson(data.mcp.serversJson);
  const servers = parsed.ok ? { ...parsed.servers } : {};
  delete servers.erpnext;

  return {
    ...data,
    erpnext: undefined,
    mcp: {
      serversJson: JSON.stringify(servers, null, 2),
      enabledKeys: data.mcp.enabledKeys.filter((key) => key !== "erpnext"),
    },
    chat: { agentId: undefined, messages: [] },
  };
}
