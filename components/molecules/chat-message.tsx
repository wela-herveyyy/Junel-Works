"use client";

import { Icon } from "@/components/ui/icon";
import { MarkdownPreview } from "@/components/ui/markdown-preview";
import { ChatTypingIndicator } from "@/components/molecules/chat-typing-indicator";
import { cn } from "@/lib/utils/cn";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  pending?: boolean;
  streaming?: boolean;
  animate?: boolean;
};

export function ChatMessage({ role, content, pending, streaming, animate = true }: ChatMessageProps) {
  if (role === "user") {
    return (
      <div className={cn("flex justify-end w-full min-w-0 max-w-full", animate && "chat-message-enter-user")}>
        <div className="max-w-[min(100%,28rem)] bg-secondary-container text-on-secondary-container px-md sm:px-lg py-md rounded-2xl rounded-br-sm nb-border nb-shadow-sm font-body-md text-body-md leading-relaxed whitespace-pre-wrap wrap-break-word">
          {content}
        </div>
      </div>
    );
  }

  const showTyping = pending && !content;
  const showCursor = streaming && content;

  return (
    <div className={cn("grid w-full min-w-0 max-w-full grid-cols-[2.5rem_minmax(0,1fr)] sm:grid-cols-[2.75rem_minmax(0,1fr)] gap-sm sm:gap-md", animate && "chat-message-enter-assistant")}>
      <div
        className={cn(
          "w-11 h-11 rounded-full bg-primary-container nb-border flex items-center justify-center shrink-0 mt-1 relative overflow-hidden transition-transform",
          (pending || streaming) && "chat-avatar-active",
        )}
      >
        {(pending || streaming) ? <div className="absolute inset-0 ai-pulse z-0" aria-hidden /> : null}
        <Icon name="smart_toy" className="text-on-primary-container text-lg relative z-10" />
      </div>
      <div
        className={cn(
          "min-w-0 max-w-full overflow-hidden bg-surface-container-lowest text-on-surface px-md sm:px-lg py-md rounded-2xl rounded-tl-sm nb-border nb-shadow-md transition-shadow",
          (pending || streaming) && "chat-bubble-active",
        )}
      >
        {content ? (
          <div className="relative min-w-0 max-w-full overflow-x-auto">
            <MarkdownPreview content={content} className="min-w-0 max-w-full" />
            {showCursor ? <span className="chat-stream-cursor" aria-hidden /> : null}
          </div>
        ) : showTyping ? (
          <ChatTypingIndicator />
        ) : null}
      </div>
    </div>
  );
}
