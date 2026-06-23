import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

type SearchFieldProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> & {
  placeholder: string;
  className?: string;
};

export function SearchField({ placeholder, className, ...props }: SearchFieldProps) {
  return (
    <div className={cn("relative", className)}>
      <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant text-sm" />
      <input
        type="text"
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest nb-border rounded-xl py-sm pl-xl pr-md text-body-md text-on-surface font-body-md min-h-[56px] nb-focus placeholder-on-surface-variant transition-[box-shadow]"
        {...props}
      />
    </div>
  );
}
