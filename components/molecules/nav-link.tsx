import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

type NavLinkProps = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: string;
  active?: boolean;
  mobile?: boolean;
  collapsed?: boolean;
};

export function NavLink({ href, label, mobileLabel, icon, active, mobile, collapsed }: NavLinkProps) {
  const mobileText = mobileLabel?.trim();

  if (mobile) {
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        aria-label={mobileText}
        className={cn(
          "flex flex-1 flex-col items-center justify-center gap-1 min-w-0 px-0.5 py-0.5 transition-transform",
          active ? "text-secondary" : "text-on-surface-variant",
        )}
      >
        <span
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg transition-[transform,box-shadow,background-color]",
            active
              ? "bg-secondary-container text-on-secondary-container nb-border nb-shadow-sm nb-press-sm"
              : "nb-border border-transparent",
          )}
        >
          <Icon name={icon} size={22} filled={active} />
        </span>
        <span
          className={cn(
            "max-w-full truncate font-label-bold text-[9px] leading-tight tracking-tight px-0.5",
            active ? "text-secondary" : "text-on-surface-variant",
          )}
        >
          {mobileText}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center rounded-lg py-sm font-label-bold text-label-bold transition-all",
        collapsed ? "justify-center px-sm" : "gap-sm px-md",
        active
          ? "bg-secondary-container text-on-secondary-container nb-border nb-shadow-sm"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface nb-border border-transparent hover:border-black/20",
      )}
    >
      <Icon name={icon} />
      {!collapsed ? label : null}
    </Link>
  );
}
