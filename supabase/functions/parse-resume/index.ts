import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlobReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function extractDocxText(base64: string): Promise<string> {
  const binary = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const blob = new Blob([binary]);
  const reader = new ZipReader(new BlobReader(blob));
  const entries = await reader.getEntries();
  const docEntry = entries.find(e => e.filename === "word/document.xml");
  if (!docEntry || !docEntry.getData) {
    await reader.close();
    return "";
  }
  const xml = await docEntry.getData(new TextWriter());
  await reader.close();
  return xml
    .replace(/<w:p[^>]*>/g, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

const SYSTEM_PROMPT = "You are a resume parser. Extract structured data from resumes. Be thorough and accurate. For experience_years, estimate total years of professional experience. For skills, include all technical and soft skills mentioned.";

const TOOL_SCHEMA = {
  name: "extract_resume_data",
  description: "Extract structured data from a resume",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string", description: "Full name of the candidate" },
      email: { type: "string", description: "Email address" },
      skills: { type: "array", items: { type: "string" }, description: "All skills (technical and soft)" },
      education: { type: "string", description: "Highest education level and field" },
      experience_years: { type: "number", description: "Total years of professional experience" },
      experience_roles: {
        type: "array",
        items: {
          type: "object",
          properties: { title: { type: "string" }, company: { type: "string" }, duration: { type: "string" }, description: { type: "string" } },
          required: ["title", "company"],
        },
        description: "Work experience entries",
      },
      projects: {
        type: "array",
        items: {
          type: "object",
          properties: { name: { type: "string" }, description: { type: "string" }, technologies: { type: "array", items: { type: "string" } } },
          required: ["name"],
        },
        description: "Projects",
      },
      certifications: { type: "array", items: { type: "string" }, description: "Certifications" },
      quality_score: { type: "number", description: "Resume quality 0-100 based on completeness, structure, and clarity" },
    },
    required: ["name", "skills", "experience_years", "quality_score"],
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_description_id, resume_url, resume_filename, file_base64, mime_type, resume_text } = await req.json();
    if (!job_description_id) throw new Error("job_description_id is required");
    if (!file_base64 && !resume_text) throw new Error("file_base64 or resume_text is required");

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const isDocx = mime_type && (
      mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime_type === "application/msword" ||
      (resume_filename && /\.docx?$/i.test(resume_filename))
    );
    const isPdf = mime_type === "application/pdf";
    const isImage = mime_type && mime_type.startsWith("image/");

    // Build Claude content blocks
    let contentBlocks: any[];

    if (file_base64 && isDocx) {
      console.log("Extracting text from DOCX file...");
      const extractedText = await extractDocxText(file_base64);
      if (!extractedText || extractedText.length < 20) {
        throw new Error("Could not extract meaningful text from DOCX file");
      }
      contentBlocks = [{ type: "text", text: `Parse this resume and extract structured data:\n\n${extractedText}` }];
    } else if (file_base64 && isPdf) {
      contentBlocks = [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: file_base64 } },
        { type: "text", text: "Parse this resume document and extract all structured data including name, email, skills, education, experience, projects, and certifications." },
      ];
    } else if (file_base64 && isImage) {
      contentBlocks = [
        { type: "image", source: { type: "base64", media_type: mime_type, data: file_base64 } },
        { type: "text", text: "Parse this resume document and extract all structured data including name, email, skills, education, experience, projects, and certifications." },
      ];
    } else if (resume_text) {
      contentBlocks = [{ type: "text", text: `Parse this resume and extract structured data:\n\n${resume_text}` }];
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        tools: [TOOL_SCHEMA],
        tool_choice: { type: "tool", name: "extract_resume_data" },
        messages: [{ role: "user", content: contentBlocks }],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("Claude API response:", status, body);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Claude API error: ${status} - ${body}`);
    }

    const aiResult = await response.json();
    const toolUse = aiResult.content?.find((b: any) => b.type === "tool_use");
    const parsed = toolUse?.input || {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Duplicate check by name or email
    const candidateName = parsed.name || "";
    const candidateEmail = parsed.email || "";
    if (candidateName && candidateName !== "Unknown") {
      const { data: nameMatch } = await supabase
        .from("candidates")
        .select("id, name")
        .eq("job_description_id", job_description_id)
        .ilike("name", candidateName)
        .limit(1);
      if (nameMatch && nameMatch.length > 0) {
        return new Response(JSON.stringify({ error: `Duplicate: candidate "${candidateName}" already exists for this job` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    if (candidateEmail) {
      const { data: emailMatch } = await supabase
        .from("candidates")
        .select("id, email")
        .eq("job_description_id", job_description_id)
        .ilike("email", candidateEmail)
        .limit(1);
      if (emailMatch && emailMatch.length > 0) {
        return new Response(JSON.stringify({ error: `Duplicate: a candidate with email "${candidateEmail}" already exists for this job` }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { data, error } = await supabase
      .from("candidates")
      .insert({
        job_description_id,
        name: parsed.name || "Unknown",
        email: parsed.email || null,
        skills: parsed.skills || [],
        education: parsed.education || null,
        experience_years: parsed.experience_years || 0,
        experience_roles: parsed.experience_roles || [],
        projects: parsed.projects || [],
        certifications: parsed.certifications || [],
        resume_url: resume_url || null,
        resume_filename: resume_filename || null,
        parsed_data: parsed,
        quality_score: parsed.quality_score || 0,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ candidate: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
