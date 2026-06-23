"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { listMcpServerKeys, parseMcpServersJson } from "@/lib/junel/mcp";
import { DEFAULT_MCP_SERVERS_JSON } from "@/lib/junel/storage/store";
import type { JunelMcpState } from "@/lib/junel/storage/types";

type McpJsonEditorProps = {
  value: JunelMcpState;
  onSave: (next: JunelMcpState) => void;
};

export function McpJsonEditor({ value, onSave }: McpJsonEditorProps) {
  const [draft, setDraft] = useState(value.serversJson);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setDraft(value.serversJson);
    setError(undefined);
  }, [value.serversJson]);

  const savedKeys = listMcpServerKeys(value);
  const draftParsed = parseMcpServersJson(draft);

  function handleSave(enableAll = false) {
    const result = parseMcpServersJson(draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    const serversJson = JSON.stringify(result.servers, null, 2);
    const keys = Object.keys(result.servers);
    onSave({
      serversJson,
      enabledKeys: enableAll ? keys : value.enabledKeys.filter((key) => keys.includes(key)),
    });
    setDraft(serversJson);
    setError(undefined);
  }

  function toggleKey(key: string, enabled: boolean) {
    const enabledKeys = enabled
      ? [...new Set([...value.enabledKeys, key])]
      : value.enabledKeys.filter((item) => item !== key);
    onSave({ ...value, enabledKeys });
  }

  return (
    <div className="p-lg flex flex-col gap-md">
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        MCP servers as JSON — same shape as{" "}
        <code className="font-mono-label text-mono-label text-secondary font-bold">~/.cursor/mcp.json</code>{" "}
        (<code className="font-mono-label text-mono-label">{"{ \"mcpServers\": { ... } }"}</code> or server map only).
      </p>

      <textarea
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setError(undefined);
        }}
        spellCheck={false}
        rows={20}
        className="w-full nb-input font-mono-label text-mono-label leading-relaxed resize-y min-h-[320px]"
      />

      {error ? <p className="font-body-sm text-body-sm text-error">{error}</p> : null}
      {!draftParsed.ok && draft.trim() ? (
        <p className="font-body-sm text-body-sm text-error">{draftParsed.error}</p>
      ) : null}

      <div className="flex flex-wrap gap-sm">
        <Button type="button" onClick={() => handleSave(false)}>
          Save JSON
        </Button>
        <Button type="button" variant="outline" onClick={() => handleSave(true)}>
          Save & enable all
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setDraft(DEFAULT_MCP_SERVERS_JSON);
            setError(undefined);
          }}
        >
          Reset template
        </Button>
      </div>

      {savedKeys.length ? (
        <div className="border-t-4 border-black pt-md flex flex-col gap-sm">
          <h4 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
            Enabled for agent (saved config)
          </h4>
          {savedKeys.map((key) => (
            <div key={key} className="flex items-center justify-between gap-md py-sm border-b border-outline-variant/5 last:border-0">
              <code className="font-mono-label text-mono-label text-on-surface">{key}</code>
              <Switch checked={value.enabledKeys.includes(key)} onCheckedChange={(checked) => toggleKey(key, checked)} />
            </div>
          ))}
        </div>
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">Save valid JSON to enable servers.</p>
      )}
    </div>
  );
}
