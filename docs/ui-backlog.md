# UI Backlog: Ultra Enhancement Pass

Last updated: 2026-04-19

## Summary

Create an "ultra enhancement" UI backlog based on local review of:

- `http://127.0.0.1:4000/`
- `http://127.0.0.1:4000/resources/`
- `http://127.0.0.1:4000/resources/private-llm-pilot-to-production/`

Primary findings:

- The homepage hero is visually strong and should be preserved.
- The new resource hub is useful but reads as a plain content index, not as a first-class private AI content pillar.
- Resource article pages currently bury the opening source-backed paragraph below an oversized table of contents, weakening readability and first-viewport impact.

## P0: Fix Resource Article Reading Experience

Redesign the `resource-entry-page` article experience so the article starts with immediate authority and the first source-backed paragraph appears in the first viewport on desktop and mobile.

### Scope

- Move the table of contents from a full-width block above the article body into a sticky right rail on desktop.
- Replace the mobile full TOC block with a collapsed "In this guide" disclosure that remains keyboard-accessible.
- Add a compact article header with:
  - Pillar label
  - Article title
  - Description or excerpt
  - Published date
  - Two or three metadata chips such as "Private LLM", "RAG", "Evaluation", "Security", or "Governance"
- Preserve a single visible `h1` per article.
- Keep the article body source-backed and readable without adding marketing-heavy wrapper copy.

### Acceptance Criteria

- First body paragraph top is below `520px` on desktop.
- First body paragraph top is below `620px` on mobile.
- TOC remains keyboard-accessible.
- Article pages retain exactly one `h1`.
- Article pages still render generated Article and FAQ JSON-LD.

## P1: Upgrade Resource Hub Into A Visual Hub

Turn `/resources/` from a plain list into a visually distinct private AI resource hub that feels connected to the existing homepage visual language.

### Scope

- Replace the plain intro with a first-viewport hub hero using the existing private-AI direction:
  - Dark technical band
  - Clear resource-hub positioning
  - Source-backed guide framing
  - Primary CTA into "How to Move a Private LLM from Pilot to Production"
- Convert guide cards into richer pillar cards with:
  - Numbered markers
  - Topic badges
  - Visible source and FAQ indicators
  - Clear hierarchy where article titles dominate labels
- Add a compact "choose by problem" strip above the cards:
  - Pilot stuck
  - Hallucinations
  - Secure RAG
  - Reliability
  - Regulated tradeoffs
- Keep contextual links to `/private-ai-deployment/`, `/custom-ai-systems/`, `/idx/assistant/`, `/ai-robotics-solutions/`, and `/contact/`.

### Acceptance Criteria

- At least two guide cards are visible on mobile without awkward clipping.
- At least three guide cards are visible on desktop.
- No horizontal overflow at `390px`, `768px`, or `1440px`.
- The hub immediately reads as a resource destination, not a generic Markdown page.

## P1: Improve Homepage Resource Integration

Make the Private AI Resource Hub clearly discoverable from the homepage without weakening the existing hero.

### Scope

- Preserve the current homepage hero.
- Upgrade "Selected insights" so the resource hub does not appear as a generic feed card.
- Add a focused resource-hub feature row with:
  - One large guide card for the strongest resource
  - Two compact supporting links to related guides or service pages
  - Data sourced from `_data/home_feed.yml` where practical
- Keep spacing coherent around FAQ, search, newsletter, and service sections.

### Acceptance Criteria

- The resource hub is discoverable from the homepage within normal scanning distance.
- FAQ and search sections are not pushed into incoherent spacing.
- Homepage visual hierarchy remains stronger than the new resource feature row.

## P1: Add Resource-Specific CSS System

Add scoped styles for resource experiences without globally changing established components.

### Scope

- Add resource-specific styles for `.resource-entry-page`.
- Add a dedicated resource hub wrapper class for `/resources/`.
- Reuse existing CSS variables, typography choices, button styles, and the dark teal technical direction.
- Avoid a new color system.
- Avoid global `.mdz-card` changes unless required by a shared bug.
- Keep card radius at or below the established local style unless matching an existing homepage hero surface.

### Acceptance Criteria

- Homepage, IDX, newsletter, and service pages avoid visual regressions.
- Resource-specific styling remains scoped and easy to remove or revise.
- No one-off page styles leak into generic cards or masthead behavior.

## P2: Add Article Navigation And Conversion Blocks

Improve guide-to-guide flow and service conversion without duplicating footer links.

### Scope

- Add an end-of-article "Next best guide" block before footer pagination, using `resource_guides` collection order.
- Add a restrained CTA band after the first third of each long resource guide.
- Route CTA links by guide topic:
  - Private LLM pilot to production: `/private-ai-deployment/`
  - Grounding and document-heavy AI: `/idx/assistant/`
  - Secure enterprise RAG: `/custom-ai-systems/`
  - Reliability evaluation: `/contact/`
  - Regulated-industry tradeoffs: `/private-ai-deployment/`
- Add a "Source-backed guide" note near citations only if it improves clarity without looking like marketing copy.

### Acceptance Criteria

- Internal links remain contextual.
- CTA blocks do not duplicate every page's footer links.
- Resource guides keep a calm technical editorial tone.

## P2: Mobile Navigation Polish

Ensure the mobile resource hub and article pages feel intentionally designed, not just stacked desktop content.

### Scope

- Use compact guide cards with stable spacing.
- Keep CTAs visible without crowding body copy.
- Prevent text overflow in badges, chips, and buttons.
- Keep the existing mobile masthead behavior unless testing reveals overlap or tap-target issues.

### Acceptance Criteria

- Resource hub passes screenshot review at `390x844` and `430x932`.
- Resource article pages pass screenshot review at `390x844` and `430x932`.
- There is no horizontal overflow at common mobile widths.
- Mobile article opening content is visible without scrolling through the full TOC.

## Implementation Surfaces

Primary backlog artifact:

- `docs/ui-backlog.md`

Likely code surfaces for future implementation:

- `resources.md`
- `_layouts/single.html`
- `_includes/resource_guide_faq.html`
- `_resource_guides/*.md`
- `assets/css/main.scss`
- `tests/e2e/website.spec.js`

Prefer front matter and collection data already present in `_resource_guides/` for labels, descriptions, ordering, dates, FAQ-driven metadata, and article routing. Avoid hard-coding repeated metadata in templates when the collection already carries it.

## Test Plan

Extend Playwright coverage for resource UI:

- `/resources/` desktop and mobile:
  - No horizontal overflow
  - Hub hero visible
  - Guide card links visible
  - At least two mobile cards and three desktop cards are visually reachable without awkward clipping
- `/resources/private-llm-pilot-to-production/` desktop and mobile:
  - Exactly one `h1`
  - First body paragraph visible within the target vertical threshold
  - TOC present and accessible
  - Article and FAQ schema still present
- Regression checks:
  - `/`
  - `/idx/assistant/`
  - `/private-ai-deployment/`

Add layout metric assertions or screenshot checks for:

- `390x844`
- `430x932`
- `768x1024`
- `1440x900`

Run before merging UI implementation:

```bash
bundle _4.0.7_ exec jekyll build --destination <tempdir>
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e
```

## Assumptions

- No existing UI backlog file was present, so `docs/ui-backlog.md` is the default backlog destination.
- The current homepage hero should be preserved.
- The highest-impact UI opportunity is resource hub and resource article presentation.
- The previous resource hub and content work remains in place and should not be reverted.
- "Ultra enhance" means a high-impact design backlog first, with implementation following this prioritized backlog.
