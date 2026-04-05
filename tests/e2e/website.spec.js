const { test, expect } = require("@playwright/test");

test("redirect page points /idx/dashboard/ at the IDX portal", async ({ request }) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('content="0; url=https://idx.mehrdadzaker.com/v2/portal"');
  expect(html).toContain('<link rel="canonical" href="https://idx.mehrdadzaker.com/v2/portal">');
  expect(html).toContain('window.location.replace("https://idx.mehrdadzaker.com/v2/portal")');
});

test("site navigation keeps IDX entry links on the IDX host", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('a[href="https://idx.mehrdadzaker.com/v2/portal"]').first()).toBeVisible();
  await expect(page.locator('a[href="https://idx.mehrdadzaker.com/v2/portal"]').first()).toHaveAttribute(
    "href",
    "https://idx.mehrdadzaker.com/v2/portal",
  );
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
