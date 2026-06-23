import { loadSkillTemplates } from "@/lib/junel/skills/load-templates";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ templates: loadSkillTemplates() });
}
