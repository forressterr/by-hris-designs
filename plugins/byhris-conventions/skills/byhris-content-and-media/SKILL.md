---
name: byhris-content-and-media
description: Use when adding or editing site content — works, projects, labs copy — in by-hris-designs. Use when tempted to hardcode content inside a component. Use when choosing, generating, or replacing an image or other media asset.
---

# By_Hris Content & Media Rules

## The Iron Rule

**Content lives in `src/data/projects.ts`; media decisions belong to the user.**

## Content

- `src/data/projects.ts` is the single source of truth for Works, Projects, and Labs content. Components stay presentational — never fork copy or data into a component.
- A headless CMS (Sanity) is planned as Phase 4 of the rework; until then, edits happen in `projects.ts` only.

## Media

- Image/asset choices are the user's call: offer options with a recommendation, **never auto-apply new imagery**. Plumbing already-chosen assets through the code is fine without asking.
- Static assets live in `public/`.
- The 11 `<img>` sites are deliberately not `next/image` yet (deferred fast-follow); the hero image's eager load is a deliberate decision. Don't "fix" either in passing.
