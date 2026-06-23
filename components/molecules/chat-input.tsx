"use client";

import { FormEvent, KeyboardEvent, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled?: boolean;
  streaming?: boolean;
};

export function ChatInput({ value, onChange, onSubmit, disabled, streaming }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit(event as unknown as FormEvent);
      }
    }
  }

  const canSend = Boolean(value.trim()) && !disabled;

  return (
    <form onSubmit={onSubmit} className="max-w-3xl mx-auto w-full min-w-0 flex flex-col gap-xs">
      <div className="flex gap-sm items-end min-w-0">
        <div
          className={cn(
            "flex-1 min-w-0 bg-surface-container-lowest nb-border rounded-2xl nb-shadow-md nb-focus-within transition-[box-shadow,transform] p-xs",
            streaming && "chat-input-streaming",
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full min-w-0 bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-on-surface font-body-md py-sm px-md placeholder-on-surface-variant/60 min-h-[48px] max-h-[120px] custom-scrollbar leading-relaxed"
            placeholder="Ask Junel anything about your ERP data…"
            rows={1}
            aria-label="Message Junel"
          />
        </div>
        <Button
          type="submit"
          disabled={!canSend}
          size="icon"
          variant="secondary"
          className={cn(
            "h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-2xl transition-[transform,box-shadow]",
            canSend && "chat-send-ready",
            streaming && "opacity-70",
          )}
        >
          <Icon name={streaming ? "more_horiz" : "arrow_upward"} size={24} className={streaming ? "chat-send-pulse" : undefined} />
        </Button>
      </div>
      <p className="font-body-sm text-body-sm text-on-surface-variant/70 text-center hidden lg:block pb-0.5">
        <kbd className="nb-chip px-xs py-[2px] text-mono-label font-mono-label not-italic whitespace-nowrap">Enter</kbd>
        <span className="mx-1">to send ·</span>
        <kbd className="nb-chip px-xs py-[2px] text-mono-label font-mono-label not-italic whitespace-nowrap">Shift+Enter</kbd>
        <span className="mx-1">new line</span>
      </p>
    </form>
  );
}
