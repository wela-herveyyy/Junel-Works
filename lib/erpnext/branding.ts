import { LIVRO_ERP_HOST } from "@/lib/erpnext/constants";
import type { ErpnextLink } from "@/lib/junel/storage/types";

export type SchoolRole = "teacher" | "student";

export type ErpBranding = {
  isLivro: boolean;
  schoolRole?: SchoolRole;
  /** Full name for sentences — e.g. "school management system" */
  productName: string;
  /** Compact label for chips and tight UI — e.g. "SMS" */
  shortName: string;
  signInTitle: string;
  connectedMessage: string;
  emailSourceLabel: string;
};

function normalizeErpUrl(url: string) {
  return url.trim().replace(/\/$/, "");
}

export function isLivroErpUrl(url?: string) {
  if (!url?.trim()) return false;
  try {
    return new URL(normalizeErpUrl(url)).hostname.toLowerCase() === LIVRO_ERP_HOST;
  } catch {
    return url.toLowerCase().includes(LIVRO_ERP_HOST);
  }
}

const STUDENT_ROLE = /\b(student|pupil|learner)\b/i;
const TEACHER_ROLE = /\b(teacher|instructor|faculty|educator|professor)\b/i;

export function classifySchoolRole(roles: string[] | undefined): SchoolRole | undefined {
  if (!roles?.length) return undefined;
  const normalized = roles.map((role) => role.trim()).filter(Boolean);
  if (normalized.some((role) => STUDENT_ROLE.test(role))) return "student";
  if (normalized.some((role) => TEACHER_ROLE.test(role))) return "teacher";
  return undefined;
}

const LIVRO_BRANDING: ErpBranding = {
  isLivro: true,
  productName: "ERPNext",
  shortName: "ERPNext",
  signInTitle: "Sign in to ERPNext",
  connectedMessage: "ERPNext is connected.",
  emailSourceLabel: "From ERPNext",
};

export function getErpBranding(erpnext?: Pick<ErpnextLink, "url" | "roles">): ErpBranding {
  if (!erpnext?.url?.trim() || isLivroErpUrl(erpnext.url)) {
    return LIVRO_BRANDING;
  }

  const schoolRole = classifySchoolRole(erpnext.roles);
  if (schoolRole) {
    return {
      isLivro: false,
      schoolRole,
      productName: "school management system",
      shortName: "SMS",
      signInTitle: "Sign in to your school",
      connectedMessage: "Your school management system is connected.",
      emailSourceLabel: "From SMS",
    };
  }

  return {
    isLivro: false,
    productName: "system",
    shortName: "system",
    signInTitle: "Sign in",
    connectedMessage: "Your system is connected.",
    emailSourceLabel: "From your account",
  };
}

export function erpBrandingContext(erpnext?: ErpnextLink): string | undefined {
  if (!erpnext?.url?.trim()) return undefined;
  const branding = getErpBranding(erpnext);
  const lines = [
    `Product naming: call this site "${branding.productName}" (short: "${branding.shortName}") in user-facing text.`,
    isLivroErpUrl(erpnext.url)
      ? "This is Livro ERPNext — ERPNext naming is correct."
      : 'Do not say "ERPNext" unless quoting a DocType or tool name.',
  ];
  if (branding.schoolRole) {
    lines.push(`User role on this site: ${branding.schoolRole}.`);
  }
  if (erpnext.roles?.length) {
    lines.push(`Frappe roles: ${erpnext.roles.join(", ")}`);
  }
  return lines.join("\n");
}
