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
  resumeText: string,
  resumeUrl?: string,
  resumeFilename?: string
) {
  const { data, error } = await supabase.functions.invoke("parse-resume", {
    body: {
      job_description_id: jobDescriptionId,
      resume_text: resumeText,
      resume_url: resumeUrl,
      resume_filename: resumeFilename,
    },
  });
  if (error) {
    toast.error("Failed to parse resume");
    throw error;
  }
  return data;
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
  const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function extractTextFromFile(file: File): Promise<string> {
  // For text files, read directly
  if (file.type === "text/plain") {
    return await file.text();
  }
  // For PDF/DOCX, read as text (basic extraction)
  // The AI model will handle imperfect text extraction
  const text = await file.text();
  // Clean up binary artifacts for PDF/DOCX
  const cleaned = text
    .replace(/[^\x20-\x7E\n\r\t]/g, " ")
    .replace(/\s{3,}/g, "\n")
    .trim();
  return cleaned || `[File: ${file.name} - Content could not be extracted client-side. The file has been uploaded for reference.]`;
}

export async function fetchJobDescriptions() {
  const { data, error } = await supabase
    .from("job_descriptions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteJobDescription(id: string) {
  const { error } = await supabase.from("job_descriptions").delete().eq("id", id);
  if (error) throw error;
}
