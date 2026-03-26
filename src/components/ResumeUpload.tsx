import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { uploadResumeFile, extractTextFromFile, parseResume } from "@/lib/api";
import { toast } from "sonner";

interface ResumeUploadProps {
  jobDescriptionId: string;
  onUploadComplete: () => void;
}

export function ResumeUpload({ jobDescriptionId, onUploadComplete }: ResumeUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.type === "application/pdf" ||
        f.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        f.type === "text/plain"
    );
    setFiles((prev) => [...prev, ...dropped]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }
    setUploading(true);
    setProgress({ current: 0, total: files.length });

    let successCount = 0;
    for (let i = 0; i < files.length; i++) {
      setProgress({ current: i + 1, total: files.length });
      try {
        const file = files[i];
        // Upload file to storage
        const resumeUrl = await uploadResumeFile(file, jobDescriptionId);
        // Extract text
        const text = await extractTextFromFile(file);
        // Parse with AI
        await parseResume(jobDescriptionId, text, resumeUrl, file.name);
        successCount++;
      } catch (err) {
        console.error(`Failed to process ${files[i].name}:`, err);
      }
    }

    toast.success(`${successCount} of ${files.length} resumes processed!`);
    setFiles([]);
    setUploading(false);
    setProgress(null);
    onUploadComplete();
  };

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
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById("file-input")?.click()}
        >
          <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Drop resumes here or click to browse
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Supports PDF, DOCX, and TXT files
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

        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-md bg-muted"
              >
                <FileText className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm truncate flex-1">{file.name}</span>
                <span className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={uploading || files.length === 0}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing {progress?.current}/{progress?.total}...
            </>
          ) : (
            `Upload & Parse ${files.length} Resume${files.length !== 1 ? "s" : ""}`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
