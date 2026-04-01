

## Mobile Responsive Design Pass

### Overview
The app already uses Tailwind's responsive grid system, so the basic layout adapts. However, several areas need mobile-specific fixes for proper usability on small screens.

### Changes

**1. Dashboard Header (`src/pages/Dashboard.tsx`)**
- Make the job selector full-width on mobile (currently fixed `w-[250px]` overflows)
- Stack header items vertically on small screens
- Reduce padding on mobile (`p-6` to `p-4` on small screens)

**2. Candidates Page Filters (`src/pages/CandidatesPage.tsx`)**
- Stack filter controls vertically on mobile instead of horizontal flex-wrap
- Make job selector responsive (`w-[250px]` to `w-full sm:w-[250px]`)
- Make sort selector full-width on mobile
- Min score slider: full width on mobile

**3. Candidate Detail Page (`src/pages/CandidateDetail.tsx`)**
- Reduce main padding on mobile (`p-6` to `p-4`)
- Ensure action buttons wrap properly on small screens
- Make the header title truncate on mobile to prevent overflow

**4. Compare Page (`src/pages/ComparePage.tsx`)**
- Add horizontal scroll for the comparison grid on mobile (currently `grid-cols-{N}` would be too narrow)
- Or stack candidates vertically on mobile with a toggle

**5. Global / Sidebar**
- The sidebar already uses `collapsible="icon"` which works on mobile via `SidebarTrigger`
- Add `viewport` meta tag check in `index.html` (likely already present)
- Ensure touch targets are at least 44px on mobile for buttons

### Files to Modify
- `src/pages/Dashboard.tsx` — Responsive header, padding
- `src/pages/CandidatesPage.tsx` — Responsive filters
- `src/pages/CandidateDetail.tsx` — Responsive padding and layout
- `src/pages/ComparePage.tsx` — Horizontal scroll or stacked view on mobile
- `src/components/ResumeUpload.tsx` — Ensure drag area sizing works on mobile

