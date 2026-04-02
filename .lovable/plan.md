

## Enhanced Resume Processing Animations

### Overview
Replace the basic spinner animations with richer, more engaging visual feedback during resume processing — including a pulsing progress bar, animated file rows with shimmer effects, and step-indicator transitions.

### Changes

**1. `src/index.css` — Add new keyframes**
- `shimmer`: horizontal gradient sweep for active file rows
- `pulse-glow`: subtle glow pulse for the progress bar
- `check-pop`: scale bounce for the done checkmark

**2. `src/components/ui/progress.tsx` — Animated progress bar**
- Add a shimmer/glow overlay on the indicator when animating
- Add a subtle pulse effect to the bar during processing

**3. `src/components/ResumeUpload.tsx` — Enhanced file row animations**
- Active row (uploading/parsing) gets a shimmer background sweep and a subtle left-border accent that pulses
- Add step indicators: show "Step 1/2 — Uploading" → "Step 2/2 — AI Parsing" instead of just status text
- Done rows get a pop-in checkmark animation (scale bounce)
- Error rows get a subtle shake animation
- Progress bar gets a gradient glow effect while processing
- Button text shows a typing-dot animation ("Processing...") with animated ellipsis

### Files to Modify
- `src/index.css` — New keyframes (shimmer, pulse-glow, check-pop, shake)
- `src/components/ui/progress.tsx` — Glow overlay on indicator
- `src/components/ResumeUpload.tsx` — Enhanced row styling, step labels, animated transitions

