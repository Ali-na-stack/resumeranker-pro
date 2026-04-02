import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      <div className="mb-5 text-muted-foreground/25">
        <Icon className="h-10 w-10" />
      </div>
      <h3 className="font-display text-lg font-medium text-foreground/80 mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-6">{subtitle}</p>
      {children}
    </div>
  );
}
