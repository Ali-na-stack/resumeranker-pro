

## Professional Visual Polish — Recruiter-Focused

### Overview
Subtle, tasteful refinements that make the UI feel intentionally designed without overdoing it. No gimmicky spacing jitter — recruiters need clean, trustworthy interfaces. Focus on mixed interaction styles, staggered card animations, and minor visual variety.

### Changes

**1. `src/index.css` — Add 3 hover utility classes**
- `.hover-glow`: subtle primary box-shadow on hover
- `.hover-underline-accent`: accent-colored bottom border on hover
- `.hover-scale-sm`: 1.02 scale on hover (very subtle)

**2. `src/components/CandidateCard.tsx` — Mixed button styles & staggered animation**
- Shortlist button: add glow hover effect
- Reject button: add underline-accent hover effect  
- Bookmark button: add scale hover effect
- Vary `MAX_SKILLS` between 3-4 based on card index (subtle variety)
- Use non-linear animation delays: `index * 80 + (index % 3) * 15`ms
- First matched skill badge gets slightly stronger styling (`bg-primary/15`)

**3. `src/components/StatsSummary.tsx` — Subtle hover micro-interaction**
- Add smooth icon rotation (3deg) on card hover via group-hover

**4. `src/pages/CandidatesPage.tsx` — Pass index to CandidateCard**
- Add `index={i}` prop to each card in the grid map

### Files to Modify
- `src/index.css`
- `src/components/CandidateCard.tsx`
- `src/components/StatsSummary.tsx`
- `src/pages/CandidatesPage.tsx`

