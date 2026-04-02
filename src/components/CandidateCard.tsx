import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScoreRing } from "@/components/ScoreRing";
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
    "bg-primary/12 text-primary",
    "bg-[hsl(var(--success))]/12 text-[hsl(var(--success))]",
    "bg-[hsl(var(--warning))]/12 text-[hsl(var(--warning))]",
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
  const animDelay = index * 60;

  return (
    <>
      <div
        className="surface-elevated border border-border/50 hover:border-primary/30 transition-all duration-200 cursor-pointer group relative p-5 animate-slide-in-up"
        style={{ animationDelay: `${animDelay}ms` }}
        onClick={() => navigate(`/candidate/${candidate.id}?job=${candidate.job_description_id}`)}
      >
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className={`text-[11px] font-semibold ${getAvatarColor(candidate.name)}`}>
              {getInitials(biasReduction ? null : candidate.name, candidate.id)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-semibold text-sm truncate leading-snug">{displayName}</h3>
            {!biasReduction && candidate.email && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{candidate.email}</p>
            )}
            <p className="text-[11px] text-muted-foreground/70 mt-0.5">
              {candidate.experience_years || 0} yrs experience
            </p>
          </div>
          <ScoreRing score={score} />
        </div>

        {/* Matched skills */}
        {candidate.score?.matched_skills && candidate.score.matched_skills.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1.5">
              {candidate.score.matched_skills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-[10px] px-2 py-0.5 font-normal max-w-[120px] truncate">
                  {skill}
                </Badge>
              ))}
              {candidate.score.matched_skills.length > 3 && (
                <span className="text-[10px] text-muted-foreground self-center">
                  +{candidate.score.matched_skills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Missing skills as text */}
        {candidate.score?.missing_skills && candidate.score.missing_skills.length > 0 && (
          <p className="text-[10px] text-destructive/70 mb-3 truncate">
            Missing: {candidate.score.missing_skills.slice(0, 2).join(", ")}
            {candidate.score.missing_skills.length > 2 && ` +${candidate.score.missing_skills.length - 2}`}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-border/40" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant={candidate.status === "shortlisted" ? "default" : "outline"}
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => handleStatus("shortlisted")}
          >
            <Star className="h-3 w-3" />
            Shortlist
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs gap-1"
            onClick={() => navigate(`/candidate/${candidate.id}?job=${candidate.job_description_id}`)}
          >
            View
            <ArrowRight className="h-3 w-3" />
          </Button>
          <div className="flex items-center gap-0.5 ml-auto">
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 ${candidate.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}
              onClick={() => handleStatus("rejected")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className={`h-7 w-7 p-0 ${candidate.status === "saved" ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => handleStatus("saved")}
            >
              <Bookmark className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

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
