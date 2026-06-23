import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Switch } from "@/components/ui/switch";

type SkillRowProps = {
  name: string;
  description: string;
  category?: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
};

export function SkillRow({ name, description, category, enabled = false, onToggle }: SkillRowProps) {
  return (
    <div className="flex items-center justify-between gap-md p-md border-b-4 border-black/10 last:border-0 hover:bg-surface-container-low transition-colors">
      <div className="flex items-center gap-md min-w-0">
        <div className="w-12 h-12 rounded-lg bg-primary-container nb-border nb-shadow-sm flex items-center justify-center shrink-0">
          <Icon name="extension" className="text-on-primary-container" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-sm mb-xs">
            <h4 className="font-body-md text-body-md text-on-surface">{name}</h4>
            {category ? <Badge>{category}</Badge> : null}
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
      <Switch checked={enabled} onCheckedChange={onToggle} />
    </div>
  );
}
