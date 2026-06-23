import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isAllowedSkillTemplate } from "./allowed-templates";
import { parseSkillTemplate } from "./bundle-skill-content";
import type { SkillTemplate } from "./types";

function templateCategory(id: string) {
  return "ERPNext";
}

export function loadSkillTemplates(): SkillTemplate[] {
  const root = join(process.cwd(), ".cursor", "skills");
  let entries: string[];
  try {
    entries = readdirSync(root);
  } catch {
    return [];
  }

  const templates: SkillTemplate[] = [];

  for (const entry of entries) {
    if (entry.startsWith("_") || !isAllowedSkillTemplate(entry)) continue;

    const dir = join(root, entry);
    if (!statSync(dir).isDirectory()) continue;

    const skillPath = join(dir, "SKILL.md");
    try {
      statSync(skillPath);
      const parsed = parseSkillTemplate(dir, entry, root);
      templates.push({
        id: entry,
        name: parsed.name,
        description: parsed.description,
        category: templateCategory(entry),
        content: parsed.content,
      });
    } catch {
      continue;
    }
  }

  return templates.sort((a, b) => {
    const cat = a.category.localeCompare(b.category);
    return cat !== 0 ? cat : a.name.localeCompare(b.name);
  });
}
