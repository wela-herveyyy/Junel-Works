"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { installTemplateSkill } from "@/lib/junel/skills/merge-templates";
import type { SkillTemplate } from "@/lib/junel/skills/types";
import type { JunelSkill } from "@/lib/junel/storage/types";

type SkillTemplateGalleryProps = {
  skills: JunelSkill[];
  onInstall: (nextSkills: JunelSkill[]) => void;
};

export function SkillTemplateGallery({ skills, onInstall }: SkillTemplateGalleryProps) {
  const [templates, setTemplates] = useState<SkillTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/skills/templates")
      .then((res) => (res.ok ? res.json() : { templates: [] }))
      .then((data: { templates?: SkillTemplate[] }) => {
        if (!cancelled) setTemplates(data.templates ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const installedIds = new Set(skills.map((skill) => skill.templateId).filter(Boolean));
  const available = templates.filter((template) => !installedIds.has(template.id));

  if (loading) {
    return <p className="font-body-sm text-body-sm text-on-surface-variant p-md">Loading templates from .cursor/skills…</p>;
  }

  if (!available.length) {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant p-md leading-relaxed">
        All project templates from <code className="font-mono-label text-mono-label">.cursor/skills/</code> are installed.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-sm p-md">
      {available.map((template) => (
        <div key={template.id} className="nb-card p-md nb-shadow-sm flex flex-col gap-sm min-w-0">
          <div className="flex items-start justify-between gap-sm">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-xs mb-xs">
                <h4 className="font-body-md text-body-md text-on-surface">{template.name}</h4>
                <Badge>Template</Badge>
                <Badge>{template.category}</Badge>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed line-clamp-3">{template.description}</p>
            </div>
          </div>
              <p className="font-mono-label text-mono-label text-on-surface-variant/80 truncate">.cursor/skills/{template.id}/</p>
          <Button
            type="button"
            size="sm"
            className="self-start rounded-full"
            onClick={() => onInstall(installTemplateSkill(skills, template))}
          >
            <Icon name="add" size={16} />
            Add skill
          </Button>
        </div>
      ))}
    </div>
  );
}
