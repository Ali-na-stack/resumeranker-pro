import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { BlobReader, ZipReader, TextWriter } from "https://deno.land/x/zipjs@v2.7.32/index.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Extract text from DOCX by reading word/document.xml from the zip and stripping XML tags
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
  
  // Strip XML tags, decode basic entities, collapse whitespace
  const text = xml
    .replace(/<w:p[^>]*>/g, "\n") // paragraph breaks
    .replace(/<[^>]+>/g, " ")     // strip all tags
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  
  return text;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_description_id, resume_url, resume_filename, file_base64, mime_type, resume_text } = await req.json();
    if (!job_description_id) throw new Error("job_description_id is required");
    if (!file_base64 && !resume_text) throw new Error("file_base64 or resume_text is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Determine how to send content to the AI
    let userContent: any;
    const isImage = mime_type && (mime_type.startsWith("image/") || mime_type === "application/pdf");
    const isDocx = mime_type && (
      mime_type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mime_type === "application/msword" ||
      (resume_filename && /\.docx?$/i.test(resume_filename))
    );

    if (file_base64 && isDocx) {
      // Extract text from DOCX and send as plain text
      console.log("Extracting text from DOCX file...");
      const extractedText = await extractDocxText(file_base64);
      if (!extractedText || extractedText.length < 20) {
        throw new Error("Could not extract meaningful text from DOCX file");
      }
      userContent = `Parse this resume and extract structured data:\n\n${extractedText}`;
    } else if (file_base64 && isImage) {
      // Use multimodal for PDFs and images
      userContent = [
        {
          type: "text",
          text: "Parse this resume document and extract all structured data including name, email, skills, education, experience, projects, and certifications. Be thorough and accurate."
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mime_type};base64,${file_base64}`
          }
        }
      ];
    } else if (resume_text) {
      userContent = `Parse this resume and extract structured data:\n\n${resume_text}`;
    } else {
      throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract structured data from resumes. Be thorough and accurate. For experience_years, estimate total years of professional experience. For skills, include all technical and soft skills mentioned.`
          },
          {
            role: "user",
            content: userContent
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_resume_data",
            description: "Extract structured data from a resume",
            parameters: {
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
                    properties: {
                      title: { type: "string" },
                      company: { type: "string" },
                      duration: { type: "string" },
                      description: { type: "string" },
                    },
                    required: ["title", "company"],
                    additionalProperties: false,
                  },
                  description: "Work experience entries"
                },
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      technologies: { type: "array", items: { type: "string" } },
                    },
                    required: ["name"],
                    additionalProperties: false,
                  },
                  description: "Projects"
                },
                certifications: { type: "array", items: { type: "string" }, description: "Certifications" },
                quality_score: { type: "number", description: "Resume quality 0-100 based on completeness, structure, and clarity" },
              },
              required: ["name", "skills", "experience_years", "quality_score"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_resume_data" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const body = await response.text();
      console.error("AI gateway response:", status, body);
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status} - ${body}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

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
