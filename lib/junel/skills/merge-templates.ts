import type { JunelSkill } from "@/lib/junel/storage/types";
import type { SkillTemplate } from "./types";

export function slugId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function templateToSkill(template: SkillTemplate, enabled = false): JunelSkill {
  return {
    id: slugId(template.id),
    templateId: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    content: template.content,
    enabled,
  };
}

const DEFAULT_ENABLED_TEMPLATES = new Set(["junel-erpnext", "erpnext-livro-task"]);

export function pruneRemovedTemplateSkills(skills: JunelSkill[], templates: SkillTemplate[]): JunelSkill[] {
  const validIds = new Set(templates.map((template) => template.id));
  return skills.filter((skill) => !skill.templateId || validIds.has(skill.templateId));
}

export function mergeMissingTemplateSkills(skills: JunelSkill[], templates: SkillTemplate[]): JunelSkill[] {
  const pruned = pruneRemovedTemplateSkills(skills, templates);
  if (!templates.length) return pruned;

  const existingTemplateIds = new Set(pruned.map((skill) => skill.templateId).filter(Boolean));
  const next = [...pruned];

  for (const template of templates) {
    if (existingTemplateIds.has(template.id)) continue;
    next.push(templateToSkill(template, DEFAULT_ENABLED_TEMPLATES.has(template.id)));
  }

  return next;
}
export function installTemplateSkill(skills: JunelSkill[], template: SkillTemplate): JunelSkill[] {
  if (skills.some((skill) => skill.templateId === template.id)) return skills;
  return [...skills, templateToSkill(template, true)];
}
