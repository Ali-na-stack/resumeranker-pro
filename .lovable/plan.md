

## Switch Resume Parsing to Claude API

### Overview
Your `ANTHROPIC_API_KEY` secret is now stored. The plan is to update the `parse-resume` edge function to call Claude's Messages API instead of the Lovable AI gateway.

### Changes — `supabase/functions/parse-resume/index.ts`

**Auth & endpoint:**
- Read `ANTHROPIC_API_KEY` instead of `LOVABLE_API_KEY`
- Call `https://api.anthropic.com/v1/messages` with `x-api-key` and `anthropic-version: 2023-06-01` headers
- Use model `claude-sonnet-4-20250514`

**Request format adaptation (Claude's API differs from OpenAI-style):**
- Move system prompt to top-level `system` field
- For PDFs: use Claude's native `document` content block (`{ type: "document", source: { type: "base64", media_type: "application/pdf", data: "..." } }`)
- For DOCX: keep existing text extraction, send as text content
- For images: use Claude's `image` content block
- Use Claude's `tools` format with `tool_choice: { type: "tool", name: "extract_resume_data" }`

**Response parsing:**
- Extract from `content[].type === "tool_use"` block instead of `choices[0].message.tool_calls[0]`
- Parse `input` field instead of `function.arguments`

**Everything else stays the same** — DOCX extraction logic, database insert, error handling structure, CORS headers, and the frontend code.

### No other files change
The frontend calls `supabase.functions.invoke("parse-resume", ...)` with the same payload — no client-side changes needed.

