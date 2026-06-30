"use client";

import { Icon } from "@/components/ui/icon";
import type { ErpBranding } from "@/lib/erpnext/branding";

function buildSuggestions(branding: ErpBranding) {
  const lookup =
    branding.isLivro
      ? "Look up a customer in ERPNext"
      : branding.schoolRole
        ? `Look up a record in ${branding.shortName}`
        : "Look up a record in the system";

  return [
    { icon: "task_alt", text: "What's on my sprint backlog?" },
    { icon: "calendar_today", text: "Show my tasks for this week" },
    { icon: "edit_note", text: "Help me draft a leave request" },
    { icon: "search", text: lookup },
  ] as const;
}

type ChatSuggestionsProps = {
  branding: ErpBranding;
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function ChatSuggestions({ branding, onSelect, disabled }: ChatSuggestionsProps) {
  const suggestions = buildSuggestions(branding);

  return (
    <div className="flex flex-col gap-md w-full">
      <p className="font-label-bold text-label-bold text-on-surface-variant text-center">Try asking</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
        {suggestions.map((item, index) => (
          <button
            key={item.text}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(item.text)}
            className="chat-suggestion-enter nb-card p-md nb-shadow-sm text-left flex items-start gap-sm hover:-translate-y-0.5 hover:nb-shadow-md transition-[transform,box-shadow] disabled:opacity-50 disabled:cursor-not-allowed nb-press-sm"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            <span className="shrink-0 w-9 h-9 rounded-lg bg-secondary-container nb-border flex items-center justify-center">
              <Icon name={item.icon} size={18} className="text-on-secondary-container" />
            </span>
            <span className="font-body-sm text-body-sm text-on-surface leading-snug pt-1">{item.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
