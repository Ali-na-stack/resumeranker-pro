

## Fix Resume Viewer Blocked Page

### Problem
When clicking "View Original Resume", the code calls `window.open(blobUrl, "_blank")` for PDFs. Chrome blocks blob URLs opened in new tabs, showing `ERR_BLOCKED_BY_CLIENT`. The download itself works, but the blocked tab opens too.

### Solution
Remove the `window.open` call entirely. Always use the anchor-element download approach for both PDFs and non-PDFs. This keeps the download behavior you like and stops the blocked page from appearing.

### Changes

**`src/pages/CandidateDetail.tsx` — `ResumeButton` component (lines 39-58)**
- Remove the `if (contentType.includes("pdf"))` branch that uses `window.open`
- Always create an anchor element, set `a.href = blobUrl` and `a.download = filename`, then click it
- Revoke the blob URL after a short delay

### Files to Modify
- `src/pages/CandidateDetail.tsx`

