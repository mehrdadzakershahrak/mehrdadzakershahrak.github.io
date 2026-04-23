const { test, expect } = require("@playwright/test");

const PRODUCT_URL = "https://idx.mehrdadzaker.com/v2/portal";
const HOMEPAGE_TITLE = "Mehrdad Zaker — Private AI Systems That Ship";
const HOMEPAGE_DESCRIPTION =
  "Private AI systems that verify every answer, protect sensitive documents, and run in production. Consulting, custom AI systems, and the IDX platform.";
const HOMEPAGE_H1 =
  "Ship private AI that verifies every answer.";
const IDX_DESCRIPTION =
  "IDX lets document-heavy teams ask questions, verify source pages, and track ingest in one workspace.";
const IDX_H1 = "Get answers you can verify before you act.";
const FAILURE_ARTICLE_PATH = "/newsletter/why-most-private-ai-deployments-fail-before-they-ship-in-2026/";
const DEFAULT_SOCIAL_IMAGE_PATH = "/assets/images/private-ai-consulting-header-1200.png";
const LINKEDIN_PROFILE_URL = "https://www.linkedin.com/in/mehrdadzaker";
const GITHUB_PROFILE_URL = "https://github.com/mehrdadzakershahrak";
const PUBLIC_DRAFT_MARKERS = [
  "TODO(mehrdad)",
  "data-mdz-placeholder",
  "this page is scaffolded",
  "placeholder engagements",
  "Figures are illustrative",
];
const OLD_PUBLIC_UI_HTML_MARKERS = [
  'data-mdz-placeholder',
  'class="page__content',
  'class="page__title',
  'class="sidebar__right',
  'class="page__footer',
  'class="archive"',
  'class="archive__',
  'class="mdz-',
  ' mdz-',
];
const HOMEPAGE_PERSON_SCHEMA = {
  "@type": "Person",
  name: "Mehrdad Zaker",
  url: "https://www.mehrdadzaker.com/",
  jobTitle: "Private AI Systems Consultant",
  description:
    "Mehrdad Zaker helps organizations ship private AI systems that are grounded, verifiable, and production-ready for secure, document-heavy workflows.",
  sameAs: [LINKEDIN_PROFILE_URL, "https://twitter.com/mehrdadzaker", GITHUB_PROFILE_URL],
  knowsAbout: [
    "Private AI Systems",
    "Retrieval-Augmented Generation",
    "LLM Deployment",
    "Document AI",
    "Enterprise AI Security",
  ],
};
const HOMEPAGE_PROFESSIONAL_SERVICE_SCHEMA = {
  "@type": "ProfessionalService",
  name: "Mehrdad Zaker — Private AI Consulting",
  url: "https://www.mehrdadzaker.com/",
  description:
    "Private AI systems consulting for organizations moving from pilot to production in secure, document-heavy environments.",
  provider: {
    "@type": "Person",
    name: "Mehrdad Zaker",
  },
  serviceType: "AI Systems Consulting",
  areaServed: "Worldwide",
};
const HOMEPAGE_FAQ_QUESTIONS = [
  "What is a private AI system?",
  "How long does it take to move from AI pilot to production?",
  "When should a team choose a private or hybrid LLM?",
  "How does retrieval-augmented generation improve reliability?",
  "How do you evaluate an AI system before production?",
];
const RESOURCE_GUIDES = [
  {
    path: "/resources/private-llm-pilot-to-production/",
    title: "How to Move a Private LLM from Pilot to Production",
    description:
      "A practical guide for turning a private LLM prototype into a production-ready system with retrieval, evaluation, deployment controls, and rollout discipline.",
    faqs: [
      "What is the first step after a private LLM pilot works?",
      "How long does private LLM production hardening usually take?",
      "What makes a private LLM production-ready?",
      "Should a team choose a smaller local model or a larger hosted model?",
    ],
    sources: [
      "https://www.gartner.com/en/articles/genai-project-failure",
      "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
    ],
    internalLinks: ["/private-ai-deployment/", "/custom-ai-systems/", "/idx/assistant/", "/contact/"],
  },
  {
    path: "/resources/grounding-hallucination-prevention-document-ai/",
    title: "Grounding and Hallucination Prevention in Document-Heavy AI",
    description:
      "How to reduce hallucinations in document-heavy AI systems with retrieval design, evidence preservation, citation checks, and answer evaluation.",
    faqs: [
      "What does grounding mean in a document AI system?",
      "Does RAG eliminate hallucinations?",
      "What is the fastest way to debug hallucinations in RAG?",
      "What should citations prove?",
    ],
    sources: [
      "https://arxiv.org/abs/2304.09848",
      "https://arxiv.org/abs/2312.10997",
      "https://aclanthology.org/2024.naacl-long.20/",
    ],
    internalLinks: ["/idx/assistant/", "/custom-ai-systems/"],
  },
  {
    path: "/resources/secure-enterprise-rag-architecture/",
    title: "RAG Architecture for Secure Enterprise Workflows",
    description:
      "A secure enterprise RAG architecture guide covering ingestion, permissions, retrieval, prompt boundaries, evaluation, monitoring, and rollout controls.",
    faqs: [
      "What is secure enterprise RAG?",
      "Where should access control happen in RAG?",
      "What is the biggest security risk in RAG systems?",
      "Does a vector database replace document permissions?",
    ],
    sources: [
      "https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m04/cisco-2025-data-privacy-benchmark-study-privacy-landscape-grows-increasingly-complex-in-the-age-of-ai.html",
      "https://genai.owasp.org/llmrisk/llm01-prompt-injection/",
      "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence",
    ],
    internalLinks: ["/private-ai-deployment/", "/custom-ai-systems/", "/idx/assistant/", "/contact/"],
  },
  {
    path: "/resources/ai-system-reliability-evaluation-before-deployment/",
    title: "Evaluating AI System Reliability Before Deployment",
    description:
      "A production-focused evaluation guide for private AI systems, covering retrieval, answer quality, permissions, latency, security, and rollout readiness.",
    faqs: [
      "What should an AI reliability evaluation measure?",
      "When should evaluation start?",
      "Are generic benchmarks enough for deployment readiness?",
      "What is a good first evaluation set size?",
    ],
    sources: [
      "https://www.ibm.com/think/x-force/2025-cost-of-a-data-breach-navigating-ai",
      "https://www.nist.gov/itl/ai-risk-management-framework",
      "https://aclanthology.org/2024.naacl-long.20/",
    ],
    internalLinks: ["/private-ai-deployment/", "/custom-ai-systems/", "/idx/assistant/"],
  },
  {
    path: "/resources/private-vs-cloud-ai-regulated-industries/",
    title: "Private vs. Cloud AI: Tradeoffs for Regulated Industries",
    description:
      "A practical comparison of private, cloud, and hybrid AI deployment models for regulated or security-sensitive teams.",
    faqs: [
      "Is private AI always safer than cloud AI?",
      "When should regulated teams use cloud AI?",
      "What is a hybrid AI deployment?",
      "What is the most important deployment decision?",
    ],
    sources: [
      "https://newsroom.cisco.com/c/r/newsroom/en/us/a/y2025/m04/cisco-2025-data-privacy-benchmark-study-privacy-landscape-grows-increasingly-complex-in-the-age-of-ai.html",
      "https://www.ibm.com/think/x-force/2025-cost-of-a-data-breach-navigating-ai",
      "https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai",
      "https://www.nist.gov/itl/ai-risk-management-framework",
    ],
    internalLinks: ["/private-ai-deployment/", "/custom-ai-systems/", "/idx/assistant/", "/contact/"],
  },
];
const RESOURCE_UI_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
];
const PRIMARY_PUBLIC_UI_ROUTES = [
  { path: "/", heading: HOMEPAGE_H1 },
  { path: "/work/", heading: "Engagements where private AI shipped." },
  { path: "/resources/", heading: "Private AI Resource Hub" },
  { path: "/idx/", heading: IDX_H1 },
  { path: "/idx/assistant/", heading: IDX_H1 },
  { path: "/private-ai-deployment/", heading: "Private AI Deployment" },
  { path: "/custom-ai-systems/", heading: "Custom AI Systems" },
  { path: "/ai-robotics-solutions/", heading: "AI and robotics work that starts from the workflow." },
  { path: "/about/", heading: /Get to know\s+Dr\. Mehrdad Zaker/ },
  { path: "/contact/", heading: "Bring a concrete AI, deployment, or workflow problem." },
  { path: "/search/", heading: "Search" },
  { path: "/docs/ui-backlog/", heading: "Current UI Backlog" },
];
const PRIMARY_PUBLIC_UI_PATHS = PRIMARY_PUBLIC_UI_ROUTES.map((route) => route.path);
const CUSTOM_H1_PAGES = [
  {
    path: "/",
    // Editorial homepage hero, Stage 14+. The <br> splits the title so match
    // each half independently.
    headingPattern: /Ship private AI that\s*verifies every answer\./,
  },
  {
    path: "/about/",
    headingPattern: /Get to know\s+Dr\. Mehrdad Zaker/,
  },
  {
    path: "/contact/",
    headingPattern: /Bring a concrete AI, deployment, or workflow problem\./,
  },
  {
    path: "/idx/support/",
    headingPattern: /Get help with IDX access, document workflows, or rollout questions\./,
  },
  {
    path: "/idx/assistant/",
    headingPattern: /Get answers you can verify before you act\./,
  },
];

