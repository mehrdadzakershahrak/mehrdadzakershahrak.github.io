const { test, expect } = require("@playwright/test");

test("dashboard wrapper is a static handoff that redirects directly to the IDX v2 portal", async ({ request, page }) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('data-idx-dashboard-wrapper');
  expect(html).not.toContain("idx-workspace-dashboard.js");
  expect(html).not.toContain('data-idx-dashboard-app');
  expect(html).toContain("Sign in to IDX v2");

  await page.route("https://idx.mehrdadzaker.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>IDX v2</title><main>IDX v2 portal</main>",
    });
  });

  await page.goto("/idx/dashboard/");

  await page.waitForURL("https://idx.mehrdadzaker.com/v2/portal");
  expect(page.url()).toBe("https://idx.mehrdadzaker.com/v2/portal");
  await expect(page.getByText("IDX v2 portal")).toBeVisible();
});

test("legacy dashboard query params are ignored and still land on IDX v2 home", async ({ page }) => {
  await page.route("https://idx.mehrdadzaker.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>IDX v2</title><main>IDX v2 portal</main>",
    });
  });

  await page.goto("/idx/dashboard/?workspace_id=ws_1&document_id=doc_1");

  await page.waitForURL("https://idx.mehrdadzaker.com/v2/portal");
  expect(page.url()).toBe("https://idx.mehrdadzaker.com/v2/portal");
});

test("login page redirects directly to product-domain auth", async ({ page }) => {
  await page.route("https://idx.mehrdadzaker.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>IDX auth</title><main>IDX auth login</main>",
    });
  });
  await page.goto("/login/");
  await page.waitForURL(/https:\/\/idx\.mehrdadzaker\.com\/auth\/login\?return_to=/);
  await expect(page.getByText("IDX auth login")).toBeVisible();
});

test("industry guidance stays public and does not load the retired dashboard bundle", async ({ request, page }) => {
  const response = await request.get("/idx/assistant/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("idx-guidance.js");
  expect(html).not.toContain("idx-dashboard.js");

  await page.goto("/idx/assistant/");
  await expect(page.locator(".mdz-idx__workspace-title")).toHaveText("Industry Guidance");
  await expect(page.getByRole("tab", { name: "Finance" })).toBeVisible();
  await expect(page.locator('script[src*="idx-dashboard.js"]')).toHaveCount(0);
});
