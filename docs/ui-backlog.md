---
layout: single
title: "Current UI Backlog"
description: "Active stabilization backlog for the public editorial UI."
permalink: /docs/ui-backlog/
classes: wide ui-backlog-page
toc: true
toc_label: "Backlog sections"
last_modified_at: 2026-04-23
---

Last updated: 2026-04-23

This backlog tracks the current public UI stabilization pass after the full editorial migration. The goal is to keep every public route on the editorial shell, remove retired old-UI surfaces from active output, and preserve a clean local verification path.

## Resolved In This Pass

- `P0` `/search/` moved from the inherited Minimal Mistakes search shell to the editorial UI while preserving the existing Lunr search input and query behavior.
- `P0` The backlog page now renders as a public editorial document at `/docs/ui-backlog/` instead of a stale raw markdown page.
- `P1` Shared runtime includes no longer load the retired scroll-reveal script.
- `P1` Active analytics code no longer binds retired legacy data attributes, FAQ, RAG demo, or old theme-toggle selectors.
- `P1` Unreferenced legacy masthead, carousel, RAG demo, about-page, and carousel bleed assets were removed from the repo.
- `P1` Playwright coverage now includes `/search/` and `/docs/ui-backlog/` in the public UI shell, resource, overflow, and local-resource checks.

## Open Follow-Up

- `P2` Split the remaining token/theme dependencies out of `assets/css/main.scss` so public pages can eventually stop shipping the large legacy stylesheet safely.

## Acceptance Checks

- Public routes return OK and render exactly one visible `h1`.
- Public navigation keeps the flat editorial order: Work, Writing, Resources, About, Contact.
- Generated public HTML does not expose placeholder markers, old page-title wrappers, old sidebars, old page-content wrappers, or retired prefixed UI wrappers.
- Primary pages have no horizontal overflow at `390`, `768`, and `1440` widths.
- Browser console checks report no page errors and no local CSS, JavaScript, or image 404s.

## Verification Commands

```bash
python3 tools/validate_site.py
PATH="$HOME/.rbenv/shims:/opt/homebrew/bin:$PATH" bundle _4.0.7_ exec jekyll build --destination /tmp/ui-backlog-fix
PATH="/opt/homebrew/bin:$HOME/.rbenv/shims:$PATH" npm run test:e2e
```
