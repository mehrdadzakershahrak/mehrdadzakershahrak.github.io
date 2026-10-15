const { test, expect } = require("@playwright/test");

test("a reader can set their own specimen text, face, and size", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Font face", { exact: true }).selectOption({ label: "Text Light Italic" });
  const editor = page.getByRole("textbox", { name: "Your specimen", exact: true });
  await editor.fill("Après la pluie — Știință, façade, œuvre.");
  await page.getByLabel("Font size in pixels", { exact: true }).fill("32");
  await expect(editor).toHaveValue("Après la pluie — Știință, façade, œuvre.");
  await expect(editor).toHaveCSS("font-family", '"MZ Vellum Text", Georgia, serif');
  await expect(editor).toHaveCSS("font-style", "italic");
  await expect(editor).toHaveCSS("font-size", "32px");
  await page.getByLabel("Font face", { exact: true }).selectOption({ label: "Display Regular" });
  await expect(editor).toHaveCSS("font-family", '"MZ Vellum Display", Georgia, serif');
  await expect(editor).toHaveCSS("font-style", "normal");
  await expect(editor).toHaveValue("Après la pluie — Știință, façade, œuvre.");
});

test("the specimen loads every face and presents the European alphabet without horizontal overflow", async ({ page, request }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "MZ Vellum", exact: true })).toBeVisible();
    const loaded = await page.evaluate(async () => Promise.all([
      '400 96px "MZ Vellum Display"', '300 21px "MZ Vellum Text"', 'italic 300 21px "MZ Vellum Text"',
    ].map(async (font) => (await document.fonts.load(font, "ÉÅœß ȘșȚț ģ Ľľ")).filter((face) => face.status === "loaded").length)));
    expect(loaded).toEqual([1, 1, 1]);
    await expect(page.getByText("Șș Țț Ģģ Ķķ Ļļ Ņņ Ŗŗ", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  for (const name of ["Display TTF", "Text TTF", "Italic TTF"]) {
    const response = await request.get(await page.getByRole("link", { name, exact: true }).getAttribute("href"));
    expect(response.ok(), name).toBe(true);
    expect((await response.body()).length).toBeGreaterThan(10000);
  }
  expect(errors).toEqual([]);
});
