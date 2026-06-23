export type ParsedSkillMd = {
  name: string;
  description: string;
  content: string;
};

function parseFrontmatter(block: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let key = "";
  let value = "";

  for (const line of block.split("\n")) {
    const folded = line.match(/^(\w[\w-]*):\s*>\s*$/);
    if (folded) {
      key = folded[1];
      value = "";
      continue;
    }

    const inline = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (inline) {
      if (key) fields[key] = value.trim();
      key = inline[1];
      value = inline[2].trim();
      continue;
    }

    if (key && line.trim()) {
      value = value ? `${value} ${line.trim()}` : line.trim();
    }
  }

  if (key) fields[key] = value.trim();
  return fields;
}

export function parseSkillMd(raw: string, fallbackName: string): ParsedSkillMd {
  const trimmed = raw.replace(/^\uFEFF/, "").trim();
  const match = trimmed.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);

  if (match) {
    const fields = parseFrontmatter(match[1]);
    const body = match[2].trim();
    return {
      name: fields.name?.trim() || fallbackName,
      description: fields.description?.trim() || body.split("\n").find((line) => line.trim())?.replace(/^#+\s*/, "") || fallbackName,
      content: body,
    };
  }

  const nameMatch = trimmed.match(/^#\s+(.+)$/m);
  return {
    name: nameMatch?.[1]?.trim() || fallbackName,
    description: trimmed.split("\n").find((line) => line.trim() && !line.startsWith("#"))?.trim() || fallbackName,
    content: trimmed,
  };
}
