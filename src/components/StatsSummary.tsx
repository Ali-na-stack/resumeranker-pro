import { Users, Star, XCircle, TrendingUp } from "lucide-react";
import type { CandidateWithScore } from "@/lib/api";

interface StatsSummaryProps {
  candidates: CandidateWithScore[];
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
    { label: "Total", value: total, icon: Users, color: "text-primary" },
    { label: "Shortlisted", value: shortlisted, icon: Star, color: "text-success" },
    { label: "Rejected", value: rejected, icon: XCircle, color: "text-destructive" },
    { label: "Avg Score", value: `${avgScore}%`, icon: TrendingUp, color: "text-accent" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="flex items-center gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-sm"
        >
          <div className={`rounded-md bg-muted p-2 ${stat.color}`}>
            <stat.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-lg font-display font-bold">{stat.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
