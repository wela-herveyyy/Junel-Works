"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { JunelAppGate } from "@/components/organisms/junel-app-gate";
import { JunelStoreProvider, useJunelStore } from "@/components/providers/junel-store-provider";
import { Icon } from "@/components/ui/icon";
import { NavLink } from "@/components/molecules/nav-link";
import { JUNEL_NAV } from "@/lib/junel/constants";
import { cn } from "@/lib/utils/cn";

const NAV_COLLAPSED_KEY = "junel-nav-collapsed";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useJunelSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useJunelSidebar must be used within JunelShell");
  }
  return context;
}

function NewChatLink({ collapsed }: { collapsed: boolean }) {
  const router = useRouter();
  const { clearChat } = useJunelStore();

  return (
    <Link
      href="/"
      title="New Chat"
      onClick={(event) => {
        event.preventDefault();
        clearChat();
        router.push("/");
      }}
      className={cn(
        "w-full py-sm bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg flex items-center nb-border nb-shadow-md nb-press-md hover:brightness-105 hover:-translate-y-0.5 transition-[transform,filter,padding]",
        collapsed ? "justify-center px-sm" : "justify-center gap-sm px-md",
      )}
    >
      <Icon name="add" size={20} />
      {!collapsed ? "New Chat" : null}
    </Link>
  );
}

export function JunelSideNav() {
  const pathname = usePathname();
  const { collapsed, toggle } = useJunelSidebar();

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-surface-container-low nb-border border-t-0 border-b-0 border-l-0 nb-shadow-lg fixed left-0 top-0 h-screen z-30 p-sm gap-md transition-[width,padding] duration-200 ease-out",
        collapsed ? "w-18 p-sm" : "w-64 p-md",
      )}
    >
      <div className={cn("flex items-center gap-xs", collapsed ? "flex-col" : "justify-between px-xs pt-sm")}>
        <Link
          href="/"
          title="Junel AI"
          className={cn(
            "text-on-surface font-bold transition-all",
            collapsed
              ? "w-10 h-10 rounded-lg nb-border bg-surface-container-lowest flex items-center justify-center nb-shadow-sm shrink-0"
              : "font-headline-md text-headline-md px-sm",
          )}
        >
          {collapsed ? <Icon name="smart_toy" className="text-secondary" /> : "Junel AI"}
        </Link>
        {!collapsed ? (
          <button
            type="button"
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface nb-border border-transparent hover:border-black/20 shrink-0"
            aria-label="Collapse sidebar"
          >
            <Icon name="chevron_left" size={20} />
          </button>
        ) : null}
      </div>

      <NewChatLink collapsed={collapsed} />

      <nav className="flex-1 flex flex-col gap-xs min-h-0">
        {JUNEL_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} collapsed={collapsed} />
        ))}
      </nav>

      {collapsed ? (
        <button
          type="button"
          onClick={toggle}
          className="w-full py-sm rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface nb-border border-transparent hover:border-black/20 shrink-0"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <Icon name="chevron_right" size={20} />
        </button>
      ) : null}
    </aside>
  );
}

export function JunelMobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 px-sm pb-[max(8px,env(safe-area-inset-bottom,0px))] pointer-events-none"
    >
      <div className="pointer-events-auto flex h-[72px] items-stretch gap-0.5 rounded-xl bg-surface-container-lowest nb-border nb-shadow-md px-xs py-xs">
        {JUNEL_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} mobile />
        ))}
      </div>
    </nav>
  );
}

function JunelShellLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(NAV_COLLAPSED_KEY) === "1");
    } catch {
      // ponytail: ignore private mode
    }
    setHydrated(true);
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(NAV_COLLAPSED_KEY, next ? "1" : "0");
      } catch {
        // ponytail: ignore
      }
      return next;
    });
  }, []);

  const sidebarValue = useMemo(() => ({ collapsed, toggle }), [collapsed, toggle]);

  return (
    <SidebarContext.Provider value={sidebarValue}>
      <div className="bg-background text-on-background font-body-md antialiased min-h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
        <div className="flex h-screen pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
          <JunelSideNav />
          <div
            className={cn(
              "flex-1 min-w-0 w-full min-h-0 flex flex-col overflow-hidden transition-[margin] duration-200 ease-out",
              hydrated && collapsed ? "md:ml-18" : "md:ml-64",
              !hydrated && "md:ml-64",
            )}
          >
            <JunelAppGate>{children}</JunelAppGate>
          </div>
        </div>
        <JunelMobileNav />
      </div>
    </SidebarContext.Provider>
  );
}

export function JunelShell({ children }: { children: React.ReactNode }) {
  return (
    <JunelStoreProvider>
      <JunelShellLayout>{children}</JunelShellLayout>
    </JunelStoreProvider>
  );
}
