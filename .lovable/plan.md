

## Visual Polish Pass — Professional UI Upgrade

### Overview
Transform the app from a typical AI-generated look to a polished, professional SaaS product through targeted visual improvements across CSS, sidebar, cards, empty states, and micro-interactions.

### Changes

**1. `src/index.css` — Foundation overhaul**
- Remove the dot grid `background-image` on `body`
- Remove the global `* { transition-colors duration-150 }` (causes sluggish feel)
- Add a subtle warm gradient background instead (light: soft blue-gray gradient, dark: deep navy gradient)
- Add animation keyframes: `fade-in`, `scale-in`, `slide-up` for micro-interactions
- Add utility classes: `.hover-lift` (subtle translateY + shadow on hover), `.glass-card` (frosted glass effect for cards)

**2. `src/components/AppSidebar.tsx` — Distinctive sidebar**
- Replace the plain `Sparkles` icon with a gradient-styled brand mark (colored div with initials "CR")
- Add a subtle gradient overlay to the sidebar background
- Style active nav items with a pill-shaped highlight instead of `border-l-2`
- Add hover animation to nav items (slight scale + background transition)
- Add a version badge or "Pro" label in the footer for polish

**3. `src/components/StatsSummary.tsx` — Elevated stat cards**
- Add subtle gradient backgrounds per stat type (e.g., blue tint for Total, green for Shortlisted)
- Add a number counter animation effect on mount
- Increase visual weight of the stat value with larger font

**4. `src/components/EmptyState.tsx` — Refined empty states**
- Replace the plain circle icon with an illustrated-style composition (layered shapes, gradient background)
- Add fade-in animation on mount
- Add a decorative pattern or floating dots behind the icon

**5. `src/components/CandidateCard.tsx` — Card micro-interactions**
- Add `animate-fade-in` with staggered delay per card index (pass index as prop)
- Improve hover state: subtle lift (`translateY(-2px)`) + enhanced shadow
- Add a subtle gradient overlay on the score circle

**6. `src/components/ResumeUpload.tsx` — Polish drop zone**
- Add a gradient border animation on hover for the drop zone
- Improve the icon styling with a gradient background circle

**7. `src/pages/Dashboard.tsx` — Layout polish
- Add fade-in animation to main content sections
- Pass card index to CandidateCard for staggered animations

**8. `tailwind.config.ts` — Animation utilities**
- Add `fade-in`, `scale-in`, `slide-up` animation definitions
- Add `hover-lift` utility

### Files to Modify
- `src/index.css`
- `tailwind.config.ts`
- `src/components/AppSidebar.tsx`
- `src/components/StatsSummary.tsx`
- `src/components/EmptyState.tsx`
- `src/components/CandidateCard.tsx`
- `src/components/ResumeUpload.tsx`
- `src/pages/Dashboard.tsx`

