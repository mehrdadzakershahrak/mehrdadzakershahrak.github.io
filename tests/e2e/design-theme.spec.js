const { test, expect } = require("@playwright/test");

test.use({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });

// Expected measurements come from the supplied DESIGN.md, not from the CSS.
test("outlined actions use the reference size, parchment stroke, and clear surface", async ({ page }) => {
  await page.goto("/");
  const email = page.getByRole("link", { name: "Email Mehrdad", exact: true });
  await expect(email).toHaveCSS("font-size", "16px");
  await expect(email).toHaveCSS("border-top-width", "1px");
  await expect(email).toHaveCSS("border-top-color", "rgb(248, 242, 222)");
  await expect(email).toHaveCSS("border-top-left-radius", "4.8px");
  await expect(email).toHaveCSS("padding-top", "11px");
  await expect(email).toHaveCSS("padding-right", "22px");
  await expect(email).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(email).toHaveCSS("background-image", "none");
  await expect(email).toHaveCSS("box-shadow", "none");
});

test("navigation carries the reference frame and visible keyboard keycaps", async ({ page }) => {
  await page.goto("/");
  const banner = page.getByRole("banner");
  const navigation = page.getByRole("navigation", { name: "Primary", exact: true });
  await expect(navigation.getByRole("link", { name: "Work", exact: true })).toHaveCSS("font-size", "16px");
  await expect(banner).toHaveCSS("border-top-color", "rgb(248, 242, 222)");
  await expect(banner).toHaveCSS("border-bottom-color", "rgb(248, 242, 222)");
  expect((await banner.boundingBox()).height).toBe(66);
  for (const [name, key] of [["Work", "W"], ["Research", "R"], ["Writing", "T"], ["About", "A"], ["Contact", "C"]]) {
    const link = navigation.getByRole("link", { name, exact: true });
    const keycap = link.locator("kbd");
    await expect(keycap).toHaveText(key);
    await expect(keycap).toHaveCSS("border-top-left-radius", "4.8px");
    expect((await keycap.boundingBox()).width).toBe(24);
  }
  expect(await banner.evaluate((element) => getComputedStyle(element).position)).not.toMatch(/sticky|fixed/);
  await expect(banner).toHaveCSS("backdrop-filter", "none");
});

test("navigation shortcuts work without interrupting the interactive canvas", async ({ page }) => {
  await page.goto("/");
  const homepage = page.url();
  const canvas = page.getByRole("application", { name: "Interactive Conway's Game of Life simulation" });
  await canvas.focus();
  await canvas.press("t");
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("heading", { name: "Mehrdad Zaker", exact: true }).click();
  await page.keyboard.press("t");
  await expect(page).toHaveURL(homepage);
  const work = page.getByRole("navigation", { name: "Primary", exact: true }).getByRole("link", { name: "Work", exact: true });
  await work.focus();
  await work.press("t");
  await expect(page).toHaveURL(/\/newsletter\/$/);
});

test("the homepage presents a centered nameplate with italic side notes and the work index first", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const name = page.getByRole("heading", { name: "Mehrdad Zaker", exact: true, level: 1 });
  const introduction = page.getByText("AI engineer, researcher, and founder building private AI and reliable agent systems from research through production.", { exact: true });
  const scope = page.getByText("My work spans private and agentic AI, production ML, reinforcement learning, human–AI interaction, and robotics.", { exact: true });
  await expect(introduction).toHaveCSS("font-style", "italic");
  await expect(scope).toHaveCSS("font-style", "italic");
  const boxes = await Promise.all([name, introduction, scope].map((element) => element.boundingBox()));
  const center = boxes[0].y + boxes[0].height / 2;
  expect(boxes[1].x + boxes[1].width).toBeLessThan(boxes[0].x);
  expect(boxes[2].x).toBeGreaterThan(boxes[0].x + boxes[0].width);
  for (const box of boxes.slice(1)) expect(Math.abs(box.y + box.height / 2 - center)).toBeLessThan(1);
  const work = await page.getByRole("heading", { name: "Selected work", exact: true }).boundingBox();
  const life = await page.getByRole("heading", { name: "Game of Life", exact: true }).boundingBox();
  expect(work.y).toBeLessThan(500);
  expect(work.y).toBeLessThan(life.y);
});

