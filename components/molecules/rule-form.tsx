"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { JunelRule } from "@/lib/junel/storage/types";
import { randomId } from "@/lib/utils/random-id";

type RuleFormProps = {
  initial?: JunelRule;
  onSave: (rule: JunelRule) => void;
  onCancel: () => void;
};

export function RuleForm({ initial, onSave, onCancel }: RuleFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [preview, setPreview] = useState(initial?.preview ?? "");
  const [scope, setScope] = useState(initial?.scope ?? "Always");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !preview.trim()) return;
    onSave({
      id: initial?.id ?? randomId(),
      name: name.trim(),
      preview: preview.trim(),
      scope: scope.trim() || "Always",
      enabled: initial?.enabled ?? true,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-lg border-b-4 border-black flex flex-col gap-md bg-surface-container-low">
      <label className="flex flex-col gap-xs font-body-sm text-body-sm text-on-surface-variant">
        Rule name
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="nb-input min-h-[56px] font-body-md"
        />
      </label>
      <label className="flex flex-col gap-xs font-body-sm text-body-sm text-on-surface-variant">
        Instruction
        <textarea
          required
          value={preview}
          onChange={(e) => setPreview(e.target.value)}
          rows={3}
          className="nb-input min-h-[120px] font-body-md resize-y"
        />
      </label>
      <label className="flex flex-col gap-xs font-body-sm text-body-sm text-on-surface-variant">
        Scope
        <input
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="nb-input min-h-[56px] font-body-md"
        />
      </label>
      <div className="flex gap-sm justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save Rule</Button>
      </div>
    </form>
  );
}
