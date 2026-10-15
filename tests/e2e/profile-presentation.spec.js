const { test, expect } = require("@playwright/test");
const baseline = require("../fixtures/public-content-approved.json");

test("the About page shows experience through its story and projects without a separate career timeline", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/about/");
    await expect(page.getByRole("heading", { name: "Background at a glance", exact: true })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: /^(Experience|Employment history|Career history)$/i })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Engineering for everyday use", exact: true })).toBeVisible();
    await expect(page.getByText(/^As a Staff Applied ML Scientist, I built/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Selected research and invention", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore Hormuz ↗", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Autonomous robotic retrieval", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("public pages remove employer associations and identifying patent links while retaining engineering work", async ({ page, request }) => {
  for (const file of [...Object.keys(baseline.pages), "llms.txt"]) {
    const response = await request.get(`/${file}`);
    expect(/grainger|fortune 500|industrial distributor|12,640,000|12640000|patentsgazette\.uspto/i.test(await response.text()), file).toBe(false);
  }
  await page.goto("/work/");
  const project = page.getByRole("article", { name: "Enterprise search and recommendations", exact: true });
  await expect(project).toContainText("Production machine-learning work across search");
  await expect(project).toContainText("Staff Applied ML Scientist");
  await expect(project).toContainText("Shaped and delivered production ML systems for search, ranking, and recommendations.");
  await expect(project).toContainText("projected to reduce losses");
  await page.goto("/");
  await expect(page.getByRole("link", { name: /^Enterprise search and recommendations/ }))
    .toHaveAttribute("href", "/work/#enterprise-search-and-recommendations");
});
