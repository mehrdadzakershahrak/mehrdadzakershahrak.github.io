# MZ Vellum typefaces

This project builds installable fonts and webfonts for the manuscript theme. It is a way to make and edit your own typefaces with the delicate display lettering and literary serif character you liked in the reference.

The two families have different origins:

- **MZ Vellum Display** is independently drawn for this project. Its outlines are generated from the project's own geometric drawing instructions. It does not use outlines extracted from BN Wispy or another paid font.
- **MZ Vellum Text** is a derivative of Cormorant Garamond Light at its designed weight of 300, in upright and true italic styles. Its tuning narrows the proportions, slightly lifts the x-height, and rounds sharp serif corners; it retains each input font's complete glyph set. It is not an independently drawn replacement for PP Editorial Old, and changing the family name does not change that provenance.

These families pursue a similar broad aesthetic; they are not copies or exact matches of the paid fonts. The source font files and their notices remain part of the project.

Display revision 1.100 broadens upright strokes while retaining the thin horizontal hairlines. This gives the nameplate more calligraphic contrast at its 96px display size without changing the independent drawing source's origins.

## Set up an isolated build environment

Use **Python 3.11 or newer**. Unpack the complete kit and open a terminal in its root directory: the directory containing `tools/`, `tests/`, and `assets/`. The same commands work from the website repository root. Replace `/path/to/unpacked-kit` below with the folder you unpacked. The environment and generated package are siblings of the kit, so neither becomes part of the website's public assets.

```sh
cd /path/to/unpacked-kit
python3 -m venv ../mz-vellum-env
../mz-vellum-env/bin/python -m pip install -r tools/typefaces/requirements.txt
```

The dependencies are pinned in `tools/typefaces/requirements.txt`. This project uses Python, fontTools, Brotli, ufoLib2, and skia-pathops. Keep running the following commands from the kit root. You do not need to activate the environment because each command names its Python executable explicitly.

## Build and test

Build the display family and the upright/italic text pair:

```sh
../mz-vellum-env/bin/python tools/typefaces/build.py \
  --family all \
  --output ../mz-vellum-release
```

This writes all three faces in the table below. Select `--family display` or `--family text` instead to build only that family. Use a separate output directory for experiments so a new build does not replace a version you are comparing.

Run the public font release tests through the same environment:

```sh
../mz-vellum-env/bin/python -m unittest discover \
  -s tests/typefaces -p 'test_*.py' -v
```

The tests exercise the build command and its generated fonts. A passing file test confirms the checked file and character behavior; it cannot judge whether the lettering looks balanced. Inspect the specimen after each design change, especially accents, punctuation, diagonals, joins, and italic pairs.

The complete release contains these fonts and editable UFO3 packages:

| Face | Desktop file | Web file | Editable outlines |
|---|---|---|---|
| Display Regular | `MZVellumDisplay-Regular.ttf` | `MZVellumDisplay-Regular.woff2` | `MZVellumDisplay-Regular.ufo/` |
| Text Light | `MZVellumText-Light.ttf` | `MZVellumText-Light.woff2` | `MZVellumText-Light.ufo/` |
| Text Light Italic | `MZVellumText-LightItalic.ttf` | `MZVellumText-LightItalic.woff2` | `MZVellumText-LightItalic.ufo/` |

Both text styles use weight 300; the display face uses weight 400. `tools/typefaces/OFL-Display.txt` covers the original display family. The Cormorant source notice is in `assets/fonts/cormorant-garamond/OFL.txt`, and the text build writes `OFL-Cormorant.txt` beside its outputs. Keep notices and provenance packaged with the fonts when moving the release to a permanent directory.

## Preview the specimen

An `--family all` build also writes `index.html` into the release directory. Open `../mz-vellum-release/index.html` in your browser to see all three faces, accent samples, reading sizes, and desktop-font download links. The webfonts are referenced with relative paths, so keep the HTML and WOFF2 files together.