function countHeadingTags(html, level) {
  return (html.match(new RegExp(`<h${level}\\b`, "gi")) || []).length;
}

async function mockIdxHost(page, title, bodyText) {
  await page.route("https://idx.mehrdadzaker.com/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: `<!doctype html><title>${title}</title><main>${bodyText}</main>`,
    });
  });
}

async function expectNoHorizontalOverflow(page) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    return Math.max(root.scrollWidth, document.body.scrollWidth) - root.clientWidth;
  });
  expect(overflow).toBeLessThanOrEqual(2);
}

function isLocalUrl(url) {
  try {
    return new URL(url).origin === "http://127.0.0.1:4000";
  } catch {
    return false;
  }
}

test("dashboard wrapper is a static handoff that redirects directly to the IDX v2 portal", async ({ request, page }) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('data-idx-dashboard-wrapper');
  expect(html).not.toContain("idx-workspace-dashboard.js");
  expect(html).not.toContain('data-idx-dashboard-app');
  expect(html).toContain("Sign in to IDX v2");

  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.goto("/idx/dashboard/");

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
  await expect(page.getByText("IDX v2 portal")).toBeVisible();
});

test("homepage exposes the updated SEO title, description, and aligned hero copy", async ({ request, page }) => {
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();

  await page.goto("/");

  await expect(page).toHaveTitle(HOMEPAGE_TITLE);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", HOMEPAGE_DESCRIPTION);
  await expect(page.getByRole("heading", { level: 1, name: HOMEPAGE_H1 })).toBeVisible();
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", new RegExp(`${DEFAULT_SOCIAL_IMAGE_PATH}$`));
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", new RegExp(`${DEFAULT_SOCIAL_IMAGE_PATH}$`));
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute("href", "/assets/images/apple-touch-icon.png");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", "/site.webmanifest");
});

