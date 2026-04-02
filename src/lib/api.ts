import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ParsedRequirements {
  required_skills: string[];
  preferred_skills: string[];
  min_experience_years: number;
  education_requirements: string[];
  key_responsibilities?: string[];
}

export interface CandidateWithScore {
  id: string;
  name: string | null;
  email: string | null;
  skills: string[] | null;
  education: string | null;
  experience_years: number | null;
  experience_roles: any;
  projects: any;
  certifications: string[] | null;
  resume_url: string | null;
  resume_filename: string | null;
  parsed_data: any;
  quality_score: number | null;
  job_description_id: string;
  created_at: string;
  score?: {
    overall_score: number | null;
    skills_score: number | null;
    experience_score: number | null;
    education_score: number | null;
    projects_score: number | null;
    certifications_score: number | null;
    matched_skills: string[] | null;
    missing_skills: string[] | null;
    explanation: string | null;
  };
  status?: "pending" | "shortlisted" | "rejected" | "saved";
}

export async function analyzeJob(title: string, description: string) {
  const { data, error } = await supabase.functions.invoke("analyze-job", {
    body: { title, description },
  });
  if (error) {
    toast.error("Failed to analyze job description");
    throw error;
  }
  return data;
}

export async function parseResume(
  jobDescriptionId: string,
  file: File,
  resumeUrl?: string,
  resumeFilename?: string
) {
  // Convert file to base64 for server-side parsing
  const base64 = await fileToBase64(file);
  
  if (!base64) {
    toast.error("Failed to read file contents");
    throw new Error("Failed to convert file to base64");
  }

  const { data, error } = await supabase.functions.invoke("parse-resume", {
    body: {
      job_description_id: jobDescriptionId,
      file_base64: base64,
      mime_type: file.type || "application/octet-stream",
      resume_url: resumeUrl,
      resume_filename: resumeFilename,
    },
  });
  if (error) {
    // Try to extract detailed error from response
    const errMsg = data?.error || error?.message || "Failed to parse resume";
    toast.error(errMsg);
    throw new Error(errMsg);
  }
  return data;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:...;base64,)
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function rankCandidates(jobDescriptionId: string) {
  const { data, error } = await supabase.functions.invoke("rank-candidates", {
    body: { job_description_id: jobDescriptionId },
  });
  if (error) {
    toast.error("Failed to rank candidates");
    throw error;
  }
  return data;
}

export async function updateCandidateStatus(
  candidateId: string,
  status: "pending" | "shortlisted" | "rejected" | "saved"
) {
  const { error } = await supabase
    .from("candidate_statuses")
    .upsert({ candidate_id: candidateId, status }, { onConflict: "candidate_id" });
  if (error) {
    toast.error("Failed to update status");
    throw error;
  }
}

export async function fetchCandidatesWithScores(
  jobDescriptionId: string
): Promise<CandidateWithScore[]> {
  const { data: candidates, error: candError } = await supabase
    .from("candidates")
    .select("*")
    .eq("job_description_id", jobDescriptionId);
  if (candError) throw candError;
  if (!candidates) return [];

  const { data: scores } = await supabase
    .from("candidate_scores")
    .select("*")
    .eq("job_description_id", jobDescriptionId);

  const { data: statuses } = await supabase
    .from("candidate_statuses")
    .select("*")
    .in("candidate_id", candidates.map((c) => c.id));

  return candidates.map((c) => {
    const score = scores?.find((s) => s.candidate_id === c.id);
    const statusRow = statuses?.find((s) => s.candidate_id === c.id);
    return {
      ...c,
      score: score
        ? {
            overall_score: score.overall_score,
            skills_score: score.skills_score,
            experience_score: score.experience_score,
            education_score: score.education_score,
            projects_score: score.projects_score,
            certifications_score: score.certifications_score,
            matched_skills: score.matched_skills,
            missing_skills: score.missing_skills,
            explanation: score.explanation,
          }
        : undefined,
      status: (statusRow?.status as any) || "pending",
    };
  });
}

export async function uploadResumeFile(file: File, jobDescriptionId: string) {
  const filePath = `${jobDescriptionId}/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from("resumes").upload(filePath, file);
  if (error) {
    toast.error("Failed to upload file");
    throw error;
  }
  // Return the file path for signed URL generation later
  return filePath;
}

export async function downloadResumeAsBlob(resumeUrl: string): Promise<{ blobUrl: string; contentType: string }> {
  // Extract file path from full public URL or use as-is
  let filePath = resumeUrl;
  const publicPrefix = "/storage/v1/object/public/resumes/";
  const idx = resumeUrl.indexOf(publicPrefix);
  if (idx !== -1) {
    filePath = decodeURIComponent(resumeUrl.substring(idx + publicPrefix.length));
  }

  const { data, error } = await supabase.storage
    .from("resumes")
    .download(filePath);
  if (error) {
    toast.error("Failed to download resume");
    throw error;
  }

  const contentType = data.type || "application/octet-stream";
  const blobUrl = URL.createObjectURL(data);
  return { blobUrl, contentType };
}

export async function checkDuplicateCandidate(
  jobDescriptionId: string,
  filename: string
): Promise<boolean> {
  const { data } = await supabase
    .from("candidates")
    .select("id")
    .eq("job_description_id", jobDescriptionId)
    .eq("resume_filename", filename)
    .limit(1);
  return (data?.length || 0) > 0;
}

export async function fetchJobDescriptions() {
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteCandidate(candidateId: string) {
  await supabase.from("candidate_scores").delete().eq("candidate_id", candidateId);
  await supabase.from("candidate_statuses").delete().eq("candidate_id", candidateId);
  const { error } = await supabase.from("candidates").delete().eq("id", candidateId);
  if (error) {
    toast.error("Failed to delete candidate");
    throw error;
  }
}

export async function deleteJobDescription(id: string) {
  // Get all candidate IDs for this job
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id")
    .eq("job_description_id", id);
  const candidateIds = candidates?.map((c) => c.id) || [];

  if (candidateIds.length > 0) {
    await supabase.from("candidate_scores").delete().in("candidate_id", candidateIds);
    await supabase.from("candidate_statuses").delete().in("candidate_id", candidateIds);
  }
  await supabase.from("candidates").delete().eq("job_description_id", id);
  const { error } = await supabase.from("job_descriptions").delete().eq("id", id);
  if (error) {
    toast.error("Failed to delete job description");
    throw error;
  }
}
