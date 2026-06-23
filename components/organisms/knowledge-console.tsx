"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { McpJsonEditor } from "@/components/molecules/mcp-json-editor";
import { RuleForm } from "@/components/molecules/rule-form";
import { RuleRow } from "@/components/molecules/rule-row";
import { SearchField } from "@/components/molecules/search-field";
import { SkillRow } from "@/components/molecules/skill-row";
import { SkillTemplateGallery } from "@/components/molecules/skill-template-gallery";
import { useJunelStore } from "@/components/providers/junel-store-provider";
import type { JunelRule } from "@/lib/junel/storage/types";

function SetupSection({
  icon,
  title,
  description,
  action,
  children,
}: {
  icon: string;
  title: string;
  description: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="nb-card flex flex-col min-w-0 w-full">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-md p-lg border-b-4 border-black">
        <div className="min-w-0">
          <div className="flex items-center gap-sm mb-xs">
            <Icon name={icon} className="text-secondary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant max-w-168 leading-relaxed">{description}</p>
        </div>
        {action}
      </div>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function KnowledgeConsole() {
  const { data, ready, persist } = useJunelStore();
  const [query, setQuery] = useState("");
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<JunelRule>();

  if (!ready || !data) {
    return <main className="flex-1 min-h-0 w-full overflow-y-auto custom-scrollbar p-lg text-on-surface-variant">Loading...</main>;
  }

  const q = query.trim().toLowerCase();
  const rules = data.rules.filter((rule) => !q || rule.name.toLowerCase().includes(q) || rule.preview.toLowerCase().includes(q));
  const skills = data.skills.filter((skill) => !q || skill.name.toLowerCase().includes(q) || skill.description.toLowerCase().includes(q));

  function saveRule(rule: JunelRule) {
    persist((prev) => ({
      ...prev,
      rules: prev.rules.some((item) => item.id === rule.id)
        ? prev.rules.map((item) => (item.id === rule.id ? rule : item))
        : [...prev.rules, rule],
    }));
    setShowRuleForm(false);
    setEditingRule(undefined);
  }

  return (
    <main className="flex-1 min-h-0 w-full overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="flex-1 w-full min-w-0 px-margin-mobile md:px-margin-desktop pt-lg pb-2xl max-w-[1200px] mx-auto">
        <SearchField
          placeholder="Search rules and skills..."
          className="w-full mb-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="mb-xl w-full min-w-0">
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-xs">
            Knowledge Base
          </h2>
          <p className="w-full min-w-0 max-w-168 font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Rules, skills, and MCP config. Saved in your browser and sent to the agent when you chat.
          </p>
        </div>

        <div className="flex flex-col gap-lg w-full min-w-0">
          <SetupSection
            icon="rule"
            title="Rules"
            description="Always-on instructions that guide Junel in every conversation."
            action={
              <Button type="button" className="rounded-full flex items-center gap-xs shrink-0" onClick={() => { setEditingRule(undefined); setShowRuleForm(true); }}>
                <Icon name="add" size={18} />
                Add Rule
              </Button>
            }
          >
            {(showRuleForm && !editingRule) || editingRule ? (
              <RuleForm
                key={editingRule?.id ?? "new-rule"}
                initial={editingRule}
                onSave={saveRule}
                onCancel={() => { setShowRuleForm(false); setEditingRule(undefined); }}
              />
            ) : null}
            {rules.map((rule) => (
              <RuleRow
                key={rule.id}
                {...rule}
                onToggle={(enabled) => persist((prev) => ({ ...prev, rules: prev.rules.map((item) => (item.id === rule.id ? { ...item, enabled } : item)) }))}
                onEdit={() => setEditingRule(rule)}
                onDelete={() => persist((prev) => ({ ...prev, rules: prev.rules.filter((item) => item.id !== rule.id) }))}
              />
            ))}
          </SetupSection>

          <SetupSection
            icon="extension"
            title="Skills"
            description="Cursor-style SKILL.md templates from .cursor/skills — toggle on to inject full instructions into every chat."
          >
            {skills.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant p-md">No skills installed yet. Add a template below.</p>
            ) : (
              skills.map((skill) => (
                <SkillRow
                  key={skill.id}
                  {...skill}
                  onToggle={(enabled) => persist((prev) => ({ ...prev, skills: prev.skills.map((item) => (item.id === skill.id ? { ...item, enabled } : item)) }))}
                />
              ))
            )}
          </SetupSection>

          <SetupSection
            icon="library_books"
            title="Skill Templates"
            description="ERPNext MCP presets that work in Junel (tasks, leave, comments)."
          >
            <SkillTemplateGallery
              skills={data.skills}
              onInstall={(nextSkills) => persist((prev) => ({ ...prev, skills: nextSkills }))}
            />
          </SetupSection>

          <SetupSection
            icon="hub"
            title="MCP Connections"
            description="ERPNext is configured at sign-in. Add other servers here if needed."
          >
            <McpJsonEditor
              value={data.mcp}
              onSave={(mcp) => persist((prev) => ({ ...prev, mcp }))}
            />
          </SetupSection>
        </div>
      </div>
    </main>
  );
}
