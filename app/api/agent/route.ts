import { streamAgentMessage } from "@/lib/agent/stream-agent";
import type { SdkMcpServerConfig } from "@/lib/junel/storage/types";

export const runtime = "nodejs";

type AgentRequestBody = {
  message?: string;
  agentId?: string;
  systemContext?: string;
  mcpServers?: Record<string, SdkMcpServerConfig>;
};

export async function POST(req: Request) {
  let body: AgentRequestBody;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "message is required" }, { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        for await (const event of streamAgentMessage(message, {
          agentId: body.agentId,
          systemContext: body.systemContext,
          mcpServers: body.mcpServers,
        })) {
          send(event);
        }
      } catch (err) {
        send({
          type: "error",
          message: err instanceof Error ? err.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
