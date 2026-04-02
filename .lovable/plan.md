

## Add Delete Candidate Feature

### Overview
Add the ability to delete candidates from the list. A delete button will appear on each candidate card, with a confirmation dialog to prevent accidental deletions.

### Changes

**1. `src/lib/api.ts` — Add `deleteCandidate` function**
- Delete from `candidate_scores` where `candidate_id` matches
- Delete from `candidate_statuses` where `candidate_id` matches
- Delete from `candidates` where `id` matches
- Note: `candidate_scores` currently lacks a DELETE RLS policy, so a migration is needed

**2. Database migration — Add missing DELETE policies**
- Add DELETE policy on `candidate_scores` table (currently missing)
- `candidate_statuses` also lacks DELETE — add there too

**3. `src/components/CandidateCard.tsx` — Add delete button**
- Add a `Trash2` icon button in the action bar (next to Shortlist/Reject/Save)
- Wrap in an `AlertDialog` confirmation ("Are you sure? This cannot be undone.")
- On confirm, call `deleteCandidate` then trigger `onStatusChange` to refresh the list

### Files to Modify
- `src/lib/api.ts` — New `deleteCandidate` function
- `src/components/CandidateCard.tsx` — Delete button + confirmation dialog
- Database migration — DELETE RLS policies on `candidate_scores` and `candidate_statuses`

