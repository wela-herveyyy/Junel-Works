"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChatInput } from "@/components/molecules/chat-input";
import { ChatMessage } from "@/components/molecules/chat-message";
import { ChatSuggestions } from "@/components/molecules/chat-suggestions";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { getErpBranding } from "@/lib/erpnext/branding";
import { clearErpnextSession, isErpnextLoggedIn } from "@/lib/erpnext/mcp-config";
import { loadStorage } from "@/lib/junel/storage/store";
import { countActiveMcpServers, prepareAgentRequest } from "@/lib/junel/prepare-agent-request";
import type { AgentStreamEvent } from "@/lib/agent/stream-agent";
import type { ChatMessage as StoredChatMessage } from "@/lib/junel/storage/types";
import { cn } from "@/lib/utils/cn";
import { randomId } from "@/lib/utils/random-id";

const CONTEXT_SIDEBAR_COLLAPSED_KEY = "junel-context-sidebar-collapsed";

type DashboardSidebarProps = {
  mcpCount: number;
  ruleCount: number;
  skillCount: number;
  erpUser?: string;
  sidebarHint: string;
};

const collapsedIconBtn =
  "w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors shrink-0";

function ContextStatIcon({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div title={`${value} ${label}`} className={cn(collapsedIconBtn, "relative")}>
      <Icon name={icon} size={20} />
      <span className="absolute -top-0.5 -right-0.5 min-w-margin-mobile h-4 px-0.5 rounded-full bg-secondary text-on-secondary-container text-[10px] font-bold leading-4 text-center">
        {value}
      </span>
    </div>
  );
}

function DashboardSidebar({ mcpCount, ruleCount, skillCount, erpUser, sidebarHint }: DashboardSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(CONTEXT_SIDEBAR_COLLAPSED_KEY) === "1");
    } catch {
      // ponytail: ignore private mode
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CONTEXT_SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ponytail: ignore
      }
      return next;
    });
  }, []);

  const showCollapsed = hydrated && collapsed;
  const contextSummary = [
    `${mcpCount} MCP`,
    `${ruleCount} rules`,
    `${skillCount} skills`,
    erpUser,
  ]
    .filter(Boolean)
    .join(" · ");

  if (showCollapsed) {
    return (
      <aside className="hidden xl:flex flex-col w-14 shrink-0 bg-surface-container-low nb-border border-t-0 border-b-0 border-r-0 z-20 py-sm items-center gap-xs chat-sidebar-enter">
        <div
          title={contextSummary ? `Agent context · ${contextSummary}` : "Agent context"}
          className={cn(collapsedIconBtn, "text-secondary")}
        >
          <Icon name="insights" size={22} />
        </div>

        <div className="w-6 h-px bg-outline-variant/40 shrink-0" aria-hidden />

        <div className="flex flex-col items-center gap-0.5">
          <ContextStatIcon icon="hub" label="MCP" value={mcpCount} />
          <ContextStatIcon icon="gavel" label="rules" value={ruleCount} />
          <ContextStatIcon icon="psychology" label="skills" value={skillCount} />
        </div>

        {erpUser ? (
          <>
            <div className="w-6 h-px bg-outline-variant/40 shrink-0" aria-hidden />
            <div title={erpUser} className={cn(collapsedIconBtn, "text-secondary")}>
              <Icon name="account_circle" size={22} />
            </div>
          </>
        ) : null}

        <button
          type="button"
          onClick={toggle}
          className={cn(collapsedIconBtn, "mt-auto")}
          aria-label="Expand context panel"
          title="Expand panel"
        >
          <Icon name="chevron_left" size={20} />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "hidden xl:flex flex-col w-72 min-w-0 max-w-72 bg-surface-container-low nb-border border-t-0 border-b-0 border-r-0 p-md z-20 shrink-0 gap-md chat-sidebar-enter overflow-hidden transition-[width,padding] duration-200 ease-out",
        !hydrated && "w-72",
      )}
    >
      <div className="nb-card p-md nb-shadow-sm min-w-0 overflow-hidden">
        <div className="flex items-center justify-between gap-xs mb-sm">
          <h3 className="font-label-bold text-label-bold text-on-surface flex items-center gap-xs min-w-0">
            <Icon name="insights" className="text-[18px] text-secondary shrink-0" />
            Agent Context
          </h3>
          <button
            type="button"
            onClick={toggle}
            className={cn(collapsedIconBtn, "w-9 h-9")}
            aria-label="Collapse context panel"
          >
            <Icon name="chevron_right" size={20} />
          </button>
        </div>

        <div className="flex flex-wrap gap-xs mt-sm">
          <span className="nb-chip px-sm py-xs text-mono-label font-mono-label text-on-surface">{mcpCount} MCP</span>
          <span className="nb-chip px-sm py-xs text-mono-label font-mono-label text-on-surface">{ruleCount} rules</span>
          <span className="nb-chip px-sm py-xs text-mono-label font-mono-label text-on-surface">{skillCount} skills</span>
        </div>

        {erpUser ? (
          <p className="font-body-sm text-body-sm text-secondary font-bold mt-md min-w-0 flex items-start gap-xs">
            <Icon name="account_circle" size={16} className="shrink-0 mt-0.5" />
            <span className="min-w-0 break-all leading-snug" title={erpUser}>
              {erpUser}
            </span>
          </p>
        ) : null}
      </div>

      <div className="nb-card p-md nb-shadow-sm min-w-0 overflow-hidden">
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          {sidebarHint}
        </p>
      </div>
    </aside>
  );
}

