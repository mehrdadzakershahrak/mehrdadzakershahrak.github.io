const { test, expect } = require("@playwright/test");

async function markWebsiteSessionAuthenticated(context) {
  await context.addCookies([
    {
      name: "mdz_session",
      value: "authenticated",
      domain: "127.0.0.1",
      path: "/",
    },
  ]);
}

test("signed-out dashboard wrapper shows the website sign-in CTA and no legacy workspace client", async ({
  request,
  page,
}) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('data-idx-dashboard-wrapper');
  expect(html).not.toContain("idx-workspace-dashboard.js");
  expect(html).not.toContain('data-idx-dashboard-app');

  await page.goto("/idx/dashboard/");

  await expect(page.getByRole("heading", { name: "Open the live IDX portal" })).toBeVisible();
  await expect(page.locator('script[src*="idx-workspace-dashboard.js"]')).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Sign in with Google" })).toHaveAttribute(
    "href",
    /\/login\/\?returnTo=%2Fidx%2Fdashboard%2F$/,
  );
  await expect(page.getByText("The older website-hosted workspace dashboard has been retired.")).toBeVisible();
});

test("signed-in dashboard wrapper redirects immediately to the IDX v2 portal", async ({ context, page }) => {
  await markWebsiteSessionAuthenticated(context);
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

test("legacy dashboard query params are ignored and still land on IDX v2 home", async ({ context, page }) => {
  await markWebsiteSessionAuthenticated(context);
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

test("login page renders a deterministic local signed-out shell without Google", async ({ page }) => {
  await page.route("https://accounts.google.com/**", async (route) => {
    await route.abort();
  });

  await page.goto("/login/");

  await expect(page.getByRole("heading", { name: "Sign in with Google" })).toBeVisible();
  await expect(
    page.getByText("Google sign-in could not load locally. Continue in local preview or refresh and try again."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue in local preview" })).toBeVisible();
});
