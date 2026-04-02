

## Improve Duplicate Candidate Detection

### Problem
Currently, duplicate detection only checks if a file with the same **filename** already exists for a job. This means two different candidates submitting files named `resume.pdf` would be flagged as duplicates, while the same candidate uploading under different filenames would slip through.

### Solution
After the resume is parsed by AI (which extracts name and email), check for an existing candidate with the **same name or email** under the same job description. Keep the filename check as a fast pre-filter, but add a post-parse content-based check.

### Changes

**1. `src/lib/api.ts`**
- Add `checkDuplicateCandidateByContent(jobDescriptionId, name, email)` that queries the `candidates` table matching on `name` (case-insensitive) or `email` (case-insensitive) for the given job
- Returns `true` if a match is found

**2. `supabase/functions/parse-resume/index.ts`**
- After AI parsing extracts candidate data, before inserting into the `candidates` table, query for existing candidates with the same name or email under the same job description
- If a duplicate is found, return an error response with a clear message instead of inserting

**3. `src/components/ResumeUpload.tsx`**
- Keep the existing filename pre-check as a quick first pass
- Handle the new duplicate error from the edge function gracefully, showing a specific message like "Duplicate: candidate John Doe already exists for this job"

### Files to Modify
- `supabase/functions/parse-resume/index.ts` — Add post-parse duplicate check before DB insert
- `src/components/ResumeUpload.tsx` — Display content-based duplicate errors

