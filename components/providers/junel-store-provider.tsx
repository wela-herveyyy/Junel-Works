"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { JUNEL_STORAGE_KEY, clearChatHistory, loadStorage, saveStorage } from "@/lib/junel/storage/store";
import type { JunelStorage } from "@/lib/junel/storage/types";

type JunelStoreContextValue = {
  data: JunelStorage | null;
  ready: boolean;
  persist: (updater: (prev: JunelStorage) => JunelStorage) => void;
  clearChat: () => void;
};

const JunelStoreContext = createContext<JunelStoreContextValue | null>(null);

export function JunelStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<JunelStorage | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setData(loadStorage());
    setReady(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key === JUNEL_STORAGE_KEY) setData(loadStorage());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
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
