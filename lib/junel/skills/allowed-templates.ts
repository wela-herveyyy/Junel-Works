/** Presets that work with Junel's remote HTTP erpnext MCP (no Cursor CLI / memory-lane files). */
export const ALLOWED_SKILL_TEMPLATES = new Set([
  "junel-erpnext",
  "erpnext-livro-task",
  "erpnext-leave-application",
  "erpnext-document-comment",
]);

export function isAllowedSkillTemplate(id: string) {
  return ALLOWED_SKILL_TEMPLATES.has(id);
}
