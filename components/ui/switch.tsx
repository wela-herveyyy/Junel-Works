"use client";

import { cn } from "@/lib/utils/cn";

type SwitchProps = {
  id?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
};

export function Switch({ id, defaultChecked, checked, onCheckedChange, className }: SwitchProps) {
  const controlled = checked !== undefined;

  return (
    <label className={cn("relative inline-flex h-8 w-14 shrink-0 cursor-pointer items-center", className)}>
      <input
        id={id}
        type="checkbox"
        checked={controlled ? checked : undefined}
        defaultChecked={controlled ? undefined : defaultChecked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full nb-border bg-surface-container transition-colors peer-checked:bg-primary-container peer-focus-visible:ring-4 peer-focus-visible:ring-secondary-container/50"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute left-1 top-1 h-6 w-6 rounded-full bg-surface-container-lowest nb-border transition-transform peer-checked:translate-x-6 peer-checked:bg-tertiary-container"
      />
    </label>
  );
}
