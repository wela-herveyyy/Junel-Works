import { cn } from "@/lib/utils/cn";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "surface";
  size?: "sm" | "md" | "icon";
};

const variants = {
  primary:
    "bg-primary-container text-on-primary-container nb-border nb-shadow-sm nb-press-sm hover:brightness-105",
  secondary:
    "bg-secondary-container text-on-secondary-container nb-border nb-shadow-sm nb-press-sm hover:brightness-105",
  outline:
    "bg-surface-container-lowest text-on-surface nb-border nb-shadow-sm nb-press-sm hover:bg-surface-container",
  surface:
    "bg-surface-container text-on-surface nb-border nb-shadow-sm nb-press-sm hover:bg-surface-container-high",
  ghost: "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg",
};

const sizes = {
  sm: "px-md py-sm text-label-bold font-label-bold rounded-lg min-h-[44px]",
  md: "px-lg py-sm text-label-bold font-label-bold rounded-lg min-h-[52px]",
  icon: "p-sm rounded-lg h-12 w-12 flex items-center justify-center shrink-0",
};

export function Button({ variant = "primary", size = "sm", className, type = "button", children, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-xs font-bold transition-[transform,box-shadow,filter] disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
