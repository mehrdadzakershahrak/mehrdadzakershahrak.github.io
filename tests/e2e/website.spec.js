const { test, expect } = require("@playwright/test");

const PRODUCT_URL = "https://idx.mehrdadzaker.com/v2/portal";
const HOMEPAGE_TITLE = "Mehrdad Zaker — Custom AI Systems & Private AI Deployment";
const HOMEPAGE_DESCRIPTION =
  "We design production-grade private AI systems, retrieval workflows, and secure deployment architectures for teams operating under real constraints.";
const HOMEPAGE_H1 =
  "We build production-grade AI systems for private, high-stakes workflows.";
const DEFAULT_SOCIAL_IMAGE_PATH = "/assets/images/private-ai-consulting-header-1200.png";
const CUSTOM_H1_PAGES = [
  {
    path: "/",
    headingPattern: /We build production-grade AI systems for private, high-stakes workflows\./,
  },
  {
    path: "/about/",
    headingPattern: /Get to know\s+Dr\. Mehrdad Zaker/,
  },
  {
    path: "/contact/",
    headingPattern: /Bring a concrete AI, deployment, or workflow problem\./,
  },
  {
    path: "/idx/support/",
    headingPattern: /Get help with IDX access, document workflows, or rollout questions\./,
  },
  {
    path: "/idx/assistant/",
    headingPattern: /Turn dense documents into a source-grounded workspace\./,
  },
];

function countHeadingTags(html, level) {
  return (html.match(new RegExp(`<h${level}\\b`, "gi")) || []).length;
}

async function mockIdxHost(page, title, bodyText) {
  await page.route("https://idx.mehrdadzaker.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><title>${title}</title><main>${bodyText}</main>`,
    });
  });
}

test("dashboard wrapper is a static handoff that redirects directly to the IDX v2 portal", async ({ request, page }) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('data-idx-dashboard-wrapper');
  expect(html).not.toContain("idx-workspace-dashboard.js");
  expect(html).not.toContain('data-idx-dashboard-app');
  expect(html).toContain("Sign in to IDX v2");

  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.goto("/idx/dashboard/");

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
  await expect(page.getByText("IDX v2 portal")).toBeVisible();
});

test("homepage exposes the updated SEO title, description, and aligned hero copy", async ({ request, page }) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page).toHaveTitle(HOMEPAGE_TITLE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", HOMEPAGE_DESCRIPTION);
  await expect(page.getByRole("heading", { level: 1, name: HOMEPAGE_H1 })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`${DEFAULT_SOCIAL_IMAGE_PATH}$`));
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", new RegExp(`${DEFAULT_SOCIAL_IMAGE_PATH}$`));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/assets/images/apple-touch-icon.png");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/site.webmanifest");
});

test("custom-hero pages expose a single content h1 without the theme page title heading", async ({ page, request }) => {
  for (const { path, headingPattern } of CUSTOM_H1_PAGES) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(countHeadingTags(html, 1)).toBe(1);
    expect(html).not.toContain('id="page-title"');

    await page.goto(path);

    const h1 = page.locator("h1");

    await expect(h1).toHaveCount(1);
    await expect(page.locator("#page-title")).toHaveCount(0);
    await expect(h1.first()).toHaveText(headingPattern);
  }
});

test("standard single-layout pages keep the default page title h1", async ({ page, request }) => {
  const response = await request.get("/private-ai-deployment/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(countHeadingTags(html, 1)).toBe(1);
  expect(html).toContain('id="page-title"');

  await page.goto("/private-ai-deployment/");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("#page-title")).toHaveCount(1);
  await expect(page.locator("#page-title")).toHaveText("Private AI Deployment");
});

test("legacy dashboard query params are ignored and still land on IDX v2 home", async ({ page }) => {
  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.goto("/idx/dashboard/?workspace_id=ws_1&document_id=doc_1");

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
});

test("login page redirects directly to product-domain auth", async ({ page }) => {
  await mockIdxHost(page, "IDX auth", "IDX auth login");
  await page.goto("/login/");
  await page.waitForURL(/https:\/\/idx\.mehrdadzaker\.com\/auth\/login\?return_to=/);
  await expect(page.getByText("IDX auth login")).toBeVisible();
});

test("homepage keeps search assets off the page while search layout still loads them", async ({ request, page }) => {
  const homeResponse = await request.get("/");
  expect(homeResponse.ok()).toBeTruthy();
  const homeHtml = await homeResponse.text();
  expect(homeHtml).not.toContain("lunr.min.js");
  expect(homeHtml).not.toContain("lunr-store.js");
  expect(homeHtml).not.toContain('class="search-content"');

  const searchResponse = await request.get("/search/");
  expect(searchResponse.ok()).toBeTruthy();
  const searchHtml = await searchResponse.text();
  expect(searchHtml).toContain("lunr.min.js");
  expect(searchHtml).toContain("lunr-store.js");
  expect(searchHtml).not.toContain('class="search-content"');

  await page.goto("/search/?q=private%20deployment");
  await expect(page.locator("input#search")).toHaveValue("private deployment");
});

test("llms.txt is published with service and contact guidance", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.ok()).toBeTruthy();

  const text = await response.text();
  expect(text).toContain("# Mehrdad Zaker");
  expect(text).toContain("private AI consulting");
  expect(text).toContain("https://www.mehrdadzaker.com/contact/");
  expect(text).toContain("https://www.mehrdadzaker.com/private-ai-deployment/");
});

test("idx landing page stays public and does not load retired guidance or dashboard bundles", async ({ request, page }) => {
  const response = await request.get("/idx/assistant/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("mdz-idx-landing");
  expect(html).toContain("Open IDX dashboard");
  expect(html).not.toContain("Industry Guidance");
  expect(html).not.toContain("idx-guidance.js");
  expect(html).not.toContain("idx-dashboard.js");
  expect(html).not.toContain("data-idx-guidance");

  await page.goto("/idx/assistant/");

  const hero = page.locator(".mdz-idx-landing__hero");

  await expect(page).toHaveTitle(/IDX/);
  await expect(hero.getByRole("heading", { name: "Turn dense documents into a source-grounded workspace." })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Open IDX dashboard" })).toHaveAttribute("href", "/idx/dashboard/");
  await expect(hero.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login/");
  await expect(hero.getByRole("link", { name: "Private deployment" })).toHaveAttribute("href", "/private-ai-deployment/");
  await expect(page.locator('script[src*="idx-dashboard.js"]')).toHaveCount(0);
});

test("idx landing page remains usable on mobile and the dashboard CTA still hands off to the product host", async ({ page }) => {
  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/idx/assistant/");

  const hero = page.locator(".mdz-idx-landing__hero");

  await expect(hero.getByRole("heading", { name: "Turn dense documents into a source-grounded workspace." })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Sign in" })).toBeVisible();
  await hero.getByRole("link", { name: "Open IDX dashboard" }).click();

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
  await expect(page.getByText("IDX v2 portal")).toBeVisible();
});
