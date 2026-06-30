import { erpBrandingContext, getErpBranding } from "@/lib/erpnext/branding";
import type { Contact, ErpnextLink, JunelRule, JunelSettings, JunelSkill, UserProfile } from "@/lib/junel/storage/types";

const LEGACY_ERP_HOST = "erp.livro.systems";

function normalizeErpBase(url: string) {
  return url.trim().replace(/\/$/, "");
}

/** Replace Livro example URLs baked into skill templates with the signed-in site. */
export function adaptSkillContentForErp(content: string, erpBaseUrl?: string) {
  if (!erpBaseUrl?.trim()) return content;
  const base = normalizeErpBase(erpBaseUrl);
  const host = base.replace(/^https?:\/\//i, "");
  return content
    .replace(/https:\/\/erp\.livro\.systems/gi, base)
    .replace(/\berp\.livro\.systems\b/gi, host);
}

function erpSessionContext(erpnext?: ErpnextLink) {
  if (!erpnext?.url?.trim()) return undefined;
  const base = normalizeErpBase(erpnext.url);
  const branding = getErpBranding(erpnext);
  const lines = [
    `${branding.productName} session (authoritative — use for all MCP calls and every link you output):`,
    `- Site: ${base}`,
    `- Logged-in user: ${erpnext.user}`,
    `- Desk link pattern: ${base}/app/{doctype-slug}/{document-name}`,
    `Do not use ${LEGACY_ERP_HOST} or any other host unless it exactly matches Site above.`,
  ];
  const naming = erpBrandingContext(erpnext);
  if (naming) lines.push(naming);
  return lines.join("\n");
}

const PERSONALITY_HINTS: Record<string, string> = {
  professional: "Formal, structured, precise — no fluff.",
  friendly: "Warm, approachable, conversational.",
  concise: "Extremely brief — bullet points and bottom-line answers.",
};

function profileContext(profile: UserProfile) {
  const lines = [
    profile.displayName && `Name: ${profile.displayName}`,
    profile.email && `Email: ${profile.email}`,
    profile.title && `Title: ${profile.title}`,
    profile.company && `Company: ${profile.company}`,
    profile.timezone && `Timezone: ${profile.timezone}`,
    profile.bio && `Bio: ${profile.bio}`,
  ].filter(Boolean);

  return lines.length ? ["User profile:", ...lines].join("\n") : undefined;
}

function contactsContext(contacts: Contact[]) {
  if (!contacts.length) return undefined;
  return [
    "User contacts:",
    ...contacts.map((contact) => {
      const parts = [contact.name];
      if (contact.email) parts.push(`<${contact.email}>`);
      if (contact.company) parts.push(`@ ${contact.company}`);
      if (contact.phone) parts.push(`tel: ${contact.phone}`);
      if (contact.notes) parts.push(`— ${contact.notes}`);
      return `- ${parts.join(" ")}`;
    }),
  ].join("\n");
}

export function buildAgentContext(
  profile: UserProfile,
  contacts: Contact[],
  rules: JunelRule[],
  skills: JunelSkill[],
  settings: JunelSettings,
  erpnext?: ErpnextLink,
) {
  const parts: string[] = [];

  const erpLine = erpSessionContext(erpnext);
  if (erpLine) parts.push(erpLine);

  const profileLine = profileContext(profile);
  if (profileLine) parts.push(profileLine);

  const contactsLine = contactsContext(contacts);
  if (contactsLine) parts.push(contactsLine);

  const enabledRules = rules.filter((rule) => rule.enabled);
  if (enabledRules.length) {
    parts.push(
      "Follow these user rules:",
      ...enabledRules.map((rule) => `- ${rule.name}: ${rule.preview}`),
    );
  }

  const enabledSkills = skills.filter((skill) => skill.enabled);
  if (enabledSkills.length) {
    parts.push("These Cursor-style skills are enabled — follow their instructions:");
    for (const skill of enabledSkills) {
      if (skill.content?.trim()) {
        const content = adaptSkillContentForErp(skill.content.trim(), erpnext?.url);
        parts.push(`### Skill: ${skill.name}\n${skill.description}\n\n${content}`);
      } else {
        parts.push(`- ${skill.name}: ${skill.description}`);
      }
    }
  }

  if (settings.personality) {
    const hint = PERSONALITY_HINTS[settings.personality] ?? settings.personality;
    parts.push(`Preferred communication style: ${hint}`);
  }

  if (settings.proactiveMode) {
    parts.push("Proactive mode is enabled — suggest helpful next steps when appropriate.");
  }

  parts.push("Format assistant replies in Markdown when helpful (headings, lists, code blocks).");

  return parts.length ? parts.join("\n\n") : undefined;
}
