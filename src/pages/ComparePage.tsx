import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, X, Trophy, Briefcase, GraduationCap, Award, FolderOpen } from "lucide-react";
import { fetchCandidatesWithScores } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";

interface ComparePageProps {
  biasReduction: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-[hsl(var(--success))]";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-[hsl(var(--warning))]";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-[hsl(var(--success))]/10";
  if (score >= 60) return "bg-primary/10";
  if (score >= 40) return "bg-[hsl(var(--warning))]/10";
  return "bg-destructive/10";
}

function ScoreBar({ label, score, icon: Icon }: { label: string; score: number | null; icon: React.ElementType }) {
  const val = score ?? 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          {label}
        </span>
        <span className={`font-semibold ${getScoreColor(val)}`}>{Math.round(val)}%</span>
      </div>
      <Progress value={val} className="h-1.5" />
    </div>
  );
}

export default function ComparePage({ biasReduction }: ComparePageProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("job") || "";
  const ids = searchParams.get("ids")?.split(",") || [];

  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId || ids.length === 0) return;
    (async () => {
      setLoading(true);
      try {
        const all = await fetchCandidatesWithScores(jobId);
        setCandidates(all.filter((c) => ids.includes(c.id)));
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const removeCandidate = (id: string) => {
    const next = candidates.filter((c) => c.id !== id);
    setCandidates(next);
    if (next.length < 2) navigate(`/?job=${jobId}`);
  };

  const allMatchedSkills = Array.from(new Set(candidates.flatMap((c) => c.score?.matched_skills || [])));
  const allMissingSkills = Array.from(new Set(candidates.flatMap((c) => c.score?.missing_skills || [])));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-14 flex items-center border-b border-border/60 px-4 gap-3 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate(`/?job=${jobId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-display font-semibold text-base tracking-tight">Compare Candidates</h1>
        <Badge variant="secondary" className="ml-auto text-xs">{candidates.length} candidates</Badge>
      </header>

      <main className="flex-1 p-5 sm:p-8 overflow-auto">
        {loading ? (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(ids.length, 4)}, 1fr)` }}>
            {ids.map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-48 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </div>
            ))}
          </div>
        ) : candidates.length < 2 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            <p>Select at least 2 candidates to compare.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/?job=${jobId}`)}>
              Go back to dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(200px, 1fr))` }}>
                {candidates.map((c) => {
                  const score = c.score?.overall_score ?? 0;
                  return (
                    <div key={c.id} className="surface-elevated p-5 relative">
                      <button onClick={() => removeCandidate(c.id)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                      <div className="text-center space-y-3">
                        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${getScoreBg(score)}`}>
                          <span className={`text-xl font-display font-bold ${getScoreColor(score)}`}>{Math.round(score)}</span>
                        </div>
                        <div>
                          <h3 className="font-display font-semibold text-sm">
                            {biasReduction ? `Candidate #${c.id.slice(0, 6)}` : c.name || "Unknown"}
                          </h3>
                          {!biasReduction && c.email && <p className="text-xs text-muted-foreground">{c.email}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {c.experience_years ?? 0} yrs · {c.education || "—"}
                        </p>
                        <Button variant="outline" size="sm" className="w-full text-xs" onClick={() => navigate(`/candidate/${c.id}?job=${jobId}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Score breakdown */}
            <div className="surface-elevated p-5">
              <h3 className="text-sm font-display font-medium flex items-center gap-2 mb-5">
                <Trophy className="h-4 w-4 text-primary" /> Score Breakdown
              </h3>
              <div className="overflow-x-auto">
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(180px, 1fr))` }}>
                  {candidates.map((c) => (
                    <div key={c.id} className="space-y-3">
                      <p className="text-xs font-medium text-center truncate">
                        {biasReduction ? `#${c.id.slice(0, 6)}` : c.name || "Unknown"}
                      </p>
                      <ScoreBar label="Skills" score={c.score?.skills_score ?? null} icon={Award} />
                      <ScoreBar label="Experience" score={c.score?.experience_score ?? null} icon={Briefcase} />
                      <ScoreBar label="Education" score={c.score?.education_score ?? null} icon={GraduationCap} />
                      <ScoreBar label="Projects" score={c.score?.projects_score ?? null} icon={FolderOpen} />
                      <ScoreBar label="Certifications" score={c.score?.certifications_score ?? null} icon={Award} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Skills matrix */}
            <div className="surface-elevated p-5">
              <h3 className="text-sm font-display font-medium flex items-center gap-2 mb-4">
                <Award className="h-4 w-4 text-primary" /> Skills Comparison
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Skill</th>
                      {candidates.map((c) => (
                        <th key={c.id} className="text-center py-2 px-2 font-medium">
                          {biasReduction ? `#${c.id.slice(0, 6)}` : (c.name?.split(" ")[0] || "?")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allMatchedSkills.concat(allMissingSkills.filter((s) => !allMatchedSkills.includes(s))).slice(0, 20).map((skill) => (
                      <tr key={skill} className="border-b last:border-0">
                        <td className="py-1.5 pr-4">{skill}</td>
                        {candidates.map((c) => {
                          const matched = c.score?.matched_skills?.includes(skill);
                          const has = c.skills?.some((s) => s.toLowerCase() === skill.toLowerCase());
                          return (
                            <td key={c.id} className="text-center py-1.5 px-2">
                              {matched ? (
                                <span className="text-[hsl(var(--success))]">✓</span>
                              ) : has ? (
                                <span className="text-muted-foreground">~</span>
                              ) : (
                                <span className="text-muted-foreground/40">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Explanations */}
            {candidates.some((c) => c.score?.explanation) && (
              <div className="surface-elevated p-5">
                <h3 className="text-sm font-display font-medium mb-4">AI Assessment</h3>
                <div className="overflow-x-auto">
                  <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(200px, 1fr))` }}>
                    {candidates.map((c) => (
                      <div key={c.id}>
                        <p className="text-xs font-medium mb-1">
                          {biasReduction ? `#${c.id.slice(0, 6)}` : c.name || "Unknown"}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {c.score?.explanation || "No assessment available."}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
