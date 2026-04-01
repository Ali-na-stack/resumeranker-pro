import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { JobDescriptionForm } from "@/components/JobDescriptionForm";
import { ResumeUpload } from "@/components/ResumeUpload";
import { CandidateCard } from "@/components/CandidateCard";
import { fetchJobDescriptions, fetchCandidatesWithScores, rankCandidates } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";
import { Loader2, Trophy, Zap, GitCompareArrows } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface DashboardProps {
  biasReduction: boolean;
}

function CandidateSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-14 w-14 rounded-full" />
      </div>
      <Skeleton className="h-2 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <div className="flex gap-1">
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-16 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-7 w-full" />
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

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-14 flex items-center border-b bg-card px-4 gap-4">
        <SidebarTrigger />
        <h1 className="font-display font-bold text-lg">Dashboard</h1>
        {jobs.length > 0 && (
          <Select value={selectedJob} onValueChange={setSelectedJob}>
            <SelectTrigger className="w-[250px] ml-auto">
              <SelectValue placeholder="Select a job" />
            </SelectTrigger>
            <SelectContent>
              {jobs.map((job) => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </header>

      <main className="flex-1 p-6 space-y-6 overflow-auto">
        {!selectedJob ? (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <Trophy className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h2 className="font-display text-2xl font-bold mb-2">
                Intelligent CV Ranking System
              </h2>
              <p className="text-muted-foreground">
                Start by entering a job description to analyze and rank candidates.
              </p>
            </div>
            <JobDescriptionForm
              onJobCreated={(id) => {
                setSelectedJob(id);
                loadJobs();
              }}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <JobDescriptionForm
                onJobCreated={(id) => {
                  setSelectedJob(id);
                  loadJobs();
                }}
              />
              <ResumeUpload
                jobDescriptionId={selectedJob}
                onUploadComplete={loadCandidates}
              />
              {candidates.length > 0 && (
                <Button
                  onClick={handleRank}
                  disabled={ranking}
                  className="w-full"
                  size="lg"
                >
                  {ranking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Ranking candidates...
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

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-semibold text-lg">
                  Ranked Candidates ({candidates.length})
                </h2>
              </div>
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[...Array(4)].map((_, i) => (
                    <CandidateSkeleton key={i} />
                  ))}
                </div>
              ) : candidates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No candidates yet. Upload resumes to get started.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidates.map((c) => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      biasReduction={biasReduction}
                      onStatusChange={loadCandidates}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
