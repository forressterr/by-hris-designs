---
name: byhris-house-protocol
description: Use when starting any feature, phase, fix, or refactor in the by-hris-designs repo. Use when about to commit, push, open a PR, or merge. Use when deciding how to run a roadmap phase or where specs and plans live.
---

# By_Hris House Protocol

The working agreement for this repo. It encodes decisions already made — follow it instead of re-deriving process per session.

## The Iron Rule

**Every roadmap phase runs as one superpowers cycle — brainstorm → writing-plans → executing-plans — on its own branch, gated by `npm run check`, merged only after verification.**

## Workflow

- The authoritative roadmap is `docs/superpowers/BACKLOG.md`. Specs and plans are saved under `docs/superpowers/{specs,plans}/YYYY-MM-DD-<name>*.md` and committed.
- One branch per phase/change; open a PR; **never merge until verified**: `npm run check` green + GitHub Actions CI green + Vercel preview deployment `READY` + the `PROTOCOL.md` manual checks for anything user-visible.
- `npm run check` = lint + format:check + typecheck + `npm audit --audit-level=high` + build. It is the gate before every PR; CI runs the same five gates.

## Commits

- Conventional Commits, enforced by commitlint (husky `commit-msg` hook).
- Author every commit as `h.goretsov <gorecov4@gmail.com>` (use `--author=` — committer identity may differ).
- **No AI co-author trailer.** The message describes only the change.
- Tidy-first: structural changes (refactor/rename/format) and behavioral changes (feat/fix) go in separate commits.

## Environment

- Dev server: port **5170** via the preview launch config (`.claude/launch.json`), or 3000 plain `npm run dev`.
- Verify animations and page transitions via `npm run build && npm run start` — never trust `npm run dev` for this (React StrictMode breaks AnimatePresence exit animations in dev).
- Hosting: Vercel (team `by-hris-designs`), production domain https://www.byhris.cc. Framework preset is `nextjs` — project settings live on Vercel's side, not in the repo.
