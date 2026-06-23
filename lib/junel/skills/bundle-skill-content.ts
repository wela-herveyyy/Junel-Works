import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { parseSkillMd } from "./parse-skill-md";

const JUNEL_MCP_NOTE = `> **Junel:** MCP server key is \`erpnext\` (remote HTTP + Bearer SID from ERP sign-in). Use \`get_user_profile\` via MCP — no local \`npm run\` auth scripts.`;

function readMarkdownFiles(dir: string, exclude = new Set(["SKILL.md"])) {
  try {
    return readdirSync(dir)
      .filter((name) => name.endsWith(".md") && !exclude.has(name))
      .sort()
      .map((name) => ({ name, text: readFileSync(join(dir, name), "utf8").trim() }));
  } catch {
    return [];
  }
}

function adaptForJunel(text: string) {
  return text
    .replace(/\buser-erpnext\b/g, "erpnext")
    .replace(/`CallMcpTool` on server `erpnext`/g, "the `erpnext` MCP server")
    .replace(/npm run setup-profile[^\n]*/g, "update via MCP `update_user_profile`")
    .replace(/npm run refresh-auth[^\n]*/g, "ask the user to sign out and sign in again in Junel")
    .replace(/npm run setup-sid[^\n]*/g, "sign in via Junel ERP login");
}

export function bundleSkillContent(skillDir: string, skillId: string, skillsRoot: string): string {
  const raw = readFileSync(join(skillDir, "SKILL.md"), "utf8");
  const parsed = parseSkillMd(raw, skillId);
  const parts: string[] = [parsed.content];

  for (const { name, text } of readMarkdownFiles(skillDir)) {
    parts.push(`## ${name.replace(/\.md$/, "")}\n\n${text}`);
  }

  const isErpPreset = skillId.startsWith("erpnext-") || skillId.startsWith("memory-lane");
  if (isErpPreset) {
    const sharedDir = join(skillsRoot, "_shared");
    for (const { name, text } of readMarkdownFiles(sharedDir)) {
      parts.push(`## Shared: ${name.replace(/\.md$/, "")}\n\n${text}`);
    }
    parts.unshift(JUNEL_MCP_NOTE);
  }

  return adaptForJunel(parts.join("\n\n---\n\n"));
}

export function parseSkillTemplate(skillDir: string, skillId: string, skillsRoot: string) {
  const raw = readFileSync(join(skillDir, "SKILL.md"), "utf8");
  const parsed = parseSkillMd(raw, skillId);
  return {
    name: parsed.name,
    description: parsed.description,
    content: bundleSkillContent(skillDir, skillId, skillsRoot),
  };
}
