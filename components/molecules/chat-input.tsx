"use client";

import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  disabled?: boolean;
};

export function ChatInput({ value, onChange, onSubmit, disabled }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="max-w-[48rem] mx-auto w-full flex gap-sm items-end">
      <div className="flex-1 bg-surface-container-lowest nb-border rounded-lg nb-shadow-md nb-focus-within transition-[box-shadow] p-xs">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full bg-transparent border-none resize-none focus:ring-0 focus:outline-none text-on-surface font-body-md py-sm px-md placeholder-on-surface-variant/60 min-h-[56px] max-h-[120px] custom-scrollbar"
          placeholder="Ask Junel anything..."
          rows={1}
        />
      </div>
      <Button type="submit" disabled={disabled || !value.trim()} size="icon" variant="secondary" className="h-14 w-14 shrink-0">
        <Icon name="arrow_upward" size={24} />
      </Button>
    </form>
  );
}
