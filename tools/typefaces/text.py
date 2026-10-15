"""Customize the complete OFL Cormorant outlines without losing their layout tables."""
from __future__ import annotations

from array import array
import json
import math
from pathlib import Path

import ufoLib2
from fontTools.misc.roundTools import otRound
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont
from fontTools.ttLib.tables._g_l_y_f import GlyphCoordinates
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
CONFIG = Path(__file__).with_name("text-design.json")
EPOCH = 3874867200  # 2026-10-15 in OpenType's 1904 epoch; stable rebuilds.


def _soften_corners(glyph, radius):
    """Round only straight-to-straight corners; keep all curved counters intact."""
    if glyph.numberOfContours <= 0 or radius <= 0:
        return
    coordinates, flags, ends = [], [], []
    start = 0
    for end in glyph.endPtsOfContours:
        points = list(glyph.coordinates[start:end + 1])
        original_flags = list(glyph.flags[start:end + 1])
        count = len(points)
        for index, point in enumerate(points):
            previous, following = points[(index - 1) % count], points[(index + 1) % count]
            straight = all(original_flags[i] & 1 for i in ((index - 1) % count, index, (index + 1) % count))
            left, right = math.dist(point, previous), math.dist(point, following)
            cross = (previous[0] - point[0]) * (following[1] - point[1]) - (previous[1] - point[1]) * (following[0] - point[0])
            if straight and min(left, right) > 5 and abs(cross) > 1:
                distance = min(radius, left * 0.18, right * 0.18)
                before = tuple(point[axis] + (previous[axis] - point[axis]) * distance / left for axis in (0, 1))
                after = tuple(point[axis] + (following[axis] - point[axis]) * distance / right for axis in (0, 1))
                coordinates.extend((before, point, after))
                flags.extend((1, 0, 1))
            else:
                coordinates.append(point)
                flags.append(original_flags[index] & 1)
        ends.append(len(coordinates) - 1)
        start = end + 1
    glyph.coordinates = GlyphCoordinates(coordinates)
    glyph.flags = array("B", flags)
    glyph.endPtsOfContours = ends


def _layout_coordinates(table, scale_x, map_y):
    """Move OpenType anchors and kerning with the outlines they describe."""
    seen = set()

    def visit(value):
        if isinstance(value, (str, int, float, bool, bytes, type(None))) or id(value) in seen:
            return
        seen.add(id(value))
        if isinstance(value, (list, tuple)):
            for item in value:
                visit(item)
        elif isinstance(value, dict):
            for item in value.values():
                visit(item)
        elif hasattr(value, "__dict__"):
            for name, item in vars(value).items():
                if name in ("XCoordinate", "XPlacement", "XAdvance") and isinstance(item, (int, float)):
                    setattr(value, name, otRound(item * scale_x))
                elif name == "YCoordinate" and isinstance(item, (int, float)):
                    setattr(value, name, otRound(map_y(item)))
                elif name == "Coordinate" and type(value).__name__ == "CaretValue" and isinstance(item, (int, float)):
                    setattr(value, name, otRound(item * scale_x))
                else:
                    visit(item)
    visit(table)


def _name(font, style, version):
    family = "MZ Vellum Text"
    readable_style = "Light Italic" if style == "LightItalic" else "Light"
    original_copyright = font["name"].getDebugName(0) or "Copyright 2015 the Cormorant Project Authors"
    font["name"].names = []
    names = {
        0: original_copyright + "; MZ Vellum modifications Copyright 2026 MZ Vellum Project Authors.",
        1: family, 2: readable_style, 3: f"{version};MZVL;MZVellumText-{style}",
        4: f"{family} {readable_style}", 5: f"Version {version}", 6: f"MZVellumText-{style}",
        8: "MZ Vellum Project", 9: "Cormorant Project Authors; MZ Vellum Project Authors",
        10: "OFL derivative of Cormorant Garamond Light: narrower proportions, raised x-height, softly rounded straight serif corners. Original glyph coverage and OpenType layout retained.",
        13: "Licensed under the SIL Open Font License, Version 1.1. See the accompanying OFL-Cormorant.txt.",
        14: "https://openfontlicense.org", 16: family, 17: readable_style,
    }
    for name_id, value in names.items():
        font["name"].setName(value, name_id, 3, 1, 0x409)
        font["name"].setName(value, name_id, 1, 0, 0)
    font["head"].created = font["head"].modified = EPOCH
    font["head"].fontRevision = 0.1
    font.recalcTimestamp = False
    font["OS/2"].fsType = 0


