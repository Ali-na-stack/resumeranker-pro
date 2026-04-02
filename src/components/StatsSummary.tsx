import { Users, Star, XCircle, TrendingUp } from "lucide-react";
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
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const rejected = candidates.filter((c) => c.status === "rejected").length;
  const avgScore =
    total > 0
      ? Math.round(
          candidates.reduce((sum, c) => sum + (c.score?.overall_score || 0), 0) / total
        )
      : 0;

  const stats = [
    { label: "Total", value: total, icon: Users, color: "text-primary", gradient: "from-[hsl(var(--primary)/0.08)] to-[hsl(var(--primary)/0.02)]" },
    { label: "Shortlisted", value: shortlisted, icon: Star, color: "text-success", gradient: "from-[hsl(var(--success)/0.08)] to-[hsl(var(--success)/0.02)]" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-destructive", gradient: "from-[hsl(var(--destructive)/0.08)] to-[hsl(var(--destructive)/0.02)]" },
    { label: "Avg Score", value: avgScore, icon: TrendingUp, color: "text-accent", gradient: "from-[hsl(var(--accent)/0.08)] to-[hsl(var(--accent)/0.02)]", suffix: "%" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`flex items-center gap-3 rounded-lg border bg-gradient-to-br ${stat.gradient} p-4 hover-lift`}
        >
          <div className={`rounded-lg bg-card p-2.5 shadow-sm ${stat.color}`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
            <p className="text-xl font-display font-bold">
              <AnimatedNumber value={stat.value} suffix={stat.suffix} />
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
