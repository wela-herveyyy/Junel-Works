import { buildAgentContext } from "@/lib/junel/agent-context";
import { toSdkMcpServers } from "@/lib/junel/mcp";
import type { JunelStorage } from "@/lib/junel/storage/types";

export function prepareAgentRequest(data: JunelStorage, message: string) {
  return {
    message,
    agentId: data.chat.agentId,
    systemContext: buildAgentContext(data.profile, data.contacts, data.rules, data.skills, data.settings),
    mcpServers: toSdkMcpServers(data.mcp),
  };
}

export function countActiveMcpServers(data: JunelStorage) {
  return Object.keys(toSdkMcpServers(data.mcp)).length;
}
