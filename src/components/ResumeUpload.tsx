import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { uploadResumeFile, parseResume } from "@/lib/api";
import { toast } from "sonner";

interface ResumeUploadProps {
  jobDescriptionId: string;
  onUploadComplete: () => void;
}

type FileStatus = "pending" | "uploading" | "parsing" | "done" | "error";

interface FileEntry {
  file: File;
  status: FileStatus;
  error?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const statusConfig: Record<FileStatus, { label: string; stepLabel?: string }> = {
  pending: { label: "Pending" },
  uploading: { label: "Uploading", stepLabel: "Step 1/2 — Uploading" },
  parsing: { label: "AI Parsing", stepLabel: "Step 2/2 — AI Parsing" },
  done: { label: "Done" },
  error: { label: "Failed" },
};

const CONCURRENCY = 3;

export function ResumeUpload({ jobDescriptionId, onUploadComplete }: ResumeUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addedAt, setAddedAt] = useState<Record<string, number>>({});

  const addFiles = useCallback((newFiles: File[]) => {
    const valid: FileEntry[] = [];
    for (const f of newFiles) {
      if (!["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"].includes(f.type)) {
        toast.error(`${f.name}: unsupported file type`);
        continue;
      }
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`${f.name}: exceeds 10MB limit`);
        continue;
      }
      valid.push({ file: f, status: "pending" });
    }
    setEntries((prev) => {
      const existingNames = new Set(prev.map((e) => e.file.name));
      const unique = valid.filter((v) => {
        if (existingNames.has(v.file.name)) {
          toast.error(`${v.file.name}: already added`);
          return false;
        }
        return true;
      });
      // Record stagger index for animation delay
      const now = Date.now();
      setAddedAt((prev) => {
        const next = { ...prev };
        unique.forEach((v, i) => { next[v.file.name] = now + i * 80; });
        return next;
      });
      return [...prev, ...unique];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (uploading) return;
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles, uploading]
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const removeFile = (index: number) => {
    setEntries((prev) => prev.filter((_, i) => i !== index));
  };

  const updateStatus = (index: number, status: FileStatus, error?: string) => {
    setEntries((prev) => prev.map((e, i) => (i === index ? { ...e, status, error } : e)));
  };

  const processOne = async (i: number): Promise<boolean> => {
    try {
      const entry = entries[i];
      updateStatus(i, "uploading");
      const resumeUrl = await uploadResumeFile(entry.file, jobDescriptionId);
      updateStatus(i, "parsing");
      await parseResume(jobDescriptionId, entry.file, resumeUrl, entry.file.name);
      updateStatus(i, "done");
      return true;
    } catch (err: any) {
      let msg = "Processing failed";
      if (err?.message) msg = err.message;
      // Handle duplicate response from edge function
      if (err?.context?.body) {
        try {
          const body = typeof err.context.body === "string" ? JSON.parse(err.context.body) : err.context.body;
          if (body?.error) msg = body.error;
        } catch {}
      }
      updateStatus(i, "error", msg);
      console.error(`Failed to process ${entries[i].file.name}:`, err);
      return false;
    }
  };

  const handleUpload = async () => {
    const pendingIndices = entries
      .map((e, i) => (e.status === "pending" || e.status === "error" ? i : -1))
      .filter((i) => i >= 0);
    if (pendingIndices.length === 0) {
      toast.error("No files to process");
      return;
    }
    setUploading(true);

    // Process in batches of CONCURRENCY
    let successCount = 0;
    for (let start = 0; start < pendingIndices.length; start += CONCURRENCY) {
      const batch = pendingIndices.slice(start, start + CONCURRENCY);
      const results = await Promise.all(batch.map((i) => processOne(i)));
      successCount += results.filter(Boolean).length;
    }

    toast.success(`${successCount} of ${pendingIndices.length} resumes processed!`);
    setUploading(false);
    onUploadComplete();
  };

  const pendingCount = entries.filter((e) => e.status === "pending" || e.status === "error").length;
  const doneCount = entries.filter((e) => e.status === "done").length;
  const totalCount = entries.length;
  const overallProgress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const isActive = (s: FileStatus) => s === "uploading" || s === "parsing";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Upload className="h-5 w-5 text-primary" />
          Upload Resumes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 group/drop ${
            uploading
              ? "border-muted cursor-not-allowed opacity-50"
              : "border-border hover:border-primary/50 hover:bg-primary/[0.02] cursor-pointer"
          }`}
          onClick={() => !uploading && document.getElementById("file-input")?.click()}
        >
          <div className="mx-auto mb-3 w-14 h-14 rounded-xl bg-gradient-to-br from-[hsl(var(--primary)/0.12)] to-[hsl(var(--accent)/0.08)] flex items-center justify-center shadow-sm group-hover/drop:shadow-md transition-shadow duration-300">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground">
            Drop resumes here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PDF, DOCX, TXT — max 10MB each
          </p>
          <input
            id="file-input"
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {entries.length > 0 && (
          <div className="space-y-2">
            {uploading && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Overall progress</span>
                  <span>{doneCount}/{totalCount}</span>
                </div>
                <Progress value={overallProgress} className="h-2" glowing />
              </div>
            )}
            {entries.map((entry, i) => {
              const cfg = statusConfig[entry.status];
              const active = isActive(entry.status);
              const staggerMs = addedAt[entry.file.name]
                ? Math.max(0, addedAt[entry.file.name] - (addedAt[entries[0]?.file.name] || 0))
                : i * 80;
              return (
                <div
                  key={entry.file.name}
                  style={{ animationDelay: `${staggerMs}ms` }}
                  className={`animate-slide-in-up relative flex items-center gap-2 p-2 rounded-md transition-all duration-300 overflow-hidden ${
                    entry.status === "done"
                      ? "bg-[hsl(var(--success)/0.06)]"
                      : entry.status === "error"
                      ? "bg-[hsl(var(--destructive)/0.06)] animate-shake"
                      : active
                      ? "bg-[hsl(var(--primary)/0.04)] border-l-2 border-l-primary"
                      : "bg-muted"
                  }`}
                >
                  {active && (
                    <div className="absolute inset-0 animate-shimmer pointer-events-none" />
                  )}

                  <FileText className={`h-4 w-4 shrink-0 ${active ? "text-primary animate-pulse" : "text-primary"}`} />

                  <div className="flex-1 min-w-0 relative z-10">
                    <span className="text-sm truncate block">{entry.file.name}</span>
                    {entry.error && (
                      <span className="text-[10px] text-destructive">{entry.error}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                    <span className="text-xs text-muted-foreground">
                      {(entry.file.size / 1024).toFixed(0)}KB
                    </span>

                    {entry.status === "done" && (
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] animate-check-pop" />
                    )}
                    {entry.status === "error" && (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    {entry.status === "pending" && (
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    {active && (
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                          <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                          <span className="w-1 h-1 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                        </div>
                      </div>
                    )}

                    <span className={`text-[10px] font-medium ${
                      entry.status === "done" ? "text-[hsl(var(--success))]"
                      : entry.status === "error" ? "text-destructive"
                      : active ? "text-primary"
                      : "text-muted-foreground"
                    }`}>
                      {active ? cfg.stepLabel : cfg.label}
                    </span>
                  </div>

                  {!uploading && (
                    <button
                      onClick={() => removeFile(i)}
                      className="text-muted-foreground hover:text-destructive shrink-0 relative z-10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || pendingCount === 0}
          className="w-full"
        >
          {uploading ? (
            <span className="flex items-center gap-2">
              Processing
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-primary-foreground animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 rounded-full bg-primary-foreground animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 rounded-full bg-primary-foreground animate-bounce [animation-delay:300ms]" />
              </span>
            </span>
          ) : (
            `Upload & Parse ${pendingCount} Resume${pendingCount !== 1 ? "s" : ""}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
