import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CandidateCard } from "@/components/CandidateCard";
import { fetchJobDescriptions, fetchCandidatesWithScores } from "@/lib/api";
import type { CandidateWithScore } from "@/lib/api";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface CandidatesPageProps {
  biasReduction: boolean;
  filterStatus?: string;
}

export default function CandidatesPage({ biasReduction, filterStatus }: CandidatesPageProps) {
  const [searchParams] = useSearchParams();
  const [jobs, setJobs] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>(searchParams.get("job") || "");
  const [candidates, setCandidates] = useState<CandidateWithScore[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [minScore, setMinScore] = useState(0);
  const [sortBy, setSortBy] = useState<"score" | "name" | "experience">("score");

  useEffect(() => {
    fetchJobDescriptions().then((data) => {
      setJobs(data);
      if (!selectedJob && data.length > 0) setSelectedJob(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedJob) return;
    setLoading(true);
    fetchCandidatesWithScores(selectedJob)
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, [selectedJob]);

  const filtered = candidates
    .filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (minScore > 0 && (c.score?.overall_score || 0) < minScore) return false;
      if (search) {
        const q = search.toLowerCase();
        const nameMatch = c.name?.toLowerCase().includes(q);
        const skillMatch = c.skills?.some((s) => s.toLowerCase().includes(q));
        return nameMatch || skillMatch;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.score?.overall_score || 0) - (a.score?.overall_score || 0);
      if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
      return (b.experience_years || 0) - (a.experience_years || 0);
    });

  const title = filterStatus === "shortlisted" ? "Shortlisted" : "All Candidates";

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <header className="h-14 flex items-center border-b border-border/60 px-4 gap-3 bg-background/80 backdrop-blur-sm">
        <SidebarTrigger />
        <h1 className="font-display font-semibold text-base tracking-tight">{title}</h1>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-[220px] h-9 text-sm ml-auto">
            <SelectValue placeholder="Select a job" />
          </SelectTrigger>
          <SelectContent>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </header>

      <main className="flex-1 p-5 sm:p-8 overflow-auto">
        <div className="flex flex-col sm:flex-row gap-3 mb-6 sm:items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          </div>
          <div className="w-full sm:w-[180px]">
            <Label className="text-[11px] text-muted-foreground mb-1 block">
              Min Score: {minScore}%
            </Label>
            <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} max={100} step={5} />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
              <SlidersHorizontal className="h-3 w-3 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Sort by Score</SelectItem>
              <SelectItem value="name">Sort by Name</SelectItem>
              <SelectItem value="experience">Sort by Experience</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No candidates found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                biasReduction={biasReduction}
                index={i}
                onStatusChange={() => fetchCandidatesWithScores(selectedJob).then(setCandidates)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
