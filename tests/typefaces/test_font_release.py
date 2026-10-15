"""Validate the font project's public build command and installable outputs."""
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from fontTools.ttLib import TTFont
import ufoLib2

ROOT = Path(__file__).resolve().parents[2]
BUILD = ROOT / "tools/typefaces/build.py"
LATIN = set(range(0x20, 0x7F)) | set(range(0xA0, 0x180))
PUNCTUATION = {0x20AC, 0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2022, 0x2026}


class FontReleaseTests(unittest.TestCase):
    def test_invalid_ufo_edit_preserves_the_existing_release(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            output = root / "my-release"
            first = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--output", str(output)], capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            path = output / "MZVellumDisplay-Regular.ttf"
            with TTFont(path, recalcTimestamp=False) as font:
                name = font.getBestCmap()[ord("A")]
                font["hmtx"][name] = (913, font["hmtx"][name][1])
                font.save(path)
            previous = path.read_bytes()
            ufo = ufoLib2.Font.open(output / "MZVellumDisplay-Regular.ufo")
            ufo.info.familyName = "A different font family"
            source = root / "invalid-edit.ufo"
            ufo.save(source)
            result = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--editable-source", str(source), "--output", str(output)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(path.read_bytes(), previous, "A failed edit must leave a previous release unchanged")

    def test_rebuild_rejects_an_output_inside_edited_sources_before_writing(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "my-edited.ufo"
            source.mkdir()
            marker = source / "my-work.txt"
            marker.write_text("keep my source")
            output = source / "rebuilt"
            result = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--editable-source", str(source), "--output", str(output)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertFalse(output.exists(), "An invalid nested output must be rejected before writing into edited sources")
            self.assertEqual(marker.read_text(), "keep my source")

    def test_european_repertoire_has_drawn_letters_including_romanian_commas(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(BUILD), "--family", "all", "--output", directory], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            printable = (LATIN | PUNCTUATION | {0x218, 0x219, 0x21A, 0x21B}) - {0x20, 0xA0, 0xAD}
            for path in Path(directory).glob("*.ttf"):
                with TTFont(path) as font:
                    cmap = font.getBestCmap()
                    self.assertFalse(printable - cmap.keys(), path.name)
                    for codepoint in sorted(printable):
                        self.assertNotEqual(font["glyf"][cmap[codepoint]].numberOfContours, 0, f"{path.name}: U+{codepoint:04X}")

    def test_capital_i_is_visibly_distinct_from_lowercase_l(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--output", directory], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with TTFont(Path(directory) / "MZVellumDisplay-Regular.ttf") as font:
                cmap = font.getBestCmap()
                capital, lower = (font["glyf"][cmap[ord(c)]] for c in "Il")
                self.assertGreaterEqual(capital.xMax - capital.xMin, 1.6 * (lower.xMax - lower.xMin))

    def test_latvian_lowercase_g_has_its_comma_above_without_a_new_descender(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--output", directory], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            with TTFont(Path(directory) / "MZVellumDisplay-Regular.ttf") as font:
                cmap = font.getBestCmap()
                plain, accented = (font["glyf"][cmap[ord(c)]] for c in "gģ")
                self.assertGreaterEqual(accented.yMax, plain.yMax + 80)
                self.assertEqual(accented.yMin, plain.yMin)

    def test_complete_release_contains_all_three_faces_and_their_licenses(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run([sys.executable, str(BUILD), "--family", "all", "--output", directory], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            output = Path(directory)
            for stem in ("MZVellumDisplay-Regular", "MZVellumText-Light", "MZVellumText-LightItalic"):
                for extension in ("ttf", "woff2", "ufo"):
                    self.assertTrue((output / f"{stem}.{extension}").exists())
            self.assertIn("MZ Vellum Project Authors", (output / "OFL-Display.txt").read_text())
            self.assertIn("Cormorant", (output / "OFL-Cormorant.txt").read_text())

    def test_display_build_produces_complete_installable_and_web_fonts(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, str(BUILD), "--family", "display", "--output", directory],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            for extension in ("ttf", "woff2"):
                path = Path(directory) / f"MZVellumDisplay-Regular.{extension}"
                with TTFont(path, checkChecksums=2) as font:
                    self.assertEqual(font["name"].getDebugName(1), "MZ Vellum Display")
                    self.assertEqual(font["name"].getDebugName(2), "Regular")
                    self.assertEqual(font["OS/2"].fsType, 0)
                    if font["OS/2"].fsSelection & 0x80:
                        self.assertGreaterEqual(font["OS/2"].version, 4, "USE_TYPO_METRICS requires OS/2 version 4+")
                    self.assertFalse((LATIN | PUNCTUATION) - font.getBestCmap().keys())
                    self.assertEqual(font.flavor, "woff2" if extension == "woff2" else None)
                    for character in "Mehrdad Zaker AVToéÅœß0123&?!":
                        glyph = font["glyf"][font.getBestCmap()[ord(character)]]
                        if character != " ":
                            self.assertNotEqual(glyph.numberOfContours, 0, character)

    def test_text_build_produces_a_complete_attributed_upright_and_true_italic_pair(self):
        with tempfile.TemporaryDirectory() as directory:
            result = subprocess.run(
                [sys.executable, str(BUILD), "--family", "text", "--output", directory],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            for style in ("Light", "LightItalic"):
                for extension in ("ttf", "woff2"):
                    with TTFont(Path(directory) / f"MZVellumText-{style}.{extension}", checkChecksums=2) as font:
                        self.assertEqual(font["name"].getDebugName(1), "MZ Vellum Text")
                        self.assertIn("Cormorant", font["name"].getDebugName(0))
                        self.assertEqual(font["OS/2"].usWeightClass, 300)
                        self.assertEqual(font["OS/2"].fsType, 0)
                        self.assertFalse((LATIN | PUNCTUATION) - font.getBestCmap().keys())
                        self.assertGreater(len(font.getBestCmap()), 900)
                        self.assertGreaterEqual(font["OS/2"].sxHeight, 399)
                        self.assertEqual(font["post"].italicAngle < 0, style == "LightItalic")

    def test_an_edited_ufo_changes_the_rebuilt_outline_and_spacing_in_both_formats(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            original, rebuilt = root / "original", root / "rebuilt"
            first = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--output", str(original)], capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            with TTFont(original / "MZVellumDisplay-Regular.ttf") as font:
                a_name = font.getBestCmap()[ord("A")]
                old_left = font["glyf"][a_name].xMin
            ufo = ufoLib2.Font.open(original / "MZVellumDisplay-Regular.ufo")
            ufo[a_name].width = 900
            for contour in ufo[a_name].contours:
                for point in contour.points:
                    point.x += 17
            edited = root / "my-edited-display.ufo"
            ufo.save(edited)
            result = subprocess.run([sys.executable, str(BUILD), "--family", "display", "--editable-source", str(edited), "--output", str(rebuilt)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            for extension in ("ttf", "woff2"):
                with TTFont(rebuilt / f"MZVellumDisplay-Regular.{extension}") as font:
                    name = font.getBestCmap()[ord("A")]
                    self.assertEqual(font["hmtx"][name][0], 900)
                    self.assertEqual(font["glyf"][name].xMin, old_left + 17)


if __name__ == "__main__":
    unittest.main()
