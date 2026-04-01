import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

    // Animate through steps
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Briefcase className="h-5 w-5 text-primary" />
          New Job Description
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="Job title (e.g., Senior React Developer)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>
          <div>
            <Textarea
              placeholder="Paste the full job description here... Include required skills, experience level, education requirements, and responsibilities."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[200px]"
              disabled={loading}
            />
          </div>

          {loading && (
            <div className="space-y-2 p-3 rounded-md bg-muted/50">
              {analysisSteps.map((step, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  {i < currentStep ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                  ) : i === currentStep ? (
                    <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />
                  ) : (
                    <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>
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
                Analyzing with AI...
              </>
            ) : (
              "Analyze Job Description"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
