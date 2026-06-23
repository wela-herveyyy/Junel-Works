import type { JunelMcpState, SdkMcpServerConfig, StoredMcpServer } from "@/lib/junel/storage/types";

export type McpParseResult =
  | { ok: true; servers: Record<string, SdkMcpServerConfig> }
  | { ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeEntry(raw: unknown): SdkMcpServerConfig | null {
  if (!isRecord(raw)) return null;

  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (url) {
    const headers = isRecord(raw.headers)
      ? Object.fromEntries(
          Object.entries(raw.headers).filter(([, value]) => typeof value === "string" && value.trim()),
        )
      : undefined;
    return {
      type: raw.type === "sse" ? "sse" : "http",
      url,
      headers: headers && Object.keys(headers).length ? (headers as Record<string, string>) : undefined,
    };
  }

  const command = typeof raw.command === "string" ? raw.command.trim() : "";
  if (!command) return null;

  const args = Array.isArray(raw.args)
    ? raw.args
        .filter((arg): arg is string => typeof arg === "string")
        .map((arg) => arg.trim())
        .filter(Boolean)
    : undefined;

  const env = isRecord(raw.env)
    ? Object.fromEntries(
        Object.entries(raw.env).filter(([, value]) => typeof value === "string"),
      )
    : undefined;

  const cwd = typeof raw.cwd === "string" && raw.cwd.trim() ? raw.cwd.trim() : undefined;

  return {
    type: "stdio",
    command,
    args: args?.length ? args : undefined,
    env: env && Object.keys(env).length ? (env as Record<string, string>) : undefined,
    cwd,
  };
}

export function parseMcpServersJson(json: string): McpParseResult {
  const trimmed = json.trim();
  if (!trimmed) return { ok: true, servers: {} };

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Invalid JSON" };
  }

  let serversObject: Record<string, unknown>;
  if (isRecord(parsed) && isRecord(parsed.mcpServers)) {
    serversObject = parsed.mcpServers;
  } else if (isRecord(parsed)) {
    serversObject = parsed;
  } else {
    return { ok: false, error: "JSON must be an object of MCP servers" };
  }

  const servers: Record<string, SdkMcpServerConfig> = {};
  for (const [key, value] of Object.entries(serversObject)) {
    if (!key.trim()) continue;
    const entry = normalizeEntry(value);
    if (!entry) {
      return { ok: false, error: `Server "${key}" must have "command" or "url"` };
    }
    servers[key.trim()] = entry;
  }

  return { ok: true, servers };
}

export function listMcpServerKeys(mcp: JunelMcpState): string[] {
  const parsed = parseMcpServersJson(mcp.serversJson);
  return parsed.ok ? Object.keys(parsed.servers) : [];
}

export function toSdkMcpServers(mcp: JunelMcpState): Record<string, SdkMcpServerConfig> {
  const parsed = parseMcpServersJson(mcp.serversJson);
  if (!parsed.ok) return {};

  const enabled = new Set(mcp.enabledKeys);
  return Object.fromEntries(Object.entries(parsed.servers).filter(([key]) => enabled.has(key)));
}

export function migrateLegacyMcpServers(legacy: StoredMcpServer[]): JunelMcpState {
  const servers: Record<string, SdkMcpServerConfig> = {};
  const enabledKeys: string[] = [];

  for (const server of legacy) {
    const key = server.id;
    if (server.transport === "http" && server.url?.trim()) {
      servers[key] = {
        type: "http",
        url: server.url.trim(),
        headers: server.headers,
      };
    } else if (server.command?.trim()) {
      servers[key] = {
        type: "stdio",
        command: server.command.trim(),
        args: server.args
          ? server.args.split(/[\n,]/).map((part) => part.trim()).filter(Boolean)
          : undefined,
        env: server.env,
        cwd: server.cwd?.trim() || undefined,
      };
    } else {
      continue;
    }
    if (server.enabled) enabledKeys.push(key);
  }

  return {
    serversJson: JSON.stringify(servers, null, 2),
    enabledKeys,
  };
}
