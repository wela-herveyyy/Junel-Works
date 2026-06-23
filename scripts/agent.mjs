import { Agent, CursorAgentError } from "@cursor/sdk";

const prompt = process.argv.slice(2).join(" ").trim();
if (!prompt) {
  console.error("Usage: npm run agent -- <prompt>");
  process.exit(1);
}

const apiKey = process.env.CURSOR_API_KEY?.trim();
if (!apiKey) {
  console.error("Set CURSOR_API_KEY — https://cursor.com/dashboard/integrations");
  process.exit(1);
}

/** @type {import("@cursor/sdk").SDKAgent | undefined} */
let agent;

try {
  agent = await Agent.create({
    apiKey,
    model: { id: "composer-2.5" },
    local: { cwd: process.cwd(), settingSources: [] },
  });

  const run = await agent.send(prompt);
  console.error(`agent ${agent.agentId} run ${run.id}`);

  for await (const event of run.stream()) {
    if (event.type !== "assistant") continue;
    for (const block of event.message.content) {
      if (block.type === "text") process.stdout.write(block.text);
    }
  }

  const result = await run.wait();
  if (result.status === "error") {
    console.error("\nrun failed:", run.id);
    process.exit(2);
  }
} catch (err) {
  if (err instanceof CursorAgentError) {
    console.error("startup failed:", err.message);
    process.exit(1);
  }
  throw err;
} finally {
  if (agent) await agent[Symbol.asyncDispose]();
}
