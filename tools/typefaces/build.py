#!/usr/bin/env python3
"""Build the editable MZ Vellum font project into a chosen output directory."""
import argparse
import shutil
import tempfile
from pathlib import Path


def apply_edited_sources(output, sources):
    import shutil
    import ufoLib2
    from fontTools.misc.roundTools import otRound
    from fontTools.pens.cu2quPen import Cu2QuPen
    from fontTools.pens.recordingPen import DecomposingRecordingPen
    from fontTools.pens.ttGlyphPen import TTGlyphPen
    from fontTools.ttLib import TTFont

    for source in sources:
        ufo = ufoLib2.Font.open(source)
        matches = []
        for candidate in output.glob("*.ttf"):
            font = TTFont(candidate, recalcTimestamp=False)
            if (font["name"].getDebugName(1), font["name"].getDebugName(2)) == (ufo.info.familyName, ufo.info.styleName):
                matches.append((candidate, font))
            else:
                font.close()
        if len(matches) != 1:
            raise ValueError(f"Choose the matching --family for {source}; keep the UFO family and style names.")
        target, font = matches[0]
        glyph_order = set(font.getGlyphOrder())
        unknown = set(ufo.keys()) - glyph_order
        if unknown:
            raise ValueError(f"Keep the existing glyph names when editing: {sorted(unknown)}")
        for name in ufo.keys():
            recording = DecomposingRecordingPen(ufo)
            ufo[name].draw(recording)
            pen = TTGlyphPen(None)
            recording.replay(Cu2QuPen(pen, max_err=0.6))
            glyph = pen.glyph()
            font["glyf"][name] = glyph
            glyph.recalcBounds(font["glyf"])
            font["hmtx"][name] = (otRound(ufo[name].width), glyph.xMin if glyph.numberOfContours > 0 else 0)
        bounds = [g for g in font["glyf"].glyphs.values() if g.numberOfContours > 0]
        font["OS/2"].usWinAscent = max(font["OS/2"].usWinAscent, max(g.yMax for g in bounds))
        font["OS/2"].usWinDescent = max(font["OS/2"].usWinDescent, -min(g.yMin for g in bounds))
        font.save(target)
        font.flavor = "woff2"
        font.save(target.with_suffix(".woff2"))
        font.close()
        # Keep the edited source alongside its rebuilt binaries for the next edit.
        shutil.copytree(source, target.with_suffix(".ufo"), dirs_exist_ok=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--family", choices=("display", "text", "all"), required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--editable-source", type=Path, help="An edited UFO3, or a directory of edited UFO3 packages")
    options = parser.parse_args()
    sources = []
    if options.editable_source:
        source = options.editable_source.resolve()
        target = options.output.resolve()
        if source.is_relative_to(target) or target.is_relative_to(source):
            parser.error("Keep edited sources and output separate; neither directory may contain the other.")
        sources = [source] if source.suffix == ".ufo" else sorted(source.glob("*.ufo"))
        if not sources or any(not path.is_dir() for path in sources):
            parser.error("--editable-source must contain at least one existing UFO3 package.")
    # Validate the entire build before replacing any previous release files.
    with tempfile.TemporaryDirectory(prefix="mz-vellum-build-") as directory:
        staging = Path(directory)
        if options.family in ("display", "all"):
            from display import build as build_display
            build_display(staging)
            shutil.copyfile(Path(__file__).with_name("OFL-Display.txt"), staging / "OFL-Display.txt")
        if options.family in ("text", "all"):
            from text import build as build_text
            build_text(staging)
        if sources:
            apply_edited_sources(staging, sources)
        if options.family == "all":
            shutil.copyfile(Path(__file__).with_name("specimen.html"), staging / "index.html")
        options.output.mkdir(parents=True, exist_ok=True)
        for artifact in staging.iterdir():
            target = options.output / artifact.name
            if artifact.is_dir():
                shutil.copytree(artifact, target, dirs_exist_ok=True)
            else:
                shutil.copy2(artifact, target)


if __name__ == "__main__":
    main()
