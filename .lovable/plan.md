
## Fix Resume Viewer Blocking Issue

### Diagnosis
Do I know what the issue is? Yes.

The resume file is not missing. The app is opening the storage URL directly in a new browser tab, and your screenshot shows Chrome blocking that external file page with `ERR_BLOCKED_BY_CLIENT`. That means the current approach can fail even when the file exists. It also means switching between public URLs and signed URLs is not enough if the browser still has to navigate to that same external storage domain.

### What I’ll change

1. `src/lib/api.ts`
- Replace the current URL-opening approach with a helper that downloads the resume file through the storage SDK.
- Support both stored formats already in your database:
  - legacy full public URLs
  - newer raw storage file paths
- Convert the downloaded file into a local `blob:` URL for browser-safe opening.
- Return filename/content-type info so the UI can decide whether to preview or download.

2. `src/pages/CandidateDetail.tsx`
- Update the `ResumeButton` to use an async click handler with a loading state.
- For previewable files like PDF, open the generated local `blob:` URL in a new tab.
- For DOC/DOCX or if the tab cannot be opened, fall back to downloading the file instead of sending the user to a blocked page.
- Pass `resume_filename` into the button so the fallback uses the proper file name.
- Revoke temporary object URLs after use to avoid memory leaks.

3. Cleanup
- Remove the direct `window.open(resumeUrl, "_blank")` behavior.
- Remove the old signed-URL dependency from the candidate page so resume access uses one reliable flow.

### Why this should fix it
- The browser will open a local `blob:` URL instead of navigating to the blocked external storage page.
- Existing candidate records will still work without a migration.
- Newer path-based records will also work with the same helper.

### Technical details
- No database migration needed.
- No storage bucket change needed.
- No authentication change needed.
- This is a client-side file access fix, not a resume parsing or data storage problem.

### Files to modify
- `src/lib/api.ts`
- `src/pages/CandidateDetail.tsx`

### QA
- Verify one PDF resume opens correctly from the candidate page.
- Verify one DOCX resume downloads correctly when preview is not supported.
- Verify both legacy full-URL records and newer file-path records work.