test("homepage editorial navigation uses the flat public order", async ({ page }) => {
  await page.goto("/");

  const navItems = await page.locator(".eh-masthead__nav .eh-masthead__link").allTextContents();
  expect(navItems.map((item) => item.trim())).toEqual(["Work", "Writing", "Resources", "About", "Contact"]);

  const toggle = page.locator("#eh-theme-toggle");
  await expect(toggle).toBeVisible();
  const initialTheme = await page.locator("html").getAttribute("data-theme");
  await toggle.click();
  const flippedTheme = await page.locator("html").getAttribute("data-theme");
  expect(flippedTheme).not.toBe(initialTheme);
  expect(["light", "dark"]).toContain(flippedTheme);
});

test("custom-hero pages expose a single content h1 without the theme page title heading", async ({ page, request }) => {
  for (const { path, headingPattern } of CUSTOM_H1_PAGES) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(countHeadingTags(html, 1)).toBe(1);
    expect(html).not.toContain('id="page-title"');

    await page.goto(path);

    const h1 = page.locator("h1");

    await expect(h1).toHaveCount(1);
    await expect(page.locator("#page-title")).toHaveCount(0);
    await expect(h1.first()).toHaveText(headingPattern);
  }
});

test("standard single-layout pages keep the default page title h1", async ({ page, request }) => {
  const response = await request.get("/private-ai-deployment/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(countHeadingTags(html, 1)).toBe(1);
  expect(html).toContain('id="main-title"');
  expect(html).not.toContain('class="page__title');

  await page.goto("/private-ai-deployment/");

  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("#main-title")).toHaveCount(1);
  await expect(page.locator("#main-title")).toHaveText("Private AI Deployment");
});

