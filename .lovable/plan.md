

## Human-Crafted Visual Polish Pass

### Overview
Address 10 specific "AI tells" to make the UI feel intentionally designed rather than template-generated. Focus on visual hierarchy, asymmetry, brand warmth, and micro-details.

### Changes

**1. `src/index.css` — Typography & spacing rhythm**
- Increase heading font-weight usage of Space Grotesk (use letter-spacing, size contrast)
- Add a subtle noise texture CSS utility class (optional, for card backgrounds)
- Add custom utility for "text-balance" on headings
- Refine progress bar colors to use branded gradients instead of flat semantic colors

**2. `src/components/CandidateCard.tsx` — Card hierarchy & score ring**
- Replace the plain score circle with a ring progress indicator (SVG circle with stroke-dasharray)
- Limit visible skill badges to 3-4, with a "+N more" overflow
- Truncate long skill text with ellipsis
- Make candidate name larger/bolder, push email to smaller muted text
- Add a subtle left-border accent color based on score tier (green/amber/red)
- Remove "Match Score" label redundancy — the ring speaks for itself
- Tighten spacing between related elements (name+email, score+label)

**3. `src/components/AppSidebar.tsx` — Brand personality**
- Remove "v1.0 Pro" footer text
- Add a subtle tagline or wordmark under "CV RANKER" (e.g., small muted text "Smart Hiring")
- Add section label "Navigation" above links with a subtle separator
- Give active nav item a left border accent instead of just background highlight
- Add a subtle gradient or brand mark to the sidebar header area

**4. `src/pages/CandidateDetail.tsx` — Detail page hierarchy**
- Make the score percentage larger with a ring visualization matching the card
- Add subtle section dividers between score breakdown rows
- Style "AI Analysis" card with a distinct left-border or subtle background tint
- Make "Matched Skills" and "Missing Skills" headings smaller, let badges do the talking

**5. `src/components/StatsSummary.tsx` — Visual weight**
- Add subtle icon backgrounds (small circles behind the icons)
- Vary stat card sizes — make the primary stat (total candidates or top score) slightly larger

**6. `src/pages/Dashboard.tsx` — Layout asymmetry**
- Make the "New Job Description" form card slightly offset or with a different visual weight than the empty state hero
- Add a subtle "tip" or contextual hint below the form in muted text

**7. `tailwind.config.ts` — Add gradient utilities**
- Add a branded gradient for progress bars (purple-to-blue instead of flat green)
- Add a score-tier color map utility

### Files to Modify
- `src/index.css`
- `src/components/CandidateCard.tsx`
- `src/components/AppSidebar.tsx`
- `src/pages/CandidateDetail.tsx`
- `src/components/StatsSummary.tsx`
- `src/pages/Dashboard.tsx`
- `tailwind.config.ts`

