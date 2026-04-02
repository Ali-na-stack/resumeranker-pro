import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { JobDescriptionForm } from "@/components/JobDescriptionForm";
import { ResumeUpload } from "@/components/ResumeUpload";
import { CandidateCard } from "@/components/CandidateCard";
import { StatsSummary } from "@/components/StatsSummary";
import { AIInsight } from "@/components/AIInsight";
import { EmptyState } from "@/components/EmptyState";
import { fetchJobDescriptions, fetchCandidatesWithScores, rankCandidates, deleteJobDescription } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";
import { Loader2, Briefcase, Zap, GitCompareArrows, Download, FileText, FileUp, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { exportCandidatesCSV, exportCandidatesPDF } from "@/lib/export";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface DashboardProps {
  biasReduction: boolean;
}

function CandidateSkeleton() {
  return (
    <div className="surface-elevated p-5 space-y-3 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-1">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 flex-1 rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
    </div>
  );
}

export default function Dashboard({ biasReduction }: DashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(searchParams.get("job") || "");
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadJobs = async () => {
    const data = await fetchJobDescriptions();
    setJobs(data);
    if (!selectedJob && data.length > 0) {
      setSelectedJob(data[0].id);
    }
  };

  const loadCandidates = async () => {
    if (!selectedJob) return;
    setLoading(true);
    try {
      const data = await fetchCandidatesWithScores(selectedJob);
      setCandidates(data.sort((a, b) => (b.score?.overall_score || 0) - (a.score?.overall_score || 0)));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      loadCandidates();
      setSearchParams({ job: selectedJob });
    }
  }, [selectedJob]);

  const handleRank = async () => {
    if (!selectedJob) return;
    setRanking(true);
    try {
      await rankCandidates(selectedJob);
      toast.success("Candidates ranked successfully!");
      await loadCandidates();
    } catch {
    } finally {
      setRanking(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!selectedJob) return;
    setDeleting(true);
    try {
      await deleteJobDescription(selectedJob);
      toast.success("Job description deleted");
      setSelectedJob("");
      setCandidates([]);
      await loadJobs();
    } catch {
    } finally {
      setDeleting(false);
    }
  };

  const currentJobTitle = jobs.find((j) => j.id === selectedJob)?.title;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      {/* Header */}
      <header className="h-14 flex items-center border-b border-border/60 px-4 gap-3 sticky top-0 z-20 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger />
        <h1 className="font-display font-semibold text-base tracking-tight">Dashboard</h1>
        {currentJobTitle && (
          <span className="text-xs text-muted-foreground hidden sm:inline">/ {currentJobTitle}</span>
        )}
        {jobs.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <Select value={selectedJob} onValueChange={setSelectedJob}>
              <SelectTrigger className="w-[220px] h-9 text-sm">
                <SelectValue placeholder="Select a job" />
              </SelectTrigger>
              <SelectContent>
                {jobs.map((job) => (
                  <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedJob && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" disabled={deleting}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Job Description?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{currentJobTitle}" and all associated candidates. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteJob} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 p-5 sm:p-8 overflow-auto">
        {!selectedJob ? (
          <div className="max-w-lg mx-auto pt-8">
            <EmptyState
              icon={Briefcase}
              title="Start by adding a job description"
              subtitle="Paste a job description to begin ranking candidates with AI."
            />
            <div className="mt-4 surface-elevated p-6">
              <JobDescriptionForm
                onJobCreated={(id) => {
                  setSelectedJob(id);
                  loadJobs();
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8 max-w-7xl mx-auto">
            {/* Stats */}
            {candidates.length > 0 && <StatsSummary candidates={candidates} />}

            {/* AI Insight */}
            {candidates.length > 0 && <AIInsight candidates={candidates} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Setup */}
              <div className="lg:col-span-1 space-y-6">
                <div className="surface-elevated p-5">
                  <JobDescriptionForm
                    onJobCreated={(id) => {
                      setSelectedJob(id);
                      loadJobs();
                    }}
                  />
                </div>

                <div className="surface-elevated p-5">
                  <ResumeUpload
                    jobDescriptionId={selectedJob}
                    onUploadComplete={loadCandidates}
                  />
                </div>

                {candidates.length > 0 && (
                  <Button
                    onClick={handleRank}
                    disabled={ranking}
                    className="w-full h-11 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    size="lg"
                  >
                    {ranking ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Ranking...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        Rank All Candidates
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Right: Candidates */}
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-semibold text-base tracking-tight">Candidates</h2>
                    {candidates.length > 0 && (
                      <span className="text-[11px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {candidates.length}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {candidates.length > 0 && (
                      <>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => exportCandidatesCSV(candidates, currentJobTitle || "Candidates")}>
                          <Download className="h-3.5 w-3.5 mr-1" /> CSV
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={() => exportCandidatesPDF(candidates, currentJobTitle || "Candidates")}>
                          <FileText className="h-3.5 w-3.5 mr-1" /> PDF
                        </Button>
                      </>
                    )}
                    {selectedIds.size >= 2 && (
                      <Button size="sm" className="h-8 text-xs" onClick={() => navigate(`/compare?job=${selectedJob}&ids=${Array.from(selectedIds).join(",")}`)}>
                        <GitCompareArrows className="h-3.5 w-3.5 mr-1" />
                        Compare ({selectedIds.size})
                      </Button>
                    )}
                  </div>
                </div>

                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => <CandidateSkeleton key={i} />)}
                  </div>
                ) : candidates.length === 0 ? (
                  <EmptyState
                    icon={FileUp}
                    title="No candidates yet"
                    subtitle="Upload resumes to start ranking candidates against this job."
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {candidates.map((c, i) => (
                      <div key={c.id} className="relative">
                        <div className="absolute top-4 left-4 z-10" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(c.id)}
                            onCheckedChange={() => toggleSelect(c.id)}
                          />
                        </div>
                        <CandidateCard
                          candidate={c}
                          biasReduction={biasReduction}
                          onStatusChange={loadCandidates}
                          index={i}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
