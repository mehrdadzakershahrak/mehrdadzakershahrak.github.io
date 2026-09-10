"""Regression tests for failure modes that must stop a Pages deployment."""
import contextlib
import io
from pathlib import Path
import tempfile
import unittest

from tools.check_indexing import ORIGIN, check


class IndexingGateTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        (self.root / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {ORIGIN}/sitemap.xml\n')
        self.write_page('/', '<a href="/article/">Article</a>')
        self.write_page('/article/', '<a href="/">Home</a>')
        self.sitemap(['/', '/article/'])

    def write_page(self, path, body='', head=''):
        file = self.root / path.lstrip('/') / 'index.html'
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_text(f'<html><head><title>{path}</title><link rel="canonical" href="{ORIGIN}{path}">'
                        f'<meta name="description" content="Description for {path}">{head}</head><body>{body}</body></html>')

    def sitemap(self, paths):
        items = ''.join(f'<url><loc>{ORIGIN}{path}</loc></url>' for path in paths)
        (self.root / 'sitemap.xml').write_text(f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">{items}</urlset>')

    def run_gate(self):
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            count = check(self.root)
        return count, output.getvalue()

    def test_connected_public_site_passes(self):
        self.assertEqual(self.run_gate()[0], 0)

    def test_disconnected_cycle_does_not_count_as_discoverable(self):
        self.write_page('/island/', '<a href="/island-two/">Other island</a>')
        self.write_page('/island-two/', '<a href="/island/">Island</a>')
        self.sitemap(['/', '/article/', '/island/', '/island-two/'])
        self.assertIn('unreachable from homepage', self.run_gate()[1])

    def test_noindex_in_sitemap_fails(self):
        self.write_page('/article/', head='<meta name="robots" content="noindex,follow">')
        self.assertIn('noindex page is in sitemap', self.run_gate()[1])

    def test_missing_asset_or_feed_fails(self):
        self.write_page('/article/', head='<link rel="alternate" href="/feed.xml">')
        self.assertIn('broken internal reference /feed.xml', self.run_gate()[1])

    def test_robots_block_fails(self):
        (self.root / 'robots.txt').write_text(f'User-agent: *\nDisallow: /article/\nSitemap: {ORIGIN}/sitemap.xml\n')
        self.assertIn('robots.txt blocks search', self.run_gate()[1])

    def test_redirect_cannot_point_to_noindex_or_another_redirect(self):
        self.write_page('/article/', head='<meta name="robots" content="noindex">')
        self.sitemap(['/'])
        self.write_page('/', '')
        folder = self.root / 'old'
        folder.mkdir()
        (folder / 'index.html').write_text(f'<link rel="canonical" href="{ORIGIN}/article/">'
                                         '<meta http-equiv="refresh" content="0; url=/article/">')
        self.assertIn('redirect target missing, chained, or noindex', self.run_gate()[1])


if __name__ == '__main__':
    unittest.main()
