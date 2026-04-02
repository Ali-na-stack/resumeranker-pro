import { Users, Star, AlertCircle, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import type { CandidateWithScore } from "@/lib/api";

interface StatsSummaryProps {
  candidates: CandidateWithScore[];
}

function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 600;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display}{suffix}</>;
}

export function StatsSummary({ candidates }: StatsSummaryProps) {
  const total = candidates.length;
  const strongMatches = candidates.filter((c) => (c.score?.overall_score || 0) >= 75).length;
  const needsReview = candidates.filter((c) => {
    const s = c.score?.overall_score || 0;
    return s >= 40 && s < 75;
  }).length;
  const avgScore =
    total > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + (c.score?.overall_score || 0), 0) / total
        )
      : 0;

  const stats = [
    { label: "Uploaded", value: total, icon: Users, borderColor: "border-t-primary/50" },
    { label: "Strong Matches", value: strongMatches, icon: Star, borderColor: "border-t-[hsl(var(--success))]" },
    { label: "Needs Review", value: needsReview, icon: AlertCircle, borderColor: "border-t-[hsl(var(--warning))]" },
    { label: "Avg Fit Score", value: avgScore, icon: TrendingUp, borderColor: "border-t-primary/50", suffix: "%" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`surface-elevated border-t-2 ${stat.borderColor} p-4 transition-colors duration-200`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{stat.label}</p>
          </div>
          <p className="text-2xl font-display font-bold tracking-tight">
            <AnimatedNumber value={stat.value} suffix={stat.suffix} />
          </p>
        </div>
      ))}
    </div>
  );
}
