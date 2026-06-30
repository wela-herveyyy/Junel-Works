"use client";

import { Icon } from "@/components/ui/icon";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { cn } from "@/lib/utils/cn";
import { SPRINT_BACKLOGS_ROUTE } from "@/lib/erpnext/constants";
import type { ErpTask } from "@/app/api/erpnext/tasks/route";
import type { TaskBoardEntry, TaskStatus } from "@/lib/junel/storage/types";

type TaskCardProps = {
  task: ErpTask;
  entry?: TaskBoardEntry;
  busy?: boolean;
  draft?: string;
  erpUrl?: string;
  openInLabel?: string;
  onStatus: (status: TaskStatus) => void;
  onFeedback: () => void;
};

const STATUS_BUTTONS: { value: TaskStatus; label: string; icon: string; active: string }[] = [
  { value: "working", label: "Working", icon: "bolt", active: "bg-tertiary-container text-on-tertiary-container" },
  { value: "on_hold", label: "On hold", icon: "pause", active: "bg-primary-container text-on-primary-container" },
];

export function TaskCard({ task, entry, busy, draft, erpUrl, openInLabel = "Open in ERPNext", onStatus, onFeedback }: TaskCardProps) {
  const feedback = busy ? draft : entry?.feedback;
  const link = erpUrl
    ? `${erpUrl.replace(/\/$/, "")}/app/${SPRINT_BACKLOGS_ROUTE}/${encodeURIComponent(task.name)}`
    : undefined;

  return (
    <article className="nb-card p-md flex flex-col gap-sm min-w-0">
      <div className="flex items-start justify-between gap-sm min-w-0">
        <div className="min-w-0">
          <h3 className="font-headline-md text-headline-md text-on-surface leading-tight wrap-break-word">{task.title}</h3>
          <div className="flex flex-wrap items-center gap-xs mt-xs">
            <span className="font-mono-label text-mono-label text-on-surface-variant break-all">{task.name}</span>
            {task.status ? (
              <span className="nb-chip px-sm py-0.5 text-mono-label bg-surface-container">{task.status}</span>
            ) : null}
            {task.priority ? (
              <span className="nb-chip px-sm py-0.5 text-mono-label bg-secondary-container text-on-secondary-container">
                {task.priority}
              </span>
            ) : null}
          </div>
        </div>
        {link ? (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-lg nb-border bg-surface-container-lowest nb-shadow-sm nb-press-sm text-on-surface"
            title={openInLabel}
          >
            <Icon name="open_in_new" size={18} />
          </a>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-sm">
        {STATUS_BUTTONS.map((btn) => {
          const isActive = entry?.status === btn.value;
          return (
            <button
              key={btn.value}
              type="button"
              onClick={() => onStatus(btn.value)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-xs px-md py-xs rounded-lg nb-border font-label-bold text-label-bold transition-[transform,box-shadow,filter] nb-press-sm",
                isActive ? `${btn.active} nb-shadow-sm` : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container",
              )}
            >
              <Icon name={btn.icon} size={18} />
              {btn.label}
            </button>
          );
        })}
      </div>

      <div className="border-t-4 border-black/10 pt-sm">
        <div className="flex items-center justify-between gap-sm mb-xs">
          <h4 className="font-label-bold text-label-bold text-on-surface flex items-center gap-xs">
            <Icon name="smart_toy" size={18} className="text-secondary" />
            AI Feedback
          </h4>
          <button
            type="button"
            onClick={onFeedback}
            disabled={busy}
            className="inline-flex items-center gap-xs px-sm py-xs rounded-lg nb-border bg-secondary-container text-on-secondary-container font-label-bold text-mono-label nb-shadow-sm nb-press-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name={busy ? "hourglass_top" : entry?.feedback ? "refresh" : "auto_awesome"} size={16} />
            {busy ? "Thinking…" : entry?.feedback ? "Regenerate" : "Get feedback"}
          </button>
        </div>
        {feedback ? (
          <div className="rounded-lg nb-border bg-surface-container-low p-sm">
            <MarkdownPreview content={feedback} />
          </div>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            No feedback yet. Tap “Get feedback” for AI suggestions on this task.
          </p>
        )}
      </div>
    </article>
  );
}
