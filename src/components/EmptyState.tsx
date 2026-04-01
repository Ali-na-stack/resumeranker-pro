import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-primary/10 p-5 mb-5">
        <Icon className="h-10 w-10 text-primary" />
      </div>
      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{subtitle}</p>
      {children}
    </div>
  );
}