test("work page is generated and homepage work section is reachable", async ({ request, page }) => {
  const workResponse = await request.get("/work/");
  expect(workResponse.ok()).toBeTruthy();

  const workHtml = await workResponse.text();
  expect(countHeadingTags(workHtml, 1)).toBe(1);
  expect(workHtml).toContain("Engagements where private AI shipped.");

  await page.goto("/work/");
  await expect(page.getByRole("heading", { level: 1, name: "Engagements where private AI shipped." })).toBeVisible();

  const homepageResponse = await request.get("/");
  expect(homepageResponse.ok()).toBeTruthy();

  await page.goto("/");
  await expect(page.locator("#work")).toBeVisible();
  await expect(page.locator('a[href="#work"]:visible').first()).toBeVisible();

  const workLinks = await page.locator("#work a[href^='/']").evaluateAll((links) =>
    links.map((link) => link.getAttribute("href"))
  );
  expect(workLinks).toContain("/idx/");
  for (const href of [...new Set(workLinks)]) {
    const response = await request.get(href);
    expect(response.ok()).toBeTruthy();
  }
});

test("public UI pages do not expose draft copy markers", async ({ request, page }) => {
  for (const path of PRIMARY_PUBLIC_UI_PATHS) {
    const response = await request.get(path);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(countHeadingTags(html, 1)).toBe(1);
    for (const marker of PUBLIC_DRAFT_MARKERS) {
      expect(html).not.toContain(marker);
    }
    for (const marker of OLD_PUBLIC_UI_HTML_MARKERS) {
      expect(html).not.toContain(marker);
    }

    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator("[data-mdz-placeholder]")).toHaveCount(0);
    await expect(
      page.locator(
        '[class^="mdz-"], [class*=" mdz-"], .page__content, .page__title, .sidebar__right, .page__footer, .archive, [class^="archive__"], [class*=" archive__"]'
      )
    ).toHaveCount(0);
  }
});

