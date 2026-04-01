

## Plan: Improve Upload UX, Loading States, and Candidate Card Navigation

### 1. Server-Side PDF Parsing in `parse-resume` Edge Function

**Problem:** Currently, PDF/DOCX text extraction happens client-side with `file.text()`, which produces garbled binary output for non-text files.

**Solution:** Send the raw file as base64 to the `parse-resume` edge function. The edge function will decode it and pass the content to the AI model, which can handle raw text extraction from PDF content. For PDFs specifically, use `pdftotext`-style extraction on the server or pass the base64 directly to the AI model (Gemini supports document understanding).

**Changes:**
- **`src/lib/api.ts`** — Update `parseResume` to accept a base64-encoded file and MIME type instead of extracted text. Remove the `extractTextFromFile` function.
- **`src/components/ResumeUpload.tsx`** — Convert files to base64 before sending. Remove client-side text extraction step.
- **`supabase/functions/parse-resume/index.ts`** — Accept `file_base64` and `mime_type`. Pass the file content to Gemini as a document/inline data part for direct parsing (Gemini supports PDF natively).

### 2. Improved File Upload UX

**Changes to `src/components/ResumeUpload.tsx`:**
- Add per-file processing status indicators (pending/uploading/parsing/done/error) with icons
- Show a progress bar for overall batch progress
- Add file size validation (reject files > 10MB)
- Add duplicate file detection (by name)
- Disable drag-drop area during upload
- Show success/error state per file after processing

### 3. Improved Loading States

**Changes to `src/pages/Dashboard.tsx`:**
- Add skeleton loading cards while candidates are loading (instead of just a spinner)
- Show a loading overlay on the job description form during analysis
- Add a shimmer/skeleton state for the candidate grid

**Changes to `src/components/JobDescriptionForm.tsx`:**
- Add animated step indicators during analysis ("Analyzing description...", "Extracting requirements...")

### 4. Candidate Card Navigation Fix

**Current state:** The card already has `onClick={() => navigate(...)}` on line 46. The buttons already have `e.stopPropagation()` on line 128. This should already work.

**Improvement:** Add visual hover indicator (arrow icon) to make it clear cards are clickable. Add the job query param to ensure the detail page loads correctly.

### Files to Modify
- `supabase/functions/parse-resume/index.ts` — Accept base64 file, use Gemini's native document parsing
- `src/lib/api.ts` — Update parseResume signature, remove extractTextFromFile
- `src/components/ResumeUpload.tsx` — Base64 conversion, per-file status UI, validation
- `src/pages/Dashboard.tsx` — Skeleton loading for candidate grid
- `src/components/CandidateCard.tsx` — Add hover arrow indicator

