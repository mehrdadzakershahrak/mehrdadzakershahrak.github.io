const { test, expect } = require("@playwright/test");

const PRIMARY_ROUTES = [
  { path: "/", heading: "Mehrdad Zaker" },
  { path: "/work/", heading: "From research to production." },
  { path: "/newsletter/", heading: "Writing" },
  { path: "/newsletter/archive/", heading: "Newsletter Archive" },
  { path: "/about/", heading: /Trustworthy AI,\s*from research\s*to production\./ },
  { path: "/contact/", heading: "Bring a concrete systems problem." },
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
  await expect(page.getByText("Founder and principal-level AI engineer building trustworthy AI systems from research through production.")).toBeVisible();
  await expect(page.getByText("My work spans private and agentic AI, production ML, reinforcement learning, human–AI interaction, and robotics.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Email Mehrdad" })).toHaveAttribute("href", /mailto:/);
  await expect(page.getByRole("img", { name: "Mehrdad Zaker" })).toHaveAttribute("src", "/assets/images/mehrdad-zaker-headshot.jpeg");
  await expect(page.getByRole("link", { name: "Neural Intelligence Labs", exact: true })).toHaveAttribute("href", "https://neuralint.io");

  const navItems = await page.locator(".eh-masthead__nav a").allTextContents();
  expect(navItems.map((item) => item.trim())).toEqual(["Work", "Writing", "About", "Contact"]);

  await expect(page.locator(".eh-nav")).toHaveCount(0);
  await expect(page.locator(".eh-proof-strip")).toHaveCount(0);
  await expect(page.locator(".eh-focus")).toHaveCount(0);
  await expect(page.locator(".eh-contact__grid")).toHaveCount(0);

  await expect(page.locator(".eh-exec-meta")).toContainText("15+ years");
  await expect(page.locator(".eh-exec-meta")).toContainText("Founder / Founding AI Engineer");
  await expect(page.locator(".eh-exec-meta")).toContainText("Ph.D. CS · 350+ citations");
  await expect(page.locator(".eh-exec-meta")).toContainText("U.S. Patent 12,640,000");

  const life = page.locator("#life");
  await expect(life.getByRole("heading", { name: "Game of Life" })).toBeVisible();
  await expect(life.locator("canvas")).toBeVisible();
  await expect(life.getByRole("button", { name: "Pause" })).toBeVisible();
  await expect(life.getByRole("button", { name: "Randomize" })).toBeVisible();
  await expect(life.getByRole("button", { name: "Glider" })).toBeVisible();
  await expect(life.getByRole("button", { name: "Pulsar" })).toBeVisible();
  await expect(life.getByRole("button", { name: "Clear" })).toBeVisible();
  await expect(life.getByLabel("Speed")).toBeVisible();

  const about = page.locator(".eh-about-drop");
  await expect(about).not.toHaveAttribute("open", "");
  await expect(page.getByText("Founder / Founding AI Engineer, Neural Intelligence Labs")).toBeHidden();
  await about.locator("summary").click();
  await expect(about).toHaveAttribute("open", "");
  await expect(page.getByText("Founder / Founding AI Engineer, Neural Intelligence Labs")).toBeVisible();
  await expect(page.getByRole("link", { name: "Granted U.S. robotics patent" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Springer handbook chapter" })).toBeVisible();

  const workTitles = await page.locator("#work .eh-exec-row__title").allTextContents();
  expect(workTitles.map((title) => title.trim())).toEqual([
    "Neural Intelligence Labs",
    "Production ML at Grainger",
    "Human–AI and robot teaming research",
    "Robotic vending machine system",
  ]);

  const workKinds = await page.locator("#work .eh-exec-row > em").allTextContents();
  expect(workKinds.map((kind) => kind.trim())).toEqual([
    "2025–Present · Founder / Founding AI Engineer",
    "2021–2024 · Staff Applied ML Scientist",
    "2016–2021 · Ph.D. research · Arizona State University",
    "Granted 2026 · U.S. Patent No. 12,640,000 · Co-inventor",
  ]);

  await expect(page.locator("#work .eh-work-mark")).toHaveCount(4);
  await expect(page.locator("#work")).not.toContainText("Workflow-specific AI systems");
  await expect(page.locator("#work")).not.toContainText("Robotics and autonomy");
  const workLinks = await page.locator("#work .eh-exec-row").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(workLinks).toEqual([
    "/work/#neural-intelligence-labs",
    "/work/#production-ml-at-grainger",
    "/work/#human-ai-and-robot-teaming-research",
    "/work/#robotic-vending-machine-system",
  ]);
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

test("work page renders four CV-grounded work records", async ({ page }) => {
  await page.goto("/work/");

  const briefs = page.locator(".eh-work-brief");
  await expect(briefs).toHaveCount(4);
  await expect(page.locator(".eh-work-brief .eh-work-mark")).toHaveCount(4);

  const briefTitles = await page.locator(".eh-work-brief h3").allTextContents();
  expect(briefTitles.map((title) => title.trim())).toEqual([
    "Neural Intelligence Labs",
    "Production ML at Grainger",
    "Human–AI and robot teaming research",
    "Robotic vending machine system",
  ]);

  await expect(page.getByText("Defined the architecture for IDX, a private-AI control plane for source-grounded document workflows.")).toBeVisible();
  await expect(page.getByText("Shaped and delivered production ML systems for search, ranking, and recommendations.")).toBeVisible();
  await expect(page.getByText("Peer-reviewed explanation and human-robot teaming research published at IROS and ICRA.")).toBeVisible();
  await expect(page.getByText("Co-inventor on the granted robotic vending machine system patent.")).toBeVisible();
  await expect(page.getByRole("link", { name: "USPTO patent record" })).toHaveAttribute("href", /US12640000/);

  const body = page.locator("body");
  await expect(body).not.toContainText("Financial services");
  await expect(body).not.toContainText("Healthcare");
  await expect(body).not.toContainText("Industrial");
  await expect(body).not.toContainText("Product Catalogue");
});

test("about page presents the current identity and rejects legacy claims", async ({ page }) => {
  await page.goto("/about/");

  const body = page.locator("body");
  await expect(body).toContainText("Mehrdad Zakershahrak—Mehrdad Zaker on this site");
  await expect(body).toContainText("Founder / Founding AI Engineer at Neural Intelligence Labs");
  await expect(body).toContainText("Staff Applied ML Scientist at Grainger");
  await expect(body).toContainText("Shiraz University, 2006–2010");
  await expect(body).toContainText("U.S. Patent No. 12,640,000");
  await expect(body).toContainText("Human–AI Interaction in LLM");
  await expect(body).not.toContainText("Pahlavi University");
  await expect(body).not.toContainText("patent application");
  await expect(body).not.toContainText("forthcoming");
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
