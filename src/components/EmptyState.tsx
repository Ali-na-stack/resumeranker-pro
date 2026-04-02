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
      <div className="relative mb-6">
        {/* Decorative background layers */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--primary)/0.1)] to-[hsl(var(--accent)/0.1)] scale-150 blur-xl" />
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[hsl(var(--primary)/0.05)] to-[hsl(var(--accent)/0.05)] scale-125" />
        <div className="relative rounded-2xl bg-gradient-to-br from-[hsl(var(--primary)/0.12)] to-[hsl(var(--accent)/0.08)] p-6 shadow-lg shadow-[hsl(var(--primary)/0.1)]">
          <Icon className="h-10 w-10 text-primary" />
        </div>
      </div>
      <h3 className="font-display text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm max-w-md mb-6">{subtitle}</p>
      {children}
    </div>
  );
}
