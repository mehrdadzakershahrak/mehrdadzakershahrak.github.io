---
layout: single
title: "Content Authoring Guide"
description: "How to add AI material, podcast entries, citations, calls to action, and minimal image placeholders on the public site."
permalink: /docs/content-authoring/
classes: wide content-authoring-page
toc: true
toc_label: "Authoring sections"
last_modified_at: 2026-04-23
---

Last updated: 2026-04-23

The public site uses one written AI library for guides, notes, explainers, and references. Add new written material to `_ai_material/`, preserve the public URL with an explicit `permalink`, and choose the smallest metadata set that makes the page useful in hubs, search, sitemap output, and structured data.

## Written AI Material

Use `_ai_material/` for written AI content:

- `guide`: source-backed resource guide with FAQ schema and a service CTA.
- `note`: newsletter-style issue or essay that appears in Writing.
- `reference`: evergreen technical material that belongs in Resources without turning a service page into a long guide.
- `explainer`: short educational page that can appear in topic views later.

Required fields:

```yaml
title: "Working title"
description: "One sentence for SEO, cards, and search results."
excerpt: "One sentence for hubs and feeds."
permalink: /resources/working-title/
date: 2026-04-23
last_modified_at: 2026-04-23
author: "Mehrdad Zaker"
content_type: "guide"
audience: "Who this is for"
topics:
  - "Private AI"
```

Resource guides also require:

```yaml
resource_guide: true
pillar: "Private AI Deployment"
order: 1
problem_label: "Pilot stuck"
ui_tags:
  - "Private LLM"
resource_cta:
  title: "Turn the pilot into a controlled deployment"
  copy: "Describe the implementation path without promising unverified outcomes."
  url: "/private-ai-deployment/"
  label: "Review deployment path"
faqs:
  - question: "What should the reader decide first?"
    answer: "Answer directly and keep it source-safe."
```

Newsletter-style notes should include a `cta` block so the page always has a next step:

```yaml
cta:
  title: "Review the deployment layer"
  copy: "Use a focused review when retrieval, evaluation, or deployment constraints are blocking launch."
  url: "/contact/"
  label: "Start the review"
```

## URLs And Hubs

Keep public URLs stable with explicit permalinks. Existing resource guides stay under `/resources/.../`, existing newsletter entries stay under `/newsletter/.../`, and new evergreen references can use `/resources/.../`.

Hubs read from metadata instead of hand-maintained lists:

- `/resources/` shows `resource_guide: true` guides and `content_type: reference` entries.
- `/newsletter/` and `/newsletter/archive/` show `content_type: note` entries.
- Homepage Writing pulls from `_ai_material/` by date.
- Local search and sitemap output include published collection documents automatically.

## Sources And Claims

Use external sources for public claims about market behavior, privacy, security, benchmarks, standards, and production risk. Avoid exact client performance numbers unless they are verified and approved for public use. When private engagement details are useful, keep them anonymized and qualitative.

For source-backed guides, include citations inline in the body and keep FAQ answers concise. FAQ schema is generated from the `faqs` front matter for pages marked `resource_guide: true`.

## Images

Images are optional. Use minimal imagery by default.

Use a final image only when it adds real information:

```yaml
image: /assets/images/example.webp
image_alt: "Specific description of the image content"
```

When a final image is not available, use a small editorial placeholder:

```yaml
image_placeholder: "Local inference stack"
```

Do not add broken image paths. Do not add decorative media only to fill space.

## Podcast Entries

Keep podcast entries in `_podcast_entries/` for now. Required fields are `title`, `description`, `excerpt`, `date`, `last_modified_at`, `author`, `topic`, `topics`, and `content_type: episode`. If `image_url` is set, add `image_alt`.

## Publish Checks

Run the local checks before publishing:

```bash
python3 tools/validate_site.py
PATH="$HOME/.rbenv/shims:/opt/homebrew/bin:$PATH" bundle _4.0.7_ exec jekyll build --destination /tmp/mdz-content-check
PATH="/opt/homebrew/bin:$HOME/.rbenv/shims:$PATH" npm run test:e2e
```

The tests verify that primary pages keep one visible `h1`, old public UI markers are absent, local resources do not 404, AI material appears in hubs/search/sitemap output, image placeholders render intentionally, and representative components remain readable in light and dark mode.