test("the architectural work index uses the live reference title scale and generous drawing space", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const work = page.getByRole("region", { name: "Selected work", exact: true });
  const first = work.getByRole("link", { name: /^Neural Intelligence Labs/ });
  const title = first.getByText("Neural Intelligence Labs", { exact: true });
  const date = first.getByText("2025–Present · Founder / Member of Technical Staff", { exact: true });
  // The live source is 32px here; Refero's exported 21px scale is normalized.
  await expect(title).toHaveCSS("font-size", "32px");
  await expect(date).toHaveCSS("font-size", "16px");
  await expect(date).toHaveCSS("color", "rgb(190, 173, 137)");
  const titleBox = await title.boundingBox();
  const dateBox = await date.boundingBox();
  expect(dateBox.y - titleBox.y - titleBox.height).toBeCloseTo(26, 1);
  const second = await work.getByRole("link", { name: /^Enterprise search and recommendations/ }).boundingBox();
  const firstBox = await first.boundingBox();
  expect(second.x - firstBox.x - firstBox.width).toBeCloseTo(26, 1);
  await expect(first).toHaveCSS("box-shadow", "none");
  await expect(first).toHaveCSS("border-top-width", "0px");
  expect((await work.boundingBox()).height).toBeGreaterThanOrEqual(600);
});

test("major divider labels use the live reference's centered 27px italic treatment", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    for (const name of ["Game of Life", "Selected work", "Writing", "Contact"]) {
      const heading = page.getByRole("heading", { name, exact: true, level: 2 });
      await expect(heading).toHaveCSS("font-size", "27.2px");
      await expect(heading).toHaveCSS("font-style", "italic");
      const box = await heading.boundingBox();
      const center = await page.evaluate(() => document.documentElement.clientWidth / 2);
      expect(Math.abs(box.x + box.width / 2 - center), `${name} at ${width}px`).toBeLessThanOrEqual(1);
    }
  }
});

test("document pages use the viewport canvas with 26–51px interior gutters", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const path of ["/work/", "/research/", "/about/", "/resources/local-llm-practical-guide/"]) {
      await page.goto(path);
      const main = page.getByRole("main");
      const bounds = await main.boundingBox();
      const viewport = await page.evaluate(() => document.documentElement.clientWidth);
      expect(bounds.x, path).toBeCloseTo(0, 1);
      expect(bounds.width, path).toBeCloseTo(viewport, 1);
      const padding = await main.evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft));
      expect(padding, path).toBeGreaterThanOrEqual(26);
      expect(padding, path).toBeLessThanOrEqual(51);
    }
  }
});

test("article typography uses the reference heading, long-form, and caption scales", async ({ page }) => {
  await page.goto("/resources/local-llm-practical-guide/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveCSS("font-size", "32px");
  const introduction = page.getByText("A comprehensive reference for running large language models locally, covering hardware, runtimes, optimization techniques, model choices, and practical setups.", { exact: true });
  await expect(introduction).toHaveCSS("font-size", "21px");
  expect(await introduction.evaluate((element) => parseFloat(getComputedStyle(element).lineHeight))).toBeCloseTo(33.6, 1);
  await expect(page.locator("time").first()).toHaveCSS("font-size", "13px");
  await expect(page.locator("time").first()).toHaveCSS("color", "rgb(190, 173, 137)");
});

test("the desktop name plate stays at the single 96px display size", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 1000 });
  await page.goto("/");
  const name = page.getByRole("heading", { name: "Mehrdad Zaker", exact: true, level: 1 });
  await expect(name).toHaveCSS("font-size", "96px");
  await expect(name).toHaveCSS("line-height", "96px");
  await expect(name).toHaveCSS("letter-spacing", "-0.96px");
  const headings = page.getByRole("heading");
  expect(await headings.evaluateAll((elements) => elements.filter((element) => getComputedStyle(element).fontSize === "96px").length)).toBe(1);
});

test("primary page introductions carry the manuscript display typography", async ({ page }) => {
  for (const path of ["/work/", "/research/", "/about/", "/contact/"]) {
    await page.goto(path);
    const title = page.getByRole("heading", { level: 1 });
    await expect(title).toHaveCSS("font-family", /MZ Vellum Display/);
    await expect(title).toHaveCSS("font-size", "96px");
    await expect(title).toHaveCSS("text-align", "center");
    const box = await title.boundingBox();
    const center = await page.evaluate(() => document.documentElement.clientWidth / 2);
    expect(Math.abs(box.x + box.width / 2 - center), path).toBeLessThanOrEqual(1);
  }
});

