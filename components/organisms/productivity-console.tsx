"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/molecules/page-header";
import { TaskCard } from "@/components/molecules/task-card";
import { Icon } from "@/components/ui/icon";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { isErpnextLoggedIn } from "@/lib/erpnext/mcp-config";
import { streamAgentClient } from "@/lib/agent/run-agent-client";
import type { ErpTask } from "@/app/api/erpnext/tasks/route";
import type { TaskStatus } from "@/lib/junel/storage/types";

function buildFeedbackPrompt(task: ErpTask, workingState: string, userName?: string) {
  return [
    `You are ${userName ? `${userName}'s` : "an"} sprint assistant reviewing one Sprint Backlog task.`,
    "",
    `Task: ${task.title}`,
    `Record: ${task.name}`,
    `ERP status: ${task.status ?? "n/a"}`,
    `My working state: ${workingState}`,
    "",
    "Give brief, actionable feedback in Markdown. Use 3 short bullets max:",
    "- the single top priority / next concrete step",
    "- any risk or blocker to watch",
    "- a quick tip to move it forward",
    "Keep it under 90 words. Do not repeat the task title verbatim.",
  ].join("\n");
}

export function ProductivityConsole() {
  const router = useRouter();
  const { data, ready, persist } = useJunelStore();

  const [tasks, setTasks] = useState<ErpTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const fetchedRef = useRef(false);

  const loggedIn = data ? isErpnextLoggedIn(data) : false;
  const erpnext = data?.erpnext;

  useEffect(() => {
    if (ready && data && !isErpnextLoggedIn(data)) {
      router.replace("/login");
    }
  }, [ready, data, router]);

  const loadTasks = useCallback(async () => {
    if (!erpnext?.sid) return;
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch("/api/erpnext/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: erpnext.url, sid: erpnext.sid, email: erpnext.email, user: erpnext.user }),
      });
      const json = (await res.json()) as { ok?: boolean; tasks?: ErpTask[]; error?: string };
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed to load tasks");
      setTasks(json.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }, [erpnext?.sid, erpnext?.url, erpnext?.email, erpnext?.user]);

  useEffect(() => {
    if (ready && loggedIn && !fetchedRef.current) {
      fetchedRef.current = true;
      void loadTasks();
    }
  }, [ready, loggedIn, loadTasks]);

  function setStatus(name: string, status: TaskStatus) {
    persist((prev) => {
      const current = prev.taskBoard[name];
      const nextStatus = current?.status === status ? undefined : status;
      return {
        ...prev,
        taskBoard: {
          ...prev.taskBoard,
          [name]: { ...current, status: nextStatus, updatedAt: Date.now() },
        },
      };
    });
  }

  async function generateFeedback(task: ErpTask) {
    if (busy[task.name]) return;
    setBusy((b) => ({ ...b, [task.name]: true }));
    setDrafts((d) => ({ ...d, [task.name]: "" }));

    const workingState = data?.taskBoard[task.name]?.status ?? "not set";

    try {
      const { text } = await streamAgentClient(
        { message: buildFeedbackPrompt(task, workingState, data?.profile.displayName) },
        (full) => setDrafts((d) => ({ ...d, [task.name]: full })),
      );

      persist((prev) => ({
        ...prev,
        taskBoard: {
          ...prev.taskBoard,
          [task.name]: {
            ...prev.taskBoard[task.name],
            feedback: text,
            feedbackAt: Date.now(),
            updatedAt: Date.now(),
          },
        },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Feedback failed");
    } finally {
      setBusy((b) => ({ ...b, [task.name]: false }));
      setDrafts((d) => {
        const next = { ...d };
        delete next[task.name];
        return next;
      });
    }
  }

  if (!ready || !data) {
    return <main className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar p-lg text-on-surface-variant">Loading...</main>;
  }

  if (!loggedIn) {
    return <main className="flex h-full min-h-0 items-center justify-center text-on-surface-variant">Redirecting…</main>;
  }

  const working = tasks.filter((t) => data.taskBoard[t.name]?.status === "working").length;
  const onHold = tasks.filter((t) => data.taskBoard[t.name]?.status === "on_hold").length;

  return (
    <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <PageHeader
        title="Productivity"
        description="Your Sprint Backlog from ERPNext. Set your working state and get AI feedback."
        actions={
          <button
            type="button"
            onClick={loadTasks}
            disabled={loading}
            className="inline-flex items-center gap-xs px-md py-sm rounded-lg nb-border bg-surface-container-lowest text-on-surface font-label-bold text-label-bold nb-shadow-sm nb-press-sm disabled:opacity-50"
          >
            <Icon name="refresh" size={18} />
            {loading ? "Loading…" : "Refresh"}
          </button>
        }
      />

      <div className="w-full min-w-0 px-margin-mobile md:px-margin-desktop pt-lg pb-2xl max-w-5xl mx-auto flex flex-col gap-lg">
        {tasks.length ? (
          <div className="flex flex-wrap gap-sm">
            <span className="nb-chip px-md py-xs text-mono-label bg-surface-container-lowest">{tasks.length} tasks</span>
            <span className="nb-chip px-md py-xs text-mono-label bg-tertiary-container text-on-tertiary-container">{working} working</span>
            <span className="nb-chip px-md py-xs text-mono-label bg-primary-container text-on-primary-container">{onHold} on hold</span>
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg nb-border nb-shadow-sm bg-error-container text-on-error-container p-md flex items-center gap-sm">
            <Icon name="error" />
            <p className="font-body-md text-body-md min-w-0 wrap-break-word">{error}</p>
          </div>
        ) : null}

        {loading && !tasks.length ? (
          <p className="font-body-md text-body-md text-on-surface-variant">Loading your Sprint Backlog…</p>
        ) : null}

        {!loading && !error && !tasks.length ? (
          <div className="nb-card p-lg text-center flex flex-col items-center gap-sm">
            <Icon name="inbox" className="text-4xl text-on-surface-variant" />
            <p className="font-headline-md text-headline-md text-on-surface">No Sprint Backlog tasks</p>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Nothing assigned to or owned by you right now.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
          {tasks.map((task) => (
            <TaskCard
              key={task.name}
              task={task}
              entry={data.taskBoard[task.name]}
              busy={busy[task.name]}
              draft={drafts[task.name]}
              erpUrl={erpnext?.url}
              onStatus={(status) => setStatus(task.name, status)}
              onFeedback={() => generateFeedback(task)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
