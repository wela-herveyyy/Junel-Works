import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("px-margin-mobile md:px-margin-desktop py-lg flex justify-between items-end border-b-4 border-black bg-surface-container-low", className)}>
      <div>
        <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">{title}</h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-unit">{description}</p>
      </div>
      {actions}
    </header>
  );
}