test("core UI pages load without browser errors or broken local resources", async ({ page }) => {
  const consoleErrors = [];
  const pageErrors = [];
  const failedLocalResponses = [];

  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });
  page.on("response", (response) => {
    if (isLocalUrl(response.url()) && response.status() >= 400) {
      failedLocalResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  for (const path of PRIMARY_PUBLIC_UI_PATHS) {
    await page.goto(path, { waitUntil: "networkidle" });
  }

  expect(consoleErrors).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect(failedLocalResponses).toEqual([]);
});

test("legacy dashboard query params are ignored and still land on IDX v2 home", async ({ page }) => {
  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.goto("/idx/dashboard/?workspace_id=ws_1&document_id=doc_1");

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
});

test("login page redirects directly to product-domain auth", async ({ page }) => {
  await mockIdxHost(page, "IDX auth", "IDX auth login");
  await page.goto("/login/");
  await page.waitForURL(/https:\/\/idx\.mehrdadzaker\.com\/auth\/login\?return_to=/);
  await expect(page.getByText("IDX auth login")).toBeVisible();
});

test("homepage keeps search assets off the page while search layout still loads them", async ({ request, page }) => {
  const homeResponse = await request.get("/");
  expect(homeResponse.ok()).toBeTruthy();
  const homeHtml = await homeResponse.text();
  expect(homeHtml).not.toContain("lunr.min.js");
  expect(homeHtml).not.toContain("lunr-store.js");
  expect(homeHtml).not.toContain('class="search-content"');

  const searchResponse = await request.get("/search/");
  expect(searchResponse.ok()).toBeTruthy();
  const searchHtml = await searchResponse.text();
  expect(searchHtml).toContain("lunr.min.js");
  expect(searchHtml).toContain("lunr-store.js");
  expect(searchHtml).not.toContain('class="search-content"');
  expect(searchHtml).toContain("eh-search-page");
  expect(searchHtml).toContain("eh-search-panel");
  expect(searchHtml).not.toContain('class="archive"');
  expect(searchHtml).not.toContain('class="page__title');

  await page.goto("/search/?q=private%20deployment");
  await expect(page.locator("input#search")).toHaveValue("private deployment");
  await expect(page.locator(".eh-search-results__count")).toContainText(/result(s)? found/);
  await expect(page.locator(".eh-search-result").first()).toBeVisible();
  await expect(page.locator(".archive, [class^='archive__'], [class*=' archive__']")).toHaveCount(0);
});

test("llms.txt is published with service and contact guidance", async ({ request }) => {
  const response = await request.get("/llms.txt");
  expect(response.ok()).toBeTruthy();

  const text = await response.text();
  expect(text).toContain("# Mehrdad Zaker");
  expect(text).toContain("private AI consulting practice");
  expect(text).toContain("source-backed private AI statistics");
  expect(text).toContain("FAQ coverage for custom AI systems");
  expect(text).toContain("https://www.mehrdadzaker.com/contact/");
  expect(text).toContain("https://www.mehrdadzaker.com/idx/assistant/");
  expect(text).toContain("https://www.mehrdadzaker.com/newsletter/why-most-private-ai-deployments-fail-before-they-ship-in-2026/");
  expect(text).toContain("https://www.mehrdadzaker.com/private-ai-deployment/");
  expect(text).toContain("https://www.mehrdadzaker.com/custom-ai-systems/");
  expect(text).toContain("https://www.mehrdadzaker.com/resources/");
  for (const guide of RESOURCE_GUIDES) {
    expect(text).toContain(`https://www.mehrdadzaker.com${guide.path}`);
  }
});

test("resources hub lists the private AI pillar guides and service paths", async ({ request, page }) => {
  const response = await request.get("/resources/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(countHeadingTags(html, 1)).toBe(1);
  expect(html).toContain("Private AI Resource Hub");
  expect(html).toContain("eh-resource-hub");
  expect(html).toContain("eh-problem-strip");
  expect(html).toContain("/private-ai-deployment/");
  expect(html).toContain("/custom-ai-systems/");
  expect(html).toContain("/idx/assistant/");
  expect(html).toContain("/ai-robotics-solutions/");
  expect(html).toContain("/contact/");

  await page.goto("/resources/");
  await expect(page.getByRole("heading", { level: 1, name: "Private AI Resource Hub" })).toBeVisible();
  await expect(page.locator(".eh-problem-strip")).toBeVisible();
  for (const guide of RESOURCE_GUIDES) {
    await expect(page.getByRole("link", { name: guide.title }).first()).toHaveAttribute("href", guide.path);
  }
});

test("resources hub layout stays intentional across desktop and mobile", async ({ page }) => {
  for (const viewport of RESOURCE_UI_VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/resources/");

    await expectNoHorizontalOverflow(page);
    await expect(page.locator(".eh-resource-hub .eh-showcase__hero")).toBeVisible();
    await expect(page.locator(".eh-problem-strip")).toBeVisible();
    await expect(page.locator(".eh-guide-card")).toHaveCount(RESOURCE_GUIDES.length);

    await expect(page.locator(".eh-guide-card").first()).toBeVisible();
  }
});

test("private AI resource guides publish article schema, FAQ schema, citations, and service links", async ({ request, page }) => {
  for (const guide of RESOURCE_GUIDES) {
    const response = await request.get(guide.path);
    expect(response.ok()).toBeTruthy();

    const html = await response.text();
    expect(countHeadingTags(html, 1)).toBe(1);
    expect(html).toContain('class="eh-toc"');
    expect(html).toContain("In this guide");
    for (const sourceUrl of guide.sources) {
      expect(html).toContain(sourceUrl);
    }
    for (const internalLink of guide.internalLinks) {
      expect(html).toContain(internalLink);
    }

    await page.goto(guide.path);
    await expect(page.getByRole("heading", { level: 1, name: guide.title })).toBeVisible();
    await expect(page.locator(".eh-toc-rail .eh-toc")).toBeVisible();
    for (const question of guide.faqs) {
      await expect(page.getByRole("heading", { level: 3, name: question })).toBeVisible();
    }

    const structuredData = await page.locator('script[type="application/ld+json"]').allTextContents();
    const parsedStructuredData = structuredData.map((scriptText) => JSON.parse(scriptText));
    const articleSchema = parsedStructuredData.find((entry) => entry["@type"] === "Article");
    expect(articleSchema).toEqual(
      expect.objectContaining({
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        author: expect.objectContaining({ "@type": "Person", name: "Mehrdad Zaker" }),
        datePublished: expect.stringContaining("2026-04-19"),
        dateModified: expect.stringContaining("2026-04-19"),
      })
    );
    expect(articleSchema.mainEntityOfPage).toEqual(
      expect.objectContaining({
        "@type": "WebPage",
        "@id": expect.stringMatching(new RegExp(`${guide.path}$`)),
      })
    );

    const faqSchema = parsedStructuredData.find((entry) => entry["@type"] === "FAQPage");
    expect(faqSchema).toBeTruthy();
    expect(faqSchema.mainEntity.map((entry) => entry.name)).toEqual(guide.faqs);
    expect(faqSchema.mainEntity.every((entry) => entry.acceptedAnswer["@type"] === "Answer")).toBe(true);
  }
});

test("resource guide reading layout exposes content before oversized navigation", async ({ page }) => {
  const articlePath = "/resources/private-llm-pilot-to-production/";

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(articlePath);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".eh-toc-rail .eh-toc")).toBeVisible();
  await expect(page.locator(".eh-toc-mobile")).toBeHidden();

  const desktopFirstParagraphTop = await page.locator(".eh-resource-body > p").first().evaluate((element) => element.getBoundingClientRect().top);
  expect(desktopFirstParagraphTop).toBeLessThan(520);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(articlePath);
  await expectNoHorizontalOverflow(page);
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator(".eh-toc-rail")).toBeHidden();
  await expect(page.locator(".eh-toc-mobile")).toBeVisible();
  await expect(page.locator(".eh-toc-mobile")).not.toHaveAttribute("open", "");

  await page.locator(".eh-toc-mobile summary").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".eh-toc-mobile .eh-toc")).toBeVisible();

  await page.locator(".eh-toc-mobile summary").click();
  const mobileFirstParagraphTop = await page.locator(".eh-resource-body > p").first().evaluate((element) => element.getBoundingClientRect().top);
  expect(mobileFirstParagraphTop).toBeLessThan(640);
});

