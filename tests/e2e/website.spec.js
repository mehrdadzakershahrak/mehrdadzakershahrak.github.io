const { test, expect } = require("@playwright/test");

const PREVIEW_SESSION_KEY = "mdz_idx_local_preview_session_v1";
const PREVIEW_WORKSPACE_KEY = "mdz_idx_workspace_preview_v1";

async function seedLocalPreview(page, store) {
  await page.addInitScript(
    ({ previewSessionKey, previewWorkspaceKey, previewStore }) => {
      window.localStorage.clear();
      window.localStorage.setItem(
        previewSessionKey,
        JSON.stringify({
          enabled: true,
          activatedAt: "2026-04-05T16:00:00.000Z",
        }),
      );
      window.localStorage.setItem(previewWorkspaceKey, JSON.stringify(previewStore));
    },
    {
      previewSessionKey: PREVIEW_SESSION_KEY,
      previewWorkspaceKey: PREVIEW_WORKSPACE_KEY,
      previewStore: store,
    },
  );
}

function previewStoreWithTwoWorkspaces() {
  return {
    workspaces: [
      {
        workspace_id: "ws_latest",
        name: "Latest diligence",
        notes: "Most recent workspace",
        workspace_type: "general",
        workspace_status: "active",
        document_count: 2,
        summary_preview: "Latest summary",
        summary: { summary: "Latest summary", citations: [] },
        facts: { fields: [] },
        latest_analysis_jobs: {},
        access_role: "owner",
        updated_at: "2026-04-05T17:00:00.000Z",
        created_at: "2026-04-05T16:00:00.000Z",
      },
      {
        workspace_id: "ws_older",
        name: "Older workspace",
        notes: "Previous review",
        workspace_type: "general",
        workspace_status: "active",
        document_count: 1,
        summary_preview: "Older summary",
        summary: { summary: "Older summary", citations: [] },
        facts: { fields: [] },
        latest_analysis_jobs: {},
        access_role: "owner",
        updated_at: "2026-04-04T17:00:00.000Z",
        created_at: "2026-04-04T16:00:00.000Z",
      },
    ],
    documents: [
      {
        document_id: "doc_processing",
        workspace_id: "ws_latest",
        file_name: "Beta Processing.pdf",
        status: "processing",
        ocr_status: "running",
        index_status: "pending",
        updated_at: "2026-04-05T17:00:00.000Z",
        created_at: "2026-04-05T16:30:00.000Z",
      },
      {
        document_id: "doc_ready",
        workspace_id: "ws_latest",
        file_name: "Alpha Ready.pdf",
        status: "ready",
        ocr_status: "ready",
        index_status: "ready",
        updated_at: "2026-04-05T16:55:00.000Z",
        created_at: "2026-04-05T16:20:00.000Z",
      },
      {
        document_id: "doc_old",
        workspace_id: "ws_older",
        file_name: "Legacy Packet.pdf",
        status: "ready",
        ocr_status: "ready",
        index_status: "ready",
        updated_at: "2026-04-04T17:00:00.000Z",
        created_at: "2026-04-04T16:30:00.000Z",
      },
    ],
    activity: [],
  };
}

test("dashboard page renders locally instead of redirecting", async ({ request }) => {
  const response = await request.get("/idx/dashboard/");
  expect(response.ok()).toBeTruthy();

  const html = await response.text();
  expect(html).toContain('data-idx-dashboard');
  expect(html).toContain("Sign in to open the IDX workspace dashboard");
  expect(html).not.toContain('window.location.replace("https://idx.mehrdadzaker.com/v2/portal")');
  expect(html).not.toContain('content="0; url=https://idx.mehrdadzaker.com/v2/portal"');
});

test("site navigation keeps IDX entry links on the local dashboard", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('a[href="/idx/dashboard/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/idx/dashboard/"]').first()).toHaveAttribute("href", "/idx/dashboard/");
});

