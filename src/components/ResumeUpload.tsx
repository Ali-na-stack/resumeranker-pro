import { useState, useCallback } from "react";
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
  uploading: { label: "Uploading", stepLabel: "Step 1/2" },
  parsing: { label: "AI Parsing", stepLabel: "Step 2/2" },
  done: { label: "Done" },
  error: { label: "Failed" },
};

const CONCURRENCY = 3;

export function ResumeUpload({ jobDescriptionId, onUploadComplete }: ResumeUploadProps) {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);

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
      return [...prev, ...valid.filter((v) => {
        if (existingNames.has(v.file.name)) {
          toast.error(`${v.file.name}: already added`);
          return false;
        }
        return true;
      })];
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
      if (err?.context?.body) {
        try {
          const body = typeof err.context.body === "string" ? JSON.parse(err.context.body) : err.context.body;
          if (body?.error) msg = body.error;
        } catch {}
      }
      updateStatus(i, "error", msg);
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
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-display font-medium text-sm">Upload Resumes</h3>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`border border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          uploading
            ? "border-border/50 cursor-not-allowed opacity-50"
            : "border-border hover:border-primary/40 cursor-pointer"
        }`}
        onClick={() => !uploading && document.getElementById("file-input")?.click()}
      >
        <Upload className="h-5 w-5 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-foreground/70">Drop files here or click to browse</p>
        <p className="text-[11px] text-muted-foreground mt-1">PDF, DOCX, TXT — max 10MB</p>
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
        <div className="mt-3 space-y-1.5">
          {uploading && (
            <div className="space-y-1 mb-2">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Progress</span>
                <span>{doneCount}/{totalCount}</span>
              </div>
              <Progress value={overallProgress} className="h-1.5" glowing />
            </div>
          )}
          {entries.map((entry, i) => {
            const cfg = statusConfig[entry.status];
            const active = isActive(entry.status);
            return (
              <div
                key={entry.file.name}
                className={`flex items-center gap-2 p-2 rounded-md text-sm transition-colors ${
                  entry.status === "done"
                    ? "bg-[hsl(var(--success))]/[0.05]"
                    : entry.status === "error"
                    ? "bg-destructive/[0.05]"
                    : active
                    ? "bg-primary/[0.04]"
                    : "bg-muted/50"
                }`}
              >
                <FileText className={`h-3.5 w-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                <span className="flex-1 min-w-0 truncate text-xs">{entry.file.name}</span>
                {entry.error && <span className="text-[10px] text-destructive truncate max-w-[100px]">{entry.error}</span>}

                <span className={`text-[10px] shrink-0 ${
                  entry.status === "done" ? "text-[hsl(var(--success))]"
                  : entry.status === "error" ? "text-destructive"
                  : active ? "text-primary"
                  : "text-muted-foreground"
                }`}>
                  {active ? cfg.stepLabel : cfg.label}
                </span>

                {entry.status === "done" && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))] shrink-0" />}
                {entry.status === "error" && <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                {entry.status === "pending" && <Clock className="h-3 w-3 text-muted-foreground shrink-0" />}
                {active && <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />}

                {!uploading && (
                  <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive shrink-0">
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
        className="w-full mt-3"
      >
        {uploading ? "Processing..." : `Upload & Parse ${pendingCount} Resume${pendingCount !== 1 ? "s" : ""}`}
      </Button>
    </div>
  );
}
