const { test, expect } = require("@playwright/test");

async function installLifePaintCounter(page) {
  await page.addInitScript(() => {
    window.__lifePaintCount = 0;
    const originalClearRect = CanvasRenderingContext2D.prototype.clearRect;
    CanvasRenderingContext2D.prototype.clearRect = function (...args) {
      if (this.canvas && this.canvas.hasAttribute("data-life-canvas")) {
        window.__lifePaintCount += 1;
      }
      return originalClearRect.apply(this, args);
    };
  });
}

test("suspends canvas painting while paused or off-screen", async ({ page }) => {
  await installLifePaintCounter(page);
  await page.goto("/");

  const life = page.locator("#life");
  const canvas = life.locator("[data-life-canvas]");
  await canvas.scrollIntoViewIfNeeded();
  await expect(life.getByRole("button", { name: "Pause" })).toBeVisible();

  await life.getByRole("button", { name: "Pause" }).click();
  await expect(life.getByRole("button", { name: "Play" })).toBeVisible();
  await page.waitForTimeout(100);
  const pausedPaints = await page.evaluate(() => window.__lifePaintCount);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lifePaintCount)).toBe(pausedPaints);

  await life.getByRole("button", { name: "Play" }).click();
  await page.waitForTimeout(150);
  expect(await page.evaluate(() => window.__lifePaintCount)).toBeGreaterThan(
    pausedPaints
  );

  await page.locator("#work").scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const offscreenPaints = await page.evaluate(() => window.__lifePaintCount);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lifePaintCount)).toBe(
    offscreenPaints
  );
});

test("honors reduced motion without a background paint loop", async ({ page }) => {
  await installLifePaintCounter(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const life = page.locator("#life");
  await life.locator("[data-life-canvas]").scrollIntoViewIfNeeded();
  await expect(life.getByRole("button", { name: "Play" })).toBeVisible();
  await page.waitForTimeout(100);
  const settledPaints = await page.evaluate(() => window.__lifePaintCount);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__lifePaintCount)).toBe(
    settledPaints
  );
});

test("keeps mobile interaction scrollable, touch-sized, and stable on resize", async ({
  page,
}) => {
  await installLifePaintCounter(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const life = page.locator("#life");
  const canvas = life.locator("[data-life-canvas]");
  await canvas.scrollIntoViewIfNeeded();

  await page.waitForTimeout(100);
  const mobilePaintStart = await page.evaluate(() => window.__lifePaintCount);
  await page.waitForTimeout(600);
  const mobilePaintDelta =
    (await page.evaluate(() => window.__lifePaintCount)) - mobilePaintStart;
  expect(mobilePaintDelta).toBeGreaterThanOrEqual(8);
  expect(mobilePaintDelta).toBeLessThanOrEqual(22);

  expect(
    await life
      .locator("[data-life-stage]")
      .evaluate((element) => getComputedStyle(element).touchAction)
  ).toContain("pan-y");

  const controlHeights = await life
    .locator(".eh-life__toolbar .eh-life__control")
    .evaluateAll((controls) =>
      controls
        .filter((control) => getComputedStyle(control).display !== "none")
        .map((control) => control.getBoundingClientRect().height)
    );
  expect(controlHeights).toHaveLength(5);
  for (const height of controlHeights) {
    expect(height).toBeGreaterThanOrEqual(44);
  }
  expect(
    await life
      .locator(".eh-life__speed")
      .evaluate((element) => element.getBoundingClientRect().height)
  ).toBeGreaterThanOrEqual(44);

  await expect(
    life.locator(".eh-life__head [data-life-toggle]")
  ).toBeHidden();
  await expect(
    life.locator(".eh-life__toolbar [data-life-toggle]")
  ).toBeVisible();

  await expect
    .poll(async () =>
      Number(await life.locator("[data-life-generation]").textContent())
    )
    .toBeGreaterThan(1);
  await life.getByRole("button", { name: "Pause" }).click();
  const generationBeforeResize = await life
    .locator("[data-life-generation]")
    .textContent();

  await page.setViewportSize({ width: 600, height: 844 });
  await page.waitForTimeout(100);
  expect(await life.locator("[data-life-generation]").textContent()).toBe(
    generationBeforeResize
  );

  await canvas.focus();
  await canvas.press("ArrowRight");
  await canvas.press(" ");
  await expect(life.locator("[data-life-status]")).toContainText(
    "Keyboard cell toggled."
  );
});
