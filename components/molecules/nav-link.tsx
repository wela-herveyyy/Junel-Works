import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

type NavLinkProps = {
  href: string;
  label: string;
  icon: string;
  active?: boolean;
  mobile?: boolean;
};

export function NavLink({ href, label, icon, active, mobile }: NavLinkProps) {
  if (mobile) {
    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center w-16 h-full",
          active ? "text-secondary" : "text-on-surface-variant",
        )}
      >
        <div
          className={cn(
            "px-sm py-xs rounded-xl mb-1 nb-border",
            active ? "bg-secondary-container text-on-secondary-container nb-shadow-sm" : "bg-transparent border-transparent",
          )}
        >
          <Icon name={icon} />
        </div>
        <span className={cn("font-label-bold text-[11px]", active && "text-secondary font-bold")}>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-sm rounded-lg px-md py-sm font-label-bold text-label-bold transition-all",
        active
          ? "bg-secondary-container text-on-secondary-container nb-border nb-shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface nb-border border-transparent hover:border-black/20",
      )}
    >
      <Icon name={icon} />
      {label}
    </Link>
  );
}
