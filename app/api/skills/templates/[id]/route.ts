import { loadSkillTemplates } from "@/lib/junel/skills/load-templates";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = loadSkillTemplates().find((item) => item.id === id);
  if (!template) {
    return Response.json({ error: "Template not found" }, { status: 404 });
  }
  return Response.json({ template });
}
