const { test, expect } = require("@playwright/test");

test("work section links and navigation skips move focus to the requested content", async ({ page }) => {
  await page.goto("/work/");
  await page.getByRole("navigation", { name: "Work sections" }).getByRole("link", { name: "Experience", exact: true }).click();
  await expect(page).toHaveURL(/#work-briefs-title$/);
  await expect(page.locator("#work-briefs-title")).toBeFocused();
  const skip = page.getByRole("link", { name: "Skip to primary navigation", exact: true });
  await skip.focus();
  await skip.click();
  await expect(page.getByRole("banner")).toBeFocused();
});

test("featured projects lead to their detailed engineering stories", async ({ page }) => {
  for (const [title, id] of [["Index (IDX)", "index"], ["Koto", "koto"], ["LinkedFull", "linkedfull"]]) {
    await page.goto("/");
    const card = page.locator(".mz-project-card").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(card).toHaveAttribute("href", `/work/#${id}`);
    await card.click();
    await expect(page).toHaveURL(new RegExp(`/work/#${id}$`));
    const story = page.getByRole("article", { name: title, exact: true });
    await expect(story).toBeVisible();
    await expect(story.locator("p").first()).not.toBeEmpty();
    await expect(story.getByRole("link")).toHaveAttribute("href", /^https:\/\//);
  }
});

test("Index's reported parsing figure keeps its denominator and attribution", async ({ page }) => {
  await page.goto("/work/#index");
  const result = page.getByRole("complementary", { name: "Index parsing evaluation" });
  await expect(result).toContainText("99.86%");
  await expect(result).toContainText("5 million documents");
  await expect(result).toContainText("provided by Mehrdad Zaker");
  await expect(page.locator("#index")).not.toContainText("all PDFs");
  await expect(page.locator("#koto")).toContainText("alpha CLI");
});

test("pinned repositories have source links, complete artwork, and bounded descriptions", async ({ page }) => {
  for (const width of [390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/work/");
    const cards = page.locator(".mz-repo-card");
    await expect(cards).toHaveCount(6);
    for (const card of await cards.all()) {
      await expect(card).toHaveAttribute("href", /^https:\/\/github\.com\/mehrdadzakershahrak\//);
      const image = card.locator("img");
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
    }
    await expect(page.getByText("Unfinished experiment", { exact: true })).toBeVisible();
    await expect(page.getByText("Exploratory scaffold", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
});

test("project cards remain readable and actionable with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto("/");
  const card = page.locator(".mz-project-card").filter({ hasText: "Index (IDX)" });
  await expect(card.getByRole("heading", { name: "Index (IDX)", exact: true })).toBeVisible();
  await card.click();
  await expect(page.getByRole("article", { name: "Index (IDX)", exact: true })).toBeVisible();
  await context.close();
});
