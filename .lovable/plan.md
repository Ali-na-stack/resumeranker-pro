

## Remove Lovable Branding

### What changes
Only `index.html` needs updating — it contains all user-visible Lovable branding (title, meta tags, OG image). Everything else (edge function API keys, vite config, playwright config, package.json) is internal tooling that must stay untouched.

### File: `index.html`
- Change `<title>` from "Lovable App" to "Intelligent CV Ranking System"
- Update `<meta name="description">` to "AI-powered CV ranking system for recruiters"
- Change `<meta name="author">` to your name or organization
- Update `og:title` and `og:description` to match
- Remove the Lovable OG image URL (or replace with your own)
- Remove the `@Lovable` Twitter site reference
- Remove the TODO comments

No other files contain user-facing Lovable branding. The sidebar already shows "CV Ranker" as the app name.

