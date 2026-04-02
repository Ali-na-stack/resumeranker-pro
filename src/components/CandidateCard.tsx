import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, X, Bookmark, ArrowRight, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CandidateWithScore } from "@/lib/api";
import { updateCandidateStatus, deleteCandidate } from "@/lib/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface CandidateCardProps {
  candidate: CandidateWithScore;
  biasReduction: boolean;
  onStatusChange: () => void;
  index?: number;
}

function getScoreColor(score: number) {
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-primary";
  if (score >= 40) return "text-warning";
  return "text-destructive";
}

function getScoreBg(score: number) {
  if (score >= 80) return "bg-success/10 border-success/30 shadow-[0_0_12px_hsl(var(--success)/0.2)]";
  if (score >= 60) return "bg-primary/10 border-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.2)]";
  if (score >= 40) return "bg-warning/10 border-warning/30 shadow-[0_0_12px_hsl(var(--warning)/0.2)]";
  return "bg-destructive/10 border-destructive/30 shadow-[0_0_12px_hsl(var(--destructive)/0.2)]";
}

function getScoreAccent(score: number) {
  if (score >= 80) return "border-t-success";
  if (score >= 60) return "border-t-primary";
  if (score >= 40) return "border-t-warning";
  return "border-t-destructive";
}

function getInitials(name: string | null, id: string) {
  if (!name) return id.slice(0, 2).toUpperCase();
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getAvatarColor(name: string | null) {
  const colors = [
    "bg-primary/15 text-primary",
    "bg-success/15 text-success",
    "bg-accent/15 text-accent",
    "bg-warning/15 text-warning",
    "bg-destructive/15 text-destructive",
  ];
  const hash = (name || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

export function CandidateCard({ candidate, biasReduction, onStatusChange, index = 0 }: {
  candidate: CandidateWithScore;
  biasReduction: boolean;
  onStatusChange: () => void;
  index?: number;
}) {
  const navigate = useNavigate();
  const score = candidate.score?.overall_score || 0;
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleStatus = async (status: "shortlisted" | "rejected" | "saved") => {
    try {
      await updateCandidateStatus(candidate.id, status);
      toast.success(`Candidate ${status}`);
      onStatusChange();
    } catch {}
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCandidate(candidate.id);
      toast.success("Candidate deleted");
      onStatusChange();
    } catch {
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const displayName = biasReduction ? `Candidate #${candidate.id.slice(0, 6)}` : candidate.name || "Unknown";

  return (
    <>
      <Card
        className={`hover-lift hover:shadow-xl cursor-pointer group relative border-t-2 ${getScoreAccent(score)} animate-fade-in`}
        style={{ animationDelay: `${index * 80}ms`, animationFillMode: "both" }}
        onClick={() => navigate(`/candidate/${candidate.id}?job=${candidate.job_description_id}`)}
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className={`text-xs font-bold ${getAvatarColor(candidate.name)}`}>
                  {getInitials(biasReduction ? null : candidate.name, candidate.id)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <h3 className="font-display font-semibold text-sm truncate">{displayName}</h3>
                {!biasReduction && candidate.email && (
                  <p className="text-xs text-muted-foreground truncate">{candidate.email}</p>
                )}
              </div>
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
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">Match Score</span>
              <span className={`font-semibold ${getScoreColor(score)}`}>{Math.round(score)}%</span>
            </div>
            <Progress value={score} className="h-2.5" />
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
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Resume Quality</span>
                <span className="font-medium">{Math.round(candidate.quality_score)}%</span>
              </div>
              <Progress value={candidate.quality_score} className="h-1.5" />
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={candidate.status === "shortlisted" ? "default" : "outline"}
              className="flex-1 h-8 text-xs gap-1"
              onClick={() => handleStatus("shortlisted")}
            >
              <Star className="h-3 w-3" />
              Shortlist
            </Button>
            <Button
              size="sm"
              variant={candidate.status === "rejected" ? "destructive" : "outline"}
              className="flex-1 h-8 text-xs gap-1"
              onClick={() => handleStatus("rejected")}
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant={candidate.status === "saved" ? "secondary" : "outline"}
              className="h-8 text-xs px-2.5"
              onClick={() => handleStatus("saved")}
            >
              <Bookmark className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs px-2.5 text-destructive hover:bg-destructive/10"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this candidate? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
