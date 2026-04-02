import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScoreRing } from "@/components/ScoreRing";
import { supabase } from "@/integrations/supabase/client";
import { updateCandidateStatus, downloadResumeAsBlob } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";
import { ArrowLeft, Star, X, Bookmark, User, Briefcase, GraduationCap, Award, FolderOpen, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

interface CandidateDetailProps {
  biasReduction: boolean;
}

function ScoreBar({ label, score, icon }: { label: string; score: number; icon: React.ReactNode }) {
  const color = score >= 80 ? "bg-success" : score >= 60 ? "bg-primary" : score >= 40 ? "bg-warning" : "bg-destructive";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-display font-semibold">{Math.round(score)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function ResumeButton({ resumeUrl, filename }: { resumeUrl: string; filename?: string | null }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const { blobUrl, contentType } = await downloadResumeAsBlob(resumeUrl);

      if (contentType.includes("pdf")) {
        const win = window.open(blobUrl, "_blank");
        if (!win) {
          // Popup blocked — fall back to download
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename || "resume.pdf";
          a.click();
        }
        // Revoke after a delay so the new tab can load
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        // Non-PDF: trigger download
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "resume";
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
    } catch {
      // error toast already shown by downloadResumeAsBlob
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" className="w-full" onClick={handleClick} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
      {loading ? "Opening..." : "View Original Resume"}
    </Button>
  );
}

export default function CandidateDetail({ biasReduction }: CandidateDetailProps) {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const jobId = searchParams.get("job") || "";
  const [candidate, setCandidate] = useState<CandidateWithScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: c } = await supabase.from("candidates").select("*").eq("id", id).single();
      if (!c) { setLoading(false); return; }

      const { data: score } = await supabase
        .from("candidate_scores")
        .select("*")
        .eq("candidate_id", id)
        .maybeSingle();

      const { data: statusRow } = await supabase
        .from("candidate_statuses")
        .select("*")
        .eq("candidate_id", id)
        .maybeSingle();

      setCandidate({
        ...c,
        score: score ? {
          overall_score: score.overall_score,
          skills_score: score.skills_score,
          experience_score: score.experience_score,
          education_score: score.education_score,
          projects_score: score.projects_score,
          certifications_score: score.certifications_score,
          matched_skills: score.matched_skills,
          missing_skills: score.missing_skills,
          explanation: score.explanation,
        } : undefined,
        status: (statusRow?.status as any) || "pending",
      });
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Candidate not found.</p>
      </div>
    );
  }

  const handleStatus = async (status: "shortlisted" | "rejected" | "saved") => {
    await updateCandidateStatus(candidate.id, status);
    setCandidate((prev) => prev ? { ...prev, status } : prev);
    toast.success(`Candidate ${status}`);
  };

  const s = candidate.score;
  const roles = Array.isArray(candidate.experience_roles) ? candidate.experience_roles : [];
  const projects = Array.isArray(candidate.projects) ? candidate.projects : [];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="min-h-[3.5rem] flex items-center border-b bg-card px-3 sm:px-4 gap-2 sm:gap-4 py-2">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Back</span>
        </Button>
        <h1 className="font-display font-bold text-base sm:text-lg truncate">
          {biasReduction ? `Candidate #${candidate.id.slice(0, 6)}` : candidate.name || "Unknown"}
        </h1>
      </header>

      <main className="flex-1 p-4 sm:p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Score Overview */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Match Score</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-display font-bold text-primary">
                    {Math.round(s?.overall_score || 0)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">Overall Match</p>
                </div>
                <div className="space-y-3">
                  <ScoreBar label="Skills" score={s?.skills_score || 0} icon={<Briefcase className="h-3 w-3" />} />
                  <ScoreBar label="Experience" score={s?.experience_score || 0} icon={<User className="h-3 w-3" />} />
                  <ScoreBar label="Education" score={s?.education_score || 0} icon={<GraduationCap className="h-3 w-3" />} />
                  <ScoreBar label="Projects" score={s?.projects_score || 0} icon={<FolderOpen className="h-3 w-3" />} />
                  <ScoreBar label="Certifications" score={s?.certifications_score || 0} icon={<Award className="h-3 w-3" />} />
                </div>
              </CardContent>
            </Card>

            {candidate.quality_score !== null && candidate.quality_score > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Resume Quality</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-2">
                    <span className="text-2xl font-display font-bold">{Math.round(candidate.quality_score)}</span>
                    <span className="text-muted-foreground">/100</span>
                  </div>
                  <Progress value={candidate.quality_score} className="h-2" />
                </CardContent>
              </Card>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                variant={candidate.status === "shortlisted" ? "default" : "outline"}
                className="flex-1 min-w-[100px] min-h-[44px]"
                onClick={() => handleStatus("shortlisted")}
              >
                <Star className="h-4 w-4" /> Shortlist
              </Button>
              <Button
                variant={candidate.status === "rejected" ? "destructive" : "outline"}
                className="flex-1 min-w-[100px] min-h-[44px]"
                onClick={() => handleStatus("rejected")}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                variant={candidate.status === "saved" ? "secondary" : "outline"}
                className="min-h-[44px]"
                onClick={() => handleStatus("saved")}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>

            {candidate.resume_url && (
              <ResumeButton resumeUrl={candidate.resume_url} filename={candidate.resume_filename} />
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-4">
            {s?.explanation && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">AI Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{s.explanation}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base text-success">Matched Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {(s?.matched_skills || []).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                    {(!s?.matched_skills || s.matched_skills.length === 0) && (
                      <p className="text-sm text-muted-foreground">No matched skills</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base text-destructive">Missing Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {(s?.missing_skills || []).map((skill) => (
                      <Badge key={skill} variant="destructive" className="opacity-80">{skill}</Badge>
                    ))}
                    {(!s?.missing_skills || s.missing_skills.length === 0) && (
                      <p className="text-sm text-muted-foreground">No missing skills</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {!biasReduction && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Contact Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {candidate.name || "N/A"}</p>
                  <p><strong>Email:</strong> {candidate.email || "N/A"}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(candidate.skills || []).map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-display text-base">Education</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{candidate.education || "Not specified"}</p>
              </CardContent>
            </Card>

            {roles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Work Experience</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {roles.map((role: any, i: number) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-3">
                      <p className="font-medium text-sm">{role.title}</p>
                      <p className="text-xs text-muted-foreground">{role.company} {role.duration ? `· ${role.duration}` : ""}</p>
                      {role.description && <p className="text-xs mt-1">{role.description}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Projects</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {projects.map((proj: any, i: number) => (
                    <div key={i}>
                      <p className="font-medium text-sm">{proj.name}</p>
                      {proj.description && <p className="text-xs text-muted-foreground">{proj.description}</p>}
                      {proj.technologies && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {proj.technologies.map((t: string) => (
                            <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {candidate.certifications && candidate.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base">Certifications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5">
                    {candidate.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary">{cert}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
