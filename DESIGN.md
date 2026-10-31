# Design: mehrdadzaker.com

The existing Haley Park theme is retained. This system records its use for the personal portfolio redesign.

## System

- Genre: editorial
- Shape: portfolio index, with detailed project records on the Work page
- Theme: forest vellum, parchment typography, and architectural hairlines
- Audience: hiring teams, clients, and collaborators
- The name and portrait lead the homepage; real projects and research provide the substance

## Tokens

`assets/css/hallmark/tokens.css` contains the shared scale and aliases.
The original colour and font values remain in `assets/css/hailey-park.scss`.

- Pine: `--hp-pine`, #143930
- Parchment: `--hp-parchment`, #f8f2de
- Cedar: `--hp-cedar`, #456859
- Tan: `--hp-tan`, #bead89
- Display name: MZ Vellum Display
- Reading text and section headings: MZ Vellum Text
- Container: 1440px, with responsive gutters
- Small-screen body text: 19px

## Components

- The framed masthead, navigation shortcuts, and theme control stay
- Project cards are flat, with real artwork and a single linked destination
- Experience and writing entries share the project card treatment, with existing site imagery, titles, and metadata
- Pinned repositories retain their exploratory or research context
- Long project descriptions use a 65-character reading measure
- Actions use the existing parchment outline and a 44px minimum target
- Focus rings appear immediately; hover does not move or enlarge images

## Motion

The site remains still apart from user-driven state and the existing Game of Life.
Reduced motion is respected. Reading content remains visible without JavaScript.

## Exports

- `assets/css/refinement.css`: portfolio refinements and the Hallmark record
- `assets/css/hallmark/tokens.css`: shared tokens
- `assets/css/hallmark/base.css`: accessibility and browser defaults
