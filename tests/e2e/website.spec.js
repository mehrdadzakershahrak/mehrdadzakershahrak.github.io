const { test, expect } = require("@playwright/test");

const PRIMARY_ROUTES = [
  { path: "/", heading: "Mehrdad Zaker" },
  { path: "/work/", heading: "Selected systems work." },
  { path: "/newsletter/", heading: "Writing" },
  { path: "/newsletter/archive/", heading: "Newsletter Archive" },
  { path: "/about/", heading: /AI systems,\s*ML,\s*robotics\./ },
  { path: "/contact/", heading: "Bring a concrete AI systems problem." },
  { path: "/resources/", heading: "Private AI Resource Hub" },
];

const RETIRED_ROUTES = [
  "/products/",
  "/products/idx/",
  "/products/idx/trust/",
  "/idx/",
  "/idx/assistant/",
  "/idx/dashboard/",
  "/idx/support/",
  "/idx/privacy/",
  "/idx/terms/",
  "/login/",
  "/search/",
  "/assets/js/idx-dashboard-wrapper.js",
  "/assets/js/search-page.js",
];

test("homepage presents the simplified personal profile", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Mehrdad Zaker/);
  await expect(page.getByRole("heading", { name: "Mehrdad Zaker", level: 1 })).toBeVisible();
  await expect(page.getByText("Senior AI systems advisor for teams moving LLMs, ML, and automation from promise to production.")).toBeVisible();
  await expect(page.getByText("I help technical leaders make AI systems reliable, grounded, observable, and operationally sane.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Email Mehrdad" })).toHaveAttribute("href", /mailto:/);

  const navItems = await page.locator(".eh-masthead__nav a").allTextContents();
  expect(navItems.map((item) => item.trim())).toEqual(["Work", "Writing", "About", "Contact"]);

  await expect(page.locator(".eh-nav")).toHaveCount(0);
  await expect(page.locator(".eh-proof-strip")).toHaveCount(0);
  await expect(page.locator(".eh-focus")).toHaveCount(0);
  await expect(page.locator(".eh-contact__grid")).toHaveCount(0);

  await expect(page.locator(".eh-exec-meta")).toContainText("Ph.D. CS");
  await expect(page.locator(".eh-exec-meta")).toContainText("Founding AI Engineer");
  await expect(page.locator(".eh-exec-meta")).toContainText("S&P 500-scale ML");
  await expect(page.locator(".eh-exec-meta")).toContainText("Robotics");

  const about = page.locator(".eh-about-drop");
  await expect(about).not.toHaveAttribute("open", "");
  await expect(page.getByText("Deep Learning Specialization")).toBeHidden();
  await about.locator("summary").click();
  await expect(about).toHaveAttribute("open", "");
  await expect(page.getByText("Deep Learning Specialization")).toBeVisible();
  await expect(page.getByText("Stanford Machine Learning")).toBeVisible();

  await expect(page.locator(".eh-exec-row").filter({ hasText: "Private AI deployment" })).toBeVisible();
  await expect(page.locator(".eh-exec-row").filter({ hasText: "The Practical Guide to Running Local LLMs" })).toBeVisible();

  const body = page.locator("body");
  await expect(body).not.toContainText("Product Catalogue");
  await expect(body).not.toContainText("IDX");
  await expect(body).not.toContainText("Now");
  await expect(body).not.toContainText("Login");
});

test("primary routes render on the editorial shell", async ({ page }) => {
  for (const route of PRIMARY_ROUTES) {
    await page.goto(route.path);
    await expect(page.locator("body")).toContainText(route.heading);
    await expect(page.locator(".eh-masthead")).toBeVisible();
    await expect(page.locator(".eh-site-footer")).toBeVisible();
  }
});

test("retired product, login, and search routes are gone", async ({ request }) => {
  for (const route of RETIRED_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
  }
});

test("public pages do not link to retired product surfaces", async ({ request }) => {
  for (const route of PRIMARY_ROUTES.map((item) => item.path)) {
    const response = await request.get(route);
    expect(response.ok(), route).toBeTruthy();
    const html = await response.text();

    expect(html, route).not.toContain("/products/idx/");
    expect(html, route).not.toContain("/idx/");
    expect(html, route).not.toContain("/login/");
    expect(html, route).not.toContain("/search/");
    expect(html, route).not.toContain("Product Catalogue");
    expect(html, route).not.toContain("Grainger");
  }
});

test("homepage has no horizontal overflow on mobile or desktop", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
