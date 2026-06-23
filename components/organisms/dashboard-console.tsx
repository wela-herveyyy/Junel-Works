"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/molecules/chat-input";
import { ChatMessage } from "@/components/molecules/chat-message";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { clearErpnextSession, isErpnextLoggedIn } from "@/lib/erpnext/mcp-config";
import { loadStorage } from "@/lib/junel/storage/store";
import { countActiveMcpServers, prepareAgentRequest } from "@/lib/junel/prepare-agent-request";
import type { AgentStreamEvent } from "@/lib/agent/stream-agent";
import type { ChatMessage as StoredChatMessage } from "@/lib/junel/storage/types";
import { randomId } from "@/lib/utils/random-id";

function DashboardSidebar({ mcpCount, ruleCount, skillCount, erpUser }: { mcpCount: number; ruleCount: number; skillCount: number; erpUser?: string }) {
  return (
    <aside className="hidden xl:flex flex-col w-64 bg-surface-container-low nb-border border-t-0 border-b-0 border-r-0 p-md z-20 shrink-0 gap-md">
      <div className="nb-card p-md nb-shadow-sm min-w-0">
        <h3 className="font-label-bold text-label-bold text-on-surface flex items-center gap-xs mb-sm">
          <Icon name="insights" className="text-[18px] text-secondary shrink-0" />
          Agent Context
        </h3>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {mcpCount} MCP · {ruleCount} rules · {skillCount} skills active
        </p>
        {erpUser ? (
          <p className="font-body-sm text-body-sm text-secondary font-bold mt-sm min-w-0 break-words">ERP: {erpUser}</p>
        ) : null}
      </div>
    </aside>
  );
}

export function DashboardConsole() {
  const router = useRouter();
  const { data, ready, persist, clearChat } = useJunelStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  const messages = data?.chat.messages ?? [];
  const loggedIn = data ? isErpnextLoggedIn(data) : false;

  useEffect(() => {
    if (ready && data && !isErpnextLoggedIn(data)) {
      router.replace("/login");
    }
  }, [ready, data, router]);

  useEffect(() => {
    if (ready && loggedIn && messages.length) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    }
  }, [ready, loggedIn, messages.length]);

  function scrollToBottom() {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }

  function setAssistantContent(assistantId: string, content: string) {
    persist((prev) => ({
      ...prev,
      chat: {
        ...prev.chat,
        messages: prev.chat.messages.map((message) =>
          message.id === assistantId ? { ...message, content } : message,
        ),
      },
    }));
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || isPending || !loggedIn) return;

    setInput("");
    setError(undefined);

    const userMessage: StoredChatMessage = { id: randomId(), role: "user", content: text, createdAt: Date.now() };
    const assistantId = randomId();
    const assistantMessage: StoredChatMessage = { id: assistantId, role: "assistant", content: "", createdAt: Date.now() };

    persist((prev) => ({
      ...prev,
      chat: { ...prev.chat, messages: [...prev.chat.messages, userMessage, assistantMessage] },
    }));
    queueMicrotask(scrollToBottom);

    startTransition(async () => {
      const snapshot = loadStorage();
      const payload = prepareAgentRequest(snapshot, text);
      let assistantContent = "";

      try {
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok || !res.body) throw new Error(`Request failed (${res.status})`);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const block of parts) {
            if (!block.trim()) continue;
            const line = block.trim().startsWith("data: ") ? block.trim().slice(6) : block.trim();
            const evt = JSON.parse(line) as AgentStreamEvent;

            if (evt.type === "meta") {
              persist((prev) => ({ ...prev, chat: { ...prev.chat, agentId: evt.agentId } }));
            }
            if (evt.type === "text") {
              assistantContent += evt.text;
              setAssistantContent(assistantId, assistantContent);
              scrollToBottom();
            }
            if (evt.type === "error") {
              setError(evt.message);
              if (/not found|invalid agent/i.test(evt.message)) {
                persist((prev) => ({ ...prev, chat: { ...prev.chat, agentId: undefined } }));
              }
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
        persist((prev) => ({
          ...prev,
          chat: { ...prev.chat, messages: prev.chat.messages.filter((message) => message.id !== assistantId) },
        }));
      }
    });
  }

  if (!ready || !data) {
    return <main className="flex h-full min-h-0 items-center justify-center text-on-surface-variant">Loading...</main>;
  }

  if (!loggedIn) {
    return <main className="flex h-full min-h-0 items-center justify-center text-on-surface-variant">Redirecting…</main>;
  }

  const activeMcp = countActiveMcpServers(data);
  const activeRules = data.rules.filter((rule) => rule.enabled).length;
  const activeSkills = data.skills.filter((skill) => skill.enabled).length;

  return (
    <main className="flex h-full min-h-0 flex-col md:flex-row overflow-hidden">
      <section className="flex-1 flex flex-col h-full min-h-0 overflow-hidden min-w-0">
        <div className="shrink-0 flex items-center justify-between gap-sm px-md md:px-lg py-sm border-b-4 border-black bg-surface-container-low">
          <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
            Signed in as <span className="text-secondary font-bold">{data.erpnext?.user}</span>
          </p>
          <div className="flex gap-sm shrink-0">
            {messages.length > 0 ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { clearChat(); setError(undefined); }} className="text-xs">
                Clear chat
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs text-on-surface-variant"
              onClick={() => {
                persist((prev) => clearErpnextSession(prev));
                router.replace("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-md md:px-lg pt-md md:pt-lg pb-md">
          <div className="mx-auto w-full max-w-[48rem] flex flex-col gap-lg">
            {messages.length === 0 ? (
              <>
                <div className="flex justify-center my-md">
                  <span className="nb-chip px-md py-xs text-on-surface-variant font-mono-label text-mono-label">
                    Ask Junel about your ERP data
                  </span>
                </div>
                <ChatMessage
                  role="assistant"
                  content={`Hi ${data.erpnext?.user} — ERPNext MCP is connected. Ask me about your site.`}
                />
              </>
            ) : (
              messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  role={message.role}
                  content={message.content}
                  pending={isPending && message.role === "assistant" && message.id === messages.at(-1)?.id && !message.content}
                />
              ))
            )}
            {error ? <p className="font-body-sm text-body-sm text-on-error-container bg-error-container nb-border rounded-lg px-md py-sm nb-shadow-sm">{error}</p> : null}
            <div aria-hidden className="h-2 shrink-0" />
          </div>
        </div>
        <div className="shrink-0 border-t-4 border-black bg-background px-md md:px-lg py-md md:py-lg">
          <ChatInput value={input} onChange={setInput} onSubmit={sendMessage} disabled={isPending} />
        </div>
      </section>
      <DashboardSidebar mcpCount={activeMcp} ruleCount={activeRules} skillCount={activeSkills} erpUser={data.erpnext?.user} />
    </main>
  );
}
