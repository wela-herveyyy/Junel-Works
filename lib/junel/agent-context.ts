import type { Contact, JunelRule, JunelSettings, JunelSkill, UserProfile } from "@/lib/junel/storage/types";

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
) {
  const parts: string[] = [];

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
        parts.push(`### Skill: ${skill.name}\n${skill.description}\n\n${skill.content.trim()}`);
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
