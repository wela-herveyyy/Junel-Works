import { cn } from "@/lib/utils/cn";

type IconProps = {
  name: string;
  className?: string;
  filled?: boolean;
  size?: number;
};

export function Icon({ name, className, filled, size }: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", className)}
      style={{
        fontSize: size,
        fontVariationSettings: filled ? "'FILL' 1" : undefined,
      }}
    >
      {name}
    </span>
  );
}
