import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, X, User, Trophy, Briefcase, GraduationCap, Award, FolderOpen } from "lucide-react";
import { fetchCandidatesWithScores } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";

interface ComparePageProps {
  biasReduction: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-success/10";
  if (score >= 60) return "bg-primary/10";
  if (score >= 40) return "bg-warning/10";
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

  // Collect all unique skills across candidates
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.skills || [])));
  const allMatchedSkills = Array.from(new Set(candidates.flatMap((c) => c.score?.matched_skills || [])));
  const allMissingSkills = Array.from(new Set(candidates.flatMap((c) => c.score?.missing_skills || [])));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="min-h-[3.5rem] flex flex-wrap items-center border-b bg-card px-3 sm:px-4 gap-2 sm:gap-4 py-2">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" onClick={() => navigate(`/?job=${jobId}`)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="font-display font-bold text-base sm:text-lg">Compare Candidates</h1>
        <Badge variant="secondary" className="ml-auto">{candidates.length} candidates</Badge>
      </header>

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
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
          <div className="text-center py-12 text-muted-foreground">
            <p>Select at least 2 candidates to compare.</p>
            <Button variant="outline" className="mt-4" onClick={() => navigate(`/?job=${jobId}`)}>
              Go back to dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overview row */}
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(200px, 1fr))` }}>
              {candidates.map((c) => {
                const score = c.score?.overall_score ?? 0;
                return (
                  <Card key={c.id} className="relative">
                    <button
                      onClick={() => removeCandidate(c.id)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <CardContent className="pt-6 text-center space-y-3">
                      <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${getScoreBg(score)}`}>
                        <span className={`text-2xl font-display font-bold ${getScoreColor(score)}`}>
                          {Math.round(score)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-sm">
                          {biasReduction ? `Candidate #${c.id.slice(0, 6)}` : c.name || "Unknown"}
                        </h3>
                        {!biasReduction && c.email && (
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3" /> {c.experience_years ?? 0} yrs
                        {c.education && (
                          <>
                            <span className="mx-1">·</span>
                            <GraduationCap className="h-3 w-3" /> {c.education}
                          </>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => navigate(`/candidate/${c.id}?job=${jobId}`)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
              </div>
            </div>

            {/* Score breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> Score Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(180px, 1fr))` }}>
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
              </CardContent>
            </Card>

            {/* Skills matrix */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-display flex items-center gap-2">
                  <Award className="h-4 w-4 text-primary" /> Skills Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-success/10 text-success border-0">✓</Badge>
                                ) : has ? (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">~</Badge>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* AI Explanations */}
            {candidates.some((c) => c.score?.explanation) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-display">AI Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${candidates.length}, minmax(200px, 1fr))` }}>
                      {candidates.map((c) => (
                        <div key={c.id} className="space-y-1">
                          <p className="text-xs font-medium">
                            {biasReduction ? `#${c.id.slice(0, 6)}` : c.name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {c.score?.explanation || "No assessment available."}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
