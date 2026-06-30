import type { ErpnextLink, UserProfile } from "@/lib/junel/storage/types";

function normalizeErpUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

/** Stable key for ERP site + login email — used to re-prompt name when either changes. */
export function profileIdentityKey(erp: Pick<ErpnextLink, "url" | "email" | "user">) {
  return `${normalizeErpUrl(erp.url)}|${erpSessionEmail(erp)}`;
}

export function hasProfileName(profile: UserProfile) {
  return Boolean(profile.displayName.trim());
}

export function isProfileNameBound(data: { profile: UserProfile; erpnext?: ErpnextLink }) {
  if (!data.erpnext?.url?.trim() || !hasProfileName(data.profile)) return false;
  const bound = data.profile.nameBoundTo?.trim();
  if (!bound) return false;
  return bound === profileIdentityKey(data.erpnext);
}

export function needsProfileSetup(data: { profile: UserProfile; erpnext?: ErpnextLink }) {
  return Boolean(data.erpnext?.sid) && !isProfileNameBound(data);
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

export function bindProfileName(
  profile: UserProfile,
  erpnext: ErpnextLink,
  displayName: string,
  title?: string,
): UserProfile {
  return {
    ...profile,
    displayName: displayName.trim(),
    title: title?.trim() ?? profile.title,
    email: erpSessionEmail(erpnext),
    nameBoundTo: profileIdentityKey(erpnext),
  };
}

/** Keep profile aligned with ERP session; clear name when site or email changes. */
export function syncProfileFromErpLogin(
  profile: UserProfile,
  session: Pick<ErpnextLink, "url" | "email" | "user">,
  previousErp?: ErpnextLink,
): UserProfile {
  const email = erpSessionEmail(session);
  if (!email) return profile;

  const currentIdentity = profileIdentityKey(session);
  const identityChanged = profile.nameBoundTo?.trim()
    ? profile.nameBoundTo.trim() !== currentIdentity
    : false;
  const accountChanged =
    Boolean(previousErp?.sid) &&
    erpAccountKey(previousErp!) !== erpAccountKey({ url: session.url, user: session.user, email: session.email });
  const emailChanged = profile.email.trim() !== email;

  if (accountChanged || emailChanged || identityChanged) {
    return {
      ...profile,
      email,
      displayName: "",
      nameBoundTo: "",
      company: "",
      title: "",
      bio: "",
    };
  }

  return { ...profile, email };
}

/** One-time bind for profiles saved before nameBoundTo existed. */
export function migrateProfileIdentity(profile: UserProfile, erpnext?: ErpnextLink): UserProfile {
  if (!erpnext?.url?.trim()) return profile;
  if (!hasProfileName(profile) || profile.nameBoundTo?.trim()) return profile;
  return { ...profile, nameBoundTo: profileIdentityKey(erpnext) };
}

export function ensureProfileIdentity(profile: UserProfile, erpnext?: ErpnextLink): UserProfile {
  if (!erpnext?.url?.trim()) return profile;

  let next = migrateProfileIdentity(profile, erpnext);
  if (!next.nameBoundTo?.trim()) return next;
  if (next.nameBoundTo.trim() === profileIdentityKey(erpnext)) return next;

  return {
    ...next,
    email: erpSessionEmail(erpnext),
    displayName: "",
    nameBoundTo: "",
    company: "",
    title: "",
    bio: "",
  };
}

export function isJunelSessionReady(data: { profile: UserProfile; erpnext?: ErpnextLink }) {
  return Boolean(data.erpnext?.sid) && isProfileNameBound(data);
}
