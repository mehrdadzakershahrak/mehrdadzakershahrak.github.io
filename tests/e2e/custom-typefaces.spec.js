const { test, expect } = require("@playwright/test");

test("the website renders the custom display and true italic text families on desktop and mobile", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const name = page.getByRole("heading", { name: "Mehrdad Zaker", exact: true, level: 1 });
    await expect(name).toHaveCSS("font-family", /MZ Vellum Display/);
    await expect(page.locator("body")).toHaveCSS("font-family", /MZ Vellum Text/);
    const faces = await page.evaluate(async () => Promise.all([
      '400 96px "MZ Vellum Display"', '300 21px "MZ Vellum Text"', 'italic 300 16px "MZ Vellum Text"',
    ].map(async (request) => (await document.fonts.load(request, "Mehrdad Zaker éÅȘș"))
      .map((face) => ({ status: face.status, family: face.family, style: face.style })))));
    expect(faces).toEqual([
      [{ status: "loaded", family: "MZ Vellum Display", style: "normal" }],
      [{ status: "loaded", family: "MZ Vellum Text", style: "normal" }],
      [{ status: "loaded", family: "MZ Vellum Text", style: "italic" }],
    ]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.goto("/resources/local-llm-practical-guide/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-family", /MZ Vellum Text/);
});
