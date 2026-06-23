import { Agent, CursorAgentError } from "@cursor/sdk";
import type { SdkMcpServerConfig } from "@/lib/junel/storage/types";

export type AgentStreamEvent =
  | { type: "meta"; agentId: string; runId: string }
  | { type: "text"; text: string }
  | { type: "error"; message: string }
  | { type: "done" };

export type AgentRunOptions = {
  agentId?: string;
  mcpServers?: Record<string, SdkMcpServerConfig>;
  systemContext?: string;
};

function getApiKey() {
  return process.env.CURSOR_API_KEY?.trim();
}

function agentOptions(apiKey: string, mcpServers?: Record<string, SdkMcpServerConfig>) {
  return {
    apiKey,
    model: { id: "composer-2.5" as const },
    local: { cwd: process.cwd(), settingSources: [] },
    ...(mcpServers && Object.keys(mcpServers).length ? { mcpServers } : {}),
  };
}

function buildPrompt(message: string, systemContext?: string) {
  if (!systemContext?.trim()) return message;
  return `${systemContext.trim()}\n\n---\n\nUser message:\n${message}`;
}

async function openAgent(apiKey: string, agentId: string | undefined, mcpServers?: Record<string, SdkMcpServerConfig>) {
  const opts = agentOptions(apiKey, mcpServers);
  if (!agentId) return Agent.create(opts);

  try {
    return await Agent.resume(agentId, opts);
  } catch (err) {
    if (err instanceof CursorAgentError) return Agent.create(opts);
    throw err;
  }
}

export async function* streamAgentMessage(
  message: string,
  options: AgentRunOptions = {},
): AsyncGenerator<AgentStreamEvent> {
  const apiKey = getApiKey();
  if (!apiKey) {
    yield { type: "error", message: "CURSOR_API_KEY is not configured" };
    return;
  }

  const { agentId, mcpServers, systemContext } = options;
  const hasMcp = Boolean(mcpServers && Object.keys(mcpServers).length);
  const sendOptions = hasMcp ? { mcpServers, local: { force: true } } : { local: { force: true } };
  const prompt = buildPrompt(message, systemContext);

  let agent: Awaited<ReturnType<typeof Agent.create>> | undefined;
  let resumedAgentId = agentId;

  try {
    agent = await openAgent(apiKey, resumedAgentId, mcpServers);

    let run;
    try {
      run = await agent.send(prompt, sendOptions);
    } catch (err) {
      if (agentId && err instanceof CursorAgentError) {
        await agent[Symbol.asyncDispose]();
        agent = await Agent.create(agentOptions(apiKey, mcpServers));
        resumedAgentId = undefined;
        run = await agent.send(prompt, sendOptions);
      } else {
        throw err;
      }
    }

    yield { type: "meta", agentId: agent.agentId, runId: run.id };

    for await (const event of run.stream()) {
      if (event.type !== "assistant") continue;
      for (const block of event.message.content) {
        if (block.type === "text") yield { type: "text", text: block.text };
      }
    }

    const result = await run.wait();
    if (result.status === "error") {
      yield { type: "error", message: `Run failed: ${run.id}` };
      return;
    }

    yield { type: "done" };
  } catch (err) {
    if (err instanceof CursorAgentError) {
      yield { type: "error", message: err.message };
      return;
    }
    throw err;
  } finally {
    if (agent) await agent[Symbol.asyncDispose]();
  }
}
