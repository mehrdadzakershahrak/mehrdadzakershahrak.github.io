const { test, expect } = require("@playwright/test");
const baseline = require("../fixtures/public-content-approved.json");

const fs = require("node:fs");
const path = require("node:path");
const contact = fs.readFileSync(path.join(__dirname, "../../_data/contact.yml"), "utf8");
const EMAIL = Buffer.from(contact.match(/^address_encoded: "([^"]+)"/m)[1], "base64").toString("utf8");

test("the email check stays readable in both themes and fits desktop and mobile", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/contact/#email");
    const gate = page.getByRole("region", { name: "Email verification", exact: true });
    const form = gate.locator("form");
    for (const [theme, ink] of [["dark", "rgb(248, 242, 222)"], ["light", "rgb(20, 57, 48)"]]) {
      if (await page.locator("html").getAttribute("data-theme") !== theme) {
        await page.getByRole("button", { name: "Toggle theme", exact: true }).click();
      }
      await expect(form).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(gate.locator("label")).toHaveCSS("color", ink);
      await expect(gate.getByRole("button", { name: "Reveal email", exact: true })).toHaveCSS("color", ink);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
  }
});

test("email links lead to a check that reveals the address only after a correct answer", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("region", { name: "Mehrdad Zaker", exact: true })
    .getByRole("link", { name: "Email Mehrdad", exact: true }).click();
  await expect(page).toHaveURL(/\/contact\/#email$/);
  const gate = page.getByRole("region", { name: "Email verification", exact: true });
  await expect(gate).toBeVisible();
  await expect(page.getByText(EMAIL, { exact: true })).toHaveCount(0);
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  const question = gate.getByText(/^What is \d+ plus \d+\?$/);
  const numbers = (await question.textContent()).match(/\d+/g).map(Number);
  const answer = gate.getByRole("spinbutton", { name: /^What is/ });
  await answer.fill("0");
  await gate.getByRole("button", { name: "Reveal email", exact: true }).click();
  await expect(gate.getByRole("status")).toContainText("That answer isn't right");
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await answer.fill(String(numbers[0] + numbers[1]));
  await answer.press("Enter");
  const email = gate.getByRole("link", { name: EMAIL, exact: true });
  await expect(email).toHaveAttribute("href", `mailto:${EMAIL}`);
  await expect(email).toBeFocused();
  await page.reload();
  await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  await expect(page.getByText(EMAIL, { exact: true })).toHaveCount(0);
});

test("public pages and local scripts contain no plain address or direct email links", async ({ request, baseURL }) => {
  const scripts = new Set();
  for (const file of Object.keys(baseline.pages)) {
    const response = await request.get(`/${file}`);
    const html = await response.text();
    expect(html.includes(EMAIL), file).toBe(false);
    expect(/href\s*=\s*["']mailto:/i.test(html), file).toBe(false);
    for (const [, src] of html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)) {
      const url = new URL(src, baseURL);
      if (url.origin === new URL(baseURL).origin) scripts.add(url.href);
    }
  }
  for (const url of scripts) {
    const response = await request.get(url);
    expect(response.ok(), url).toBe(true);
    expect((await response.text()).includes(EMAIL), url).toBe(false);
  }
});
