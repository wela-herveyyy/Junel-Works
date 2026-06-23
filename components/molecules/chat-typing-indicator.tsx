"use client";

import { cn } from "@/lib/utils/cn";

type ChatTypingIndicatorProps = {
  label?: string;
  className?: string;
};

export function ChatTypingIndicator({ label = "Junel is thinking", className }: ChatTypingIndicatorProps) {
  return (
    <span className={cn("flex flex-wrap items-center gap-sm font-body-md text-body-md text-on-surface-variant min-w-0", className)}>
      <span className="inline-flex items-center gap-[5px]" aria-hidden>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="chat-dot h-2 w-2 rounded-full bg-secondary nb-border border-2 border-black"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
      <span>{label}</span>
    </span>
  );
}
