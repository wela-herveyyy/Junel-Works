import { cn } from "@/lib/utils/cn";

type DotProps = { className?: string };

export function Dot({ className }: DotProps) {
  return <div className={cn("w-2 h-2 rounded-full", className)} />;
}
