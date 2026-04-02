import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

function getLeftBorder(score: number) {
  if (score >= 80) return "border-l-[3px] border-l-[hsl(var(--success))]";
  if (score >= 60) return "border-l-[3px] border-l-[hsl(var(--primary))]";
  if (score >= 40) return "border-l-[3px] border-l-[hsl(var(--warning))]";
  return "border-l-[3px] border-l-[hsl(var(--destructive))]";
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
  const MAX_SKILLS = index % 3 === 0 ? 4 : 3;
  const animDelay = index * 80 + (index % 3) * 15;

  return (
    <>
      <Card
        className={`hover-lift hover:shadow-xl cursor-pointer group relative ${getLeftBorder(score)} animate-fade-in`}
        style={{ animationDelay: `${animDelay}ms`, animationFillMode: "both" }}
        onClick={() => navigate(`/candidate/${candidate.id}?job=${candidate.job_description_id}`)}
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <Avatar className="h-10 w-10 shrink-0">
              <AvatarFallback className={`text-xs font-bold ${getAvatarColor(candidate.name)}`}>
                {getInitials(biasReduction ? null : candidate.name, candidate.id)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="font-display font-bold text-base truncate leading-tight">{displayName}</h3>
              {!biasReduction && candidate.email && (
                <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5">{candidate.email}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {candidate.experience_years || 0} yrs experience
              </p>
            </div>
            <ScoreRing score={score} />
          </div>

          {candidate.score?.matched_skills && candidate.score.matched_skills.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {candidate.score.matched_skills.slice(0, MAX_SKILLS).map((skill, si) => (
                  <Badge key={skill} variant="secondary" className={`text-[10px] px-1.5 py-0 max-w-[120px] truncate ${si === 0 ? "bg-primary/15 text-primary" : ""}`}>
                    {skill}
                  </Badge>
                ))}
                {candidate.score.matched_skills.length > MAX_SKILLS && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    +{candidate.score.matched_skills.length - MAX_SKILLS}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {candidate.score?.missing_skills && candidate.score.missing_skills.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {candidate.score.missing_skills.slice(0, 2).map((skill) => (
                  <Badge key={skill} variant="destructive" className="text-[10px] px-1.5 py-0 opacity-60 max-w-[100px] truncate">
                    {skill}
                  </Badge>
                ))}
                {candidate.score.missing_skills.length > 2 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                    +{candidate.score.missing_skills.length - 2}
                  </Badge>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3 border-t border-border/50" onClick={(e) => e.stopPropagation()}>
            <Button
              size="sm"
              variant={candidate.status === "shortlisted" ? "default" : "outline"}
              className="flex-1 h-8 text-xs gap-1 hover-glow"
              onClick={() => handleStatus("shortlisted")}
            >
              <Star className="h-3 w-3" />
              Shortlist
            </Button>
            <Button
              size="sm"
              variant={candidate.status === "rejected" ? "destructive" : "outline"}
              className="flex-1 h-8 text-xs gap-1 hover-underline-accent overflow-visible"
              onClick={() => handleStatus("rejected")}
            >
              <X className="h-3 w-3" />
              Reject
            </Button>
            <Button
              size="sm"
              variant={candidate.status === "saved" ? "secondary" : "outline"}
              className="h-8 text-xs px-2.5 hover-scale-sm"
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