test("resource UI changes do not introduce horizontal overflow on primary pages", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    for (const pageUnderTest of PRIMARY_PUBLIC_UI_ROUTES) {
      await page.goto(pageUnderTest.path);
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("heading", { level: 1, name: pageUnderTest.heading })).toBeVisible();
    }
  }
});

test("resource guides are discoverable through sitemap and local search data", async ({ request }) => {
  const sitemapResponse = await request.get("/sitemap.xml");
  expect(sitemapResponse.ok()).toBeTruthy();
  const sitemap = await sitemapResponse.text();

  const searchStoreResponse = await request.get("/assets/js/lunr/lunr-store.js");
  expect(searchStoreResponse.ok()).toBeTruthy();
  const searchStore = await searchStoreResponse.text();

  for (const guide of RESOURCE_GUIDES) {
    expect(sitemap).toContain(guide.path);
    expect(searchStore).toContain(guide.title);
    expect(searchStore).toContain(guide.path);
  }
});

test("idx landing page stays public and does not load retired guidance or dashboard bundles", async ({ request, page }) => {
  const response = await request.get("/idx/assistant/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("eh-showcase--idx");
  expect(html).toContain("Open IDX dashboard");
  expect(html).not.toContain("Industry Guidance");
  expect(html).not.toContain("idx-guidance.js");
  expect(html).not.toContain("idx-dashboard.js");
  expect(html).not.toContain("data-idx-guidance");

  await page.goto("/idx/assistant/");

  const hero = page.locator(".eh-showcase--idx .eh-showcase__hero");

  await expect(page).toHaveTitle(/IDX/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", IDX_DESCRIPTION);
  await expect(hero.getByRole("heading", { name: IDX_H1 })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Open IDX dashboard" })).toHaveAttribute("href", "/idx/dashboard/");
  await expect(hero.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login/");
  await expect(hero.getByRole("link", { name: "Private deployment" })).toHaveAttribute("href", "/private-ai-deployment/");
  await expect(page.locator('script[src*="idx-dashboard.js"]')).toHaveCount(0);
});

test("idx landing page remains usable on mobile and the dashboard CTA still hands off to the product host", async ({ page }) => {
  await mockIdxHost(page, "IDX v2", "IDX v2 portal");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/idx/assistant/");

  const hero = page.locator(".eh-showcase--idx .eh-showcase__hero");

  await expect(hero.getByRole("heading", { name: IDX_H1 })).toBeVisible();
  await expect(hero.getByRole("link", { name: "Sign in" })).toBeVisible();
  await hero.getByRole("link", { name: "Open IDX dashboard" }).click();

  await page.waitForURL(PRODUCT_URL);
  expect(page.url()).toBe(PRODUCT_URL);
  await expect(page.getByText("IDX v2 portal")).toBeVisible();
});

test("deployment failure article bridges to IDX while keeping the final consulting CTA", async ({ request, page }) => {
  const response = await request.get(FAILURE_ARTICLE_PATH);
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain("/idx/assistant/");
  expect(html).toContain("Get in touch");

  await page.goto(FAILURE_ARTICLE_PATH);
  await expect(page.locator(".eh-prose").getByRole("link", { name: "IDX" })).toHaveAttribute("href", "/idx/assistant/");
  await expect(page.getByRole("link", { name: "Get in touch" })).toHaveAttribute("href", "/contact/");
});
