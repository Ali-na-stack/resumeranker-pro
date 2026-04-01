import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Star, X, Bookmark, User, ArrowRight } from "lucide-react";
import type { CandidateWithScore } from "@/lib/api";
import { updateCandidateStatus } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CandidateCardProps {
  candidate: CandidateWithScore;
  biasReduction: boolean;
  onStatusChange: () => void;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-success/10 border-success/30";
  if (score >= 60) return "bg-primary/10 border-primary/30";
  if (score >= 40) return "bg-warning/10 border-warning/30";
  return "bg-destructive/10 border-destructive/30";
}

export function CandidateCard({ candidate, biasReduction, onStatusChange }: CandidateCardProps) {
  const navigate = useNavigate();
  const score = candidate.score?.overall_score || 0;

  const handleStatus = async (status: "shortlisted" | "rejected" | "saved") => {
    try {
      await updateCandidateStatus(candidate.id, status);
      toast.success(`Candidate ${status}`);
      onStatusChange();
    } catch {}
  };

  return (
    <Card
      className="hover:shadow-md transition-all cursor-pointer group relative"
      onClick={() => navigate(`/candidate/${candidate.id}?job=${candidate.job_description_id}`)}
    >
      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <h3 className="font-display font-semibold text-sm truncate">
                {biasReduction ? `Candidate #${candidate.id.slice(0, 6)}` : candidate.name || "Unknown"}
              </h3>
            </div>
            {!biasReduction && candidate.email && (
              <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
            )}
          </div>
          <div
            className={`flex items-center justify-center rounded-full border w-14 h-14 shrink-0 ${getScoreBg(score)}`}
          >
            <span className={`text-lg font-display font-bold ${getScoreColor(score)}`}>
              {Math.round(score)}
            </span>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">Match Score</span>
            <span className={`font-medium ${getScoreColor(score)}`}>{Math.round(score)}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Experience</p>
            <p className="text-xs font-medium">{candidate.experience_years || 0} years</p>
          </div>

          {candidate.score?.matched_skills && candidate.score.matched_skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Matched Skills</p>
              <div className="flex flex-wrap gap-1">
                {candidate.score.matched_skills.slice(0, 5).map((skill) => (
                  <Badge key={skill} variant="secondary" className="text-[10px] px-1.5 py-0">
                    {skill}
                  </Badge>
                ))}
                {candidate.score.matched_skills.length > 5 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{candidate.score.matched_skills.length - 5}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {candidate.score?.missing_skills && candidate.score.missing_skills.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Missing Skills</p>
              <div className="flex flex-wrap gap-1">
                {candidate.score.missing_skills.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="destructive" className="text-[10px] px-1.5 py-0 opacity-70">
                    {skill}
                  </Badge>
                ))}
                {candidate.score.missing_skills.length > 3 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    +{candidate.score.missing_skills.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        {candidate.quality_score !== null && candidate.quality_score > 0 && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground mb-1">Resume Quality</p>
            <Progress value={candidate.quality_score} className="h-1.5" />
          </div>
        )}

        <div className="flex gap-1.5 pt-2 border-t" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={candidate.status === "shortlisted" ? "default" : "outline"}
            className="flex-1 h-7 text-xs"
            onClick={() => handleStatus("shortlisted")}
          >
            <Star className="h-3 w-3" />
            Shortlist
          </Button>
          <Button
            size="sm"
            variant={candidate.status === "rejected" ? "destructive" : "outline"}
            className="flex-1 h-7 text-xs"
            onClick={() => handleStatus("rejected")}
          >
            <X className="h-3 w-3" />
            Reject
          </Button>
          <Button
            size="sm"
            variant={candidate.status === "saved" ? "secondary" : "outline"}
            className="h-7 text-xs px-2"
            onClick={() => handleStatus("saved")}
          >
            <Bookmark className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
