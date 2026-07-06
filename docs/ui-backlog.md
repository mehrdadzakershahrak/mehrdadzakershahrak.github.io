---
layout: single
title: "Current UI Backlog"
description: "Stabilization backlog for the minimal public editorial UI."
permalink: /docs/ui-backlog/
classes: wide ui-backlog-page
toc: true
toc_label: "Backlog sections"
last_modified_at: 2026-04-23
---

Last updated: 2026-04-23

This backlog tracks the current public UI after the minimalist site pass. The goal is to keep every public route on the editorial shell, remove retired product/search/login surfaces from active output, and preserve a clean local verification path.

## Resolved In This Pass

- `P0` The public navigation is reduced to Work, Writing, About, and Contact.
- `P0` Product catalogue, login, search, and product-specific routes are retired.
- `P1` The homepage uses a compact personal profile, proof strip, focus list, selected work, writing, and contact.
- `P1` The About page is shortened and avoids employer-specific naming.
- `P1` Playwright coverage now checks the simplified routes and retired-route behavior.

## Open Follow-Up

- `P2` Split the remaining token/theme dependencies out of `assets/css/main.scss` so public pages can eventually stop shipping legacy styles safely.

## Acceptance Checks

- Public routes return OK and render exactly one visible `h1`.
- Public navigation keeps the flat editorial order: Work, Writing, About, Contact.
- Generated public HTML does not expose placeholder markers, old page-title wrappers, old sidebars, old page-content wrappers, or retired prefixed UI wrappers.
- Primary pages have no horizontal overflow at `390`, `768`, and `1440` widths.
- Browser console checks report no page errors and no local CSS, JavaScript, or image 404s.

## Verification Commands

```bash
python3 tools/validate_site.py
PATH="$HOME/.rbenv/shims:/opt/homebrew/bin:$PATH" bundle _4.0.7_ exec jekyll build --destination /tmp/ui-backlog-fix
PATH="/opt/homebrew/bin:$HOME/.rbenv/shims:$PATH" npm run test:e2e
```
