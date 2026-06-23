import { KNOWLEDGE_RULES, KNOWLEDGE_SKILLS } from "@/lib/junel/constants";
import type { JunelStorage } from "./types";

export const DEFAULT_MCP_SERVERS_JSON = "{}";

function slugId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

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
      id: slugId(rule.name),
      name: rule.name,
      preview: rule.preview,
      scope: rule.scope,
      enabled: rule.enabled,
    })),
    skills: KNOWLEDGE_SKILLS.map((skill) => ({
      id: slugId(skill.name),
      name: skill.name,
      description: skill.description,
      category: skill.category,
      enabled: skill.enabled,
    })),
    mcp: {
      serversJson: DEFAULT_MCP_SERVERS_JSON,
      enabledKeys: [],
    },
    chat: { messages: [] },
    taskBoard: {},
  };
}
