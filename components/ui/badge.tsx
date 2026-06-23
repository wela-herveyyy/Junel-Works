import { cn } from "@/lib/utils/cn";

type BadgeProps = {
  children: React.ReactNode;
  tone?: "default" | "primary" | "error" | "suggested";
  className?: string;
};

const toneClass = {
  default: "bg-surface-container-lowest text-on-surface-variant",
  primary: "bg-primary-container text-on-primary-container",
  error: "bg-error-container text-on-error-container",
  suggested: "bg-tertiary-container text-on-tertiary-container",
};

export function Badge({ children, tone = "default", className }: BadgeProps) {
  return (
    <span className={cn("nb-chip font-mono-label text-mono-label px-sm py-xs gap-xs", toneClass[tone], className)}>
      {children}
    </span>
  );
}
