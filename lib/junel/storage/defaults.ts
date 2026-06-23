import { KNOWLEDGE_RULES } from "@/lib/junel/constants";
import type { JunelStorage } from "./types";

export const DEFAULT_MCP_SERVERS_JSON = "{}";

export function createDefaultStorage(): JunelStorage {
  return {
    version: 1,
    profile: {
      displayName: "",
      email: "",
      title: "",
      company: "",
      timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" : "UTC",
      bio: "",
      avatarUrl: "",
    },
    contacts: [],
    settings: {
      personality: "professional",
      proactiveMode: true,
    },
    rules: KNOWLEDGE_RULES.map((rule) => ({
      id: rule.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      name: rule.name,
      preview: rule.preview,
      scope: rule.scope,
      enabled: rule.enabled,
    })),
    skills: [],
    mcp: {
      serversJson: DEFAULT_MCP_SERVERS_JSON,
      enabledKeys: [],
    },
    chat: { messages: [] },
    taskBoard: {},
  };
}
