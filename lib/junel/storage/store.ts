import { createDefaultStorage, DEFAULT_MCP_SERVERS_JSON } from "./defaults";
import { migrateErpnextMcpToHttp } from "@/lib/erpnext/mcp-config";
import { migrateLegacyMcpServers } from "@/lib/junel/mcp";
import type { Contact, JunelMcpState, JunelStorage, StoredMcpServer } from "./types";

export const JUNEL_STORAGE_KEY = "junel-storage";

function normalizeContact(contact: Contact): Contact {
  return {
    id: contact.id,
    name: contact.name ?? "",
    email: contact.email ?? "",
    phone: contact.phone ?? "",
    company: contact.company ?? "",
    notes: contact.notes ?? "",
  };
}

function normalizeMcp(partial: Partial<JunelMcpState> | undefined, legacy?: StoredMcpServer[]): JunelMcpState {
  if (Array.isArray(legacy) && legacy.length) {
    return migrateLegacyMcpServers(legacy);
  }

  const defaults = createDefaultStorage().mcp;
  return {
    serversJson: partial?.serversJson?.trim() ? partial.serversJson : defaults.serversJson,
    enabledKeys: Array.isArray(partial?.enabledKeys) ? partial.enabledKeys : defaults.enabledKeys,
  };
}

export function normalizeStorage(partial?: Partial<JunelStorage> & { mcpServers?: StoredMcpServer[] } | null): JunelStorage {
  const defaults = createDefaultStorage();
  if (!partial) return defaults;

  const erpnext = partial.erpnext?.sid ? partial.erpnext : undefined;

  return {
    version: 1,
    profile: { ...defaults.profile, ...partial.profile },
    contacts: Array.isArray(partial.contacts) ? partial.contacts.map(normalizeContact) : defaults.contacts,
    settings: { ...defaults.settings, ...partial.settings },
    rules: Array.isArray(partial.rules) && partial.rules.length ? partial.rules : defaults.rules,
    skills: Array.isArray(partial.skills) ? partial.skills : defaults.skills,
    mcp: migrateErpnextMcpToHttp(normalizeMcp(partial.mcp, partial.mcpServers), erpnext),
    erpnext,
    chat: {
      agentId: partial.chat?.agentId,
      messages: Array.isArray(partial.chat?.messages) ? partial.chat.messages : [],
    },
    taskBoard:
      partial.taskBoard && typeof partial.taskBoard === "object" && !Array.isArray(partial.taskBoard)
        ? partial.taskBoard
        : {},
  };
}

export function loadStorage(): JunelStorage {
  if (typeof window === "undefined") return createDefaultStorage();
  try {
    const raw = localStorage.getItem(JUNEL_STORAGE_KEY);
    if (!raw) {
      const defaults = createDefaultStorage();
      localStorage.setItem(JUNEL_STORAGE_KEY, JSON.stringify(defaults));
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<JunelStorage> & { mcpServers?: StoredMcpServer[] };
    const normalized = normalizeStorage(parsed);
    localStorage.setItem(JUNEL_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    const defaults = createDefaultStorage();
    localStorage.setItem(JUNEL_STORAGE_KEY, JSON.stringify(defaults));
    return defaults;
  }
}

export function saveStorage(data: JunelStorage) {
  if (typeof window === "undefined") return;
  localStorage.setItem(JUNEL_STORAGE_KEY, JSON.stringify(normalizeStorage(data)));
}

export function clearChatHistory(data: JunelStorage): JunelStorage {
  return { ...data, chat: { agentId: undefined, messages: [] } };
}

export { DEFAULT_MCP_SERVERS_JSON };
