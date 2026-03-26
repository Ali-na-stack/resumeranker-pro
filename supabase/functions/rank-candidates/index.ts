import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { job_description_id } = await req.json();
    if (!job_description_id) throw new Error("job_description_id is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch job description
    const { data: job, error: jobError } = await supabase
      .from("job_descriptions")
      .select("*")
      .eq("id", job_description_id)
      .single();
    if (jobError || !job) throw new Error("Job description not found");

    // Fetch candidates
    const { data: candidates, error: candError } = await supabase
      .from("candidates")
      .select("*")
      .eq("job_description_id", job_description_id);
    if (candError) throw candError;
    if (!candidates || candidates.length === 0) throw new Error("No candidates found");

    const results = [];

    for (const candidate of candidates) {
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
              content: `You are a recruitment scoring system. Compare a candidate against a job description and provide detailed scoring.

Scoring weights:
- Skills match: 40% (match similar skills like "JS" = "JavaScript", "React.js" = "React")
- Experience relevance: 25%
- Education match: 15%
- Projects relevance: 10%
- Certifications: 10%

Each sub-score should be 0-100. Calculate overall_score as the weighted average.
Provide a clear, human-readable explanation of the scoring.`
            },
            {
              role: "user",
              content: `Job Description Requirements:
${JSON.stringify(job.parsed_requirements)}

All Required/Preferred Skills: ${JSON.stringify(job.parsed_skills)}

Candidate Profile:
Name: ${candidate.name}
Skills: ${JSON.stringify(candidate.skills)}
Education: ${candidate.education}
Experience: ${candidate.experience_years} years
Roles: ${JSON.stringify(candidate.experience_roles)}
Projects: ${JSON.stringify(candidate.projects)}
Certifications: ${JSON.stringify(candidate.certifications)}

Score this candidate against the job requirements.`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_candidate",
              description: "Score a candidate against job requirements",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Weighted overall score 0-100" },
                  skills_score: { type: "number", description: "Skills match score 0-100" },
                  experience_score: { type: "number", description: "Experience relevance score 0-100" },
                  education_score: { type: "number", description: "Education match score 0-100" },
                  projects_score: { type: "number", description: "Projects relevance score 0-100" },
                  certifications_score: { type: "number", description: "Certifications match score 0-100" },
                  matched_skills: { type: "array", items: { type: "string" }, description: "Skills that match the job requirements" },
                  missing_skills: { type: "array", items: { type: "string" }, description: "Required skills the candidate lacks" },
                  explanation: { type: "string", description: "Human-readable explanation of the scoring, 2-4 sentences" },
                },
                required: ["overall_score", "skills_score", "experience_score", "education_score", "projects_score", "certifications_score", "matched_skills", "missing_skills", "explanation"],
                additionalProperties: false,
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "score_candidate" } },
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        console.error(`AI error for candidate ${candidate.id}: ${status}`);
        continue;
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      const scored = toolCall ? JSON.parse(toolCall.function.arguments) : {};

      // Upsert score
      const { data: scoreData, error: scoreError } = await supabase
        .from("candidate_scores")
        .upsert({
          candidate_id: candidate.id,
          job_description_id,
          overall_score: scored.overall_score || 0,
          skills_score: scored.skills_score || 0,
          experience_score: scored.experience_score || 0,
          education_score: scored.education_score || 0,
          projects_score: scored.projects_score || 0,
          certifications_score: scored.certifications_score || 0,
          matched_skills: scored.matched_skills || [],
          missing_skills: scored.missing_skills || [],
          explanation: scored.explanation || "",
        }, { onConflict: "candidate_id,job_description_id" })
        .select()
        .single();

      if (scoreError) {
        console.error(`Score upsert error for ${candidate.id}:`, scoreError);
        continue;
      }

      // Create default status if not exists
      await supabase
        .from("candidate_statuses")
        .upsert({ candidate_id: candidate.id, status: "pending" }, { onConflict: "candidate_id" });

      results.push({ candidate, score: scoreData });

      // Small delay to avoid rate limits
      await new Promise(r => setTimeout(r, 500));
    }

    // Sort by overall score descending
    results.sort((a, b) => (b.score?.overall_score || 0) - (a.score?.overall_score || 0));

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rank-candidates error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
