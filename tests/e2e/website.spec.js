const { test, expect } = require("@playwright/test");

const PRIMARY_ROUTES = [
  { path: "/", heading: "Mehrdad Zaker" },
  { path: "/work/", heading: "From research to production." },
  { path: "/research/", heading: "Research by Mehrdad Zaker" },
  { path: "/newsletter/", heading: "Writing" },
  { path: "/newsletter/archive/", heading: "Writing" },
  { path: "/about/", heading: /It started with a robot\./ },
  { path: "/contact/", heading: "Bring a concrete systems problem." },
  { path: "/resources/", heading: "Private AI Resource Hub" },
];

const RETIRED_ROUTES = [
  "/products/",
  "/products/idx/",
  "/products/idx/trust/",
  "/idx/assistant/",
  "/idx/support/",
  "/idx/privacy/",
  "/idx/terms/",
  "/login/",
  "/search/",
  "/assets/js/idx-dashboard-wrapper.js",
  "/assets/js/search-page.js",
];

const IDX_REDIRECT_ROUTES = ["/idx/", "/idx/dashboard/"];

test("homepage presents the simplified personal profile", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Mehrdad Zaker/);
  await expect(page.getByRole("heading", { name: "Mehrdad Zaker", level: 1 })).toBeVisible();
  await expect(page.getByText("AI engineer, researcher, and founder building private AI and reliable agent systems from research through production.")).toBeVisible();
  await expect(page.getByText("My work spans private and agentic AI, production ML, reinforcement learning, human–AI interaction, and robotics.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Email Mehrdad" })).toHaveAttribute("href", "/contact/#email");
  await expect(page.getByRole("img", { name: "Mehrdad Zaker" })).toHaveAttribute("src", "/assets/images/mehrdad-zaker-three-quarter-transparent.webp");
  await expect(page.getByRole("link", { name: "Neural Intelligence Labs", exact: true })).toHaveAttribute("href", "https://neuralint.io");

  const navItems = await page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link").all();
  for (const [i, name] of ["Work", "Research", "Writing", "About", "Contact"].entries()) await expect(navItems[i]).toHaveAccessibleName(name);

  await expect(page.locator(".eh-nav")).toHaveCount(0);
  await expect(page.locator(".eh-proof-strip")).toHaveCount(0);
  await expect(page.locator(".eh-focus")).toHaveCount(0);
  await expect(page.locator(".eh-contact__grid")).toHaveCount(0);

  await expect(page.locator(".eh-exec-meta")).toContainText("15+ years");
  await expect(page.locator(".eh-exec-meta")).toContainText("Founder / Member of Technical Staff");
  await expect(page.locator(".eh-exec-meta")).toContainText("Ph.D. CS · 350+ citations");
  await expect(page.locator(".eh-exec-meta")).toContainText("Robotics and invention");

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
  await expect(page.getByText("Founder / Member of Technical Staff, Neural Intelligence Labs")).toBeHidden();
  await about.locator("summary").click();
  await expect(about).toHaveAttribute("open", "");
  await expect(page.getByText("Founder / Member of Technical Staff, Neural Intelligence Labs")).toBeVisible();
  await expect(page.getByRole("link", { name: "Springer handbook chapter" })).toBeVisible();

  const workTitles = await page.locator("#work .eh-exec-row__title").allTextContents();
  expect(workTitles.map((title) => title.trim())).toEqual([
    "Neural Intelligence Labs",
    "Enterprise search and recommendations",
    "Human–AI and robot teaming research",
    "Autonomous robotic retrieval",
  ]);

  const workKinds = await page.locator("#work .eh-exec-row > em").allTextContents();
  expect(workKinds.map((kind) => kind.trim())).toEqual([
    "2025–Present · Founder / Member of Technical Staff",
    "2021–2024 · Staff Applied ML Scientist",
    "2016–2021 · Ph.D. research · Arizona State University",
    "Robotics · Co-inventor",
  ]);

  await expect(page.locator("#work .eh-work-mark")).toHaveCount(4);
  await expect(page.locator("#work")).not.toContainText("Workflow-specific AI systems");
  await expect(page.locator("#work")).not.toContainText("Robotics and autonomy");
  const workLinks = await page.locator("#work .eh-exec-row").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
  expect(workLinks).toEqual([
    "/work/#neural-intelligence-labs",
    "/work/#enterprise-search-and-recommendations",
    "/work/#human-ai-and-robot-teaming-research",
    "/work/#autonomous-robotic-retrieval",
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
    "Enterprise search and recommendations",
    "Human–AI and robot teaming research",
    "Autonomous robotic retrieval",
  ]);

  await expect(page.getByText("Defined the architecture for IDX, a private-AI control plane for source-grounded document workflows.")).toBeVisible();
  await expect(page.getByText("Shaped and delivered production ML systems for search, ranking, and recommendations.")).toBeVisible();
  await expect(page.getByText("Peer-reviewed explanation and human-robot teaming research published at IROS and ICRA.")).toBeVisible();
  await expect(page.getByText("Co-inventor of autonomous robotic retrieval and delivery systems.")).toBeVisible();
  await expect(page.getByRole("link", { name: "USPTO patent record" })).toHaveCount(0);

  const body = page.locator("body");
  await expect(body).not.toContainText("Financial services");
  await expect(body).not.toContainText("Healthcare");
  await expect(body).not.toContainText("Industrial");
  await expect(body).not.toContainText("Product Catalogue");
});

