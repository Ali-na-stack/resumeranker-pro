import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Briefcase, Loader2, CheckCircle2 } from "lucide-react";
import { analyzeJob } from "@/lib/api";
import { toast } from "sonner";

interface JobDescriptionFormProps {
  onJobCreated: (jobId: string) => void;
}

const analysisSteps = [
  "Reading job description...",
  "Extracting required skills...",
  "Identifying experience requirements...",
  "Finalizing analysis...",
];

export function JobDescriptionForm({ onJobCreated }: JobDescriptionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please enter a job description");
      return;
    }
    setLoading(true);
    setCurrentStep(0);

    const interval = setInterval(() => {
      setCurrentStep((prev) => Math.min(prev + 1, analysisSteps.length - 1));
    }, 1500);

    try {
      const result = await analyzeJob(title || "Untitled Position", description);
      clearInterval(interval);
      toast.success("Job description analyzed successfully!");
      onJobCreated(result.job.id);
      setTitle("");
      setDescription("");
    } catch {
      clearInterval(interval);
    } finally {
      setLoading(false);
      setCurrentStep(0);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Briefcase className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-display font-medium text-sm">New Job Description</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          placeholder="Job title (e.g., Senior React Developer)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={loading}
          className="bg-background/50"
        />
        <Textarea
          placeholder="Paste the full job description here... Include required skills, experience level, education requirements, and responsibilities."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[180px] bg-background/50 resize-none"
          disabled={loading}
        />

        {loading && (
          <div className="space-y-1.5 py-2">
            {analysisSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                {i < currentStep ? (
                  <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))] shrink-0" />
                ) : i === currentStep ? (
                  <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
                ) : (
                  <div className="h-3 w-3 rounded-full border border-border shrink-0" />
                )}
                <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground/60"}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            "Analyze Job Description"
          )}
        </Button>
      </form>
    </div>
  );
}
