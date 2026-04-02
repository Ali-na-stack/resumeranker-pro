

## Add Delete Job Description Feature

### Overview
Add a delete button next to the job description selector so users can remove job descriptions they no longer need, with a confirmation dialog.

### Changes

**1. `src/pages/Dashboard.tsx`**
- Import `Trash2` from lucide-react and `AlertDialog` components
- Add a delete (trash) icon button next to the job selector dropdown
- Wrap it in an `AlertDialog` confirmation ("This will delete the job and all associated candidates. Are you sure?")
- On confirm, call `deleteJobDescription(selectedJob)`, then refresh jobs list and clear selection if the deleted job was selected

**2. No API changes needed**
`deleteJobDescription` already exists in `src/lib/api.ts`. The database already has a DELETE RLS policy on `job_descriptions`. Note: deleting a job won't cascade-delete candidates since there are no foreign keys — we'll also delete associated candidates, scores, and statuses in the handler.

**3. `src/lib/api.ts` — Enhance `deleteJobDescription`**
- Before deleting the job, also delete all `candidate_scores`, `candidate_statuses`, and `candidates` linked to that `job_description_id` to clean up orphaned data

### Files to Modify
- `src/pages/Dashboard.tsx` — Delete button + confirmation dialog in header
- `src/lib/api.ts` — Cascade-delete related records in `deleteJobDescription`

