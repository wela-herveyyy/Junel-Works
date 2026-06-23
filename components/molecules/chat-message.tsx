"use client";

import { Icon } from "@/components/ui/icon";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { cn } from "@/lib/utils/cn";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
};

export function ChatMessage({ role, content, pending }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className="flex justify-end w-full min-w-0">
        <div className="max-w-[min(85%,28rem)] bg-surface-container-highest text-on-surface px-lg py-md rounded-lg rounded-tr-sm nb-border nb-shadow-sm font-body-md text-body-md leading-relaxed whitespace-pre-wrap wrap-break-word">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-md">
      <div className="w-10 h-10 rounded-full bg-primary-container nb-border flex items-center justify-center shrink-0 mt-1 relative overflow-hidden">
        {!content && pending ? <div className="absolute inset-0 ai-pulse z-0" /> : null}
        <Icon name="smart_toy" className="text-on-primary-container text-lg relative z-10" />
      </div>
      <div
        className={cn(
          "min-w-0 bg-surface-container-lowest text-on-surface px-lg py-md rounded-lg rounded-tl-sm nb-border nb-shadow-md",
          !content && pending ? "font-body-md text-body-md text-on-surface-variant" : "",
        )}
      >
        {content ? (
          <MarkdownPreview content={content} />
        ) : pending ? (
          "Thinking…"
        ) : null}
      </div>
    </div>
  );
}
