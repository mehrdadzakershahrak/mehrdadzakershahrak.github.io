#!/usr/bin/env python3
"""Check the built site's crawl graph and SEO directives; optionally verify live HTTP.

Usage: python3 tools/check_indexing.py /path/to/jekyll-output [--live]
Uses only Python's standard library and curl for live requests.
"""
import argparse
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from pathlib import Path
import re
import subprocess
import tempfile
from urllib.parse import unquote, urljoin, urlsplit
from urllib.robotparser import RobotFileParser
import xml.etree.ElementTree as ET

ORIGIN = 'https://www.mehrdadzaker.com'
NS = '{http://www.sitemaps.org/schemas/sitemap/0.9}'


class Page(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.canonical, self.robots, self.description = [], [], []
        self.links, self.assets, self.refresh, self.title = [], [], [], []
        self.in_title = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'link' and a.get('rel') == 'canonical':
            self.canonical.append(a.get('href', ''))
        if tag == 'meta':
            name = a.get('name', '').lower()
            if name in ('robots', 'googlebot'):
                self.robots.append(a.get('content', '').lower())
            if name == 'description':
                self.description.append(a.get('content', ''))
            if a.get('http-equiv', '').lower() == 'refresh':
                self.refresh.append(a.get('content', ''))
        if tag == 'a' and a.get('href'):
            self.links.append(a['href'])
        if tag in ('img', 'script', 'iframe', 'source') and a.get('src'):
            self.assets.append(a['src'])
        if tag == 'link' and a.get('rel') in ('stylesheet', 'icon', 'manifest', 'alternate', 'preload', 'apple-touch-icon'):
            self.assets.append(a.get('href', ''))

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title.append(data)

    @property
    def noindex(self):
        return any(set(re.split(r'[\s,]+', value)) & {'noindex', 'none'} for value in self.robots)


def sitemap_urls(text):
    return [node.text for node in ET.fromstring(text).iter(NS + 'loc')]


def fetch(url):
    with tempfile.TemporaryDirectory(prefix='mdz-http-') as tmp:
        headers = Path(tmp) / 'headers'
        result = subprocess.run(
            ['curl', '-sS', '-L', '--max-redirs', '5', '--max-time', '30',
             '-D', str(headers), '-w', '\n%{http_code} %{url_effective}', url],
            capture_output=True, text=True, check=True,
        )
        body, _, status = result.stdout.rpartition('\n')
        code, final = status.split(' ', 1)
        return int(code), final, body, headers.read_text()


def check(root, live=False):
    errors = []
    def require(condition, message):
        if not condition:
            errors.append(message)

    urls = sitemap_urls((root / 'sitemap.xml').read_text())
    require(bool(urls) and len(urls) == len(set(urls)), 'Sitemap is empty or contains duplicates')
    robots_text = (root / 'robots.txt').read_text()
    robots = RobotFileParser()
    robots.parse(robots_text.splitlines())
    require(f'Sitemap: {ORIGIN}/sitemap.xml' in robots_text, 'Missing canonical sitemap in robots.txt')
    pages = {}
    for file in root.rglob('*.html'):
        route = '/' + file.relative_to(root).as_posix()
        if route.endswith('index.html'):
            route = route[:-10]
        pages[ORIGIN + route] = Page(file.read_text())

    graph, descriptions, titles = {}, defaultdict(list), defaultdict(list)
    for url, page in pages.items():
        require(len(page.canonical) == 1, f'{url}: expected exactly one canonical')
        if page.refresh:
            require(len(page.refresh) == 1, f'{url}: multiple redirects')
            match = re.fullmatch(r'0;\s*url=(.+)', page.refresh[0], re.I)
            require(bool(match), f'{url}: redirect must be immediate')
            target = urljoin(url, match[1]).split('#')[0] if match else ''
            require(page.canonical == [target], f'{url}: redirect and canonical disagree')
            require(target in pages and not pages[target].refresh and not pages[target].noindex,
                    f'{url}: redirect target missing, chained, or noindex')
            require(not page.noindex, f'{url}: redirect must consolidate via canonical without noindex')
            require(url not in urls, f'{url}: redirect is in sitemap')
        elif page.noindex:
            require(url not in urls, f'{url}: noindex page is in sitemap')
        else:
            require(url in urls, f'{url}: indexable page missing from sitemap')
            require(page.canonical == [url], f'{url}: canonical is not its public URL')
            require(len(page.description) == 1 and bool(page.description[0].strip()), f'{url}: missing/duplicate description')
            require(bool(''.join(page.title).strip()), f'{url}: missing title')
            descriptions[''.join(page.description)].append(url)
            titles[''.join(page.title)].append(url)

        graph[url] = []
        for ref in page.links + page.assets:
            full = urlsplit(urljoin(url, ref))
            if full.netloc != urlsplit(ORIGIN).netloc:
                continue
            target = ORIGIN + full.path
            path = root / unquote(full.path).lstrip('/')
            if path.is_dir():
                path /= 'index.html'
            require(path.is_file(), f'{url}: broken internal reference {ref}')
            if ref in page.links:
                graph[url].append(target)
                require(not (target in pages and pages[target].refresh), f'{url}: links through redirect {ref}')

    for label, groups in [('description', descriptions), ('title', titles)]:
        for group in groups.values():
            require(len(group) == 1, f'Duplicate {label}: {group}')
    visited, pending = set(), [ORIGIN + '/']
    while pending:
        url = pending.pop()
        if url in visited:
            continue
        visited.add(url)
        # Redirect/noindex pages must not be the only way to discover public content.
        if url in pages and not pages[url].noindex and not pages[url].refresh:
            pending.extend(graph.get(url, []))
    for url in urls:
        require(url.startswith(ORIGIN + '/') and url in pages, f'{url}: invalid sitemap URL')
        require(url in visited, f'{url}: unreachable from homepage')
        require(robots.can_fetch('Googlebot', url) and robots.can_fetch('bingbot', url), f'{url}: robots.txt blocks search')

    if live and not errors:
        targets = list(pages) + [ORIGIN + '/robots.txt', ORIGIN + '/sitemap.xml']
        with ThreadPoolExecutor(max_workers=4) as pool:
            for url, (code, final, body, headers) in zip(targets, pool.map(fetch, targets)):
                require(code == 200 and final == url, f'{url}: unexpected live response {code} {final}')
                if url in pages:
                    actual, expected = Page(body), pages[url]
                    require(actual.canonical == expected.canonical and actual.robots == expected.robots
                            and actual.refresh == expected.refresh and actual.description == expected.description,
                            f'{url}: live indexing metadata differs from build')
                    if url in urls:
                        require(not re.search(r'(?im)^x-robots-tag:.*\b(noindex|none)\b', headers), f'{url}: HTTP header blocks indexing')
                elif url.endswith('/sitemap.xml'):
                    require(set(sitemap_urls(body)) == set(urls), 'Live sitemap differs from build')
                else:
                    parser = RobotFileParser()
                    parser.parse(body.splitlines())
                    require(f'Sitemap: {ORIGIN}/sitemap.xml' in body, 'Live robots missing sitemap')
                    require(all(parser.can_fetch('Googlebot', u) and parser.can_fetch('bingbot', u) for u in urls), 'Live robots blocks search')
        for origin in ['http://www.mehrdadzaker.com', 'http://mehrdadzaker.com', 'https://mehrdadzaker.com', 'https://mehrdadzakershahrak.github.io']:
            code, final, _, headers = fetch(origin + '/about/')
            require(code == 200 and final == ORIGIN + '/about/' and re.search(r'HTTP/\S+ 30[18]\b', headers), f'{origin}: canonical host/HTTPS redirect broken')
        require(fetch(ORIGIN + '/this-url-does-not-exist-indexing-audit/')[0] == 404, 'Missing URL must return HTTP 404')

    for error in errors:
        print('ERROR:', error)
    print(f'Indexing check: {len(urls)} sitemap URLs, {len(pages)} HTML pages, {len(errors)} errors' + (' (including live HTTP)' if live else ''))
    return len(errors)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('build', type=Path)
    parser.add_argument('--live', action='store_true')
    args = parser.parse_args()
    raise SystemExit(bool(check(args.build, args.live)))
