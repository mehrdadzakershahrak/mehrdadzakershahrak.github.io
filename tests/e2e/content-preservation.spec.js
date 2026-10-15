const { test, expect } = require("@playwright/test");
const baseline = require("../fixtures/public-content-approved.json");

// Derived from the original capture using only the approved edits, before
// publication, so the public repository does not republish removed details.
test("the theme preserves content outside the requested privacy and profile changes", async ({ page, request }) => {
  await page.goto("/");
  for (const [file, expected] of Object.entries(baseline.pages)) {
    const response = await request.get(`/${file}`);
    expect([200, 404], file).toContain(response.status());
    const actual = await page.evaluate((html) => {
      const document = new DOMParser().parseFromString(html, "text/html");
      const normalize = (text) => text.replace(/\s+/g, " ").trim();
      const attributes = (element, names) => Object.fromEntries(
        names.filter((name) => element.hasAttribute(name)).map((name) => [name, element.getAttribute(name)])
      );
      const body = document.body.cloneNode(true);
      body.querySelectorAll("script, style, [data-email-gate], [data-theme-decoration]").forEach((element) => element.remove());
      return {
        body_text: normalize(body.textContent),
        links: Array.from(body.querySelectorAll("a"), (element) => attributes(element, ["href", "title", "aria-label", "target", "rel", "download"])),
        images: Array.from(body.querySelectorAll("img, source, iframe, video, audio"), (element) => ({ tag: element.tagName.toLowerCase(), ...attributes(element, ["src", "srcset", "alt", "title", "poster"]) })),
        headings: Array.from(body.querySelectorAll("h1, h2, h3, h4, h5, h6"), (element) => ({ tag: element.tagName.toLowerCase(), text: normalize(element.textContent) })),
        title: document.title.trim(),
        meta: Array.from(document.querySelectorAll('meta[name="description"], meta[name="robots"], meta[property="og:title"], meta[property="og:description"], meta[property="og:image"], meta[property="og:image:alt"]'), (element) => attributes(element, ["name", "property", "content"])),
        canonical: Array.from(document.querySelectorAll('link[rel="canonical"]'), (element) => element.getAttribute("href")),
        jsonld: Array.from(document.querySelectorAll('script[type="application/ld+json"]'), (element) => JSON.parse(element.textContent)),
      };
    }, await response.text());
    expect(actual, file).toEqual(expected);
  }
});
