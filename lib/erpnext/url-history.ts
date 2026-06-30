export const ERP_URL_HISTORY_KEY = "junel-erp-url-history";
const MAX_HISTORY = 10;

export function normalizeErpUrlInput(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function loadErpUrlHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ERP_URL_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const urls: string[] = [];
    for (const item of parsed) {
      if (typeof item !== "string") continue;
      const normalized = normalizeErpUrlInput(item);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      urls.push(normalized);
    }
    return urls.slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function rememberErpUrl(url: string): string[] {
  const normalized = normalizeErpUrlInput(url);
  if (!normalized || typeof window === "undefined") return loadErpUrlHistory();

  const next = [normalized, ...loadErpUrlHistory().filter((item) => item !== normalized)].slice(0, MAX_HISTORY);
  try {
    localStorage.setItem(ERP_URL_HISTORY_KEY, JSON.stringify(next));
  } catch {
    // ponytail: ignore private mode quota
  }
  return next;
}

export function pickInitialErpUrl(storedUrl?: string, history: string[] = loadErpUrlHistory()) {
  const fromSession = storedUrl ? normalizeErpUrlInput(storedUrl) : "";
  if (fromSession) return fromSession;
  return history[0] ?? "";
}
