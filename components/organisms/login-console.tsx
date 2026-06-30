"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ErpnextLoginForm } from "@/components/molecules/erpnext-login-form";
import { Icon } from "@/components/ui/icon";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import { isErpnextLoggedIn } from "@/lib/erpnext/mcp-config";
import { getErpBranding } from "@/lib/erpnext/branding";
import { needsProfileSetup } from "@/lib/junel/profile";

export function LoginConsole() {
  const router = useRouter();
  const { data, ready, persist } = useJunelStore();

  useEffect(() => {
    if (ready && data && isErpnextLoggedIn(data) && !needsProfileSetup(data)) {
      router.replace("/");
    }
  }, [ready, data, router]);

  if (!ready || !data) {
    return <p className="font-body-sm text-body-sm text-on-surface-variant">Loading...</p>;
  }

  if (isErpnextLoggedIn(data) && !needsProfileSetup(data)) {
    return null;
  }

  const branding = getErpBranding(data.erpnext);

  return (
    <div className="w-full min-w-[min(100%,20rem)] max-w-112 nb-card p-lg">
      <div className="mb-lg text-center min-w-0">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary-container nb-border nb-shadow-sm mb-sm">
          <Icon name="lock" className="text-on-primary-container text-3xl" />
        </div>
        <h1 className="font-headline-md text-headline-md text-on-surface mb-xs">{branding.signInTitle}</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Login required before you can chat with Junel.
        </p>
      </div>
      <ErpnextLoginForm
        compact
        erpUrl={data.erpnext?.url}
        email={data.erpnext?.email}
        store={{ mcp: data.mcp, profile: data.profile, erpnext: data.erpnext }}
        onSuccess={(patch) => {
          persist((prev) => ({ ...prev, ...patch }));
          router.replace("/");
        }}
      />
    </div>
  );
}