function ChatEmptyHero({ userName, connectedMessage }: { userName?: string; connectedMessage: string }) {
  return (
    <div className="chat-hero-enter flex flex-col items-center text-center gap-md py-lg">
      <div className="relative w-20 h-20 rounded-full bg-primary-container nb-border nb-shadow-lg flex items-center justify-center chat-hero-icon">
        <Icon name="smart_toy" className="text-on-primary-container text-4xl" />
        <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-tertiary-container nb-border flex items-center justify-center">
          <Icon name="bolt" size={16} className="text-on-tertiary-container" />
        </span>
      </div>
      <div className="max-w-112">
        <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
          {userName ? `Hey ${userName.split("@")[0]}!` : "Hey there!"}
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
          {connectedMessage} Ask about tasks, records, or anything on your site — Junel will use your live data.
        </p>
      </div>
    </div>
  );
}

export function DashboardConsole() {
  const router = useRouter();
  const { data, ready, persist, clearChat } = useJunelStore();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = data?.chat.messages ?? [];
  const loggedIn = data ? isErpnextLoggedIn(data) : false;
  const lastMessage = messages.at(-1);
  const isStreaming = isPending && lastMessage?.role === "assistant";

  useEffect(() => {
    if (ready && data && !isErpnextLoggedIn(data)) {
      router.replace("/login");
    }
  }, [ready, data, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isStreaming]);

  function scrollToBottom() {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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

  function submitText(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isPending || !loggedIn) return;

    setInput("");
    setError(undefined);

    const userMessage: StoredChatMessage = { id: randomId(), role: "user", content: trimmed, createdAt: Date.now() };
    const assistantId = randomId();
    const assistantMessage: StoredChatMessage = { id: assistantId, role: "assistant", content: "", createdAt: Date.now() };

    persist((prev) => ({
      ...prev,
      chat: { ...prev.chat, messages: [...prev.chat.messages, userMessage, assistantMessage] },
    }));
    queueMicrotask(scrollToBottom);

    startTransition(async () => {
      const snapshot = loadStorage();
      const payload = prepareAgentRequest(snapshot, trimmed);
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

  function sendMessage(event: FormEvent) {
    event.preventDefault();
    submitText(input);
  }

  if (!ready || !data) {
    return (
      <main className="flex h-full min-h-0 items-center justify-center chat-bg">
        <div className="flex flex-col items-center gap-md chat-hero-enter">
          <div className="w-12 h-12 rounded-full bg-primary-container nb-border flex items-center justify-center">
            <Icon name="smart_toy" className="text-on-primary-container animate-pulse" />
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant">Loading Junel…</p>
        </div>
      </main>
    );
  }

  if (!loggedIn) {
    return <main className="flex h-full min-h-0 items-center justify-center text-on-surface-variant chat-bg">Redirecting…</main>;
  }

  const activeMcp = countActiveMcpServers(data);
  const activeRules = data.rules.filter((rule) => rule.enabled).length;
  const activeSkills = data.skills.filter((skill) => skill.enabled).length;
  const branding = getErpBranding(data.erpnext);
  const sidebarHint = `Junel streams replies live and can call your ${branding.shortName} tools while you chat.`;

  return (
    <main className="flex h-full min-h-0 flex-col md:flex-row overflow-hidden">
      <section className="flex-1 flex flex-col h-full min-h-0 overflow-hidden min-w-0">
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-sm px-md md:px-lg py-sm border-b-4 border-black bg-surface-container-low/95 backdrop-blur-sm min-w-0">
          <div className="flex items-center gap-sm min-w-0 flex-1">
            {isStreaming ? (
              <span className="chat-status-live nb-chip px-sm py-xs text-mono-label font-mono-label text-secondary flex items-center gap-xs shrink-0">
                <span className="chat-status-dot" aria-hidden />
                Live
              </span>
            ) : (
              <span className="nb-chip px-sm py-xs text-mono-label font-mono-label text-on-surface-variant shrink-0">Ready</span>
            )}
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate min-w-0 xl:hidden">
              <span className="text-secondary font-bold">{data.erpnext?.user}</span>
            </p>
          </div>
          <div className="flex gap-xs sm:gap-sm shrink-0">
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

        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar chat-bg px-sm sm:px-md md:px-lg pt-md md:pt-lg pb-md">
          <div className="mx-auto w-full max-w-3xl min-w-0 flex flex-col gap-lg">
            {messages.length === 0 ? (
              <>
                <ChatEmptyHero userName={data.erpnext?.user} connectedMessage={branding.connectedMessage} />
                <ChatSuggestions branding={branding} onSelect={(text) => submitText(text)} disabled={isPending} />
              </>
            ) : (
              messages.map((message, index) => {
                const isLast = message.id === lastMessage?.id;
                const isAssistantLast = isLast && message.role === "assistant";
                return (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    pending={isPending && isAssistantLast && !message.content}
                    streaming={isPending && isAssistantLast && Boolean(message.content)}
                    animate={index >= messages.length - 2}
                  />
                );
              })
            )}
            {error ? (
              <div className="chat-message-enter-assistant font-body-sm text-body-sm text-on-error-container bg-error-container nb-border rounded-xl px-md py-sm nb-shadow-sm flex items-start gap-sm min-w-0 max-w-full">
                <Icon name="error" size={18} className="shrink-0 mt-0.5" />
                <span className="min-w-0 wrap-break-word">{error}</span>
              </div>
            ) : null}
            <div ref={bottomRef} aria-hidden className="h-2 shrink-0" />
          </div>
        </div>

        <div className="shrink-0 border-t-4 border-black bg-background/95 backdrop-blur-sm px-sm sm:px-md md:px-lg py-sm md:py-md chat-input-bar min-w-0">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={sendMessage}
            disabled={isPending}
            streaming={isStreaming}
          />
        </div>
      </section>
      <DashboardSidebar
        mcpCount={activeMcp}
        ruleCount={activeRules}
        skillCount={activeSkills}
        erpUser={data.erpnext?.user}
        sidebarHint={sidebarHint}
      />
    </main>
  );
}
