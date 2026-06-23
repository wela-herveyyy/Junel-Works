import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";

type RuleRowProps = {
  name: string;
  preview: string;
  scope: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function RuleRow({ name, preview, scope, enabled = true, onToggle, onEdit, onDelete }: RuleRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-md p-md border-b-4 border-black/10 last:border-0 hover:bg-surface-container-low transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-sm mb-xs">
          <h4 className="font-body-md text-body-md text-on-surface">{name}</h4>
          <Badge tone="primary">{scope}</Badge>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{preview}</p>
      </div>
      <div className="flex items-center gap-sm shrink-0">
        <Switch checked={enabled} onCheckedChange={onToggle} />
        {onEdit ? (
          <Button type="button" variant="ghost" size="icon" className="h-auto w-auto p-sm text-on-surface-variant hover:text-on-surface" onClick={onEdit}>
            <Icon name="edit" size={18} />
          </Button>
        ) : null}
        {onDelete ? (
          <Button type="button" variant="ghost" size="icon" className="h-auto w-auto p-sm text-on-surface-variant hover:text-error" onClick={onDelete}>
            <Icon name="delete" size={18} />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
