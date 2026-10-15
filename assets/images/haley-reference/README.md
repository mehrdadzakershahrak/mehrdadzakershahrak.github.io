# Theme artwork sources

The architectural drawings, rose window, navigation terminal, cross ornament,
and vellum texture were captured from the visible Haley Park site on 2026-10-15
for the requested theme transfer.

- Design reference: https://styles.refero.design/style/c47654a9-7d7a-4b2c-8e0a-cd9296719c69
- Original visible artwork: https://haleypark.design/
- Original texture: https://haleypark.design/images/texture.png

The source SVG paths are retained. Colors are mapped to the selected forest
palette, strokes stay one pixel when scaled, and background fills are removed
so the drawings also work in the existing parchment reading mode. The texture
is exported as WebP and shared across the canvas instead of embedded repeatedly
inside the SVG drawings. The extracted cathedral and rose window are stored at
`../vellum-arches.svg` and `../vellum-rosette.svg`.

These decorations are separate from the MZ Vellum typefaces. No paid font
outlines or font files were extracted from the reference site.
