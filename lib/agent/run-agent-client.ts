import type { AgentStreamEvent } from "@/lib/agent/stream-agent";
import type { SdkMcpServerConfig } from "@/lib/junel/storage/types";

export type AgentClientPayload = {
  message: string;
  agentId?: string;
  systemContext?: string;
  mcpServers?: Record<string, SdkMcpServerConfig>;
};

export type AgentClientResult = {
  text: string;
  agentId?: string;
};

/**
 * Calls /api/agent and consumes the SSE stream.
 * `onText` receives the full accumulated text on each chunk.
 */
export async function streamAgentClient(
  payload: AgentClientPayload,
  onText?: (fullText: string) => void,
  signal?: AbortSignal,
): Promise<AgentClientResult> {
  const res = await fetch("/api/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let agentId: string | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      const line = trimmed.startsWith("data: ") ? trimmed.slice(6) : trimmed;
      const evt = JSON.parse(line) as AgentStreamEvent;

      if (evt.type === "meta") agentId = evt.agentId;
      if (evt.type === "text") {
        text += evt.text;
        onText?.(text);
      }
      if (evt.type === "error") throw new Error(evt.message);
    }
  }

  return { text, agentId };
}
