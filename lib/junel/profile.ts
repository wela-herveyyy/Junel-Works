import type { ErpnextLink, UserProfile } from "@/lib/junel/storage/types";

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

export function profileEmailFromErp(profile: UserProfile, erpnext?: ErpnextLink) {
  return profile.email.trim() || erpnext?.email.trim() || erpnext?.user.trim() || "";
}

export function isJunelSessionReady(data: { profile: UserProfile; erpnext?: ErpnextLink }) {
  return Boolean(data.erpnext?.sid) && hasProfileName(data.profile);
}
