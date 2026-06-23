import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

type PersonalityCardProps = {
  id: string;
  label: string;
  icon: string;
  description: string;
  checked?: boolean;
  onSelect?: () => void;
};

export function PersonalityCard({ id, label, icon, description, checked, onSelect }: PersonalityCardProps) {
  return (
    <label className="relative block h-full cursor-pointer group">
      <input
        type="radio"
        name="personality"
        value={id}
        checked={checked}
        onChange={onSelect}
        className="sr-only"
      />
      <div
        className={cn(
          "h-full rounded-lg p-md transition-all nb-border",
          checked
            ? "bg-primary-container nb-shadow-md"
            : "bg-surface-container-lowest nb-shadow-sm hover:bg-surface-container-low",
        )}
      >
        <div className="flex justify-between items-start gap-sm mb-md">
          <div className="flex items-center gap-sm min-w-0">
            <Icon name={icon} className={cn("text-[22px] shrink-0", checked ? "text-on-primary-container" : "text-outline")} />
            <span className="font-label-bold text-label-bold text-on-surface">{label}</span>
          </div>
          <span
            className={cn(
              "w-8 h-8 rounded-lg nb-border flex items-center justify-center shrink-0 transition-colors",
              checked ? "bg-tertiary-container" : "bg-surface-container-lowest group-hover:bg-surface-container",
            )}
          >
            {checked ? <Icon name="check" className="text-on-tertiary-container text-lg font-bold" /> : null}
          </span>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">{description}</p>
      </div>
    </label>
  );
}
