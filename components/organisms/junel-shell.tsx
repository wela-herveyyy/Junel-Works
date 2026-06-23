"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { JunelStoreProvider, useJunelStore } from "@/components/providers/junel-store-provider";
import { Icon } from "@/components/ui/icon";
import { NavLink } from "@/components/molecules/nav-link";
import { JUNEL_NAV } from "@/lib/junel/constants";

function NewChatLink() {
  const router = useRouter();
  const { clearChat } = useJunelStore();

  return (
    <Link
      href="/"
      onClick={(event) => {
        event.preventDefault();
        clearChat();
        router.push("/");
      }}
      className="w-full py-sm px-md bg-primary-container text-on-primary-container font-label-bold text-label-bold rounded-lg flex items-center justify-center gap-sm nb-border nb-shadow-md nb-press-md hover:brightness-105"
    >
      <Icon name="add" size={20} />
      New Chat
    </Link>
  );
}

export function JunelSideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col bg-surface-container-low nb-border border-t-0 border-b-0 border-l-0 nb-shadow-lg fixed left-0 top-0 h-screen w-64 z-30 p-md gap-lg">
      <Link href="/" className="font-headline-md text-headline-md text-on-surface px-sm pt-sm">
        Junel AI
      </Link>
      <NewChatLink />
      <nav className="flex-1 flex flex-col gap-xs">
        {JUNEL_NAV.map((item) => (
          <NavLink key={item.href} {...item} active={pathname === item.href} />
        ))}
      </nav>
    </aside>
  );
}

export function JunelMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden bg-surface-container-low nb-border border-b-0 border-l-0 border-r-0 fixed bottom-0 w-full z-40 flex justify-around items-center pt-xs px-sm h-[72px]">
      {JUNEL_NAV.map((item) => (
        <NavLink key={item.href} {...item} active={pathname === item.href} mobile />
      ))}
    </nav>
  );
}

export function JunelShell({ children }: { children: React.ReactNode }) {
  return (
    <JunelStoreProvider>
      <div className="bg-background text-on-background font-body-md antialiased min-h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container">
        <div className="flex h-screen pb-[72px] md:pb-0">
          <JunelSideNav />
          <div className="flex-1 min-w-0 w-full ml-0 md:ml-64 min-h-0 flex flex-col overflow-hidden">{children}</div>
        </div>
        <JunelMobileNav />
      </div>
    </JunelStoreProvider>
  );
}
