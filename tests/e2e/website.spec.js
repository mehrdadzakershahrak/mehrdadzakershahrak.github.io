const { test, expect } = require("@playwright/test");

const PRODUCT_URL = "https://idx.mehrdadzaker.com/v2/portal";

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