def _export_ufo(font, path):
    ufo = ufoLib2.Font()
    ufo.info.familyName = font["name"].getDebugName(1)
    ufo.info.styleName = font["name"].getDebugName(2)
    ufo.info.unitsPerEm = font["head"].unitsPerEm
    ufo.info.ascender, ufo.info.descender = font["hhea"].ascent, font["hhea"].descent
    ufo.info.xHeight, ufo.info.capHeight = font["OS/2"].sxHeight, font["OS/2"].sCapHeight
    ufo.info.italicAngle = font["post"].italicAngle
    ufo.info.copyright = font["name"].getDebugName(0)
    ufo.info.openTypeNameLicense = font["name"].getDebugName(13)
    ufo.info.openTypeOS2WeightClass = 300
    ufo.glyphOrder = font.getGlyphOrder()
    cmap = font.getBestCmap()
    for name in font.getGlyphOrder():
        glyph = ufo.newGlyph(name)
        glyph.width = font["hmtx"][name][0]
        font["glyf"][name].drawPoints(glyph.getPointPen(), font["glyf"])
    for codepoint, name in cmap.items():
        ufo[name].unicodes.append(codepoint)
    ufo.features.text = "# Original OpenType layout is preserved in the complete TTF shell.\n# Use build.py --editable-source to reimport these edited outlines.\n"
    ufo.save(path, overwrite=True)


def build(output: Path):
    settings = json.loads(CONFIG.read_text())
    scale_x = settings["width_scale"]
    for style, source in (("Light", "CormorantGaramond-Variable.ttf"), ("LightItalic", "CormorantGaramond-Italic-Variable.ttf")):
        font = instantiateVariableFont(TTFont(ROOT / "assets/fonts/cormorant-garamond" / source), {"wght": settings["source_weight"]}, static=True)
        x_height, cap_height = font["OS/2"].sxHeight, font["OS/2"].sCapHeight
        lift = x_height * (settings["x_height_lift"] - 1)

        def map_y(y):
            if 0 < y < x_height:
                return y * settings["x_height_lift"]
            if x_height <= y < cap_height:
                return y + lift * (cap_height - y) / (cap_height - x_height)
            return y

        glyph_set = font.getGlyphSet()
        revised = {}
        for name in font.getGlyphOrder():
            recording = DecomposingRecordingPen(glyph_set)
            glyph_set[name].draw(recording)
            pen = TTGlyphPen(None)
            recording.replay(pen)
            glyph = pen.glyph()
            _soften_corners(glyph, settings["serif_corner_radius"])
            if glyph.numberOfContours > 0:
                glyph.coordinates = GlyphCoordinates((otRound(x * scale_x), otRound(map_y(y))) for x, y in glyph.coordinates)
            revised[name] = glyph
        font["glyf"].glyphs = revised
        for name, glyph in revised.items():
            glyph.recalcBounds(font["glyf"])
            advance, old_bearing = font["hmtx"][name]
            font["hmtx"][name] = (otRound(advance * scale_x), glyph.xMin if glyph.numberOfContours > 0 else otRound(old_bearing * scale_x))
        for tag in ("GPOS", "GDEF"):
            if tag in font:
                _layout_coordinates(font[tag].table, scale_x, map_y)
        if "kern" in font:
            for table in font["kern"].kernTables:
                table.kernTable = {pair: otRound(value * scale_x) for pair, value in table.kernTable.items()}
        # Unicode micro sign is canonically a Greek mu-shaped character.
        for table in font["cmap"].tables:
            if table.isUnicode() and hasattr(table, "cmap") and 0x3BC in table.cmap:
                table.cmap[0xB5] = table.cmap[0x3BC]
        for tag in ("fpgm", "prep", "cvt ", "STAT"):
            if tag in font:
                del font[tag]
        font["OS/2"].sxHeight = otRound(x_height * settings["x_height_lift"])
        _name(font, style, settings["version"])
        stem = f"MZVellumText-{style}"
        font.save(output / f"{stem}.ttf")
        font.flavor = "woff2"
        font.save(output / f"{stem}.woff2")
        font.flavor = None
        _export_ufo(font, output / f"{stem}.ufo")
    (output / "OFL-Cormorant.txt").write_bytes((ROOT / "assets/fonts/cormorant-garamond/OFL.txt").read_bytes())
