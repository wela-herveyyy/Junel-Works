"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ProfileSetupConsole } from "@/components/organisms/profile-setup-console";
import { Icon } from "@/components/ui/icon";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { isErpnextLoggedIn } from "@/lib/erpnext/mcp-config";
import { hasProfileName, profileEmailFromErp } from "@/lib/junel/profile";

export function JunelAppGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data, ready, persist } = useJunelStore();

  useEffect(() => {
    if (ready && data && !isErpnextLoggedIn(data)) {
      router.replace("/login");
    }
  }, [ready, data, router]);

  if (!ready || !data) {
    return (
      <main className="flex flex-1 min-h-0 items-center justify-center text-on-surface-variant chat-bg">
        <div className="flex flex-col items-center gap-md">
          <Icon name="smart_toy" className="text-primary-container text-4xl animate-pulse" />
          <p className="font-body-md text-body-md">Loading Junel…</p>
        </div>
      </main>
    );
  }

  if (!isErpnextLoggedIn(data)) {
    return (
      <main className="flex flex-1 min-h-0 items-center justify-center text-on-surface-variant chat-bg">
        Redirecting to sign in…
      </main>
    );
  }

  if (!hasProfileName(data.profile)) {
    return (
      <ProfileSetupConsole
        data={data}
        onSave={(displayName, title) => {
          persist((prev) => ({
            ...prev,
            profile: {
              ...prev.profile,
              displayName,
              title: title || prev.profile.title,
              email: profileEmailFromErp(prev.profile, prev.erpnext),
            },
          }));
        }}
      />
    );
  }

  return children;
}
