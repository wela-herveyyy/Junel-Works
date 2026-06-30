import type { ErpnextLink, UserProfile } from "@/lib/junel/storage/types";

function normalizeErpUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function hasProfileName(profile: UserProfile) {
  return Boolean(profile.displayName.trim());
}

/** Guess a friendly name from ERP username or email for the setup form. */
export function suggestDisplayName(erpUser?: string, email?: string) {
  const raw = erpUser?.trim() || email?.trim() || "";
  if (!raw) return "";

  const local = raw.includes("@") ? raw.split("@")[0] : raw;
  return local
    .replace(/[._-]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function erpSessionEmail(session: Pick<ErpnextLink, "email" | "user">) {
  return session.email.trim() || session.user.trim();
}

/** Prefer the live ERP session email over stale profile data. */
export function profileEmailFromErp(_profile: UserProfile, erpnext?: ErpnextLink) {
  if (!erpnext) return "";
  return erpSessionEmail(erpnext);
}

function erpAccountKey(erp: Pick<ErpnextLink, "url" | "user" | "email">) {
  return `${normalizeErpUrl(erp.url)}|${erp.user.trim()}|${erp.email.trim()}`;
}

/** Keep profile email (and org-specific fields) aligned with the signed-in ERP account. */
export function syncProfileFromErpLogin(
  profile: UserProfile,
  session: Pick<ErpnextLink, "url" | "email" | "user">,
  previousErp?: ErpnextLink,
): UserProfile {
  const email = erpSessionEmail(session);
  if (!email) return profile;

  const accountChanged =
    Boolean(previousErp?.sid) &&
    erpAccountKey(previousErp!) !== erpAccountKey({ url: session.url, user: session.user, email: session.email });
  const emailChanged = profile.email.trim() !== email;

  if (accountChanged || emailChanged) {
    return {
      ...profile,
      email,
      company: "",
      title: "",
      bio: "",
    };
  }

  return { ...profile, email };
}

export function isJunelSessionReady(data: { profile: UserProfile; erpnext?: ErpnextLink }) {
  return Boolean(data.erpnext?.sid) && hasProfileName(data.profile);
}