In **Try your own words**, type into **Your specimen**, choose **Display Regular**, **Text Light**, or **Text Light Italic** from **Font face**, and set **Font size in pixels** between 12 and 160. Your entered text stays in place when you switch face or size. These controls change the preview; use the source or UFO editing workflows below to change the font files themselves.

For a reliable browser preview, serve only the release directory. Run this from the kit root and leave the terminal open:

```sh
python3 -m http.server 4010 --bind 127.0.0.1 --directory ../mz-vellum-release
```

Open [the local specimen](http://127.0.0.1:4010/) in your browser. Stop the server with **Control-C** when finished. Serving the release also works around browsers that restrict fonts loaded directly from a local HTML file.

The optional browser tests need Node.js/npm, the kit's `package.json`, and Playwright's Chromium browser. In a second terminal at the kit root, install those test dependencies and run the dedicated configuration:

```sh
npm install
npx playwright install chromium
npx playwright test --config tools/typefaces/playwright.config.js
```

Keep the server running on port 4010 while the tests run. If you choose another local port, supply its URL:

```sh
FONT_SPECIMEN_URL=http://127.0.0.1:4020 \
  npx playwright test --config tools/typefaces/playwright.config.js
```

Rebuild with `--family all` before testing a new complete release. The browser configuration checks the standalone specimen rather than starting the Jekyll website.

## Install on your Mac

Open a generated `.ttf` file in Font Book and choose **Install**. Install the upright and italic text files together. Select the family in your writing or design application; an application already running may need to reopen its font menu or restart.

The `.woff2` files are for websites. You do not need to install them in Font Book. When installing an experimental revision, remove or disable an older copy with the same family name if the application continues to show an older design.

## Use the webfont

The website's webfont directory is `assets/fonts/mz-vellum/`, relative to the website root. Keep editable sources, desktop packages, and comparison specimens outside that public asset directory.

For another website, copy the generated WOFF2 file into that site's font assets and declare it in CSS. For example, if the file is served at `/assets/fonts/mz-vellum/MZVellumDisplay-Regular.woff2`:

```css
@font-face {
  font-family: "MZ Vellum Display";
  src: url("/assets/fonts/mz-vellum/MZVellumDisplay-Regular.woff2") format("woff2");
  font-style: normal;
  font-weight: 400;
  font-display: swap;
}

.nameplate {
  font-family: "MZ Vellum Display", serif;
}
```

Use the actual font style and weight for each text face. Declare the true italic file with `font-style: italic`; do not rely on a browser to slant the upright. Keep a generic serif fallback for scripts the font does not cover. The display family's coverage includes Latin, Latin-1, Latin Extended-A, Romanian comma-below letters `ȘșȚț`, and common editorial punctuation; it does not imply support for every language or writing system.

## Change the design yourself

There are two useful levels of editing:

1. **Drawing parameters and source instructions.** The independently drawn display source is `tools/typefaces/display.py`. The text family uses `tools/typefaces/text.py`, its tuning configuration in `tools/typefaces/text-design.json`, and the complete original Cormorant font files in `assets/fonts/cormorant-garamond/`. Change the drawing instructions or configuration, then rebuild to a fresh directory. Source edits make the result reproducible. Outline width, advance width, and side bearings solve different problems: making a letter narrower does not automatically make its spacing better.
2. **Individual outlines.** Editable UFO3 packages let you move points and revise a particular glyph in a UFO-compatible font editor. Work on a copy, save the UFO, and rebuild using the reimport command below. Editing a generated TTF directly does not update the drawing source and will be lost on the next build.

Make one visible change at a time. Compare `H O n o a e g R M W`, then words such as `Mehrdad Zaker`, and then complete sentences. Check `AV`, `To`, `Wa`, accented capitals, curly quotes, and numerals. View display lettering at 96px and text at 16px and 21px; a graceful large specimen can still have broken hairlines or crowded accents at reading sizes.

For a first display experiment, find the `place("A", 510, ...)` drawing in `tools/typefaces/display.py`. Its second argument is the letter's advance width in a 1000-unit em: changing `510` to `530` adds space after `A` without redrawing its strokes. Rebuild only that family into a comparison folder:

```sh
../mz-vellum-env/bin/python tools/typefaces/build.py \
  --family display \
  --output ../mz-vellum-display-experiment
```

Cormorant's source weight range starts at 300. A weight number in a font's metadata is a label, not a drawing operation. Thinner strokes require actual outline work; stretching or compressing a glyph changes its proportions and does not provide independent control of stroke contrast.

The text configuration starts with these values:

| Setting | Initial value | What it changes |
|---|---:|---|
| `source_weight` | `300` | Selects an actual designed instance from the Cormorant source; keep it within 300–700. |
| `width_scale` | `0.96` | Narrows outlines, advances, and horizontal layout coordinates together. `1.0` keeps the source width. |
| `x_height_lift` | `1.035` | Raises the lowercase-height region, tapering the adjustment toward cap height. `1.0` disables that adjustment. |
| `serif_corner_radius` | `2.5` | Softens eligible straight outline corners in font units. `0` disables the rounding. |
| `version` | `"0.1.0"` | Labels the generated release. |

Try small changes, use a fresh output directory, and compare the same specimen text. If you change the designed source weight from 300, also review the output style name and weight metadata in the builder: the current text release is named **Light** and declares weight 300.

For a first text experiment, change only `width_scale` from `0.96` to `0.98` in `tools/typefaces/text-design.json`. Rebuild the text pair into a new folder; the result will be slightly wider than the initial design:

```sh
../mz-vellum-env/bin/python tools/typefaces/build.py \
  --family text \
  --output ../mz-vellum-text-experiment
```

## Editable UFO reimport workflow

The workflow is **build → copy the generated UFO → edit → rebuild with the edited UFO → inspect**. The builder retains the source font's character mapping and layout tables while importing changed outlines and advance widths. An outline-only UFO export should not be treated as a standalone reconstruction of every OpenType feature in the source font.

For example, copy `MZVellumDisplay-Regular.ufo/` from the release folder to a working folder named `my-edited-display.ufo/`:

```sh
cp -R ../mz-vellum-release/MZVellumDisplay-Regular.ufo ../my-edited-display.ufo
```

Open the copied UFO in your font editor, move points or change a glyph's advance width, and save. Then rebuild:

```sh
../mz-vellum-env/bin/python tools/typefaces/build.py \
  --family display \
  --editable-source ../my-edited-display.ufo \
  --output ../mz-vellum-edited
```

`--editable-source` accepts either one generated `.ufo` package or a directory containing generated `.ufo` packages. Use `--family text` to rebuild edited text styles, or `--family all` if a directory contains edits from both families. The UFO's **family and style names must remain unchanged** so the builder can select the matching font. Keep existing glyph names when editing outlines or spacing; adding or renaming glyphs is outside this reimport interface. A UFO package may be renamed on disk because matching uses its internal family/style metadata.

To include the browser specimen when rebuilding an edited face, use `--family all` with the same `--editable-source` argument and a fresh output directory. The selected edited source is overlaid onto the complete release, while the other faces are built from their drawing sources.

Keep edited sources and output directories separate: neither should contain the other. Use a fresh output directory for every comparison. Font generation and UFO validation finish in a temporary directory before release files are copied to the requested output; a rejected UFO edit leaves an existing release untouched. The edited UFO is copied alongside the rebuilt TTF and WOFF2 for the next edit. This workflow changes outlines and advance widths; it does not import replacement character maps, kerning rules, or feature programs from the UFO. Review accents and letter pairs after an outline edit because preserved anchors and kerning may need corresponding design work in the source.

After a rebuild, run the release tests, inspect the fonts in Font Book or the browser specimen, and compare the website at desktop and mobile sizes. Existing page text, links, images, and controls should remain unchanged when choosing a font.
