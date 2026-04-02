import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const color = score >= 80 ? "bg-[hsl(var(--success))]" : score >= 60 ? "bg-primary" : score >= 40 ? "bg-[hsl(var(--warning))]" : "bg-destructive";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-display font-semibold text-sm">{Math.round(score)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
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
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = filename || "resume.pdf";
          a.click();
        }
        setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
      } else {
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename || "resume";
        a.click();
        setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
      }
    } catch {} finally {
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
        .from("candidate_scores").select("*").eq("candidate_id", id).maybeSingle();
      const { data: statusRow } = await supabase
        .from("candidate_statuses").select("*").eq("candidate_id", id).maybeSingle();

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
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
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
      <header className="h-14 flex items-center border-b border-border/60 px-4 gap-3 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger />
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="font-display font-semibold text-base tracking-tight truncate">
          {biasReduction ? `Candidate #${candidate.id.slice(0, 6)}` : candidate.name || "Unknown"}
        </h1>
      </header>

      <main className="flex-1 p-5 sm:p-8 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left: Score */}
          <div className="lg:col-span-1 space-y-5">
            <div className="surface-elevated p-6">
              <h3 className="font-display text-sm font-medium text-muted-foreground mb-5">Match Score</h3>
              <div className="flex justify-center mb-4">
                <ScoreRing score={s?.overall_score || 0} size={120} strokeWidth={6} />
              </div>
              <p className="text-center text-xs text-muted-foreground mb-6">Overall Match</p>
              <div className="space-y-4">
                <ScoreBar label="Skills" score={s?.skills_score || 0} icon={<Briefcase className="h-3 w-3" />} />
                <ScoreBar label="Experience" score={s?.experience_score || 0} icon={<User className="h-3 w-3" />} />
                <ScoreBar label="Education" score={s?.education_score || 0} icon={<GraduationCap className="h-3 w-3" />} />
                <ScoreBar label="Projects" score={s?.projects_score || 0} icon={<FolderOpen className="h-3 w-3" />} />
                <ScoreBar label="Certifications" score={s?.certifications_score || 0} icon={<Award className="h-3 w-3" />} />
              </div>
            </div>

            {candidate.quality_score !== null && candidate.quality_score > 0 && (
              <div className="surface-elevated p-5">
                <h3 className="font-display text-sm font-medium text-muted-foreground mb-3">Resume Quality</h3>
                <div className="text-center mb-2">
                  <span className="text-2xl font-display font-bold">{Math.round(candidate.quality_score)}</span>
                  <span className="text-muted-foreground text-sm">/100</span>
                </div>
                <Progress value={candidate.quality_score} className="h-1.5" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant={candidate.status === "shortlisted" ? "default" : "outline"}
                className="flex-1 h-10"
                onClick={() => handleStatus("shortlisted")}
              >
                <Star className="h-4 w-4" /> Shortlist
              </Button>
              <Button
                variant={candidate.status === "rejected" ? "destructive" : "outline"}
                className="flex-1 h-10"
                onClick={() => handleStatus("rejected")}
              >
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button
                variant={candidate.status === "saved" ? "secondary" : "outline"}
                className="h-10 px-3"
                onClick={() => handleStatus("saved")}
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>

            {candidate.resume_url && (
              <ResumeButton resumeUrl={candidate.resume_url} filename={candidate.resume_filename} />
            )}
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-5">
            {s?.explanation && (
              <div className="border-l-2 border-primary/40 bg-primary/[0.03] rounded-r-lg px-5 py-4">
                <p className="text-[11px] font-medium text-primary/60 uppercase tracking-wider mb-2">AI Analysis</p>
                <p className="text-sm leading-relaxed text-foreground/80">{s.explanation}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="surface-elevated p-5">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--success))]/70 mb-3">Matched Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(s?.matched_skills || []).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                  ))}
                  {(!s?.matched_skills || s.matched_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No matched skills</p>
                  )}
                </div>
              </div>

              <div className="surface-elevated p-5">
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-destructive/70 mb-3">Missing Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(s?.missing_skills || []).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs text-destructive/70 border-destructive/20">{skill}</Badge>
                  ))}
                  {(!s?.missing_skills || s.missing_skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No missing skills</p>
                  )}
                </div>
              </div>
            </div>

            {!biasReduction && (
              <div className="surface-elevated p-5">
                <h4 className="font-display text-sm font-medium mb-3">Contact Info</h4>
                <div className="space-y-1 text-sm text-foreground/80">
                  <p><span className="text-muted-foreground">Name:</span> {candidate.name || "N/A"}</p>
                  <p><span className="text-muted-foreground">Email:</span> {candidate.email || "N/A"}</p>
                </div>
              </div>
            )}

            <div className="surface-elevated p-5">
              <h4 className="font-display text-sm font-medium mb-3">All Skills</h4>
              <div className="flex flex-wrap gap-1.5">
                {(candidate.skills || []).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">{skill}</Badge>
                ))}
              </div>
            </div>

            <div className="surface-elevated p-5">
              <h4 className="font-display text-sm font-medium mb-2">Education</h4>
              <p className="text-sm text-foreground/80">{candidate.education || "Not specified"}</p>
            </div>

            {roles.length > 0 && (
              <div className="surface-elevated p-5">
                <h4 className="font-display text-sm font-medium mb-4">Work Experience</h4>
                <div className="space-y-4">
                  {roles.map((role: any, i: number) => (
                    <div key={i} className="border-l-2 border-border pl-4">
                      <p className="font-medium text-sm">{role.title}</p>
                      <p className="text-xs text-muted-foreground">{role.company} {role.duration ? `· ${role.duration}` : ""}</p>
                      {role.description && <p className="text-xs text-foreground/70 mt-1">{role.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {projects.length > 0 && (
              <div className="surface-elevated p-5">
                <h4 className="font-display text-sm font-medium mb-4">Projects</h4>
                <div className="space-y-3">
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
                </div>
              </div>
            )}

            {candidate.certifications && candidate.certifications.length > 0 && (
              <div className="surface-elevated p-5">
                <h4 className="font-display text-sm font-medium mb-3">Certifications</h4>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.certifications.map((cert) => (
                    <Badge key={cert} variant="secondary" className="text-xs">{cert}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