test("work example headings remain readable after removing decorative marks", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/work/");
    await page.evaluate(() => document.fonts.ready);
    const title = page.getByRole("heading", { name: "Neural Intelligence Labs", exact: true });
    const box = await title.boundingBox();
    expect(box.width, `${width}px`).toBeGreaterThanOrEqual(300);
    expect(box.height, `${width}px`).toBeLessThan(100);
  }
});

test("mobile keeps the reference navigation and borderless project rhythm", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  expect((await page.getByRole("banner").boundingBox()).height).toBe(66);
  const work = page.getByRole("region", { name: "Selected work", exact: true });
  const first = work.getByRole("link", { name: /^Neural Intelligence Labs/ });
  const second = work.getByRole("link", { name: /^Enterprise search and recommendations/ });
  const title = await first.getByText("Neural Intelligence Labs", { exact: true }).boundingBox();
  const date = await first.getByText("2025–Present · Founder / Member of Technical Staff", { exact: true }).boundingBox();
  expect(date.y - title.y - title.height).toBeCloseTo(26, 1);
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(secondBox.y - firstBox.y - firstBox.height).toBeCloseTo(51, 1);
  await expect(first).toHaveCSS("border-bottom-width", "0px");
  const action = page.getByRole("link", { name: "Email Mehrdad", exact: true });
  await expect(action).toHaveCSS("padding-right", "18px");
});

test("the source architectural illustrations sit behind the work and writing indices", async ({ page }) => {
  await page.goto("/");
  const hero = page.getByRole("region", { name: "Mehrdad Zaker", exact: true });
  expect(await hero.evaluate((element) => getComputedStyle(element, "::before").backgroundImage)).toBe("none");
  const work = page.getByRole("region", { name: "Selected work", exact: true });
  const decoration = await work.evaluate((element) => {
    const architecture = getComputedStyle(element, "::before");
    return { architecture: architecture.backgroundImage, opacity: architecture.opacity,
      pointerEvents: architecture.pointerEvents };
  });
  expect(decoration.architecture).toMatch(/^url\(/);
  expect(Number(decoration.opacity)).toBe(1);
  expect(decoration.pointerEvents).toBe("none");
  expect(await page.getByRole("region", { name: "Writing", exact: true }).evaluate((element) => getComputedStyle(element, "::before").backgroundImage)).toMatch(/ornamental-frame\.svg/);
});

test("the permitted full font families render without a third-party font service", async ({ page }) => {
  await page.route(/https:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com)\//, (route) => route.abort());
  await page.goto("/");
  const loaded = await page.evaluate(async () => {
    const requests = ['300 21px "Cormorant Garamond"', 'italic 300 16px "Cormorant Garamond"', '400 96px "Italiana"'];
    return Promise.all(requests.map(async (font) => {
      try { return (await document.fonts.load(font)).filter((face) => face.status === "loaded").length; }
      catch { return 0; }
    }));
  });
  expect(loaded).toEqual([1, 1, 1]);
});

test("inline reference links use 16px parchment text and a 1px underline offset", async ({ page }) => {
  await page.goto("/");
  const link = page.getByRole("link", { name: "View work", exact: true });
  await expect(link).toHaveCSS("font-size", "16px");
  await expect(link).toHaveCSS("text-decoration-line", "underline");
  await expect(link).toHaveCSS("text-decoration-thickness", "1px");
  await expect(link).toHaveCSS("text-underline-offset", "1px");
  await link.hover();
  await expect(link).toHaveCSS("color", "rgb(248, 242, 222)");
  await expect(link).toHaveCSS("text-decoration-thickness", "2px");
});

test("structural hairlines and control outlines remain solid parchment", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("region", { name: "Mehrdad Zaker", exact: true })).toHaveCSS("border-bottom-color", "rgb(248, 242, 222)");
  await expect(page.locator(".eh-site-footer")).toHaveCSS("border-top-color", "rgb(248, 242, 222)");
  for (const name of ["Toggle theme", /^(Pause|Play)$/, "Randomize"]) {
    const control = page.getByRole("button", { name, exact: true }).filter({ visible: true });
    await expect(control).toHaveCSS("border-bottom-width", "1px");
    await expect(control).toHaveCSS("border-bottom-color", "rgb(248, 242, 222)");
  }
});

test("crosshair terminals align with the divider line rather than hanging below it", async ({ page }) => {
  await page.goto("/");
  for (const name of ["Game of Life", "Selected work", "Writing", "Contact"]) {
    const position = await page.getByRole("heading", { name, exact: true, level: 2 }).evaluate((heading) => {
      let divider = heading.parentElement;
      if (getComputedStyle(divider).display === "contents") divider = divider.parentElement;
      return getComputedStyle(divider).backgroundPositionY;
    });
    expect(position, name).toBe("8px, 8px");
  }
});

