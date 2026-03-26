import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Loader2 } from "lucide-react";
import { analyzeJob } from "@/lib/api";
import { toast } from "sonner";

interface JobDescriptionFormProps {
  onJobCreated: (jobId: string) => void;
}

export function JobDescriptionForm({ onJobCreated }: JobDescriptionFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please enter a job description");
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeJob(title || "Untitled Position", description);
      toast.success("Job description analyzed successfully!");
      onJobCreated(result.job.id);
      setTitle("");
      setDescription("");
    } catch {
      // error toast already shown in api.ts
    } finally {
      setLoading(false);
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
            />
          </div>
          <div>
            <Textarea
              placeholder="Paste the full job description here... Include required skills, experience level, education requirements, and responsibilities."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
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
