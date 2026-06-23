import { parseMcpServersJson } from "@/lib/junel/mcp";
import { buildErpnextMcpEntry } from "@/lib/erpnext/login";
import type { ErpnextLink, JunelMcpState, JunelStorage } from "@/lib/junel/storage/types";

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

export function mergeErpnextMcp(mcp: JunelMcpState, erpnext: ReturnType<typeof buildErpnextMcpEntry>): JunelMcpState {
  const parsed = parseMcpServersJson(mcp.serversJson);
  const servers = parsed.ok ? { ...parsed.servers } : {};
  servers.erpnext = erpnext;
  return {
    serversJson: JSON.stringify(servers, null, 2),
    enabledKeys: [...new Set([...mcp.enabledKeys, "erpnext"])],
  };
}

export function applyErpnextSession(mcp: JunelMcpState, session: ErpnextSessionInput) {
  const entry = buildErpnextMcpEntry(session);
  return {
    erpnext: {
      url: session.url,
      email: session.email,
      user: session.user,
      sid: session.sid,
      linkedAt: Date.now(),
    } satisfies ErpnextLink,
    mcp: mergeErpnextMcp(mcp, entry),
  };
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