test("the About disclosure shares the centered italic divider treatment", async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/");
    const about = page.getByRole("region", { name: "About Mehrdad Zaker", exact: true });
    const label = about.getByText("About", { exact: true });
    await expect(label).toHaveCSS("font-size", "27.2px");
    await expect(label).toHaveCSS("font-style", "italic");
    const box = await label.boundingBox();
    const center = await page.evaluate(() => document.documentElement.clientWidth / 2);
    expect(Math.abs(box.x + box.width / 2 - center)).toBeLessThanOrEqual(1);
    await about.locator("summary").click();
    await expect(about.getByText("Founder / Member of Technical Staff, Neural Intelligence Labs", { exact: true })).toBeVisible();
  }
});

test("article dividers fill the interior canvas without a second fixed-width wrapper", async ({ page }) => {
  await page.goto("/resources/local-llm-practical-guide/");
  const main = page.getByRole("main");
  const mainBox = await main.boundingBox();
  const interior = await main.evaluate((element) => element.clientWidth - parseFloat(getComputedStyle(element).paddingLeft) - parseFloat(getComputedStyle(element).paddingRight));
  const header = page.locator("main article > header");
  expect((await header.boundingBox()).width).toBeCloseTo(interior, 1);
  await expect(page.locator(".eh-prose")).toHaveCSS("max-width", "none");
  expect(mainBox.x).toBe(0);
});

test("architectural drawings keep cedar strokes at one pixel when scaled", async ({ page }) => {
  for (const drawing of ["vellum-arches.svg", "vellum-rosette.svg"]) {
    await page.goto(`/assets/images/${drawing}`);
    const circle = page.locator("circle").first();
    await expect(circle).toHaveCSS("stroke", "rgb(69, 104, 89)");
    await expect(circle).toHaveCSS("stroke-width", "1px");
    await expect(circle).toHaveCSS("vector-effect", "non-scaling-stroke");
    await expect(circle).toHaveCSS("fill", "none");
  }
});

test("the rosette's native canvas matches its 128px display footprint", async ({ page }) => {
  await page.goto("/assets/images/vellum-rosette.svg");
  const ornament = await page.locator("svg").boundingBox();
  expect(ornament.width).toBe(128);
  expect(ornament.height).toBe(128);
});

test("research publication titles use the same light 21px project typography", async ({ page }) => {
  await page.goto("/research/");
  const publication = page.getByRole("link", { name: /Order Matters/ }).locator(":scope > span");
  await expect(publication).toHaveCSS("font-size", "21px");
  await expect(publication).toHaveCSS("font-weight", "300");
  await expect(publication).toHaveCSS("color", "rgb(248, 242, 222)");
  const year = page.locator('.eh-paper-tag--year[data-year="2021"]').first();
  await expect(year).toHaveCSS("font-size", "13px");
  await expect(year).toHaveCSS("color", "rgb(190, 173, 137)");
});

test("all existing page panels sit on pine without gradients or elevation", async ({ page }) => {
  for (const path of ["/", "/work/", "/research/", "/about/", "/resources/", "/resources/local-llm-practical-guide/", "/ai-robotics-solutions/"]) {
    await page.goto(path);
    const leaks = await page.getByRole("main").evaluate((main) => {
      const failures = [];
      for (const element of main.querySelectorAll("*")) {
        if (!(element instanceof HTMLElement) || !element.getClientRects().length) continue;
        for (const pseudo of [null, "::before", "::after"]) {
          const style = getComputedStyle(element, pseudo);
          if (style.display === "none" || (pseudo && ["none", "normal"].includes(style.content))) continue;
          const label = `${element.tagName.toLowerCase()}.${element.className}${pseudo || ""}`;
          const backgrounds = ["rgba(0, 0, 0, 0)", "rgb(20, 57, 48)"];
          // Hairlines and masked crosshairs are painted with the text color.
          if (pseudo) backgrounds.push("rgb(248, 242, 222)", "rgb(69, 104, 89)", "rgb(190, 173, 137)");
          if (!backgrounds.includes(style.backgroundColor)) failures.push(`${label}: ${style.backgroundColor}`);
          if (style.backgroundImage.includes("gradient(")) failures.push(`${label}: gradient`);
          if (style.boxShadow !== "none") failures.push(`${label}: shadow`);
        }
      }
      return [...new Set(failures)];
    });
    expect(leaks, path).toEqual([]);
  }
});
