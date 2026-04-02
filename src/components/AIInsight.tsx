import { Sparkles } from "lucide-react";
import type { CandidateWithScore } from "@/lib/api";

interface AIInsightProps {
  candidates: CandidateWithScore[];
}

export function AIInsight({ candidates }: AIInsightProps) {
  const scored = candidates.filter((c) => c.score?.overall_score != null);
  if (scored.length === 0) return null;

  const strongMatches = scored.filter((c) => (c.score?.overall_score || 0) >= 75).length;
  const topCandidate = scored.reduce((best, c) =>
    (c.score?.overall_score || 0) > (best.score?.overall_score || 0) ? c : best
  );

  // Find most common missing skill
  const missingCount: Record<string, number> = {};
  scored.forEach((c) => {
    (c.score?.missing_skills || []).forEach((skill) => {
      missingCount[skill] = (missingCount[skill] || 0) + 1;
    });
  });
  const topMissing = Object.entries(missingCount).sort((a, b) => b[1] - a[1])[0];

  const insights: string[] = [];

  if (strongMatches > 0) {
    insights.push(`${strongMatches} candidate${strongMatches > 1 ? "s" : ""} match 75%+ of role requirements`);
  } else {
    insights.push("No candidates exceed 75% match — consider adjusting requirements");
  }

  if (topMissing) {
    insights.push(`Most common skill gap: ${topMissing[0]}`);
  }

  if (topCandidate.score?.overall_score) {
    insights.push(`Top candidate scored ${Math.round(topCandidate.score.overall_score)}% overall`);
  }

  return (
    <div className="border-l-2 border-primary/40 bg-primary/[0.03] rounded-r-lg px-5 py-4 animate-slide-in-up">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="h-3.5 w-3.5 text-primary/70" />
        <span className="text-xs font-medium text-primary/70 tracking-wide uppercase">AI Hiring Insight</span>
      </div>
      <div className="space-y-1.5">
        {insights.map((insight, i) => (
          <p key={i} className="text-sm text-foreground/80 leading-relaxed">
            {insight}
          </p>
        ))}
      </div>
    </div>
  );
}
