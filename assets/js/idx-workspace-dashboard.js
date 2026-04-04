(function () {
  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value || "";
  }

  function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function createClientError(message) {
    const error = new Error(normalizeString(message) || "Request could not be completed.");
    error.data = { message: error.message };
    return error;
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (character) {
      return (
        {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
        }[character] || character
      );
    });
  }

  function currentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function currentOrigin() {
    return window.location.origin.replace(/\/+$/, "");
  }

  function isLocalHostname(hostname) {
    return hostname === "127.0.0.1" || hostname === "localhost";
  }

  function isLocalDev() {
    return isLocalHostname(window.location.hostname);
  }

  function urlOrigin(value) {
    try {
      return new URL(value, window.location.origin).origin.replace(/\/+$/, "");
    } catch (_error) {
      return "";
    }
  }

  function extractErrorMessage(value) {
    if (typeof value === "string") return normalizeString(value);
    if (!isPlainObject(value)) return "";
    if (Array.isArray(value.detail)) {
      return value.detail
        .map(function (item) {
          return extractErrorMessage(item);
        })
        .filter(Boolean)
        .join(" ");
    }
    return normalizeString(value.message || value.error || value.detail || value.reason || "");
  }

  function isNetworkStyleError(error) {
    const message = normalizeString(error && error.message).toLowerCase();
    return error instanceof TypeError || /failed to fetch|load failed|networkerror|network request failed/.test(message);
  }

  function buildUiNotice(error, options) {
    const endpoint = normalizeString(options && options.endpoint);
    const action = normalizeString((options && options.action) || "request");
    const endpointOrigin = urlOrigin(endpoint);
    const message =
      extractErrorMessage(error && error.data) ||
      extractErrorMessage(error) ||
      normalizeString(error && error.message);

    if (!endpoint) {
      return {
        title: "IDX API is not configured",
        body: "This dashboard does not have a valid IDX API base URL yet, so browser requests cannot be sent.",
      };
    }

    if (error && (error.status === 401 || error.status === 403)) {
      return {
        title: "IDX session is not available",
        body:
          (endpointOrigin ? endpointOrigin + " rejected the browser request." : "The IDX API rejected the browser request.") +
          (isLocalDev()
            ? " Start the local IDX backend or use local preview on the login page."
            : " Sign in again, then verify that the IDX domain can read the same browser session."),
      };
    }

    if (error && error.status === 404) {
      return {
        title: "IDX route was not found",
        body:
          "The website reached " +
          endpoint +
          ", but that route returned 404. The IDX host is reachable, but the expected endpoint for " +
          action +
          " is not available there.",
      };
    }

    if (isNetworkStyleError(error)) {
      return {
        title: isLocalDev() ? "Local IDX is unavailable" : "Browser access to IDX is blocked",
        body:
          isLocalDev()
            ? "The dashboard is trying to reach " +
              (endpointOrigin || "the local IDX service") +
              ". Start the local IDX backend on port 8000 or continue in local preview."
            : (endpointOrigin || "The IDX API") +
              " is not allowing browser requests from " +
              currentOrigin() +
              ". This is usually a CORS or cross-site cookie policy issue on the IDX service.",
      };
    }

    if (error && error.status >= 500) {
      return {
        title: "IDX returned a server error",
        body:
          "The request reached " +
          (endpointOrigin || "the IDX API") +
          ", but the service returned " +
          error.status +
          ".",
      };
    }

    return {
      title: "Request could not be completed",
      body: message || "The request did not complete successfully.",
    };
  }

  function getIdxApiBaseUrl() {
    const auth = window.MdzAuth || null;
    if (auth && auth.getIdxApiBaseUrl) {
      return normalizeString(auth.getIdxApiBaseUrl()).replace(/\/+$/, "");
    }
    const config = window.MDZ_AUTH_CONFIG || {};
    if (isLocalDev()) {
      return (window.location.protocol + "//" + window.location.hostname + ":8000").replace(/\/+$/, "");
    }
    return normalizeString(config.idxApiBaseUrl || "").replace(/\/+$/, "");
  }

  function hasIdxApiBaseUrl() {
    return !!getIdxApiBaseUrl();
  }

  function buildIdxUrl(path) {
    const base = getIdxApiBaseUrl();
    return base ? base + path : "";
  }

  function buildIdxAppUrl(path) {
    const base = getIdxApiBaseUrl();
    return base ? base + path : path;
  }

  async function request(url, options) {
    const requestOptions = Object.assign(
      {
        credentials: "include",
        headers: {
          Accept: "application/json",
        },
      },
      options || {}
    );

    const isFormData = requestOptions.body instanceof FormData;
    requestOptions.headers = Object.assign({}, requestOptions.headers || {});

    if (!isFormData && requestOptions.body != null && !requestOptions.headers["Content-Type"]) {
      requestOptions.headers["Content-Type"] = "application/json";
    }

    const response = await fetch(url, requestOptions);
    const contentType = response.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await response.json().catch(function () {
        return null;
      });
    } else {
      const text = await response.text().catch(function () {
        return "";
      });
      data = text ? { message: text } : null;
    }

    if (!response.ok) {
      const error = new Error((data && (data.error || data.message || data.detail)) || "Request failed (" + response.status + ")");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data || {};
  }

  function formatTimestamp(value) {
    const text = normalizeString(value);
    if (!text) return "recently";
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return text;
    return parsed.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function workspaceTypeLabel(workspaceType) {
    const labels = {
      pe: "PE",
      real_estate: "Real Estate",
      sales: "Sales",
      general: "General",
    };
    return labels[workspaceType] || "General";
  }

  function workspaceStatusLabel(status) {
    const labels = {
      active: "Active",
      approved: "Approved",
      needs_follow_up: "Needs Follow-Up",
    };
    return labels[status] || "Active";
  }

  function classifyDocumentStatus(item) {
    const status = normalizeString(item && item.status).toLowerCase();
    const ocrStatus = normalizeString(item && item.ocr_status).toLowerCase();
    const indexStatus = normalizeString(item && item.index_status).toLowerCase();

    if (/failed|error|cancelled|canceled/.test(status + " " + ocrStatus + " " + indexStatus)) return "failed";
    if (status === "ready" && ocrStatus === "ready" && indexStatus === "ready") return "ready";
    if (status === "queued" || ocrStatus === "queued" || indexStatus === "pending") return "queued";
    return "processing";
  }

  function documentStatusLabel(item) {
    const status = classifyDocumentStatus(item);
    if (status === "ready") return "Ready";
    if (status === "failed") return "Failed";
    if (status === "queued") return "Queued";
    return "Processing";
  }

  function documentStatusDetail(item) {
    const parts = [];
    const status = normalizeString(item && item.status).toLowerCase();
    const ocrStatus = normalizeString(item && item.ocr_status).toLowerCase();
    const indexStatus = normalizeString(item && item.index_status).toLowerCase();

    if (status) parts.push("document " + status);
    if (ocrStatus) parts.push("ocr " + ocrStatus);
    if (indexStatus) parts.push("index " + indexStatus);
    return parts.join(" • ");
  }

  function buildDocumentViewerUrl(documentId) {
    return buildIdxAppUrl("/viewer/documents/" + encodeURIComponent(documentId));
  }

  function buildCitationViewerUrl(citationId) {
    return buildIdxAppUrl("/viewer/citations/" + encodeURIComponent(citationId));
  }

  function normalizeStatusState(value) {
    if (isPlainObject(value)) {
      return {
        message: normalizeString(value.message),
        isError: !!value.isError,
      };
    }
    return {
      message: "",
      isError: false,
    };
  }

  function initDashboard(root) {
    const auth = window.MdzAuth || null;
    const elements = {
      refreshHome: qs(root, "[data-idx-refresh-home]"),
      preauth: qs(root, "[data-idx-preauth]"),
      preauthSummary: qs(root, "[data-idx-preauth-summary]"),
      app: qs(root, "[data-idx-dashboard-app]"),
      authGate: qs(root, "[data-idx-auth-gate]"),
      authGateTitle: qs(root, "[data-idx-auth-gate-title]"),
      authGateCopy: qs(root, "[data-idx-auth-gate-copy]"),
      authLogin: qs(root, "[data-idx-auth-login]"),
      localPreviewButtons: qsa(root, "[data-idx-local-preview]"),
      notice: qs(root, "[data-idx-notice]"),
      noticeTitle: qs(root, "[data-idx-notice-title]"),
      noticeCopy: qs(root, "[data-idx-notice-copy]"),
      homeView: qs(root, "[data-idx-home-view]"),
      workspaceView: qs(root, "[data-idx-workspace-view]"),
      createForm: qs(root, "[data-idx-create-workspace-form]"),
      workspaceName: qs(root, "[data-idx-workspace-name]"),
      workspaceType: qs(root, "[data-idx-workspace-type]"),
      workspaceNotesInput: qs(root, "[data-idx-workspace-create-notes]"),
      createStatus: qs(root, "[data-idx-create-status]"),
      openLatestWorkspace: qs(root, "[data-idx-open-latest-workspace]"),
      statWorkspaces: qs(root, "[data-idx-stat-workspaces]"),
      statFollowUp: qs(root, "[data-idx-stat-follow-up]"),
      statReadyFiles: qs(root, "[data-idx-stat-ready-files]"),
      statProcessingFiles: qs(root, "[data-idx-stat-processing-files]"),
      workspacesStatus: qs(root, "[data-idx-workspaces-status]"),
      filesStatus: qs(root, "[data-idx-files-status]"),
      workspaceStream: qs(root, "[data-idx-workspace-stream]"),
      recentFiles: qs(root, "[data-idx-recent-files]"),
      backHome: qs(root, "[data-idx-back-home]"),
      workspaceTitle: qs(root, "[data-idx-workspace-title]"),
      workspaceNotes: qs(root, "[data-idx-current-workspace-notes]"),
      workspacePills: qs(root, "[data-idx-workspace-pills]"),
      workspaceStatus: qs(root, "[data-idx-workspace-status]"),
      summaryCard: qs(root, "[data-idx-summary-card]"),
      factsCard: qs(root, "[data-idx-facts-card]"),
      refreshSummary: qs(root, "[data-idx-refresh-summary]"),
      refreshFacts: qs(root, "[data-idx-refresh-facts]"),
      uploadStatus: qs(root, "[data-idx-upload-status]"),
      dropzone: qs(root, "[data-idx-dropzone]"),
      uploadButtons: qsa(root, "[data-idx-upload-button]"),
      fileInput: qs(root, "[data-idx-file-input]"),
      workspaceDocuments: qs(root, "[data-idx-workspace-documents]"),
      compareLeft: qs(root, "[data-idx-compare-left]"),
      compareRight: qs(root, "[data-idx-compare-right]"),
      compareStatus: qs(root, "[data-idx-compare-status]"),
      compareResult: qs(root, "[data-idx-compare-result]"),
      compareButton: qs(root, "[data-idx-run-compare]"),
      decisionSummary: qs(root, "[data-idx-decision-summary]"),
      decisionForm: qs(root, "[data-idx-decision-form]"),
      decisionKind: qs(root, "[data-idx-decision-kind]"),
      decisionNote: qs(root, "[data-idx-decision-note]"),
      decisionStatus: qs(root, "[data-idx-decision-status]"),
      commentForm: qs(root, "[data-idx-comment-form]"),
      commentBody: qs(root, "[data-idx-comment-body]"),
      commentStatus: qs(root, "[data-idx-comment-status]"),
      activityList: qs(root, "[data-idx-activity-list]"),
    };

    const state = {
      home: {
        workspaces: [],
        documents: [],
      },
      routeWorkspaceId: currentWorkspaceIdFromUrl(),
      workspace: null,
      workspaceDocuments: [],
      activity: [],
      workspaceError: "",
      compare: {
        left: "",
        right: "",
        result: null,
      },
      notice: null,
      loading: {
        auth: false,
        home: false,
        create: false,
        workspace: false,
        upload: false,
        summary: false,
        facts: false,
        compare: false,
        decision: false,
        comment: false,
      },
      feedback: {
        create: { message: "", isError: false },
        upload: { message: "", isError: false },
        compare: { message: "", isError: false },
        decision: { message: "", isError: false },
        comment: { message: "", isError: false },
      },
    };

    let authState = {
      checked: false,
      authenticated: false,
      missingConfig: false,
    };
    let idxAuthState = {
      checked: false,
      authenticated: false,
    };
    let dragDepth = 0;
    let workspacePollTimer = null;
    const LOCAL_PREVIEW_WORKSPACE_KEY = "mdz_idx_workspace_preview_v1";

    function currentWorkspaceIdFromUrl() {
      return normalizeString(new URLSearchParams(window.location.search).get("workspace_id"));
    }

    function isLocalPreviewMode() {
      return !!(auth && auth.isLocalPreview && auth.isLocalPreview());
    }

    function cloneJson(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function previewNow() {
      return new Date().toISOString();
    }

    function previewId(prefix) {
      return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    }

    function previewSortByUpdated(items, field) {
      return ensureArray(items)
        .slice()
        .sort(function (left, right) {
          const leftTime = Date.parse((left && left[field]) || "") || 0;
          const rightTime = Date.parse((right && right[field]) || "") || 0;
          return rightTime - leftTime;
        });
    }

    function readPreviewStore() {
      const fallback = {
        workspaces: [],
        documents: [],
        activity: [],
      };

      if (!isLocalPreviewMode()) return fallback;

      try {
        const raw = window.localStorage.getItem(LOCAL_PREVIEW_WORKSPACE_KEY);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!isPlainObject(parsed)) return fallback;
        return {
          workspaces: ensureArray(parsed.workspaces),
          documents: ensureArray(parsed.documents),
          activity: ensureArray(parsed.activity),
        };
      } catch (_error) {
        return fallback;
      }
    }

    function writePreviewStore(store) {
      if (!isLocalPreviewMode()) return;
      window.localStorage.setItem(
        LOCAL_PREVIEW_WORKSPACE_KEY,
        JSON.stringify({
          workspaces: ensureArray(store && store.workspaces),
          documents: ensureArray(store && store.documents),
          activity: ensureArray(store && store.activity),
        })
      );
    }

    function previewWorkspaceSummaryText(workspace, documents) {
      if (!documents.length) return "";
      const names = documents.slice(0, 3).map(function (item) {
        return item.file_name || "Document";
      });
      return (
        "Reviewing " +
        documents.length +
        " document" +
        (documents.length === 1 ? "" : "s") +
        ": " +
        names.join(", ") +
        (documents.length > 3 ? ", and more." : ".")
      );
    }

    function previewWorkspaceFacts(workspace, documents) {
      const readyCount = documents.filter(function (item) {
        return classifyDocumentStatus(item) === "ready";
      }).length;
      return [
        {
          field: "documents",
          value: String(documents.length),
          citations: [],
        },
        {
          field: "ready_files",
          value: String(readyCount),
          citations: [],
        },
        {
          field: "type",
          value: workspaceTypeLabel(workspace.workspace_type),
          citations: [],
        },
      ];
    }

    function previewHydrateWorkspace(store, workspaceId) {
      const workspace = ensureArray(store.workspaces).find(function (item) {
        return normalizeString(item && item.workspace_id) === normalizeString(workspaceId);
      });
      if (!workspace) {
        const error = createClientError("Workspace not found.");
        error.status = 404;
        throw error;
      }

      const documents = previewSortByUpdated(
        ensureArray(store.documents).filter(function (item) {
          return normalizeString(item && item.workspace_id) === normalizeString(workspaceId);
        }),
        "updated_at"
      );

      workspace.document_count = documents.length;
      workspace.updated_at = workspace.updated_at || previewNow();
      workspace.summary = workspace.summary || { summary: "", citations: [] };
      workspace.facts = workspace.facts || { fields: [] };
      workspace.latest_analysis_jobs = workspace.latest_analysis_jobs || {};
      workspace.summary_preview = normalizeString(workspace.summary && workspace.summary.summary) || previewWorkspaceSummaryText(workspace, documents);
      workspace.access_role = workspace.access_role || "owner";

      return {
        workspace: workspace,
        documents: documents,
        activity: previewSortByUpdated(
          ensureArray(store.activity).filter(function (item) {
            return normalizeString(item && item.workspace_id) === normalizeString(workspaceId);
          }),
          "created_at"
        ),
      };
    }

    function previewHomePayload() {
      const store = readPreviewStore();
      store.workspaces = ensureArray(store.workspaces).map(function (item) {
        return previewHydrateWorkspace(store, item.workspace_id).workspace;
      });
      writePreviewStore(store);
      return {
        workspaces: previewSortByUpdated(store.workspaces, "updated_at").slice(0, 12),
        documents: previewSortByUpdated(store.documents, "updated_at").slice(0, 12),
      };
    }

    function previewWorkspacePayload(workspaceId) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      writePreviewStore(store);
      return payload;
    }

    function previewCreateWorkspace(payload) {
      const store = readPreviewStore();
      const now = previewNow();
      const workspace = {
        workspace_id: previewId("ws_local"),
        name: normalizeString(payload && payload.name) || "Workspace",
        notes: normalizeString(payload && payload.notes),
        workspace_type: normalizeString(payload && payload.workspace_type) || "general",
        workspace_status: "active",
        document_count: 0,
        summary_preview: "",
        summary: { summary: "", citations: [] },
        facts: { fields: [] },
        latest_analysis_jobs: {},
        access_role: "owner",
        updated_at: now,
        created_at: now,
      };
      store.workspaces.unshift(workspace);
      writePreviewStore(store);
      return cloneJson(workspace);
    }

    function previewUploadFiles(workspaceId, files) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      const now = previewNow();

      Array.from(files || []).forEach(function (file) {
        store.documents.unshift({
          document_id: previewId("doc_local"),
          workspace_id: workspaceId,
          file_name: normalizeString(file && file.name) || "Document.pdf",
          status: "ready",
          ocr_status: "ready",
          index_status: "ready",
          created_at: now,
          updated_at: now,
        });
      });

      payload.workspace.updated_at = now;
      payload.workspace.summary.summary = previewWorkspaceSummaryText(payload.workspace, store.documents.filter(function (item) {
        return item.workspace_id === workspaceId;
      }));
      payload.workspace.summary_preview = payload.workspace.summary.summary;
      payload.workspace.summary_updated_at = now;
      payload.workspace.facts = {
        fields: previewWorkspaceFacts(
          payload.workspace,
          store.documents.filter(function (item) {
            return item.workspace_id === workspaceId;
          })
        ),
      };
      payload.workspace.facts_updated_at = now;
      writePreviewStore(store);
    }

    function previewRefreshSummary(workspaceId) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      const now = previewNow();
      payload.workspace.summary = {
        summary: previewWorkspaceSummaryText(payload.workspace, payload.documents) || "Add a PDF to generate a summary.",
        citations: [],
      };
      payload.workspace.summary_preview = payload.workspace.summary.summary;
      payload.workspace.summary_updated_at = now;
      payload.workspace.updated_at = now;
      writePreviewStore(store);
    }

    function previewRefreshFacts(workspaceId) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      const now = previewNow();
      payload.workspace.facts = {
        fields: previewWorkspaceFacts(payload.workspace, payload.documents),
      };
      payload.workspace.facts_updated_at = now;
      payload.workspace.updated_at = now;
      writePreviewStore(store);
    }

    function previewCompare(workspaceId, leftId, rightId) {
      const payload = previewWorkspacePayload(workspaceId);
      const left = payload.documents.find(function (item) {
        return item.document_id === leftId;
      });
      const right = payload.documents.find(function (item) {
        return item.document_id === rightId;
      });
      return {
        result: {
          overlap_count: 1,
          shared_examples: [
            {
              text: "Both files are attached to this workspace and ready for review.",
            },
          ],
          left_only: left
            ? [
                {
                  text: (left.file_name || "Left document") + " is selected on the left.",
                },
              ]
            : [],
          right_only: right
            ? [
                {
                  text: (right.file_name || "Right document") + " is selected on the right.",
                },
              ]
            : [],
        },
      };
    }

    function previewSaveDecision(workspaceId, decision, summary) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      const now = previewNow();
      payload.workspace.workspace_status = decision === "approved" ? "approved" : "needs_follow_up";
      payload.workspace.updated_at = now;
      store.activity.unshift({
        workspace_id: workspaceId,
        id: previewId("activity"),
        kind: "decision",
        decision: decision,
        summary: normalizeString(summary) || "Decision recorded.",
        principal_id: "local-user",
        created_at: now,
      });
      writePreviewStore(store);
    }

    function previewPostComment(workspaceId, body) {
      const store = readPreviewStore();
      const payload = previewHydrateWorkspace(store, workspaceId);
      const now = previewNow();
      payload.workspace.updated_at = now;
      store.activity.unshift({
        workspace_id: workspaceId,
        id: previewId("activity"),
        kind: "comment",
        body: normalizeString(body),
        principal_id: "local-user",
        created_at: now,
      });
      writePreviewStore(store);
    }

    function setFeedback(key, message, isError) {
      state.feedback[key] = {
        message: normalizeString(message),
        isError: !!isError,
      };
      render();
    }

    function updateLoading(patch) {
      state.loading = Object.assign({}, state.loading, patch || {});
      render();
    }

    function setNotice(notice) {
      state.notice = notice || null;
      render();
    }

    function clearNotice() {
      state.notice = null;
      render();
    }

    function handleAuthFailure(error) {
      if (error && (error.status === 401 || error.status === 403)) {
        if (isLocalPreviewMode()) return;
        idxAuthState = {
          checked: true,
          authenticated: false,
        };
      }
    }

    function buildLoginHref() {
      if (!auth || !auth.buildLoginUrl) return "/login/";
      return auth.buildLoginUrl(currentRelativeUrl());
    }

    function canUseLocalPreview() {
      return !!(isLocalDev() && auth && auth.enableLocalPreview);
    }

    function openLocalPreview() {
      if (!canUseLocalPreview()) return;
      auth.enableLocalPreview();
      window.location.assign(currentRelativeUrl());
    }

    async function refreshAuth(forceRefresh) {
      updateLoading({ auth: true });

      if (!auth || !auth.getSession) {
        authState = {
          checked: true,
          authenticated: false,
          missingConfig: true,
        };
        updateLoading({ auth: false });
        return authState;
      }

      try {
        const session = await auth.getSession(!!forceRefresh);
        authState = {
          checked: true,
          authenticated: !!(session && session.authenticated),
          missingConfig: !!(session && session.missingConfig),
        };
      } catch (_error) {
        authState = {
          checked: true,
          authenticated: false,
          missingConfig: true,
        };
      }

      updateLoading({ auth: false });
      return authState;
    }

    async function refreshIdxAuth(forceRefresh) {
      if (isLocalPreviewMode()) {
        idxAuthState = {
          checked: true,
          authenticated: true,
        };
        return idxAuthState;
      }

      const endpoint = buildIdxUrl("/idx/auth/me");
      if (!endpoint) {
        idxAuthState = {
          checked: true,
          authenticated: false,
        };
        return idxAuthState;
      }

      if (idxAuthState.checked && !forceRefresh) {
        return idxAuthState;
      }

      try {
        const payload = await request(endpoint, { method: "GET" });
        idxAuthState = {
          checked: true,
          authenticated: !!(payload && payload.authenticated),
        };
      } catch (error) {
        idxAuthState = {
          checked: true,
          authenticated: false,
        };
        if (!(error && (error.status === 401 || error.status === 403))) {
          throw error;
        }
      }

      return idxAuthState;
    }

    async function ensureAuthenticated(forceRefresh) {
      const session = authState.checked && !forceRefresh ? authState : await refreshAuth(!!forceRefresh);
      if (!session.authenticated) return false;
      if (isLocalPreviewMode()) return true;

      try {
        const idxSession = await refreshIdxAuth(!!forceRefresh);
        return !!idxSession.authenticated;
      } catch (error) {
        setNotice(
          buildUiNotice(error, {
            action: "IDX session check",
            endpoint: buildIdxUrl("/idx/auth/me"),
          })
        );
        return false;
      }
    }

    async function loadHome(options) {
      const workspacesEndpoint = buildIdxUrl("/idx/workspaces/?limit=12");
      const documentsEndpoint = buildIdxUrl("/idx/documents/?limit=12");

      if (!isLocalPreviewMode() && (!workspacesEndpoint || !documentsEndpoint)) {
        setNotice(buildUiNotice(null, { action: "dashboard home", endpoint: "" }));
        return null;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return null;
      }

      updateLoading({ home: true });

      try {
        if (isLocalPreviewMode()) {
          const preview = previewHomePayload();
          state.home.workspaces = ensureArray(preview && preview.workspaces);
          state.home.documents = ensureArray(preview && preview.documents);
        } else {
          const responses = await Promise.all([
            request(workspacesEndpoint, { method: "GET" }),
            request(documentsEndpoint, { method: "GET" }),
          ]);
          state.home.workspaces = ensureArray(responses[0] && responses[0].workspaces);
          state.home.documents = ensureArray(responses[1] && responses[1].documents);
        }

        if (!(options && options.preserveNotice)) {
          clearNotice();
        }
        return {
          workspaces: state.home.workspaces,
          documents: state.home.documents,
        };
      } catch (error) {
        handleAuthFailure(error);
        setNotice(
          buildUiNotice(error, {
            action: "dashboard home",
            endpoint: workspacesEndpoint,
          })
        );
        return null;
      } finally {
        updateLoading({ home: false });
      }
    }

    async function loadWorkspace(workspaceId, options) {
      const normalizedId = normalizeString(workspaceId);
      if (!normalizedId) {
        state.workspace = null;
        state.workspaceDocuments = [];
        state.activity = [];
        state.workspaceError = "";
        render();
        return;
      }

      const workspaceEndpoint = buildIdxUrl("/idx/workspaces/" + encodeURIComponent(normalizedId));
      const documentsEndpoint = buildIdxUrl("/idx/workspaces/" + encodeURIComponent(normalizedId) + "/documents");
      const activityEndpoint = buildIdxUrl("/idx/workspaces/" + encodeURIComponent(normalizedId) + "/activity?limit=16");

      if (!isLocalPreviewMode() && (!workspaceEndpoint || !documentsEndpoint || !activityEndpoint)) {
        setNotice(buildUiNotice(null, { action: "workspace page", endpoint: "" }));
        return null;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return null;
      }

      updateLoading({ workspace: true });
      state.workspaceError = "";

      try {
        if (isLocalPreviewMode()) {
          const preview = previewWorkspacePayload(normalizedId);
          state.workspace = preview.workspace || null;
          state.workspaceDocuments = ensureArray(preview && preview.documents);
          state.activity = ensureArray(preview && preview.activity);
        } else {
          const responses = await Promise.all([
            request(workspaceEndpoint, { method: "GET" }),
            request(documentsEndpoint, { method: "GET" }),
            request(activityEndpoint, { method: "GET" }),
          ]);
          state.workspace = responses[0] || null;
          state.workspaceDocuments = ensureArray(responses[1] && responses[1].documents);
          state.activity = ensureArray(responses[2] && responses[2].activity);
        }

        const availableIds = state.workspaceDocuments.map(function (item) {
          return item.document_id;
        });

        if (availableIds.indexOf(state.compare.left) === -1) {
          state.compare.left = availableIds[0] || "";
        }
        if (availableIds.indexOf(state.compare.right) === -1 || state.compare.right === state.compare.left) {
          state.compare.right = availableIds[1] || "";
        }
        if (state.compare.right === state.compare.left && availableIds.length > 1) {
          state.compare.right = availableIds[1];
        }

        if (!(options && options.preserveNotice)) {
          clearNotice();
        }
        scheduleWorkspacePoll();
        return state.workspace;
      } catch (error) {
        handleAuthFailure(error);
        state.workspace = null;
        state.workspaceDocuments = [];
        state.activity = [];
        state.workspaceError = extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Workspace could not be loaded.";
        setNotice(
          buildUiNotice(error, {
            action: "workspace page",
            endpoint: workspaceEndpoint,
          })
        );
        return null;
      } finally {
        updateLoading({ workspace: false });
      }
    }

    function clearWorkspacePoll() {
      if (workspacePollTimer) {
        window.clearTimeout(workspacePollTimer);
        workspacePollTimer = null;
      }
    }

    function jobIsPending(job) {
      return !!(job && (job.status === "queued" || job.status === "running"));
    }

    function workspaceNeedsPolling() {
      const workspace = state.workspace;
      if (!workspace) return false;
      const latestJobs = workspace.latest_analysis_jobs || {};
      const pendingDocuments = state.workspaceDocuments.some(function (item) {
        return classifyDocumentStatus(item) === "queued" || classifyDocumentStatus(item) === "processing";
      });
      return pendingDocuments || jobIsPending(latestJobs.summarize) || jobIsPending(latestJobs.extract);
    }

    function scheduleWorkspacePoll() {
      clearWorkspacePoll();
      if (!state.routeWorkspaceId || !workspaceNeedsPolling()) return;
      workspacePollTimer = window.setTimeout(function () {
        Promise.all([
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
          loadHome({ preserveNotice: true }),
        ]).catch(function () {
          /* handled in request flows */
        });
      }, 2500);
    }

    async function waitForJob(jobId, jobType) {
      const endpoint = buildIdxUrl("/idx/jobs/" + encodeURIComponent(jobId));
      if (!endpoint) {
        throw new Error("IDX jobs endpoint is not configured.");
      }

      while (true) {
        const payload = await request(endpoint, { method: "GET" });
        if (!payload || (payload.status !== "queued" && payload.status !== "running")) {
          if (!payload || payload.status !== "completed") {
            throw new Error(
              extractErrorMessage(payload && payload.error) ||
                jobType + " job failed"
            );
          }
          return payload;
        }
        await new Promise(function (resolve) {
          window.setTimeout(resolve, 1200);
        });
      }
    }

    async function runAnalysis(jobType, payload) {
      const endpoint = buildIdxUrl("/idx/analysis/" + jobType);
      if (!endpoint) {
        throw new Error("IDX analysis endpoint is not configured.");
      }
      const response = await request(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!response || !response.job_id) {
        return response || {};
      }
      return waitForJob(response.job_id, jobType);
    }

    function updateRouteWorkspaceId(workspaceId, replace) {
      const normalizedId = normalizeString(workspaceId);
      const url = new URL(window.location.href);
      if (normalizedId) {
        url.searchParams.set("workspace_id", normalizedId);
      } else {
        url.searchParams.delete("workspace_id");
      }
      const nextUrl = url.pathname + url.search + url.hash;
      if (replace) {
        window.history.replaceState({}, "", nextUrl);
      } else {
        window.history.pushState({}, "", nextUrl);
      }
      state.routeWorkspaceId = normalizedId;
      state.compare.result = null;
      render();
    }

    async function navigateToWorkspace(workspaceId, replace) {
      updateRouteWorkspaceId(workspaceId, replace);
      const workspace = await loadWorkspace(state.routeWorkspaceId, { preserveNotice: true });
      await loadHome({ preserveNotice: true });
      return workspace;
    }

    async function navigateHome(replace) {
      clearWorkspacePoll();
      updateRouteWorkspaceId("", replace);
      state.workspace = null;
      state.workspaceDocuments = [];
      state.activity = [];
      state.workspaceError = "";
      state.compare = {
        left: "",
        right: "",
        result: null,
      };
      render();
      return loadHome({ preserveNotice: true });
    }

    async function openCreatedWorkspace(workspaceId) {
      const normalizedId = normalizeString(workspaceId);

      if (!normalizedId) {
        throw createClientError("IDX returned an invalid workspace create response.");
      }

      setFeedback("create", "Opening workspace…", false);
      const workspace = await navigateToWorkspace(normalizedId);

      if (workspace) {
        setFeedback("create", "Workspace created.", false);
        return true;
      }

      await navigateHome(true);
      setFeedback(
        "create",
        "Workspace created, but IDX could not open it right away. Open it from Recent Workspaces.",
        false
      );
      setNotice({
        title: "Workspace created",
        body: "The workspace was created, but the workspace page could not be loaded right away. Refresh and open it from Recent Workspaces.",
      });
      return false;
    }

    async function createWorkspace(event) {
      event.preventDefault();
      if (state.loading.create) return;

      const endpoint = buildIdxUrl("/idx/workspaces/");
      const name = normalizeString(elements.workspaceName && elements.workspaceName.value);

      if (!name) {
        setFeedback("create", "Workspace name is required.", true);
        return;
      }

      if (!isLocalPreviewMode() && !endpoint) {
        setFeedback("create", "IDX API is not configured for workspace requests.", true);
        setNotice(buildUiNotice(null, { action: "workspace create", endpoint: "" }));
        return;
      }

      clearNotice();
      updateLoading({ create: true });
      setFeedback("create", "Creating workspace…", false);

      try {
        const requestPayload = {
          name: name,
          workspace_type: elements.workspaceType ? elements.workspaceType.value : "general",
          notes: elements.workspaceNotesInput ? elements.workspaceNotesInput.value : "",
          document_ids: [],
          collection_ids: [],
        };
        const payload = isLocalPreviewMode()
          ? previewCreateWorkspace(requestPayload)
          : await request(endpoint, {
              method: "POST",
              body: JSON.stringify(requestPayload),
            });

        if (!normalizeString(payload && payload.workspace_id)) {
          throw createClientError("IDX returned an invalid workspace create response.");
        }

        if (elements.createForm) {
          elements.createForm.reset();
        }
        await openCreatedWorkspace(payload.workspace_id);
      } catch (error) {
        handleAuthFailure(error);
        setFeedback(
          "create",
          extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Workspace could not be created.",
          true
        );
        setNotice(
          buildUiNotice(error, {
            action: "workspace create",
            endpoint: endpoint,
          })
        );
      } finally {
        updateLoading({ create: false });
      }
    }

    async function uploadFiles(files) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const validFiles = Array.from(files || []).filter(function (file) {
        return file && ((file.type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(file.name || ""));
      });

      if (!validFiles.length) {
        if (files && Array.from(files).length) {
          setFeedback("upload", "Only PDF files are supported.", true);
        }
        return;
      }

      if (!state.routeWorkspaceId) {
        setFeedback("upload", "Open a workspace before uploading PDFs.", true);
        return;
      }

      if (!isLocalPreviewMode() && !endpoint) {
        setNotice(buildUiNotice(null, { action: "workspace upload", endpoint: "" }));
        return;
      }

      updateLoading({ upload: true });
      setFeedback(
        "upload",
        "Uploading " + validFiles.length + " file" + (validFiles.length === 1 ? "" : "s") + "…",
        false
      );

      try {
        if (isLocalPreviewMode()) {
          previewUploadFiles(state.routeWorkspaceId, validFiles);
          setFeedback("upload", "Files added to the local preview workspace.", false);
        } else {
          const formData = new FormData();
          validFiles.forEach(function (file) {
            formData.append("files", file, file.name);
          });
          formData.append("workspace_id", state.routeWorkspaceId);
          await request(endpoint, {
            method: "POST",
            body: formData,
            headers: {
              Accept: "application/json",
            },
          });
          setFeedback("upload", "Upload queued. IDX will refresh the workspace as processing completes.", false);
        }
        await Promise.all([
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
          loadHome({ preserveNotice: true }),
        ]);
      } catch (error) {
        handleAuthFailure(error);
        setFeedback(
          "upload",
          extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Upload failed.",
          true
        );
        setNotice(
          buildUiNotice(error, {
            action: "workspace upload",
            endpoint: endpoint,
          })
        );
      } finally {
        updateLoading({ upload: false });
        if (elements.fileInput) {
          elements.fileInput.value = "";
        }
      }
    }

    async function refreshWorkspaceSummary() {
      if (!state.routeWorkspaceId) return;
      updateLoading({ summary: true });

      try {
        if (isLocalPreviewMode()) {
          previewRefreshSummary(state.routeWorkspaceId);
        } else {
          await runAnalysis("summarize", {
            workspace_id: state.routeWorkspaceId,
            document_ids: [],
          });
        }
        await Promise.all([
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
          loadHome({ preserveNotice: true }),
        ]);
      } catch (error) {
        handleAuthFailure(error);
        setNotice(
          buildUiNotice(error, {
            action: "workspace summary",
            endpoint: buildIdxUrl("/idx/analysis/summarize"),
          })
        );
      } finally {
        updateLoading({ summary: false });
      }
    }

    async function refreshWorkspaceFacts() {
      if (!state.routeWorkspaceId) return;
      updateLoading({ facts: true });

      try {
        if (isLocalPreviewMode()) {
          previewRefreshFacts(state.routeWorkspaceId);
        } else {
          await runAnalysis("extract", {
            workspace_id: state.routeWorkspaceId,
            document_ids: [],
            fields: [],
          });
        }
        await Promise.all([
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
          loadHome({ preserveNotice: true }),
        ]);
      } catch (error) {
        handleAuthFailure(error);
        setNotice(
          buildUiNotice(error, {
            action: "workspace facts",
            endpoint: buildIdxUrl("/idx/analysis/extract"),
          })
        );
      } finally {
        updateLoading({ facts: false });
      }
    }

    async function runCompare() {
      if (!state.routeWorkspaceId) return;
      if (!state.compare.left || !state.compare.right || state.compare.left === state.compare.right) {
        setFeedback("compare", "Select two different documents to compare.", true);
        return;
      }

      updateLoading({ compare: true });
      setFeedback("compare", "Running compare…", false);
      state.compare.result = null;
      render();

      try {
        const job = isLocalPreviewMode()
          ? previewCompare(state.routeWorkspaceId, state.compare.left, state.compare.right)
          : await runAnalysis("compare", {
              workspace_id: state.routeWorkspaceId,
              document_ids: [state.compare.left, state.compare.right],
            });
        state.compare.result = isPlainObject(job && job.result) ? job.result : {};
        setFeedback("compare", "Compare complete.", false);
      } catch (error) {
        handleAuthFailure(error);
        setFeedback(
          "compare",
          extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Compare failed.",
          true
        );
        setNotice(
          buildUiNotice(error, {
            action: "document compare",
            endpoint: buildIdxUrl("/idx/analysis/compare"),
          })
        );
      } finally {
        updateLoading({ compare: false });
        render();
      }
    }

    async function saveDecision(event) {
      event.preventDefault();
      if (!state.routeWorkspaceId) return;
      const endpoint = buildIdxUrl("/idx/workspaces/" + encodeURIComponent(state.routeWorkspaceId) + "/decisions");

      updateLoading({ decision: true });
      setFeedback("decision", "Saving decision…", false);

      try {
        if (isLocalPreviewMode()) {
          previewSaveDecision(
            state.routeWorkspaceId,
            elements.decisionKind ? elements.decisionKind.value : "approved",
            elements.decisionNote ? elements.decisionNote.value : ""
          );
        } else {
          await request(endpoint, {
            method: "POST",
            body: JSON.stringify({
              decision: elements.decisionKind ? elements.decisionKind.value : "approved",
              summary: elements.decisionNote ? elements.decisionNote.value : "",
              citation_ids: [],
              metadata: {},
            }),
          });
        }
        if (elements.decisionNote) {
          elements.decisionNote.value = "";
        }
        setFeedback("decision", "Decision saved.", false);
        await Promise.all([
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
          loadHome({ preserveNotice: true }),
        ]);
      } catch (error) {
        handleAuthFailure(error);
        setFeedback(
          "decision",
          extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Decision could not be saved.",
          true
        );
        setNotice(
          buildUiNotice(error, {
            action: "workspace decision",
            endpoint: endpoint,
          })
        );
      } finally {
        updateLoading({ decision: false });
      }
    }

    async function postComment(event) {
      event.preventDefault();
      if (!state.routeWorkspaceId) return;
      const endpoint = buildIdxUrl("/idx/workspaces/" + encodeURIComponent(state.routeWorkspaceId) + "/comments");
      const body = normalizeString(elements.commentBody && elements.commentBody.value);

      if (!body) {
        setFeedback("comment", "Comment body is required.", true);
        return;
      }

      updateLoading({ comment: true });
      setFeedback("comment", "Posting comment…", false);

      try {
        if (isLocalPreviewMode()) {
          previewPostComment(state.routeWorkspaceId, body);
        } else {
          await request(endpoint, {
            method: "POST",
            body: JSON.stringify({
              body: body,
              metadata: {},
            }),
          });
        }
        if (elements.commentBody) {
          elements.commentBody.value = "";
        }
        setFeedback("comment", "Comment posted.", false);
        await loadWorkspace(state.routeWorkspaceId, { preserveNotice: true });
      } catch (error) {
        handleAuthFailure(error);
        setFeedback(
          "comment",
          extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Comment could not be posted.",
          true
        );
        setNotice(
          buildUiNotice(error, {
            action: "workspace comment",
            endpoint: endpoint,
          })
        );
      } finally {
        updateLoading({ comment: false });
      }
    }

    function renderAuthGate() {
      if (elements.authLogin) {
        elements.authLogin.href = buildLoginHref();
      }

      elements.localPreviewButtons.forEach(function (button) {
        button.hidden = !canUseLocalPreview();
      });

      const previewMode = isLocalPreviewMode();
      const appReady =
        authState.checked &&
        authState.authenticated &&
        !authState.missingConfig &&
        (previewMode || (idxAuthState.checked && idxAuthState.authenticated));

      if (elements.app) {
        elements.app.hidden = !appReady;
      }

      if (elements.preauth) {
        elements.preauth.hidden = appReady;
      }

      if (elements.preauthSummary) {
        if (!authState.checked || authState.missingConfig) {
          elements.preauthSummary.hidden = true;
        } else {
          elements.preauthSummary.hidden = !!authState.authenticated;
        }
      }

      if (!elements.authGate) return;

      if (!authState.checked) {
        elements.authGate.hidden = false;
        setText(elements.authGateTitle, "Checking sign-in");
        setText(elements.authGateCopy, "Verifying sign-in for the IDX workspace dashboard.");
      } else if (previewMode) {
        elements.authGate.hidden = true;
      } else if (authState.missingConfig) {
        elements.authGate.hidden = false;
        setText(elements.authGateTitle, "Sign-in unavailable");
        setText(elements.authGateCopy, "The site auth configuration is missing, so the IDX workspace dashboard cannot authenticate requests yet.");
      } else if (authState.authenticated && !idxAuthState.checked) {
        elements.authGate.hidden = false;
        setText(elements.authGateTitle, "Checking IDX");
        setText(elements.authGateCopy, "Verifying access to the IDX workspace service.");
      } else if (authState.authenticated && !idxAuthState.authenticated) {
        elements.authGate.hidden = false;
        setText(elements.authGateTitle, isLocalDev() ? "Start local IDX or use preview" : "IDX access unavailable");
        setText(
          elements.authGateCopy,
          isLocalDev()
            ? "The local auth session is ready, but the local IDX backend is not available. Start the backend on port 8000 or continue in local preview."
            : "The website session is valid, but IDX rejected the dashboard request."
        );
      } else {
        elements.authGate.hidden = true;
      }
    }

    function renderNotice() {
      if (!elements.notice) return;
      const notice =
        state.notice ||
        (authState.checked && authState.authenticated && !isLocalPreviewMode() && !hasIdxApiBaseUrl()
          ? buildUiNotice(null, { action: "IDX dashboard", endpoint: "" })
          : null);
      const visible = !!(notice && (notice.title || notice.body));
      elements.notice.hidden = !visible;
      if (!visible) return;
      setText(elements.noticeTitle, notice.title);
      setText(elements.noticeCopy, notice.body);
    }

    function renderStatusLine(element, stateValue) {
      if (!element) return;
      const status = normalizeStatusState(stateValue);
      element.textContent = status.message;
      element.classList.toggle("is-error", !!status.isError);
    }

    function renderHomeStats() {
      const workspaces = state.home.workspaces;
      const documents = state.home.documents;
      const followUpCount = workspaces.filter(function (item) {
        return normalizeString(item && item.workspace_status) === "needs_follow_up";
      }).length;
      const readyFiles = documents.filter(function (item) {
        return classifyDocumentStatus(item) === "ready";
      }).length;
      const processingFiles = documents.filter(function (item) {
        const status = classifyDocumentStatus(item);
        return status === "queued" || status === "processing";
      }).length;

      setText(elements.statWorkspaces, String(workspaces.length));
      setText(elements.statFollowUp, String(followUpCount));
      setText(elements.statReadyFiles, String(readyFiles));
      setText(elements.statProcessingFiles, String(processingFiles));

      setText(
        elements.workspacesStatus,
        state.loading.home
          ? "Refreshing workspaces…"
          : workspaces.length
          ? workspaces.length + " workspace" + (workspaces.length === 1 ? "" : "s")
          : ""
      );
      setText(
        elements.filesStatus,
        state.loading.home
          ? "Refreshing files…"
          : documents.length
          ? documents.length + " file" + (documents.length === 1 ? "" : "s")
          : ""
      );
    }

    function renderWorkspaceStream() {
      if (!elements.workspaceStream) return;
      const workspaces = state.home.workspaces;

      if (state.loading.home && !workspaces.length) {
        elements.workspaceStream.innerHTML = '<div class="mdz-idx__empty-state"><strong>Loading workspaces…</strong><p>IDX is fetching your latest workspaces.</p></div>';
        return;
      }

      if (!workspaces.length) {
        elements.workspaceStream.innerHTML = '<div class="mdz-idx__empty-state"><strong>No workspaces yet.</strong><p>Create a review to get started.</p></div>';
        return;
      }

      elements.workspaceStream.innerHTML = workspaces
        .map(function (workspace) {
          return (
            '<article class="mdz-idx__workspace-row">' +
            '<div class="mdz-idx__workspace-row-top">' +
            '<div>' +
            '<h3 class="mdz-idx__workspace-row-title">' +
            escapeHtml(workspace.name || "Workspace") +
            "</h3>" +
            '<p class="mdz-idx__workspace-row-copy">' +
            escapeHtml(workspace.notes || "No notes yet.") +
            "</p>" +
            "</div>" +
            '<button type="button" class="btn btn--small mdz-cta mdz-cta--outline" data-idx-open-workspace="' +
            escapeHtml(workspace.workspace_id) +
            '">Open workspace</button>' +
            "</div>" +
            '<div class="mdz-idx__pills">' +
            '<span class="mdz-idx__pill">' +
            escapeHtml(workspaceTypeLabel(workspace.workspace_type)) +
            "</span>" +
            '<span class="mdz-idx__pill mdz-idx__pill--status is-' +
            escapeHtml(workspace.workspace_status || "active") +
            '">' +
            escapeHtml(workspaceStatusLabel(workspace.workspace_status)) +
            "</span>" +
            '<span class="mdz-idx__pill mdz-idx__pill--muted">' +
            escapeHtml(String(workspace.document_count || 0)) +
            " document(s)</span>" +
            "</div>" +
            '<p class="mdz-idx__summary-preview">' +
            escapeHtml(workspace.summary_preview || "No summary yet. Upload documents to generate one.") +
            "</p>" +
            '<p class="mdz-idx__helper">Updated ' +
            escapeHtml(formatTimestamp(workspace.updated_at)) +
            ".</p>" +
            "</article>"
          );
        })
        .join("");

      qsa(elements.workspaceStream, "[data-idx-open-workspace]").forEach(function (button) {
        button.addEventListener("click", function () {
          navigateToWorkspace(button.getAttribute("data-idx-open-workspace"));
        });
      });
    }

    function renderRecentFiles() {
      if (!elements.recentFiles) return;
      const documents = state.home.documents;

      if (state.loading.home && !documents.length) {
        elements.recentFiles.innerHTML = '<div class="mdz-idx__empty-state"><strong>Loading files…</strong><p>IDX is fetching the most recent files in your corpus.</p></div>';
        return;
      }

      if (!documents.length) {
        elements.recentFiles.innerHTML = '<div class="mdz-idx__empty-state"><strong>No recent files yet.</strong><p>Upload PDFs inside a workspace and they will appear here as OCR and indexing progress.</p></div>';
        return;
      }

      elements.recentFiles.innerHTML = documents
        .map(function (documentItem) {
          const status = classifyDocumentStatus(documentItem);
          const previewMode = isLocalPreviewMode();
          const action =
            status === "ready" && !previewMode
              ? '<a class="btn btn--small mdz-cta mdz-cta--outline" href="' +
                escapeHtml(buildDocumentViewerUrl(documentItem.document_id)) +
                '" target="_blank" rel="noopener noreferrer">Open viewer</a>'
              : '<span class="mdz-idx__helper">' +
                escapeHtml(previewMode ? "Viewer is unavailable in local preview." : "Viewer opens when the file is ready.") +
                "</span>";

          return (
            '<article class="mdz-idx__file-row">' +
            '<div class="mdz-idx__document-top">' +
            '<div class="mdz-idx__document-copy">' +
            '<strong class="mdz-idx__document-title">' +
            escapeHtml(documentItem.file_name || "Document") +
            "</strong>" +
            '<p class="mdz-idx__document-detail">' +
            escapeHtml(documentStatusDetail(documentItem)) +
            "</p>" +
            "</div>" +
            '<span class="mdz-idx__document-badge is-' +
            escapeHtml(status) +
            '">' +
            escapeHtml(documentStatusLabel(documentItem)) +
            "</span>" +
            "</div>" +
            '<div class="mdz-idx__row-actions">' +
            action +
            "</div>" +
            "</article>"
          );
        })
        .join("");
    }

    function renderSummaryCard() {
      if (!elements.summaryCard) return;
      const workspace = state.workspace;

      if (state.loading.workspace && !workspace) {
        elements.summaryCard.innerHTML = '<div class="mdz-idx__helper">Loading summary…</div>';
        return;
      }

      if (state.workspaceError) {
        elements.summaryCard.innerHTML = '<div class="mdz-idx__error">' + escapeHtml(state.workspaceError) + "</div>";
        return;
      }

      const summary = (workspace && workspace.summary) || {};
      const citations = ensureArray(summary.citations);
      const job = workspace && workspace.latest_analysis_jobs ? workspace.latest_analysis_jobs.summarize : null;
      const summaryText = normalizeString(summary.summary);
      let html = "";

      if (summaryText) {
        html += '<p class="mdz-idx__analysis-copy">' + escapeHtml(summaryText) + "</p>";
      } else {
        html += '<p class="mdz-idx__helper">No summary yet. Upload documents or refresh the summary to generate one.</p>';
      }

      if (citations.length) {
        html += '<div class="mdz-idx__chip-row">' +
          citations
            .map(function (item, index) {
              const citationId = normalizeString(item && item.citation_id);
              if (!citationId) return "";
              return (
                '<a class="mdz-idx__chip" href="' +
                escapeHtml(buildCitationViewerUrl(citationId)) +
                '" target="_blank" rel="noopener noreferrer">Source ' +
                (index + 1) +
                "</a>"
              );
            })
            .filter(Boolean)
            .join("") +
          "</div>";
      }

      html += '<div class="mdz-idx__analysis-meta">';
      if (workspace && workspace.summary_updated_at) {
        html += '<span>Updated ' + escapeHtml(formatTimestamp(workspace.summary_updated_at)) + "</span>";
      }
      if (job && normalizeString(job.status)) {
        html += "<span>Latest job: " + escapeHtml(job.status) + (job.progress != null ? " • " + escapeHtml(String(job.progress)) + "%" : "") + "</span>";
      }
      html += "</div>";

      elements.summaryCard.innerHTML = html;
    }

    function renderFactsCard() {
      if (!elements.factsCard) return;
      const workspace = state.workspace;

      if (state.loading.workspace && !workspace) {
        elements.factsCard.innerHTML = '<div class="mdz-idx__helper">Loading facts…</div>';
        return;
      }

      if (state.workspaceError) {
        elements.factsCard.innerHTML = '<div class="mdz-idx__error">' + escapeHtml(state.workspaceError) + "</div>";
        return;
      }

      const facts = (workspace && workspace.facts) || {};
      const fields = ensureArray(facts.fields);
      const job = workspace && workspace.latest_analysis_jobs ? workspace.latest_analysis_jobs.extract : null;

      if (!fields.length) {
        elements.factsCard.innerHTML =
          '<p class="mdz-idx__helper">No extracted facts yet. IDX will populate this panel automatically when the workspace documents are ready.</p>' +
          '<div class="mdz-idx__analysis-meta">' +
          (workspace && workspace.facts_updated_at ? '<span>Updated ' + escapeHtml(formatTimestamp(workspace.facts_updated_at)) + "</span>" : "") +
          (job && normalizeString(job.status) ? "<span>Latest job: " + escapeHtml(job.status) + (job.progress != null ? " • " + escapeHtml(String(job.progress)) + "%" : "") + "</span>" : "") +
          "</div>";
        return;
      }

      elements.factsCard.innerHTML =
        fields
          .map(function (field) {
            const citations = ensureArray(field && field.citations);
            return (
              '<article class="mdz-idx__fact-row">' +
              '<div class="mdz-idx__fact-top">' +
              '<strong>' +
              escapeHtml((field && field.field) || "Field") +
              "</strong>" +
              '<span>' +
              escapeHtml((field && field.value) || "Not found") +
              "</span>" +
              "</div>" +
              (citations.length
                ? '<div class="mdz-idx__chip-row">' +
                  citations
                    .map(function (item, index) {
                      const citationId = normalizeString(item && item.citation_id);
                      if (!citationId) return "";
                      return (
                        '<a class="mdz-idx__chip" href="' +
                        escapeHtml(buildCitationViewerUrl(citationId)) +
                        '" target="_blank" rel="noopener noreferrer">Source ' +
                        (index + 1) +
                        "</a>"
                      );
                    })
                    .filter(Boolean)
                    .join("") +
                  "</div>"
                : "") +
              "</article>"
            );
          })
          .join("") +
        '<div class="mdz-idx__analysis-meta">' +
        (workspace && workspace.facts_updated_at ? '<span>Updated ' + escapeHtml(formatTimestamp(workspace.facts_updated_at)) + "</span>" : "") +
        (job && normalizeString(job.status) ? "<span>Latest job: " + escapeHtml(job.status) + (job.progress != null ? " • " + escapeHtml(String(job.progress)) + "%" : "") + "</span>" : "") +
        "</div>";
    }

    function renderWorkspaceDocuments() {
      if (!elements.workspaceDocuments) return;

      if (state.loading.workspace && !state.workspaceDocuments.length && !state.workspaceError) {
        elements.workspaceDocuments.innerHTML = '<div class="mdz-idx__empty-state"><strong>Loading workspace files…</strong><p>IDX is pulling the current packet.</p></div>';
        return;
      }

      if (state.workspaceError) {
        elements.workspaceDocuments.innerHTML = '<div class="mdz-idx__empty-state"><strong>Workspace unavailable.</strong><p>' + escapeHtml(state.workspaceError) + "</p></div>";
        return;
      }

      if (!state.workspaceDocuments.length) {
        elements.workspaceDocuments.innerHTML = '<div class="mdz-idx__empty-state"><strong>No documents yet.</strong><p>Add a PDF to begin.</p></div>';
        return;
      }

      elements.workspaceDocuments.innerHTML = state.workspaceDocuments
        .map(function (item) {
          const status = classifyDocumentStatus(item);
          const previewMode = isLocalPreviewMode();
          return (
            '<article class="mdz-idx__document-card">' +
            '<div class="mdz-idx__document-top">' +
            '<div class="mdz-idx__document-copy">' +
            '<strong class="mdz-idx__document-title">' +
            escapeHtml(item.file_name || "Document") +
            "</strong>" +
            '<p class="mdz-idx__document-detail">' +
            escapeHtml(documentStatusDetail(item)) +
            "</p>" +
            "</div>" +
            '<span class="mdz-idx__document-badge is-' +
            escapeHtml(status) +
            '">' +
            escapeHtml(documentStatusLabel(item)) +
            "</span>" +
            "</div>" +
            '<div class="mdz-idx__row-actions">' +
            (previewMode
              ? '<span class="mdz-idx__helper">Viewer is unavailable in local preview.</span>'
              : '<a class="btn btn--small mdz-cta mdz-cta--outline" href="' +
                escapeHtml(buildDocumentViewerUrl(item.document_id)) +
                '" target="_blank" rel="noopener noreferrer">Open viewer</a>') +
            "</div>" +
            "</article>"
          );
        })
        .join("");
    }

    function compareOptionMarkup(selectedValue) {
      const options = ['<option value="">Select document</option>'].concat(
        state.workspaceDocuments.map(function (item) {
          return (
            '<option value="' +
            escapeHtml(item.document_id) +
            '"' +
            (item.document_id === selectedValue ? " selected" : "") +
            ">" +
            escapeHtml(item.file_name || item.document_id) +
            "</option>"
          );
        })
      );
      return options.join("");
    }

    function renderCompareControls() {
      if (elements.compareLeft) {
        elements.compareLeft.innerHTML = compareOptionMarkup(state.compare.left);
      }
      if (elements.compareRight) {
        elements.compareRight.innerHTML = compareOptionMarkup(state.compare.right);
      }
      renderStatusLine(elements.compareStatus, state.feedback.compare);

      if (!elements.compareResult) return;

      if (!state.compare.result) {
        elements.compareResult.innerHTML = '<p class="mdz-idx__helper">Select two documents from this workspace to compare shared passages and unique excerpts.</p>';
        return;
      }

      const result = state.compare.result;
      const sections = [
        {
          title: "Shared passages",
          helper: String(result.overlap_count || 0) + " overlap(s).",
          items: ensureArray(result.shared_examples),
        },
        {
          title: "Left only",
          helper: ensureArray(result.left_only).length ? "" : "No unique left passages.",
          items: ensureArray(result.left_only),
        },
        {
          title: "Right only",
          helper: ensureArray(result.right_only).length ? "" : "No unique right passages.",
          items: ensureArray(result.right_only),
        },
      ];

      elements.compareResult.innerHTML = sections
        .map(function (section) {
          return (
            '<section class="mdz-idx__compare-group">' +
            "<strong>" +
            escapeHtml(section.title) +
            "</strong>" +
            (section.helper ? '<p class="mdz-idx__helper">' + escapeHtml(section.helper) + "</p>" : "") +
            (section.items.length
              ? section.items
                  .map(function (item) {
                    const citationId = normalizeString(item && item.citation_id);
                    return (
                      '<article class="mdz-idx__compare-item">' +
                      '<p class="mdz-idx__search-result-text">' +
                      escapeHtml((item && item.text) || "") +
                      "</p>" +
                      (citationId
                        ? '<a class="mdz-idx__chip" href="' +
                          escapeHtml(buildCitationViewerUrl(citationId)) +
                          '" target="_blank" rel="noopener noreferrer">Open source</a>'
                        : "") +
                      "</article>"
                    );
                  })
                  .join("")
              : "") +
            "</section>"
          );
        })
        .join("");
    }

    function sortedActivityItems() {
      return state.activity.slice().sort(function (left, right) {
        const leftTime = Date.parse(left && left.created_at ? left.created_at : "") || 0;
        const rightTime = Date.parse(right && right.created_at ? right.created_at : "") || 0;
        return rightTime - leftTime;
      });
    }

    function latestDecisionItem() {
      return sortedActivityItems().find(function (item) {
        return item.kind === "decision";
      }) || null;
    }

    function renderDecisionSummary() {
      if (!elements.decisionSummary) return;
      const latestDecision = latestDecisionItem();

      if (!latestDecision) {
        elements.decisionSummary.innerHTML = '<div class="mdz-idx__empty-state"><strong>No review decision yet.</strong><p>Save a decision when the workspace is ready to move forward.</p></div>';
      } else {
        const statusClass = latestDecision.decision === "approved" ? "approved" : "needs_follow_up";
        elements.decisionSummary.innerHTML =
          '<div class="mdz-idx__pills">' +
          '<span class="mdz-idx__pill mdz-idx__pill--status is-' +
          escapeHtml(statusClass) +
          '">' +
          escapeHtml(workspaceStatusLabel(statusClass)) +
          "</span>" +
          "</div>" +
          '<p class="mdz-idx__analysis-copy">' +
          escapeHtml(latestDecision.summary || "Decision recorded.") +
          "</p>" +
          '<p class="mdz-idx__helper">' +
          escapeHtml(latestDecision.principal_id || "user") +
          " • " +
          escapeHtml(formatTimestamp(latestDecision.created_at)) +
          "</p>";
      }

      renderStatusLine(elements.decisionStatus, state.feedback.decision);
    }

    function renderActivityList() {
      if (!elements.activityList) return;
      const activity = sortedActivityItems();
      renderStatusLine(elements.commentStatus, state.feedback.comment);

      if (state.loading.workspace && !activity.length) {
        elements.activityList.innerHTML = '<p class="mdz-idx__helper">Loading activity…</p>';
        return;
      }

      if (!activity.length) {
        elements.activityList.innerHTML = '<div class="mdz-idx__empty-state"><strong>No activity yet.</strong><p>Comments, decisions, and workspace audit events will appear here.</p></div>';
        return;
      }

      elements.activityList.innerHTML = activity
        .map(function (item) {
          if (item.kind === "comment") {
            return (
              '<article class="mdz-idx__activity-row">' +
              "<strong>Comment</strong>" +
              '<p class="mdz-idx__workspace-row-copy">' +
              escapeHtml(item.body || "") +
              "</p>" +
              '<p class="mdz-idx__helper">' +
              escapeHtml(item.principal_id || "user") +
              " • " +
              escapeHtml(formatTimestamp(item.created_at)) +
              "</p>" +
              "</article>"
            );
          }

          if (item.kind === "decision") {
            return (
              '<article class="mdz-idx__activity-row">' +
              "<strong>" +
              escapeHtml(workspaceStatusLabel(item.decision === "approved" ? "approved" : "needs_follow_up")) +
              "</strong>" +
              '<p class="mdz-idx__workspace-row-copy">' +
              escapeHtml(item.summary || "Decision recorded.") +
              "</p>" +
              '<p class="mdz-idx__helper">' +
              escapeHtml(item.principal_id || "user") +
              " • " +
              escapeHtml(formatTimestamp(item.created_at)) +
              "</p>" +
              "</article>"
            );
          }

          return (
            '<article class="mdz-idx__activity-row">' +
            "<strong>" +
            escapeHtml(item.action || "Activity") +
            "</strong>" +
            '<p class="mdz-idx__workspace-row-copy">' +
            escapeHtml(extractErrorMessage(item.detail) || JSON.stringify(item.detail || {})) +
            "</p>" +
            '<p class="mdz-idx__helper">' +
            escapeHtml(item.principal_id || "system") +
            " • " +
            escapeHtml(formatTimestamp(item.created_at)) +
            "</p>" +
            "</article>"
          );
        })
        .join("");
    }

    function renderWorkspaceHeader() {
      if (!elements.workspaceTitle) return;

      if (state.loading.workspace && !state.workspace) {
        setText(elements.workspaceTitle, "Loading workspace…");
        setText(elements.workspaceNotes, "IDX is pulling the current packet.");
        if (elements.workspacePills) {
          elements.workspacePills.innerHTML = "";
        }
        setText(elements.workspaceStatus, "");
        return;
      }

      if (state.workspaceError) {
        setText(elements.workspaceTitle, "Workspace unavailable");
        setText(elements.workspaceNotes, state.workspaceError);
        if (elements.workspacePills) {
          elements.workspacePills.innerHTML = "";
        }
        setText(elements.workspaceStatus, "");
        return;
      }

      const workspace = state.workspace;
      if (!workspace) {
        setText(elements.workspaceTitle, "Choose a workspace");
        setText(elements.workspaceNotes, "");
        if (elements.workspacePills) {
          elements.workspacePills.innerHTML = "";
        }
        setText(elements.workspaceStatus, "");
        return;
      }

      setText(elements.workspaceTitle, workspace.name || "Workspace");
      setText(elements.workspaceNotes, workspace.notes || "No notes yet.");
      if (elements.workspacePills) {
        elements.workspacePills.innerHTML =
          '<span class="mdz-idx__pill">' +
          escapeHtml(workspaceTypeLabel(workspace.workspace_type)) +
          "</span>" +
          '<span class="mdz-idx__pill mdz-idx__pill--status is-' +
          escapeHtml(workspace.workspace_status || "active") +
          '">' +
          escapeHtml(workspaceStatusLabel(workspace.workspace_status)) +
          "</span>" +
          '<span class="mdz-idx__pill mdz-idx__pill--muted">' +
          escapeHtml(String(workspace.document_count || 0)) +
          " document(s)</span>" +
          '<span class="mdz-idx__pill mdz-idx__pill--muted">' +
          escapeHtml(String(workspace.access_role || "viewer")) +
          "</span>";
      }
      setText(elements.workspaceStatus, "Updated " + formatTimestamp(workspace.updated_at) + ".");
    }

    function renderWorkspaceView() {
      renderWorkspaceHeader();
      renderSummaryCard();
      renderFactsCard();
      renderWorkspaceDocuments();
      renderCompareControls();
      renderDecisionSummary();
      renderActivityList();
      renderStatusLine(elements.uploadStatus, state.feedback.upload);
    }

    function renderHomeView() {
      renderStatusLine(elements.createStatus, state.feedback.create);
      renderHomeStats();
      renderWorkspaceStream();
      renderRecentFiles();
    }

    function renderRoute() {
      const showingWorkspace = !!state.routeWorkspaceId;
      if (elements.homeView) {
        elements.homeView.hidden = showingWorkspace;
      }
      if (elements.workspaceView) {
        elements.workspaceView.hidden = !showingWorkspace;
      }
    }

    function renderDropzone() {
      if (!elements.dropzone) return;
      const previewMode = isLocalPreviewMode();
      const authBlocked =
        !authState.checked ||
        !authState.authenticated ||
        !!authState.missingConfig ||
        (!previewMode && (!idxAuthState.checked || !idxAuthState.authenticated));
      const blocked = authBlocked || (!previewMode && !hasIdxApiBaseUrl()) || state.loading.upload || !state.routeWorkspaceId;
      elements.dropzone.classList.toggle("is-disabled", blocked);
      elements.dropzone.classList.toggle("is-busy", state.loading.upload);
      elements.dropzone.setAttribute("aria-disabled", blocked ? "true" : "false");
      if (elements.fileInput) {
        elements.fileInput.disabled = blocked;
      }
      elements.uploadButtons.forEach(function (button) {
        button.disabled = blocked;
      });
    }

    function renderControls() {
      const previewMode = isLocalPreviewMode();
      const authBlocked =
        !authState.checked ||
        !authState.authenticated ||
        !!authState.missingConfig ||
        (!previewMode && (!idxAuthState.checked || !idxAuthState.authenticated));
      const apiBlocked = authBlocked || (!previewMode && !hasIdxApiBaseUrl());

      if (elements.refreshHome) {
        elements.refreshHome.disabled = apiBlocked || state.loading.home || state.loading.workspace;
      }
      if (elements.refreshSummary) {
        elements.refreshSummary.disabled = apiBlocked || state.loading.summary || !state.routeWorkspaceId;
        elements.refreshSummary.textContent = state.loading.summary ? "Refreshing…" : "Refresh summary";
      }
      if (elements.refreshFacts) {
        elements.refreshFacts.disabled = apiBlocked || state.loading.facts || !state.routeWorkspaceId;
        elements.refreshFacts.textContent = state.loading.facts ? "Refreshing…" : "Refresh facts";
      }
      if (elements.compareButton) {
        elements.compareButton.disabled = apiBlocked || state.loading.compare || state.workspaceDocuments.length < 2;
        elements.compareButton.textContent = state.loading.compare ? "Running compare…" : "Run compare";
      }
      if (elements.openLatestWorkspace) {
        elements.openLatestWorkspace.disabled = apiBlocked || !state.home.workspaces.length || state.loading.home;
      }
      if (elements.backHome) {
        elements.backHome.disabled = state.loading.workspace;
      }
      if (elements.createForm) {
        qsa(elements.createForm, "input, select, textarea, button").forEach(function (element) {
          element.disabled = apiBlocked || state.loading.create;
        });
      }
      if (elements.decisionForm) {
        qsa(elements.decisionForm, "select, textarea, button").forEach(function (element) {
          element.disabled = apiBlocked || state.loading.decision || !state.routeWorkspaceId;
        });
      }
      if (elements.commentForm) {
        qsa(elements.commentForm, "textarea, button").forEach(function (element) {
          element.disabled = apiBlocked || state.loading.comment || !state.routeWorkspaceId;
        });
      }
    }

    function render() {
      renderAuthGate();
      renderNotice();
      renderRoute();
      renderHomeView();
      renderWorkspaceView();
      renderDropzone();
      renderControls();
    }

    async function refreshCurrentView() {
      if (state.routeWorkspaceId) {
        await Promise.all([
          loadHome({ preserveNotice: true }),
          loadWorkspace(state.routeWorkspaceId, { preserveNotice: true }),
        ]);
      } else {
        await loadHome();
      }
    }

    if (elements.createForm) {
      elements.createForm.addEventListener("submit", createWorkspace);
    }

    elements.localPreviewButtons.forEach(function (button) {
      button.addEventListener("click", openLocalPreview);
    });

    if (elements.openLatestWorkspace) {
      elements.openLatestWorkspace.addEventListener("click", function () {
        if (!state.home.workspaces.length) return;
        navigateToWorkspace(state.home.workspaces[0].workspace_id);
      });
    }

    if (elements.refreshHome) {
      elements.refreshHome.addEventListener("click", function () {
        refreshCurrentView();
      });
    }

    if (elements.backHome) {
      elements.backHome.addEventListener("click", function () {
        navigateHome();
      });
    }

    if (elements.refreshSummary) {
      elements.refreshSummary.addEventListener("click", refreshWorkspaceSummary);
    }

    if (elements.refreshFacts) {
      elements.refreshFacts.addEventListener("click", refreshWorkspaceFacts);
    }

    if (elements.compareLeft) {
      elements.compareLeft.addEventListener("change", function (event) {
        state.compare.left = normalizeString(event.target && event.target.value);
      });
    }

    if (elements.compareRight) {
      elements.compareRight.addEventListener("change", function (event) {
        state.compare.right = normalizeString(event.target && event.target.value);
      });
    }

    if (elements.compareButton) {
      elements.compareButton.addEventListener("click", runCompare);
    }

    if (elements.decisionForm) {
      elements.decisionForm.addEventListener("submit", saveDecision);
    }

    if (elements.commentForm) {
      elements.commentForm.addEventListener("submit", postComment);
    }

    elements.uploadButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (elements.fileInput && !elements.fileInput.disabled) {
          elements.fileInput.click();
        }
      });
    });

    if (elements.fileInput) {
      elements.fileInput.addEventListener("change", function (event) {
        uploadFiles((event.target && event.target.files) || []).finally(function () {
          if (elements.fileInput) {
            elements.fileInput.value = "";
          }
        });
      });
    }

    if (elements.dropzone) {
      ["dragenter", "dragover"].forEach(function (eventName) {
        elements.dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          if (elements.dropzone.getAttribute("aria-disabled") === "true") return;
          dragDepth += 1;
          elements.dropzone.classList.add("is-dragover");
        });
      });

      ["dragleave", "dragend", "drop"].forEach(function (eventName) {
        elements.dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
          dragDepth = Math.max(0, dragDepth - 1);
          if (!dragDepth || eventName === "drop") {
            elements.dropzone.classList.remove("is-dragover");
          }
        });
      });

      elements.dropzone.addEventListener("drop", function (event) {
        if (elements.dropzone.getAttribute("aria-disabled") === "true") return;
        uploadFiles((event.dataTransfer && event.dataTransfer.files) || []);
      });

      elements.dropzone.addEventListener("click", function (event) {
        if (event.target.closest("[data-idx-upload-button]")) return;
        if (elements.fileInput && !elements.fileInput.disabled) {
          elements.fileInput.click();
        }
      });

      elements.dropzone.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          if (elements.fileInput && !elements.fileInput.disabled) {
            elements.fileInput.click();
          }
        }
      });
    }

    window.addEventListener("popstate", function () {
      const nextWorkspaceId = currentWorkspaceIdFromUrl();
      if (nextWorkspaceId) {
        navigateToWorkspace(nextWorkspaceId, true);
      } else {
        navigateHome(true);
      }
    });

    render();
    refreshAuth(false).then(function (session) {
      if (!session || !session.authenticated) return;
      refreshIdxAuth(false)
        .catch(function (error) {
          setNotice(
            buildUiNotice(error, {
              action: "IDX session check",
              endpoint: buildIdxUrl("/idx/auth/me"),
            })
          );
        })
        .finally(function () {
          loadHome().then(function () {
            if (state.routeWorkspaceId) {
              loadWorkspace(state.routeWorkspaceId, { preserveNotice: true });
            }
          });
        });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-idx-dashboard]").forEach(initDashboard);
  });
})();
