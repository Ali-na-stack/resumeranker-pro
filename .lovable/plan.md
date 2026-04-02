

## Remove Lovable Favicon

### Changes

**1. Delete `public/favicon.ico`** — Remove the existing Lovable icon file.

**2. Update `index.html`** — Add an empty SVG favicon so browsers don't fall back to the old cached icon:
```html
<link rel="icon" href="data:," />
```

This gives a blank/empty tab icon with no branding.

### Files to Modify
- Delete: `public/favicon.ico`
- Edit: `index.html`