test("research page presents five illustrated research programs", async ({ page }) => {
  await page.goto("/research/");

  const stories = page.locator(".eh-research-story");
  const researchImages = page.locator(".eh-research-story__media img");
  await expect(stories).toHaveCount(5);
  await expect(researchImages).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    const image = researchImages.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect(image).toHaveJSProperty("complete", true);
    expect(await image.evaluate((element) => [element.naturalWidth, element.naturalHeight])).toEqual([900, 900]);
  }
  await expect(page.getByRole("heading", { name: "Human–robot teaming and progressive explanation" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personalized summarization and information retrieval" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Interpretable learning and model alignment" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Efficient language models from bytes to edge" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hardware roots of trustworthy systems" })).toBeVisible();
  await expect(page.getByRole("link", { name: /View Google Scholar/ })).toHaveAttribute("href", /scholar\.google\.com/);
  await expect(page.getByRole("link", { name: /Order Matters/ })).toHaveAttribute("href", "https://arxiv.org/abs/2004.07822");
  await expect(page.getByRole("link", { name: /Extractive Document Summarization/ })).toHaveAttribute("href", "https://doi.org/10.1109/ACCESS.2020.3012539");
  await expect(page.locator(".eh-paper-tag--venue")).toHaveCount(15);
  await expect(page.locator(".eh-paper-tag--year")).toHaveCount(15);
  await expect(page.locator('.eh-paper-tag--venue').filter({ hasText: "ICRA" })).toBeVisible();
  await expect(page.locator('.eh-paper-tag--year[data-year="2021"]')).toHaveCount(2);
  const structuredData = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
    scripts.map((script) => JSON.parse(script.textContent))
  );
  const researchSchema = structuredData.find((item) => item["@type"] === "CollectionPage");
  expect(researchSchema.hasPart).toHaveLength(5);
  expect(researchSchema.hasPart.flatMap((project) => project.subjectOf)).toHaveLength(15);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 820, height: 1180 },
  ]) {
    await page.setViewportSize(viewport);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test("about page presents the current identity and rejects legacy claims", async ({ page }) => {
  await page.goto("/about/");

  const body = page.locator("body");
  await expect(body).toContainText("Mehrdad Zakershahrak, also known as Mehrdad Zaker");
  await expect(body).toContainText("Founder / Member of Technical Staff");
  await expect(body).toContainText("Staff Applied ML Scientist");
  await expect(body).toContainText("RoboCup Humanoid KidSize league");
  await expect(body).toContainText("autonomous robotic retrieval and delivery systems");
  await expect(body).toContainText("Human–AI Interaction in LLM");
  await expect(body).not.toContainText("Pahlavi University");
  await expect(body).not.toContainText("patent application");
  await expect(body).not.toContainText("forthcoming");

  // Catch missing or stale story styles, even when the text still renders.
  await expect(page.locator('link[href*="editorial-home.css"]')).toHaveAttribute("href", /\?v=\d+/);
  const photos = page.locator(".eh-engineering-photos");
  await expect(photos).toHaveCSS("display", "grid");
  await expect(page.locator(".eh-demo-card")).toHaveCount(2);
  await expect(page.locator(".eh-project-card")).toHaveCount(3);
  for (const image of await page.locator(".eh-engineering-photos img, .eh-demo-card img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBeTruthy();
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const cards = await page.locator(".eh-demo-card").evaluateAll((items) => items.map((item) => {
    const rect = item.getBoundingClientRect();
    return { top: rect.top, left: rect.left, bottom: rect.bottom };
  }));
  expect(cards[1].top).toBeGreaterThan(cards[0].bottom);
  expect(cards[1].left).toBe(cards[0].left);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);

});

test("retired product, login, and search routes are gone", async ({ request }) => {
  for (const route of RETIRED_ROUTES) {
    const response = await request.get(route);
    expect(response.status(), route).toBe(404);
  }
});

test("retired IDX routes resolve to the current work page", async ({ request }) => {
  for (const route of IDX_REDIRECT_ROUTES) {
    const response = await request.get(route);
    expect(response.ok(), route).toBeTruthy();
    const html = await response.text();
    const canonicalMatch = html.match(/<link rel="canonical" href="([^"]+)">/);

    expect(html, route).toContain('<meta http-equiv="refresh" content="0; url=/work/">');
    expect(canonicalMatch, route).not.toBeNull();
    expect(new URL(canonicalMatch[1]).pathname, route).toBe("/work/");
    expect(html, route).not.toMatch(/<meta[^>]+name="robots"[^>]+noindex/);
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
