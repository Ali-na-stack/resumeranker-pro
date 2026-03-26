import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { title, description } = await req.json();
    if (!description) throw new Error("Job description is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

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
            content: `You are a job description analyzer. Extract structured requirements from job descriptions. Return data using the provided tool.`
          },
          {
            role: "user",
            content: `Analyze this job description and extract all requirements:\n\n${description}`
          }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_job_requirements",
            description: "Extract structured requirements from a job description",
            parameters: {
              type: "object",
              properties: {
                required_skills: { type: "array", items: { type: "string" }, description: "Must-have skills" },
                preferred_skills: { type: "array", items: { type: "string" }, description: "Nice-to-have skills" },
                min_experience_years: { type: "number", description: "Minimum years of experience required" },
                education_requirements: { type: "array", items: { type: "string" }, description: "Education requirements" },
                key_responsibilities: { type: "array", items: { type: "string" }, description: "Main job responsibilities" },
              },
              required: ["required_skills", "preferred_skills", "min_experience_years", "education_requirements"],
              additionalProperties: false,
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_job_requirements" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    const parsed = toolCall ? JSON.parse(toolCall.function.arguments) : {};

    // Save to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const allSkills = [...(parsed.required_skills || []), ...(parsed.preferred_skills || [])];

    const { data, error } = await supabase
      .from("job_descriptions")
      .insert({
        title: title || "Untitled Position",
        description,
        parsed_skills: allSkills,
        parsed_requirements: parsed,
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ job: data, parsed_requirements: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-job error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
