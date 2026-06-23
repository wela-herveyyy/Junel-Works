export const JUNEL_NAV = [
  { href: "/", label: "Dashboard", mobileLabel: "", icon: "dashboard" },
  { href: "/productivity", label: "Productivity", mobileLabel: "", icon: "event_available" },
  { href: "/knowledge", label: "Knowledge", mobileLabel: "", icon: "auto_stories" },
  { href: "/settings", label: "Settings", mobileLabel: "", icon: "settings" },
] as const;

export const KNOWLEDGE_RULES = [
  {
    name: "Keep answers concise",
    preview: "Prefer short replies and bullet points unless I ask for more detail.",
    scope: "Always",
    enabled: true,
  },
  {
    name: "Match project style",
    preview: "Follow the conventions already in the codebase. Keep changes small and focused.",
    scope: "Always",
    enabled: true,
  },
  {
    name: "Protect sensitive info",
    preview: "Never share API keys, passwords, or private credentials in chat.",
    scope: "Always",
    enabled: true,
  },
] as const;

export const KNOWLEDGE_SKILLS = [] as const;

export const PERSONALITIES = [
  { id: "professional", label: "Professional", icon: "work", description: "Formal, structured, and focused on delivering precise information without fluff." },
  { id: "friendly", label: "Friendly", icon: "sentiment_satisfied", description: "Approachable and conversational. Uses warmer language and occasional emojis." },
  { id: "concise", label: "Concise", icon: "short_text", description: "Extremely brief. Provides bullet points and bottom-line answers instantly." },
];
