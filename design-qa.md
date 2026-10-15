# Haley Park theme comparison

Date: 2026-10-15
final result: passed

## Findings

No actionable P0, P1, or P2 findings remain in the reviewed states. This passes the theme transfer with the user's existing content and requested custom font alternatives; it does not claim identical proprietary font outlines or identical page lengths.

The live source is [Haley Park](https://haleypark.design/), selected through the [Refero reference](https://styles.refero.design/style/c47654a9-7d7a-4b2c-8e0a-cd9296719c69). The implementation reviewed here is [the local Jekyll preview](http://127.0.0.1:4000/). This report records the design review before publication; deployment and live verification are reported separately in the release conversation.

## Capture and comparison evidence

All evidence files are in `/Users/mehrdad/.codex/visualizations/2026/10/14/01a1388c-d8b5-74a0-8612-84167d4444a9/`.

| View | Source visual truth | Implementation screenshot | Combined comparison |
| --- | --- | --- | --- |
| Desktop homepage, pine, navigation closed, top of page | `haley-source-desktop.png` | `theme-final-desktop.png` | `theme-final-comparison.png` |
| Mobile homepage, pine, navigation closed, top of page | `haley-source-mobile.png` | `theme-final-mobile.png` | `theme-final-mobile-comparison.png` |
| Nameplate and font detail | Crop of desktop source | Crop of desktop implementation | `theme-focus-nameplate.png` |
| Navigation frame, text, and keycaps | Crop of desktop source | Crop of desktop implementation | `theme-focus-navigation.png` |

Desktop CSS viewport: 1440 × 1000. Source raster: 1425 × 990; implementation: 1430 × 993. Mobile CSS viewport: 390 × 844. Source raster: 375 × 812; implementation: 380 × 822. Device pixel ratio: 1. The browser provider omits slightly different edge areas. Paired images crop both sides to the common 1425 × 990 or 375 × 812 pixels without resizing, then add a 32px label band. Focused comparisons retain native screenshot scale. These are composition and detail comparisons, not pixel-difference scores.

Additional reviewed implementation states: `theme-final-full-desktop.png`, `theme-about-desktop.png`, `theme-about-mobile.png`, `theme-work-desktop.png`, `theme-work-mobile.png`, `theme-contact-desktop.png`, `theme-contact-mobile.png`, `theme-contact-light-mobile.png`, `theme-reading-desktop.png`, and `theme-menu-mobile.png`. The light capture is taken after the existing 200ms color transition settles.

## Required fidelity surfaces

| Surface | Assessment |
| --- | --- |
| Fonts and typography | Original MZ Vellum Display carries the 96px desktop nameplate and primary page introductions. MZ Vellum Text is an attributed Cormorant Light derivative with true italics. Source hierarchy is retained: 32px project titles, 27.2px italic dividers, 21px long-form text, and 13–16px metadata/navigation. Mobile display type scales to fit. The custom shapes differ visibly from BN Wispy and PP Editorial Old, as expected from the user's later request to build similar fonts. Font loading, accents, spacing, editable sources, and clipping are checked through the font and browser suites. |
| Spacing and layout rhythm | Centered desktop nameplate with italic side notes; work index immediately follows the introduction. Framed 66px navigation, visible 24px keycaps, 26–51px gutters, 26px project column gaps, 51px mobile row gaps, borderless entries, centered dividers, and full architectural drawing space. About's inherited width and Work's obsolete icon column are corrected. |
| Colors and tokens | Pine `#143930`, parchment `#f8f2de`, cedar `#456859`, and tan `#bead89`. Shared vellum texture matches the source's visible grain. No inherited gradients, card fills, or elevation remain in the tested routes. Parchment reading mode reverses text/background tokens and remains readable. |
| Images and assets | Cathedral, rose window, ornamental frame, navigation terminal, cross, and texture use actual source assets rather than approximate drawings. SVG fills are transparent, strokes remain one pixel when scaled, and texture is shared as WebP. The source artwork provenance is recorded in `assets/images/haley-reference/README.md`. Existing user photographs and media remain intact. |
| Copy and content | The baseline covers 46 HTML pages: body text, headings, links/destinations, media attributes, titles, metadata, canonicals, and structured data. Explicit exceptions are limited to the requested email gate, employer/patent identifier removal, career timeline removal, layout reordering, and accurate font credit. Before publishing, the existing test's approved transformations were serialized into `public-content-approved.json`, so the public fixture does not republish removed details. It was not regenerated from the current site; the original capture's SHA256 is retained as provenance. |

## Comparison history

1. **P1: Composition and artwork drift.** The earlier homepage opened with a conventional profile and Game of Life, small dividers, and approximate decorative art. `theme-before-comparison.png` records this state. Moved the existing work/writing indices forward, centered the nameplate and side notes, and transferred the actual source architectural assets and navigation frame.
2. **P2: Clipped cathedral, weak grain, undersized dividers/mobile nameplate.** `theme-iteration-one-comparison.png` and `theme-review-mobile-comparison.png` show intermediate states. Increased the architectural section's drawing space, matched the live source's divider/project scales, strengthened the shared texture, enlarged mobile display type, and refined the original display font's stroke contrast. Fresh desktop/mobile combined images show the complete central arch and revised hierarchy.
3. **P2: About heading offset.** A legacy 780px parent width shifted the introduction 279px off viewport center. Removed that width constraint and centered its retained paragraph. The public heading-center test first failed, then passed; `theme-about-desktop.png` and `theme-about-mobile.png` show the correction.
4. **P2: Work title collapse after decorative marks were hidden.** Review found an obsolete 32px/28px icon column receiving the remaining heading. A browser test confirmed a 32px-wide heading before the fix. Reset the header to a single flexible column and aligned its text/evidence. The same test now passes at desktop/mobile widths; fresh Work captures confirm readable headings.
5. **Indexing correction.** Excluded the artwork provenance note and this QA report from Jekyll output. The final crawl graph contains 31 sitemap URLs and 46 HTML pages with zero indexing errors.
6. **Build-host date consistency.** The first CI run found UTC offsets in article JSON-LD where the baseline used Chicago offsets. A local `TZ=UTC` production build reproduced the exact failure. Pinning `timezone: America/Chicago` in Jekyll makes the same UTC-host build pass all 42 browser checks without changing article text or calendar dates.

## Intentional differences and limits

- Retained the user's five navigation destinations, brand, theme control, calls to action, longer copy, photographs, and interactive Game of Life. The mobile menu accommodates those destinations. The original reference has three navigation links and shorter project names.
- The source About route uses blue; the requested forest palette is applied consistently to this site's routes.
- The custom fonts pursue the requested aesthetic and remain editable. Display is independently drawn; Text preserves its documented OFL derivative origin.
- Email uses a visible addition-question reveal gate. The encoded address is still accessible to a determined client-side scraper; this is basic scraping deterrence rather than server-enforced CAPTCHA protection.
- The review verifies current local output. It does not remove historical repository copies or external employer/patent records.

## Validation and implementation checklist

- [x] Opened source, implementation, full-view paired comparisons, and focused detail comparisons.
- [x] Reviewed all five fidelity surfaces and desktop/mobile layouts.
- [x] Fixed identified P1/P2 issues and captured revised views.
- [x] 42 website browser tests pass, including 46-page content preservation, email reveal/error/reset, primary navigation, navigation-focused shortcuts, About disclosure, theme switching, and Game of Life controls/performance/reduced motion.
- [x] Nine font release tests and two standalone specimen browser tests pass.
- [x] Unpacked the downloadable font kit and rebuilt it; all six font hashes and all three packaged website webfonts match.
- [x] Six existing Python tests, site validation, indexing validation, and whitespace checks pass.
- [x] Browser console error inspection returned no site errors on the inspected article and final homepage.
- [x] Source/public-output scans find no employer or identifying patent references outside excluded regression fixtures/tests.
- [x] CI now runs the complete website browser suite against its built production artifact.
- [x] Restored the user's homepage preview in pine mode, with the temporary mobile viewport override removed.

## Follow-up polish

No blocking polish remains. Further refinement of the independent display font is an aesthetic iteration, with the current editable UFO/source kit available for that work.
