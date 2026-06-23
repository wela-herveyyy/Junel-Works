"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { mergeMissingTemplateSkills } from "@/lib/junel/skills/merge-templates";
import type { SkillTemplate } from "@/lib/junel/skills/types";
import { JUNEL_STORAGE_KEY, clearChatHistory, loadStorage, saveStorage } from "@/lib/junel/storage/store";
import type { JunelStorage } from "@/lib/junel/storage/types";

type JunelStoreContextValue = {
  data: JunelStorage | null;
  ready: boolean;
  persist: (updater: (prev: JunelStorage) => JunelStorage) => void;
  clearChat: () => void;
};

const JunelStoreContext = createContext<JunelStoreContextValue | null>(null);

async function fetchSkillTemplates(): Promise<SkillTemplate[]> {
  try {
    const res = await fetch("/api/skills/templates");
    if (!res.ok) return [];
    const data = (await res.json()) as { templates?: SkillTemplate[] };
    return data.templates ?? [];
  } catch {
    return [];
  }
}

export function JunelStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<JunelStorage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const stored = loadStorage();
      const templates = await fetchSkillTemplates();
      const merged = templates.length
        ? { ...stored, skills: mergeMissingTemplateSkills(stored.skills, templates) }
        : stored;

      if (cancelled) return;

      if (merged !== stored) saveStorage(merged);
      setData(merged);
      setReady(true);
    }

    void bootstrap();

    const onStorage = (event: StorageEvent) => {
      if (event.key === JUNEL_STORAGE_KEY) setData(loadStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = useCallback((updater: (prev: JunelStorage) => JunelStorage) => {
    setData((prev) => {
      const base = prev ?? loadStorage();
      const next = updater(base);
      saveStorage(next);
      return next;
    });
  }, []);

  const clearChat = useCallback(() => {
    persist((prev) => clearChatHistory(prev));
  }, [persist]);

  const value = useMemo(() => ({ data, ready, persist, clearChat }), [data, ready, persist, clearChat]);

  return <JunelStoreContext.Provider value={value}>{children}</JunelStoreContext.Provider>;
}

export function useJunelStore() {
  const context = useContext(JunelStoreContext);
  if (!context) {
    throw new Error("useJunelStore must be used within JunelStoreProvider");
  }
  return context;
}
