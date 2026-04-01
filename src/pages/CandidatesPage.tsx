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
      <header className="min-h-[3.5rem] flex flex-wrap items-center border-b bg-card px-3 sm:px-4 gap-2 sm:gap-4 py-2">
        <SidebarTrigger />
        <h1 className="font-display font-bold text-base sm:text-lg">{title}</h1>
        <Select value={selectedJob} onValueChange={setSelectedJob}>
          <SelectTrigger className="w-full sm:w-[250px] sm:ml-auto">
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
      </header>

      <main className="flex-1 p-6 overflow-auto">
        <div className="flex flex-wrap gap-4 mb-6 items-end">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or skill..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="w-[200px]">
            <Label className="text-xs text-muted-foreground mb-1 block">
              Min Score: {minScore}%
            </Label>
            <Slider
              value={[minScore]}
              onValueChange={([v]) => setMinScore(v)}
              max={100}
              step={5}
            />
          </div>
          <div>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <SlidersHorizontal className="h-3 w-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sort by Score</SelectItem>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="experience">Sort by Experience</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No candidates found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c) => (
              <CandidateCard
                key={c.id}
                candidate={c}
                biasReduction={biasReduction}
                onStatusChange={() =>
                  fetchCandidatesWithScores(selectedJob).then(setCandidates)
                }
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