test("login page renders a deterministic local signed-out shell without Google", async ({ page }) => {
  await page.route("https://accounts.google.com/**", async (route) => {
    await route.abort();
  });

  await page.goto("/login/");

  await expect(page.getByRole("heading", { name: "Sign in with Google" })).toBeVisible();
  await expect(
    page.getByText("Google sign-in could not load locally. Continue in local preview or refresh and try again."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue in local preview" })).toBeVisible();
});

test("dashboard auto-opens the latest workspace and falls back to the first ready document", async ({ page }) => {
  await seedLocalPreview(page, previewStoreWithTwoWorkspaces());

  await page.goto("/idx/dashboard/");

  await expect(page.locator("[data-idx-workspace-switcher]")).toHaveValue("ws_latest");
  await expect(page.locator("[data-idx-selected-document-title]")).toHaveText("Alpha Ready.pdf");
  await expect(page).toHaveURL(/workspace_id=ws_latest/);
  await expect(page).toHaveURL(/document_id=doc_ready/);
});

test("dashboard shows a compact empty state when no workspaces exist", async ({ page }) => {
  await seedLocalPreview(page, { workspaces: [], documents: [], activity: [] });

  await page.goto("/idx/dashboard/");

  await expect(page.locator("[data-idx-selected-document-title]")).toHaveText("Create your first workspace");
  await expect(page.locator("[data-idx-create-panel]")).toBeVisible();
  await expect(page.locator("[data-idx-workspace-documents]")).toContainText("No workspace yet.");
});

test("local preview flow creates a workspace, uploads PDFs, updates selection, and runs compare", async ({ page }) => {
  await seedLocalPreview(page, { workspaces: [], documents: [], activity: [] });

  await page.goto("/idx/dashboard/");

  await page.locator("[data-idx-workspace-name]").fill("Preview Review");
  await page.locator("[data-idx-workspace-type]").selectOption("general");
  await page.locator("[data-idx-create-workspace-form]").getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/workspace_id=/);
  await expect(page.locator("[data-idx-workspace-title]")).toHaveText("Preview Review");

  await page.locator("[data-idx-file-input]").setInputFiles([
    {
      name: "Alpha.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
    },
    {
      name: "Zulu.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"),
    },
  ]);

  await expect(page.locator("[data-idx-workspace-documents] [data-idx-select-document]")).toHaveCount(2);
  await expect(page.locator("[data-idx-selected-document-title]")).toHaveText("Alpha.pdf");

  await page.locator('[data-idx-select-document]:has-text("Zulu.pdf")').click();
  await expect(page.locator("[data-idx-selected-document-title]")).toHaveText("Zulu.pdf");
  await expect(page).toHaveURL(/document_id=/);

  await page.locator('[data-idx-inspector-tab="compare"]').click();
  await expect(page.locator("[data-idx-compare-left-label]")).toHaveText("Zulu.pdf");
  await page.locator("[data-idx-compare-right]").selectOption({ label: "Alpha.pdf" });
  await page.locator("[data-idx-run-compare]").click();
  await expect(page.locator("[data-idx-compare-result]")).toContainText(
    "Both files are attached to this workspace and ready for review.",
  );
});

test("workspace switching resets document selection using the defined fallback order", async ({ page }) => {
  const store = previewStoreWithTwoWorkspaces();
  store.workspaces.unshift({
    workspace_id: "ws_single",
    name: "Single failed doc",
    notes: "No ready docs here",
    workspace_type: "general",
    workspace_status: "active",
    document_count: 1,
    summary_preview: "",
    summary: { summary: "", citations: [] },
    facts: { fields: [] },
    latest_analysis_jobs: {},
    access_role: "owner",
    updated_at: "2026-04-03T12:00:00.000Z",
    created_at: "2026-04-03T11:00:00.000Z",
  });
  store.documents.push({
    document_id: "doc_failed_only",
    workspace_id: "ws_single",
    file_name: "Only Failed.pdf",
    status: "failed",
    ocr_status: "failed",
    index_status: "failed",
    updated_at: "2026-04-03T12:00:00.000Z",
    created_at: "2026-04-03T11:10:00.000Z",
  });

  await seedLocalPreview(page, store);

  await page.goto("/idx/dashboard/");

  await page.locator("[data-idx-workspace-switcher]").selectOption("ws_single");

  await expect(page.locator("[data-idx-selected-document-title]")).toHaveText("Only Failed.pdf");
  await expect(page).toHaveURL(/workspace_id=ws_single/);
  await expect(page).toHaveURL(/document_id=doc_failed_only/);
});

test("mobile view collapses the rails behind toggles and stacks the inspector below the viewer", async ({ page }) => {
  await seedLocalPreview(page, previewStoreWithTwoWorkspaces());
  await page.setViewportSize({ width: 800, height: 1100 });

  await page.goto("/idx/dashboard/");

  const documentRail = page.locator("[data-idx-document-rail]");
  const inspectorRail = page.locator("[data-idx-inspector]");
  const viewerStage = page.locator(".mdz-idx__viewer-stage");

  await expect(documentRail).toBeHidden();
  await expect(inspectorRail).toBeHidden();

  await page.getByRole("button", { name: "Documents" }).click();
  await expect(documentRail).toBeVisible();

  await page.getByRole("button", { name: "Inspector" }).click();
  await expect(inspectorRail).toBeVisible();

  const viewerBox = await viewerStage.boundingBox();
  const inspectorBox = await inspectorRail.boundingBox();
  expect(viewerBox).toBeTruthy();
  expect(inspectorBox).toBeTruthy();
  expect(inspectorBox.y).toBeGreaterThan(viewerBox.y);
});
