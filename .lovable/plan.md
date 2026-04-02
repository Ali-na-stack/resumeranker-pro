

## Premium UI Redesign — CV Ranker

### Overview
Transform the current template-style dashboard into a premium, Linear/Vercel-inspired recruiter tool. Deep navy dark aesthetic, restrained indigo accents, cleaner typography hierarchy, less visual noise, and a new AI Insight component. All existing functionality preserved.

### Design Direction
- **Dark-first**: Deep navy/charcoal backgrounds (not pure black), soft borders
- **Accent**: Indigo/violet for primary actions and AI elements only
- **Cards**: Not every section gets a bordered card — use flat sections, subtle dividers, and varied surface treatments
- **Typography**: Stronger size contrast between headings, body, and labels
- **Spacing**: More breathing room between sections (8-12px → 16-24px gaps)

---

### Changes by File

**1. `src/index.css` — Color system & surface treatments**
- Revise CSS variables for a deeper, more premium dark palette (charcoal base, softer borders)
- Lighten the light mode slightly for better contrast
- Add utility class `.surface-elevated` for subtle raised sections (no border, just shadow)
- Add `.surface-inset` for recessed/quiet sections
- Tone down existing hover effects (reduce glow intensity)
- Add a subtle text-gradient utility for hero headings

**2. `tailwind.config.ts` — Typography & animation refinements**
- Add `tracking-tight` defaults for display font
- No structural changes needed

**3. `src/components/AppSidebar.tsx` — Refined sidebar**
- Cleaner brand area: Remove gradient badge, use a simple text wordmark with a thin accent line
- Tighter nav items with softer active state (no border-left, use a subtle background pill)
- Theme toggle as a simple icon button, not a full-width row
- Bias reduction toggle stays but with cleaner styling
- Add a subtle separator between brand and nav

**4. `src/pages/Dashboard.tsx` — Layout hierarchy overhaul**
- Header: Remove card-like background, use a clean borderless header with stronger title typography
- When no job selected: Simplify the empty state — less decorative, more purposeful
- When job selected:
  - Stats summary at top (unchanged component, restyled)
  - Left column: Job form + Upload as flat sections (not bordered cards), separated by spacing
  - Right column: Section title "Ranked Candidates" with count badge
  - Add new **AI Insight card** between stats and candidates grid
- "Rank All Candidates" button: Use gradient accent treatment (only button that gets special treatment)
- Export buttons: Quieter, ghost-style

**5. `src/components/StatsSummary.tsx` — Recruiter-specific metrics**
- Rename labels: "Total Candidates" → "Uploaded", add "Strong Matches" (score ≥ 75), "Needs Review" (score 40-74)
- Simplify visual treatment: Remove gradient backgrounds, use flat cards with a thin top-border accent color
- Keep animated numbers

**6. New: `src/components/AIInsight.tsx` — Smart hiring summary**
- A single elegant card that appears when candidates have scores
- Generates 2-3 insight lines from candidate data:
  - "N candidates match 75%+ of role requirements"
  - "Most common missing skill: [skill]"
  - "Top candidate scored X% overall"
- Styled with a subtle indigo left border and a small sparkle/brain icon
- No AI call needed — computed from existing score data on the client

**7. `src/components/CandidateCard.tsx` — Premium card redesign**
- Remove left border accent (too template-y)
- Cleaner layout:
  - Top: Avatar + Name + Experience on left, Score ring on right (keep ScoreRing component)
  - Middle: Top 3 matched skills only, as subtle pills (muted background, no colorful first-badge)
  - Show 1-2 missing skills as muted red text (not badges)
  - Bottom: Two-button layout — "Shortlist" (primary, prominent) and "View Profile" (outline) as main CTAs. Reject/Bookmark/Delete as icon-only buttons in a separate row or overflow
- Remove hover-lift transform (too bouncy) — use a simple border-highlight on hover
- Keep the existing click-to-navigate behavior
- Keep checkbox for compare

**8. `src/components/JobDescriptionForm.tsx` — Cleaner form**
- Remove Card wrapper — render as a flat section with a section title
- Style textarea with a softer border and more padding
- CTA button: Slightly more prominent with a subtle gradient
- Analysis steps: Keep but make more subtle (smaller text, less visual weight)

**9. `src/components/ResumeUpload.tsx` — Modern upload zone**
- Remove Card wrapper — flat section with section title
- Dropzone: Simpler dashed border, larger padding, cleaner icon
- File list: Tighter rows, no background color variations (use a simple left-border for active items)
- Keep all existing batch logic

**10. `src/pages/CandidateDetail.tsx` — Detail page refinement**
- Header: Cleaner, no card background
- Score section: Keep ScoreRing, make it larger (120px), add subtle background
- Score bars: Remove separators, use tighter spacing
- AI Analysis card: Keep the left-border treatment, soften background
- Skills cards: Remove card borders, use flat layout with section headers
- Action buttons: Cleaner spacing, keep all functionality

**11. `src/pages/CandidatesPage.tsx` — Filter bar refinement**
- Cleaner header styling
- Filter controls: Inline, no visual weight changes needed — just align with new color system

**12. `src/components/EmptyState.tsx` — Simpler empty state**
- Remove the decorative gradient circles behind the icon
- Use a simple muted icon + text stack
- Less vertical padding

**13. `src/pages/ComparePage.tsx` — Align with new card style**
- Minimal changes: Let the new color system flow through
- Keep all comparison logic

---

### Technical Notes
- No database changes
- No new dependencies (no Framer Motion — use CSS transitions for micro-interactions)
- No routing changes
- All Supabase integration, export buttons, bias reduction, dark/light mode preserved
- The AI Insight component is purely computed from existing candidate score data

### Files to Create
- `src/components/AIInsight.tsx`

### Files to Modify
- `src/index.css`
- `tailwind.config.ts`
- `src/components/AppSidebar.tsx`
- `src/components/CandidateCard.tsx`
- `src/components/StatsSummary.tsx`
- `src/components/JobDescriptionForm.tsx`
- `src/components/ResumeUpload.tsx`
- `src/components/EmptyState.tsx`
- `src/pages/Dashboard.tsx`
- `src/pages/CandidateDetail.tsx`
- `src/pages/CandidatesPage.tsx`
- `src/pages/ComparePage.tsx`

