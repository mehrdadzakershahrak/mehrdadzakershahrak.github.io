(function () {
  const INDUSTRIES = {
    legal: {
      label: "Legal",
      title: "Legal AI",
      copy: "Summaries, drafting support, and document Q&A workflows.",
    },
    finance: {
      label: "Finance",
      title: "Finance AI",
      copy: "Analysis helpers, narrative summaries, and checklist-style guidance.",
    },
    healthcare: {
      label: "Healthcare",
      title: "Healthcare AI",
      copy: "Intake summaries, care-plan drafts, and administrative workflow support.",
    },
    procurement: {
      label: "Procurement",
      title: "Procurement AI",
      copy: "RFP summaries, vendor comparison, and sourcing checklist workflows.",
    },
    "real-estate": {
      label: "Real Estate",
      title: "Real Estate AI",
      copy: "Listing insights, comps reasoning, and deal memo generation.",
    },
  };

  const READY_STATUS = "ready";
  const FAST_POLL_INTERVAL_MS = 2000;
  const SLOW_POLL_INTERVAL_MS = 10000;
  const FAST_POLL_WINDOW_MS = 120000;
  const FAILURE_STATUSES = new Set(["error", "failed", "cancelled", "canceled"]);

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

  function ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function rawString(value) {
    return typeof value === "string" ? value : "";
  }

  function currentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function currentOrigin() {
    return window.location.origin.replace(/\/+$/, "");
  }

  function uniqueStrings(values) {
    const seen = new Set();
    const result = [];

    ensureArray(values).forEach(function (value) {
      const normalized = normalizeString(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      result.push(normalized);
    });

    return result;
  }

  function humanizeValue(value) {
    const text = normalizeString(value).replace(/[-_]+/g, " ");
    if (!text) return "";
    return text.replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }

  function normalizeIndustry(value) {
    const key = normalizeString(value);
    return Object.prototype.hasOwnProperty.call(INDUSTRIES, key) ? key : null;
  }

  function urlOrigin(value) {
    try {
      return new URL(value, window.location.origin).origin.replace(/\/+$/, "");
    } catch (_error) {
      return "";
    }
  }

  function isNetworkStyleError(error) {
    const message = normalizeString(error && error.message).toLowerCase();
    return error instanceof TypeError || /failed to fetch|load failed|networkerror|network request failed/.test(message);
  }

  function extractErrorMessage(value) {
    if (typeof value === "string") return normalizeString(value);
    if (!value || typeof value !== "object") return "";
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
        body: "This workspace does not have a valid IDX API base URL yet, so browser requests cannot be sent.",
      };
    }

    if (error && (error.status === 401 || error.status === 403)) {
      return {
        title: "IDX session is not available",
        body:
          (endpointOrigin ? endpointOrigin + " rejected the browser request." : "The IDX API rejected the browser request.") +
          " Sign in again, then verify that the IDX domain can read the same browser session.",
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
        title: "Browser access to IDX is blocked",
        body:
          (endpointOrigin || "The IDX API") +
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

  function createInitialState() {
    return {
      phase: "phase_1",
      selectedIndustry: "general",
      sessionId: null,
      messages: [],
      documentIds: [],
      workspaceId: null,
      documents: [],
      pendingDocuments: [],
      references: [],
      nextActions: [],
      starterPrompts: [],
      scopeStatus: "",
      uploadJobState: {},
    };
  }

  function createMessage(role, text) {
    return {
      id: String(Date.now()) + Math.random().toString(16).slice(2),
      role: role,
      text: text,
    };
  }

  function getIdxApiBaseUrl() {
    const config = window.MDZ_AUTH_CONFIG || {};
    const explicit = normalizeString(config.idxApiBaseUrl || "");
    if (explicit) return explicit.replace(/\/+$/, "");

    const hostname = window.location.hostname || "";
    if (hostname === "127.0.0.1" || hostname === "localhost") {
      const auth = window.MdzAuth;
      if (auth && auth.getApiBaseUrl) {
        return normalizeString(auth.getApiBaseUrl()).replace(/\/+$/, "");
      }
      return window.location.origin.replace(/\/+$/, "");
    }

    return "";
  }

  function buildIdxUrl(path) {
    const base = getIdxApiBaseUrl();
    return base ? base + path : "";
  }

  async function fetchJson(url, options) {
    const request = Object.assign(
      {
        credentials: "include",
        headers: {},
      },
      options || {}
    );

    request.headers = Object.assign({ Accept: "application/json" }, request.headers || {});

    const response = await fetch(url, request);
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
      const error = new Error(extractErrorMessage(data) || "Request failed.");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data || {};
  }

  function postJson(url, payload) {
    return fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function getDocumentId(value) {
    if (!value) return "";
    if (typeof value === "string") return normalizeString(value);
    if (typeof value !== "object" || Array.isArray(value)) return "";
    if (value.document && typeof value.document === "object") {
      return getDocumentId(value.document) || normalizeString(value.document_id || value.id || "");
    }
    return normalizeString(value.document_id || value.id || "");
  }

  function getJobId(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    return normalizeString(value.job_id || value.jobId || "");
  }

  function normalizePromptText(value) {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object" || Array.isArray(value)) return "";
    return normalizeString(value.prompt || value.message || value.text || value.label || value.title || "");
  }

  function normalizeAction(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    const kind = normalizeString(value.kind || value.type || "");
    return kind ? value : null;
  }

  function normalizeReference(value) {
    if (!value) return null;
    if (typeof value === "string") {
      const url = normalizeString(value);
      return url ? { url: url, title: url } : null;
    }
    if (typeof value !== "object" || Array.isArray(value)) return null;
    const url = normalizeString(value.url || value.href || value.link || "");
    if (!url) return null;
    return value;
  }

  function normalizeMessageText(value) {
    return typeof value === "string" ? value.trim() : normalizeString(value);
  }

  function normalizeUploadJobStateEntry(value, fallback) {
    const base = fallback && typeof fallback === "object" ? fallback : {};
    const raw = value && typeof value === "object" ? value : {};

    return {
      jobId: normalizeString(raw.jobId || raw.job_id || base.jobId || ""),
      latestJobPayload: raw.latestJobPayload || raw.latest_job_payload || base.latestJobPayload || null,
      latestDocumentPayload: raw.latestDocumentPayload || raw.latest_document_payload || base.latestDocumentPayload || null,
      isPolling: !!(Object.prototype.hasOwnProperty.call(raw, "isPolling") ? raw.isPolling : base.isPolling),
      timedOut: !!(Object.prototype.hasOwnProperty.call(raw, "timedOut") ? raw.timedOut : base.timedOut),
      lastPollAt: raw.lastPollAt || raw.last_poll_at || base.lastPollAt || null,
    };
  }

  function normalizeDocumentRecord(value, fallback) {
    const base = fallback && typeof fallback === "object" ? fallback : {};
    const raw = value && typeof value === "object" ? value : {};
    const nestedDocument = raw.document && typeof raw.document === "object" ? raw.document : null;
    const documentId = getDocumentId(raw) || getDocumentId(nestedDocument) || getDocumentId(base);
    if (!documentId) return null;

    const fileName =
      normalizeString(
        raw.file_name ||
          raw.filename ||
          raw.original_filename ||
          raw.name ||
          raw.title ||
          (nestedDocument &&
            (nestedDocument.file_name ||
              nestedDocument.filename ||
              nestedDocument.original_filename ||
              nestedDocument.name ||
              nestedDocument.title)) ||
          base.file_name ||
          base.filename ||
          base.original_filename ||
          base.name ||
          base.title
      ) || documentId;

    const status = normalizeString(
      raw.document_status || raw.status || (nestedDocument && nestedDocument.status) || base.document_status || base.status || ""
    );

    const jobStatus = normalizeString(
      raw.job_status ||
        raw.jobStatus ||
        (raw.document_status ? raw.status : "") ||
        base.job_status ||
        base.jobStatus ||
        ""
    );

    const progress =
      typeof raw.progress === "number"
        ? raw.progress
        : typeof base.progress === "number"
          ? base.progress
          : null;

    return {
      document_id: documentId,
      file_name: fileName,
      status: status,
      job_status: jobStatus,
      ocr_status: normalizeString(raw.ocr_status || raw.ocrStatus || (nestedDocument && nestedDocument.ocr_status) || base.ocr_status || ""),
      index_status: normalizeString(
        raw.index_status || raw.indexStatus || (nestedDocument && nestedDocument.index_status) || base.index_status || ""
      ),
      job_id: getJobId(raw) || getJobId(base),
      progress: progress,
      timed_out: !!(raw.timed_out || base.timed_out),
      error:
        extractErrorMessage(raw.error || raw.detail || raw.reason || (raw.result && raw.result.error)) ||
        extractErrorMessage(base.error) ||
        "",
      raw: raw || base.raw || null,
    };
  }

  function normalizeDocumentList(values) {
    return ensureArray(values)
      .map(function (value) {
        return normalizeDocumentRecord(value, value);
      })
      .filter(Boolean);
  }

  function normalizeReferences(values) {
    return ensureArray(values)
      .map(normalizeReference)
      .filter(Boolean);
  }

  function normalizeActions(values) {
    return ensureArray(values)
      .map(normalizeAction)
      .filter(Boolean);
  }

  function normalizeStarterPrompts(values) {
    return ensureArray(values)
      .map(normalizePromptText)
      .filter(Boolean);
  }

  function documentLifecycle(document) {
    const record = normalizeDocumentRecord(document, document);
    if (!record) return "processing";

    const status = normalizeString(record.status).toLowerCase();
    const jobStatus = normalizeString(record.job_status).toLowerCase();
    const ocrStatus = normalizeString(record.ocr_status).toLowerCase();
    const indexStatus = normalizeString(record.index_status).toLowerCase();

    if (status === "uploading" || jobStatus === "uploading") return "uploading";
    if (
      record.error ||
      FAILURE_STATUSES.has(status) ||
      FAILURE_STATUSES.has(jobStatus) ||
      FAILURE_STATUSES.has(ocrStatus) ||
      FAILURE_STATUSES.has(indexStatus)
    ) {
      return "failed";
    }
    if (status === READY_STATUS && ocrStatus === READY_STATUS && indexStatus === READY_STATUS) {
      return "ready";
    }
    return "processing";
  }

  function isReadyDocument(document) {
    return documentLifecycle(document) === "ready";
  }

  function documentStatusLabel(document) {
    const record = normalizeDocumentRecord(document, document);
    if (!record) return "Pending";

    const lifecycle = documentLifecycle(record);
    if (lifecycle === "uploading") return "Uploading";
    if (lifecycle === "failed") return "Failed";
    if (lifecycle === "ready") return "Ready";
    if (record.timed_out) return "Still processing";
    if (typeof record.progress === "number" && record.progress >= 0) {
      return Math.round(record.progress) + "%";
    }
    if (normalizeString(record.status).toLowerCase() === READY_STATUS && normalizeString(record.ocr_status).toLowerCase() === READY_STATUS) {
      return "Indexing";
    }
    if (normalizeString(record.status).toLowerCase() === READY_STATUS && normalizeString(record.ocr_status)) {
      return "OCR";
    }
    return humanizeValue(record.status || record.job_status || "processing") || "Processing";
  }

  function documentStatusDetail(document, isSelected) {
    const record = normalizeDocumentRecord(document, document);
    if (!record) return "";

    const lifecycle = documentLifecycle(record);

    if (lifecycle === "ready") {
      return isSelected ? "Included in the next assistant request." : "Ready to include in assistant scope.";
    }

    if (lifecycle === "failed") {
      return record.error || "This file is not available as assistant context.";
    }

    if (record.timed_out) {
      return "IDX is still processing this file. Background polling will keep checking.";
    }

    if (typeof record.progress === "number" && record.progress >= 0) {
      return "IDX job progress: " + Math.round(record.progress) + "%";
    }

    return "Waiting for IDX job and document readiness.";
  }

  function scopeBannerText(status) {
    const normalized = normalizeString(status).toLowerCase();
    if (!normalized) return "";
    if (normalized === "pending") {
      return "Scope pending: selected documents are still processing, but the assistant remains usable.";
    }
    if (normalized === "partial_pending") {
      return "Scope partially pending: some selected documents are ready now, while others are still processing.";
    }
    if (normalized === "ready") {
      return "Scope ready: the current document context is available to the assistant.";
    }
    if (normalized === "empty") {
      return "Scope empty: no current document context is active yet.";
    }
    return humanizeValue(normalized);
  }

  function upsertDocument(list, document) {
    const nextDocument = normalizeDocumentRecord(document, document);
    if (!nextDocument) return ensureArray(list);

    const next = [];
    let inserted = false;

    ensureArray(list).forEach(function (item) {
      const current = normalizeDocumentRecord(item, item);
      if (!current) return;

      if (current.document_id === nextDocument.document_id) {
        if (!inserted) {
          next.push(Object.assign({}, current, nextDocument));
          inserted = true;
        }
        return;
      }

      next.push(current);
    });

    if (!inserted) {
      next.unshift(nextDocument);
    }

    return next;
  }

  function removeDocument(list, documentId) {
    return ensureArray(list).filter(function (item) {
      return getDocumentId(item) !== documentId;
    });
  }

  function replaceDocuments(list, matchIds, replacements) {
    const matchSet = new Set(ensureArray(matchIds).map(getDocumentId).filter(Boolean));
    const normalizedReplacements = normalizeDocumentList(replacements);
    const next = [];
    let inserted = false;

    ensureArray(list).forEach(function (item) {
      const current = normalizeDocumentRecord(item, item);
      if (!current) return;

      if (matchSet.has(current.document_id)) {
        if (!inserted) {
          normalizedReplacements.forEach(function (replacement) {
            next.push(replacement);
          });
          inserted = true;
        }
        return;
      }

      next.push(current);
    });

    if (!inserted) {
      normalizedReplacements.forEach(function (replacement) {
        next.unshift(replacement);
      });
    }

    return next;
  }

  function buildRequestPayload(action) {
    if (!action || typeof action !== "object") return null;
    const payload = action.payload && typeof action.payload === "object" ? action.payload : {};
    return payload.request && typeof payload.request === "object" ? payload.request : null;
  }

  function actionKind(action) {
    return normalizeString(action && (action.kind || action.type || ""));
  }

  function actionLabel(action) {
    const payload = action && action.payload && typeof action.payload === "object" ? action.payload : {};
    return normalizeString(action && (action.label || action.title || payload.label || payload.title || actionKind(action))) || "Action";
  }

  function actionPrompt(action) {
    const payload = action && action.payload && typeof action.payload === "object" ? action.payload : {};
    return normalizePromptText(payload.prompt || payload.text || payload.message || (payload.request && payload.request.message));
  }

  function createLocalPendingDocument(file) {
    return normalizeDocumentRecord(
      {
        document_id: "local-upload-" + String(Date.now()) + "-" + Math.random().toString(16).slice(2),
        file_name: normalizeString(file && file.name) || "Uploaded PDF",
        status: "uploading",
        ocr_status: "pending",
        index_status: "pending",
      },
      null
    );
  }

  function extractUploadItems(response, file) {
    const raw = response && typeof response === "object" ? response : {};
    const fallbackName = normalizeString(file && file.name) || "Uploaded PDF";
    const items = [];
    const seen = new Set();

    function pushRecord(value, fallback) {
      const normalized = normalizeDocumentRecord(
        value,
        Object.assign(
          {
            file_name: fallbackName,
            status: "processing",
            ocr_status: "pending",
            index_status: "pending",
          },
          fallback || {}
        )
      );

      if (!normalized || seen.has(normalized.document_id)) return;
      seen.add(normalized.document_id);
      items.push(normalized);
    }

    ensureArray(raw.items).forEach(function (item) {
      pushRecord(item);
    });

    if (!items.length && raw.document && typeof raw.document === "object") {
      pushRecord(raw.document);
    }

    if (!items.length) {
      ensureArray(raw.documents).forEach(function (item) {
        pushRecord(item);
      });
    }

    if (!items.length) {
      pushRecord(raw);
    }

    return items;
  }

  function buildAssistantRequestBody(request, state) {
    const raw = request && typeof request === "object" ? request : {};
    const requestedIndustry = normalizeIndustry(raw.industry);
    const fallbackIndustry = normalizeIndustry(state.selectedIndustry);

    return {
      industry: requestedIndustry || fallbackIndustry,
      message: rawString(raw.message),
      document_ids: Object.prototype.hasOwnProperty.call(raw, "document_ids")
        ? uniqueStrings(ensureArray(raw.document_ids).map(getDocumentId))
        : state.documentIds.slice(),
      workspace_id: Object.prototype.hasOwnProperty.call(raw, "workspace_id")
        ? normalizeString(raw.workspace_id) || null
        : state.workspaceId,
      session_id: Object.prototype.hasOwnProperty.call(raw, "session_id")
        ? normalizeString(raw.session_id) || null
        : state.sessionId,
    };
  }

  function buildPolledDocument(documentId, entry, fallback) {
    const jobPayload = entry && entry.latestJobPayload ? entry.latestJobPayload : null;
    const documentPayload = entry && entry.latestDocumentPayload ? entry.latestDocumentPayload : null;

    return normalizeDocumentRecord(
      {
        document_id: documentId,
        job_id: entry && entry.jobId ? entry.jobId : "",
        file_name:
          normalizeString(
            (documentPayload && documentPayload.file_name) ||
              (jobPayload && jobPayload.file_name) ||
              (fallback && fallback.file_name) ||
              ""
          ) || documentId,
        status: normalizeString(
          (documentPayload && documentPayload.status) ||
            (jobPayload && jobPayload.document_status) ||
            (fallback && fallback.status) ||
            ""
        ),
        job_status: normalizeString((jobPayload && jobPayload.status) || (fallback && fallback.job_status) || ""),
        ocr_status: normalizeString(
          (documentPayload && documentPayload.ocr_status) ||
            (jobPayload && jobPayload.ocr_status) ||
            (fallback && fallback.ocr_status) ||
            ""
        ),
        index_status: normalizeString(
          (documentPayload && documentPayload.index_status) ||
            (jobPayload && jobPayload.index_status) ||
            (fallback && fallback.index_status) ||
            ""
        ),
        progress:
          jobPayload && typeof jobPayload.progress === "number"
            ? jobPayload.progress
            : fallback && typeof fallback.progress === "number"
              ? fallback.progress
              : null,
        timed_out: !!(entry && entry.timedOut),
        error:
          extractErrorMessage(documentPayload && documentPayload.error) ||
          extractErrorMessage(jobPayload && jobPayload.error) ||
          extractErrorMessage(fallback && fallback.error),
      },
      fallback
    );
  }

  function initAssistant(root) {
    const auth = window.MdzAuth || null;
    const elements = {
      phase1: qs(root, '[data-idx-phase="phase_1"]'),
      phase2: qs(root, '[data-idx-phase="phase_2"]'),
      cards: qsa(root, "[data-idx-enter-industry]"),
      title: qs(root, "[data-idx-industry-title]"),
      copy: qs(root, "[data-idx-industry-copy]"),
      backButton: qs(root, "[data-idx-back]"),
      authGate: qs(root, "[data-idx-auth-gate]"),
      authGateTitle: qs(root, "[data-idx-auth-gate-title]"),
      authGateCopy: qs(root, "[data-idx-auth-gate-copy]"),
      authLogin: qs(root, "[data-idx-auth-login]"),
      notice: qs(root, "[data-idx-notice]"),
      noticeTitle: qs(root, "[data-idx-notice-title]"),
      noticeCopy: qs(root, "[data-idx-notice-copy]"),
      scopeStatus: qs(root, "[data-idx-scope-status]"),
      transcript: qs(root, "[data-idx-transcript]"),
      form: qs(root, "[data-idx-form]"),
      input: qs(root, "[data-idx-input]"),
      sendButton: qs(root, "[data-idx-send]"),
      uploadButtons: qsa(root, "[data-idx-upload-button], [data-idx-upload-entry]"),
      fileInput: qs(root, "[data-idx-file-input]"),
      guidancePanel: qs(root, "[data-idx-guidance-panel]"),
      starterGroup: qs(root, "[data-idx-starter-group]"),
      actionsGroup: qs(root, "[data-idx-actions-group]"),
      starterPrompts: qs(root, "[data-idx-starter-prompts]"),
      nextActions: qs(root, "[data-idx-next-actions]"),
      documentContext: qs(root, "[data-idx-document-context]"),
      references: qs(root, "[data-idx-references]"),
      sendStatus: qs(root, "[data-idx-send-status]"),
      uploadStatus: qs(root, "[data-idx-upload-status]"),
    };

    let state = createInitialState();
    let authState = {
      checked: false,
      authenticated: false,
      missingConfig: false,
    };

    const ui = {
      notice: null,
      chatPending: false,
      bootstrapPending: false,
      uploadActiveCount: 0,
    };

    const pollTimers = Object.create(null);
    const pollMeta = Object.create(null);

    function setState(next) {
      state = next;
      render();
    }

    function patchState(patch) {
      setState(Object.assign({}, state, patch));
    }

    function setNotice(notice) {
      ui.notice = notice || null;
    }

    function clearNotice() {
      ui.notice = null;
    }

    function cloneUploadJobState() {
      return Object.assign({}, state.uploadJobState || {});
    }

    function setUploadJobStateEntry(documentId, patch) {
      const current = normalizeUploadJobStateEntry((state.uploadJobState || {})[documentId], null);
      const next = cloneUploadJobState();
      next[documentId] = normalizeUploadJobStateEntry(patch, current);
      patchState({ uploadJobState: next });
    }

    function industryConfig() {
      return INDUSTRIES[state.selectedIndustry] || null;
    }

    function setIndustryQuery(industry) {
      const url = new URL(window.location.href);
      if (industry) {
        url.searchParams.set("industry", industry);
      } else {
        url.searchParams.delete("industry");
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }

    function buildLoginHref() {
      if (!auth || !auth.buildLoginUrl) return "/login/";
      return auth.buildLoginUrl(currentRelativeUrl());
    }

    async function refreshAuth(forceRefresh) {
      if (!auth || !auth.getSession) {
        authState = {
          checked: true,
          authenticated: false,
          missingConfig: true,
        };
        render();
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

      render();
      return authState;
    }

    async function ensureAuthenticated() {
      const session = authState.checked ? authState : await refreshAuth(true);
      return !!session.authenticated;
    }

    function focusComposer() {
      if (!elements.input) return;
      window.requestAnimationFrame(function () {
        elements.input.focus();
      });
    }

    function resetVisibleAssistantState(industry, preserved) {
      patchState({
        phase: "phase_2",
        selectedIndustry: industry,
        sessionId: preserved && Object.prototype.hasOwnProperty.call(preserved, "sessionId") ? preserved.sessionId : state.sessionId,
        messages: [],
        documentIds: preserved && Array.isArray(preserved.documentIds) ? preserved.documentIds.slice() : state.documentIds.slice(),
        workspaceId:
          preserved && Object.prototype.hasOwnProperty.call(preserved, "workspaceId") ? preserved.workspaceId : state.workspaceId,
        documents: [],
        pendingDocuments: [],
        references: [],
        nextActions: [],
        starterPrompts: [],
        scopeStatus: "",
      });
    }

    function syncUploadStateFromAssistantResponse(documents, pendingDocuments) {
      const nextUploadJobState = cloneUploadJobState();
      let changed = false;

      normalizeDocumentList(documents)
        .concat(normalizeDocumentList(pendingDocuments))
        .forEach(function (documentItem) {
          const documentId = documentItem.document_id;
          if (!documentId || !nextUploadJobState[documentId]) return;

          nextUploadJobState[documentId] = normalizeUploadJobStateEntry(
            {
              latestDocumentPayload: documentItem.raw || documentItem,
              isPolling: !isReadyDocument(documentItem) && documentLifecycle(documentItem) !== "failed" && !!pollTimers[documentId],
              timedOut: nextUploadJobState[documentId].timedOut,
            },
            nextUploadJobState[documentId]
          );
          changed = true;

          if (isReadyDocument(documentItem) || documentLifecycle(documentItem) === "failed") {
            if (pollTimers[documentId]) {
              window.clearTimeout(pollTimers[documentId]);
              delete pollTimers[documentId];
            }
          }
        });

      return changed ? nextUploadJobState : state.uploadJobState;
    }

    function applyAssistantResponse(response, options) {
      const phase = normalizeString(response && response.phase) === "phase_1" ? "phase_1" : "phase_2";
      const selectedIndustry = normalizeIndustry(response && response.industry) || normalizeIndustry(options && options.industryFallback) || state.selectedIndustry;
      const assistantText = normalizeMessageText(response && response.message);
      const responseDocuments = normalizeDocumentList(response && response.documents);
      const responsePendingDocuments = normalizeDocumentList(response && response.pending_documents);
      const nextMessages = assistantText ? state.messages.concat(createMessage("assistant", assistantText)) : state.messages;

      patchState({
        phase: phase,
        selectedIndustry: selectedIndustry,
        sessionId: Object.prototype.hasOwnProperty.call(response || {}, "session_id") ? normalizeString(response && response.session_id) || null : state.sessionId,
        messages: nextMessages,
        documentIds: Object.prototype.hasOwnProperty.call(response || {}, "document_ids")
          ? uniqueStrings(ensureArray(response && response.document_ids).map(getDocumentId))
          : [],
        workspaceId: Object.prototype.hasOwnProperty.call(response || {}, "workspace_id")
          ? normalizeString(response && response.workspace_id) || null
          : null,
        documents: responseDocuments,
        pendingDocuments: responsePendingDocuments,
        references: normalizeReferences(response && response.references),
        nextActions: normalizeActions(response && response.next_actions),
        starterPrompts: normalizeStarterPrompts(response && response.starter_prompts),
        scopeStatus: normalizeString(response && response.scope_status),
        uploadJobState: syncUploadStateFromAssistantResponse(responseDocuments, responsePendingDocuments),
      });
    }

    async function sendAssistantRequest(request, options) {
      const endpoint = buildIdxUrl("/idx/assistant/chat");
      const previousInput = elements.input ? elements.input.value : "";
      const previousMessages = state.messages.slice();
      const requestBody = buildAssistantRequestBody(request, state);
      const messageText = normalizeString(requestBody.message);

      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "assistant chat", endpoint: "" }));
        render();
        return null;
      }

      if (!requestBody.industry) {
        setNotice({
          title: "Choose an industry first",
          body: "Select one of the supported IDX assistant industries before sending a request.",
        });
        render();
        return null;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return null;
      }

      if (options && options.appendUser && messageText) {
        patchState({
          messages: previousMessages.concat(createMessage("user", requestBody.message)),
        });
      }

      clearNotice();
      ui.bootstrapPending = !!(options && options.bootstrap);
      ui.chatPending = !ui.bootstrapPending;
      render();

      try {
        const response = await postJson(endpoint, requestBody);
        applyAssistantResponse(response, { industryFallback: requestBody.industry });
        clearNotice();

        if (elements.input && options && options.clearComposerOnSuccess) {
          elements.input.value = "";
        }

        return response;
      } catch (error) {
        if (error && (error.status === 401 || error.status === 403)) {
          authState = {
            checked: true,
            authenticated: false,
            missingConfig: authState.missingConfig,
          };
        }

        if (options && options.appendUser) {
          patchState({ messages: previousMessages });
        }

        setNotice(
          buildUiNotice(error, {
            action: options && options.bootstrap ? "assistant bootstrap" : "assistant chat",
            endpoint: endpoint,
          })
        );

        if (elements.input && options && options.restoreComposerOnFailure) {
          elements.input.value = previousInput || requestBody.message;
        }

        return null;
      } finally {
        ui.bootstrapPending = false;
        ui.chatPending = false;
        render();
      }
    }

    async function enterIndustry(industry, options) {
      const normalized = normalizeIndustry(industry);
      if (!normalized) return;

      const preservedContext = {
        sessionId: state.sessionId,
        documentIds: state.documentIds.slice(),
        workspaceId: state.workspaceId,
      };

      setIndustryQuery(normalized);
      clearNotice();
      resetVisibleAssistantState(normalized, preservedContext);

      if (!(options && options.skipFocus)) {
        focusComposer();
      }

      await sendAssistantRequest(
        {
          industry: normalized,
          message: "",
          session_id: preservedContext.sessionId,
          document_ids: preservedContext.documentIds,
          workspace_id: preservedContext.workspaceId,
        },
        {
          bootstrap: true,
        }
      );
    }

    function returnToPhase1() {
      clearNotice();
      patchState({
        phase: "phase_1",
        selectedIndustry: "general",
      });
      setIndustryQuery("");
    }

    function canSend() {
      return state.phase === "phase_2" && !!normalizeIndustry(state.selectedIndustry);
    }

    async function dispatchAction(action) {
      const kind = actionKind(action);
      const payload = action && action.payload && typeof action.payload === "object" ? action.payload : {};
      const request = buildRequestPayload(action);

      if (!kind) return;

      if (kind === "upload") {
        if (elements.fileInput) elements.fileInput.click();
        return;
      }

      if (kind === "open_reference") {
        const url = normalizeString(payload.url || action.url || "");
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (kind === "prompt" || kind === "run_tool") {
        if (!request) {
          setNotice({
            title: "Server action is incomplete",
            body: "The selected action did not include a valid assistant request payload.",
          });
          render();
          return;
        }

        if (kind === "prompt" && elements.input) {
          elements.input.value = actionPrompt(action) || rawString(request.message);
        }

        await sendAssistantRequest(request, {
          appendUser: true,
          clearComposerOnSuccess: kind === "prompt",
          restoreComposerOnFailure: true,
        });
      }
    }

    function clearPollTimer(documentId) {
      if (!pollTimers[documentId]) return;
      window.clearTimeout(pollTimers[documentId]);
      delete pollTimers[documentId];
    }

    function nextPollDelay(documentId) {
      const entry = normalizeUploadJobStateEntry((state.uploadJobState || {})[documentId], null);
      return entry.timedOut ? SLOW_POLL_INTERVAL_MS : FAST_POLL_INTERVAL_MS;
    }

    function schedulePoll(documentId, delayMs) {
      clearPollTimer(documentId);
      pollTimers[documentId] = window.setTimeout(function () {
        runUploadPoll(documentId);
      }, delayMs);
    }

    async function runUploadPoll(documentId) {
      const currentEntry = normalizeUploadJobStateEntry((state.uploadJobState || {})[documentId], null);
      if (!currentEntry || !currentEntry.jobId) return;

      const jobUrl = buildIdxUrl("/idx/jobs/" + encodeURIComponent(currentEntry.jobId));
      const documentUrl = buildIdxUrl("/idx/documents/" + encodeURIComponent(documentId));
      const startedAt = pollMeta[documentId] && pollMeta[documentId].startedAt ? pollMeta[documentId].startedAt : Date.now();
      const fallbackDocument =
        state.pendingDocuments.find(function (item) {
          return getDocumentId(item) === documentId;
        }) ||
        state.documents.find(function (item) {
          return getDocumentId(item) === documentId;
        }) ||
        buildPolledDocument(documentId, currentEntry, null);

      pollMeta[documentId] = { startedAt: startedAt };

      setUploadJobStateEntry(documentId, {
        isPolling: true,
        lastPollAt: new Date().toISOString(),
      });

      const [jobResult, documentResult] = await Promise.allSettled([
        fetchJson(jobUrl, { method: "GET" }),
        fetchJson(documentUrl, { method: "GET" }),
      ]);

      const timedOut = Date.now() - startedAt >= FAST_POLL_WINDOW_MS;
      const timestamp = new Date().toISOString();

      if (jobResult.status === "rejected" || documentResult.status === "rejected") {
        const error = jobResult.status === "rejected" ? jobResult.reason : documentResult.reason;
        const failedEndpoint = jobResult.status === "rejected" ? jobUrl : documentUrl;

        if (error && (error.status === 401 || error.status === 403)) {
          authState = {
            checked: true,
            authenticated: false,
            missingConfig: authState.missingConfig,
          };
        }

        const failedEntry = normalizeUploadJobStateEntry(
          {
            jobId: currentEntry.jobId,
            latestJobPayload: jobResult.status === "fulfilled" ? jobResult.value : currentEntry.latestJobPayload,
            latestDocumentPayload: documentResult.status === "fulfilled" ? documentResult.value : currentEntry.latestDocumentPayload,
            isPolling: false,
            timedOut: timedOut,
            lastPollAt: timestamp,
          },
          currentEntry
        );

        patchState({
          uploadJobState: Object.assign({}, state.uploadJobState, {
            [documentId]: failedEntry,
          }),
          pendingDocuments: upsertDocument(state.pendingDocuments, buildPolledDocument(documentId, failedEntry, fallbackDocument)),
        });

        setNotice(
          buildUiNotice(error, {
            action: "document polling",
            endpoint: failedEndpoint,
          })
        );

        schedulePoll(documentId, nextPollDelay(documentId));
        return;
      }

      const nextEntry = normalizeUploadJobStateEntry(
        {
          jobId: currentEntry.jobId,
          latestJobPayload: jobResult.value,
          latestDocumentPayload: documentResult.value,
          isPolling: false,
          timedOut: timedOut,
          lastPollAt: timestamp,
        },
        currentEntry
      );

      const nextUploadJobState = cloneUploadJobState();
      nextUploadJobState[documentId] = nextEntry;

      const nextDocument = buildPolledDocument(documentId, nextEntry, fallbackDocument);
      const lifecycle = documentLifecycle(nextDocument);

      if (lifecycle === "ready") {
        clearPollTimer(documentId);
        patchState({
          uploadJobState: nextUploadJobState,
          pendingDocuments: removeDocument(state.pendingDocuments, documentId),
          documents: upsertDocument(state.documents, nextDocument),
          documentIds: uniqueStrings(state.documentIds.concat(documentId)),
        });
        return;
      }

      if (lifecycle === "failed") {
        clearPollTimer(documentId);
        patchState({
          uploadJobState: nextUploadJobState,
          pendingDocuments: upsertDocument(state.pendingDocuments, nextDocument),
        });
        return;
      }

      patchState({
        uploadJobState: nextUploadJobState,
        pendingDocuments: upsertDocument(state.pendingDocuments, nextDocument),
      });

      schedulePoll(documentId, nextEntry.timedOut ? SLOW_POLL_INTERVAL_MS : FAST_POLL_INTERVAL_MS);
    }

    async function uploadSingleFile(file) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const tempDocument = createLocalPendingDocument(file);

      patchState({
        pendingDocuments: [tempDocument].concat(state.pendingDocuments),
      });

      try {
        const formData = new FormData();
        formData.append("files", file, file.name);

        const response = await fetchJson(endpoint, {
          method: "POST",
          body: formData,
          headers: {},
        });

        const uploadItems = extractUploadItems(response, file);
        if (!uploadItems.length) {
          throw new Error("Upload completed but returned no document records.");
        }

        const nextUploadJobState = cloneUploadJobState();
        uploadItems.forEach(function (item) {
          const latestDocumentPayload = {
            document_id: item.document_id,
            file_name: item.file_name,
            status: item.status,
            ocr_status: item.ocr_status,
            index_status: item.index_status,
          };

          nextUploadJobState[item.document_id] = normalizeUploadJobStateEntry(
            {
              jobId: item.job_id,
              latestJobPayload: item.raw || item,
              latestDocumentPayload: latestDocumentPayload,
              isPolling: false,
              timedOut: false,
              lastPollAt: null,
            },
            null
          );

          pollMeta[item.document_id] = { startedAt: Date.now() };
        });

        patchState({
          uploadJobState: nextUploadJobState,
          pendingDocuments: replaceDocuments(state.pendingDocuments, [tempDocument.document_id], uploadItems),
        });

        uploadItems.forEach(function (item) {
          if (item.job_id) {
            schedulePoll(item.document_id, 0);
          } else if (isReadyDocument(item)) {
            patchState({
              pendingDocuments: removeDocument(state.pendingDocuments, item.document_id),
              documents: upsertDocument(state.documents, item),
              documentIds: uniqueStrings(state.documentIds.concat(item.document_id)),
            });
          }
        });
      } catch (error) {
        if (error && (error.status === 401 || error.status === 403)) {
          authState = {
            checked: true,
            authenticated: false,
            missingConfig: authState.missingConfig,
          };
        }

        patchState({
          pendingDocuments: replaceDocuments(state.pendingDocuments, [tempDocument.document_id], [
            normalizeDocumentRecord(
              {
                document_id: tempDocument.document_id,
                file_name: tempDocument.file_name,
                status: "failed",
                error: extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Could not upload this PDF right now.",
              },
              tempDocument
            ),
          ]),
        });

        setNotice(
          buildUiNotice(error, {
            action: "document upload",
            endpoint: endpoint,
          })
        );
      }
    }

    async function uploadFiles(files) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const incomingFiles = Array.from(files || []);
      const validFiles = incomingFiles.filter(function (file) {
        return file && ((file.type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(file.name || ""));
      });

      if (!incomingFiles.length) return;

      if (!validFiles.length) {
        setNotice({
          title: "Only PDF files are supported",
          body: "Select one or more PDF files to upload into IDX.",
        });
        render();
        return;
      }

      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "document upload", endpoint: "" }));
        render();
        return;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      clearNotice();
      ui.uploadActiveCount += validFiles.length;
      render();

      for (const file of validFiles) {
        await uploadSingleFile(file);
      }

      ui.uploadActiveCount = Math.max(0, ui.uploadActiveCount - validFiles.length);
      render();
    }

    function toggleDocument(documentId) {
      const documentItem = state.documents.find(function (item) {
        return getDocumentId(item) === documentId;
      });

      if (!isReadyDocument(documentItem)) return;

      const nextDocumentIds = state.documentIds.includes(documentId)
        ? state.documentIds.filter(function (item) {
            return item !== documentId;
          })
        : state.documentIds.concat(documentId);

      patchState({
        documentIds: uniqueStrings(nextDocumentIds),
      });
    }

    function renderTranscript() {
      if (!elements.transcript) return;
      elements.transcript.innerHTML = "";

      if (!state.messages.length) {
        if (ui.bootstrapPending) {
          const loading = document.createElement("p");
          loading.className = "mdz-idx__empty-inline";
          loading.textContent = "Loading assistant…";
          elements.transcript.appendChild(loading);
        }
        return;
      }

      state.messages.forEach(function (message) {
        const article = document.createElement("article");
        article.className = "mdz-idx__message mdz-idx__message--" + message.role;

        const meta = document.createElement("div");
        meta.className = "mdz-idx__message-meta";
        meta.textContent = message.role === "user" ? "You" : "Assistant";

        const bubble = document.createElement("div");
        bubble.className = "mdz-idx__message-bubble";
        bubble.textContent = message.text;

        article.appendChild(meta);
        article.appendChild(bubble);
        elements.transcript.appendChild(article);
      });

      elements.transcript.scrollTop = elements.transcript.scrollHeight;
    }

    function renderStarterPrompts() {
      if (!elements.starterPrompts) return;
      elements.starterPrompts.innerHTML = "";

      const prompts = state.starterPrompts.filter(Boolean);
      if (elements.starterGroup) {
        elements.starterGroup.hidden = !prompts.length;
      }

      prompts.forEach(function (prompt) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mdz-idx__chip";
        button.textContent = prompt;
        button.addEventListener("click", function () {
          if (elements.input) {
            elements.input.value = prompt;
            render();
            focusComposer();
          }
        });
        elements.starterPrompts.appendChild(button);
      });
    }

    function renderActionChips() {
      if (!elements.nextActions) return;
      elements.nextActions.innerHTML = "";

      const actions = state.nextActions.filter(Boolean);
      if (elements.actionsGroup) {
        elements.actionsGroup.hidden = !actions.length;
      }

      actions.forEach(function (action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mdz-idx__chip";
        button.textContent = actionLabel(action);
        button.disabled = ui.chatPending || ui.bootstrapPending;
        button.addEventListener("click", function () {
          dispatchAction(action);
        });
        elements.nextActions.appendChild(button);
      });
    }

    function renderDocumentGroup(title, documents, options) {
      const group = document.createElement("section");
      group.className = "mdz-idx__document-group";

      const heading = document.createElement("h4");
      heading.className = "mdz-idx__document-group-title";
      heading.textContent = title;
      group.appendChild(heading);

      documents.forEach(function (documentItem) {
        const record = normalizeDocumentRecord(documentItem, documentItem);
        if (!record) return;

        const lifecycle = documentLifecycle(record);
        const isSelectable = !!(options && options.selectable) && lifecycle === "ready";
        const isSelected = lifecycle === "ready" && state.documentIds.includes(record.document_id);
        const card = document.createElement(isSelectable ? "button" : "div");

        if (isSelectable) {
          card.type = "button";
          card.setAttribute("aria-pressed", isSelected ? "true" : "false");
          card.addEventListener("click", function () {
            toggleDocument(record.document_id);
          });
        }

        card.className =
          "mdz-idx__document-card is-" + lifecycle + (isSelectable ? " is-selectable" : "") + (isSelected ? " is-active" : "");

        const top = document.createElement("div");
        top.className = "mdz-idx__document-top";

        const copy = document.createElement("div");
        copy.className = "mdz-idx__document-copy";

        const name = document.createElement("strong");
        name.className = "mdz-idx__document-title";
        name.textContent = record.file_name || record.document_id;

        const detail = document.createElement("p");
        detail.className = "mdz-idx__document-detail";
        detail.textContent = documentStatusDetail(record, isSelected);

        const badge = document.createElement("span");
        badge.className = "mdz-idx__document-badge is-" + lifecycle;
        badge.textContent = documentStatusLabel(record);

        copy.appendChild(name);
        copy.appendChild(detail);
        top.appendChild(copy);
        top.appendChild(badge);
        card.appendChild(top);

        const metaParts = ["document_id " + record.document_id];
        if (record.job_id) metaParts.push("job_id " + record.job_id);

        const meta = document.createElement("p");
        meta.className = "mdz-idx__document-meta";
        meta.textContent = metaParts.join(" | ");
        card.appendChild(meta);

        if (record.error) {
          const error = document.createElement("p");
          error.className = "mdz-idx__document-error";
          error.textContent = record.error;
          card.appendChild(error);
        }

        group.appendChild(card);
      });

      return group;
    }

    function renderDocumentContext() {
      if (!elements.documentContext) return;
      elements.documentContext.innerHTML = "";

      const pendingDocuments = normalizeDocumentList(state.pendingDocuments);
      const pendingIds = new Set(
        pendingDocuments.map(function (documentItem) {
          return documentItem.document_id;
        })
      );
      const scopedDocuments = normalizeDocumentList(state.documents).filter(function (documentItem) {
        return !pendingIds.has(documentItem.document_id);
      });

      if (!scopedDocuments.length && !pendingDocuments.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "No documents are currently in assistant scope.";
        elements.documentContext.appendChild(empty);
        return;
      }

      if (scopedDocuments.length) {
        elements.documentContext.appendChild(
          renderDocumentGroup("Documents in scope", scopedDocuments, {
            selectable: true,
          })
        );
      }

      if (pendingDocuments.length) {
        elements.documentContext.appendChild(
          renderDocumentGroup("Pending documents", pendingDocuments, {
            selectable: false,
          })
        );
      }
    }

    function renderReferences() {
      if (!elements.references) return;
      elements.references.innerHTML = "";

      state.references.forEach(function (reference) {
        const url = normalizeString(reference && (reference.url || reference.href || reference.link));
        if (!url) return;

        const link = document.createElement("a");
        link.className = "mdz-idx__reference";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        const title = document.createElement("strong");
        title.textContent = normalizeString(reference.title || reference.label || url) || url;
        link.appendChild(title);

        const source = normalizeString(reference.document_id || reference.kind || "");
        if (source) {
          const sourceEl = document.createElement("span");
          sourceEl.textContent = humanizeValue(source);
          link.appendChild(sourceEl);
        }

        const excerpt = normalizeString(reference.excerpt || reference.snippet || reference.description || "");
        if (excerpt) {
          const excerptEl = document.createElement("span");
          excerptEl.textContent = excerpt;
          link.appendChild(excerptEl);
        }

        elements.references.appendChild(link);
      });
    }

    function renderAuthGate() {
      if (!elements.authGate) return;

      const shouldShowGate = state.phase === "phase_2" && (!authState.checked || !authState.authenticated);
      elements.authGate.hidden = !shouldShowGate;

      if (!shouldShowGate) return;

      if (!authState.checked) {
        setText(elements.authGateTitle, "Checking sign-in");
        setText(elements.authGateCopy, "Verifying your current session before enabling assistant requests.");
      } else if (authState.missingConfig) {
        setText(elements.authGateTitle, "Sign-in unavailable");
        setText(elements.authGateCopy, "The site auth configuration is missing, so the assistant workspace cannot authenticate requests yet.");
      } else {
        setText(elements.authGateTitle, "Sign in required");
        setText(elements.authGateCopy, "Sign in with Google to use the assistant workspace.");
      }

      if (elements.authLogin) {
        elements.authLogin.hidden = !!authState.missingConfig;
        elements.authLogin.href = buildLoginHref();
      }
    }

    function renderNotice() {
      if (!elements.notice) return;
      const visible = !!(ui.notice && (ui.notice.title || ui.notice.body));
      elements.notice.hidden = !visible;
      if (!visible) return;
      setText(elements.noticeTitle, ui.notice.title);
      setText(elements.noticeCopy, ui.notice.body);
    }

    function renderScopeStatus() {
      if (!elements.scopeStatus) return;
      const status = normalizeString(state.scopeStatus).toLowerCase();
      const text = scopeBannerText(status);
      elements.scopeStatus.hidden = !text;
      elements.scopeStatus.className = "mdz-idx__scope-banner" + (status ? " is-" + status.replace(/_/g, "-") : "");
      setText(elements.scopeStatus, text);
    }

    function renderGuidancePanel() {
      if (!elements.guidancePanel) return;
      const hasStarters = !!(elements.starterGroup && !elements.starterGroup.hidden);
      const hasActions = !!(elements.actionsGroup && !elements.actionsGroup.hidden);
      elements.guidancePanel.hidden = !(hasStarters || hasActions);
    }

    function summarizeUploadStatus() {
      const pendingCount = normalizeDocumentList(state.pendingDocuments).length;
      const selectedCount = state.documentIds.length;

      if (ui.uploadActiveCount > 0) {
        return ui.uploadActiveCount === 1 ? "Uploading 1 file" : "Uploading " + ui.uploadActiveCount + " files";
      }
      if (pendingCount > 0) {
        return pendingCount === 1 ? "Tracking 1 pending document" : "Tracking " + pendingCount + " pending documents";
      }
      if (selectedCount > 0) {
        return selectedCount === 1 ? "1 document selected" : selectedCount + " documents selected";
      }
      return "";
    }

    function render() {
      const config = industryConfig();
      const showPhase2 = state.phase === "phase_2" && !!normalizeIndustry(state.selectedIndustry);
      const authBlocked = !authState.checked || !authState.authenticated || !!authState.missingConfig;

      if (elements.phase1) elements.phase1.hidden = showPhase2;
      if (elements.phase2) elements.phase2.hidden = !showPhase2;

      if (config) {
        setText(elements.title, config.title + " Assistant");
        setText(elements.copy, config.copy);
      } else {
        setText(elements.title, "Assistant Workspace");
        setText(elements.copy, "");
      }

      renderAuthGate();
      renderNotice();
      renderScopeStatus();
      renderTranscript();
      renderStarterPrompts();
      renderActionChips();
      renderGuidancePanel();
      renderDocumentContext();
      renderReferences();

      if (elements.sendButton) {
        const inputValue = normalizeString(elements.input && elements.input.value);
        elements.sendButton.disabled = !showPhase2 || !inputValue || authBlocked || ui.chatPending || ui.bootstrapPending;
      }

      if (elements.input) {
        elements.input.disabled = !showPhase2 || authBlocked || ui.chatPending || ui.bootstrapPending;
      }

      elements.uploadButtons.forEach(function (button) {
        button.disabled = !showPhase2 || authBlocked || ui.bootstrapPending;
        button.classList.toggle("mdz-idx__upload-primary", showPhase2 && !state.documentIds.length);
      });

      if (elements.sendStatus) {
        if (ui.bootstrapPending) {
          setText(elements.sendStatus, "Connecting to assistant…");
        } else if (ui.chatPending) {
          setText(elements.sendStatus, "Sending to assistant…");
        } else {
          setText(elements.sendStatus, "");
        }
      }

      if (elements.uploadStatus) {
        setText(elements.uploadStatus, summarizeUploadStatus());
      }
    }

    elements.cards.forEach(function (card) {
      const industry = card.getAttribute("data-idx-enter-industry");

      card.addEventListener("click", function () {
        enterIndustry(industry);
      });

      card.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          enterIndustry(industry);
        }
      });
    });

    if (elements.backButton) {
      elements.backButton.addEventListener("click", function () {
        returnToPhase1();
      });
    }

    if (elements.form) {
      elements.form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (!elements.input) return;
        if (!normalizeString(elements.input.value) || !canSend()) return;

        sendAssistantRequest(
          {
            message: elements.input.value,
          },
          {
            appendUser: true,
            clearComposerOnSuccess: true,
            restoreComposerOnFailure: true,
          }
        );
      });
    }

    if (elements.input) {
      elements.input.addEventListener("input", render);
      elements.input.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          if (!normalizeString(elements.input.value) || !canSend()) return;

          sendAssistantRequest(
            {
              message: elements.input.value,
            },
            {
              appendUser: true,
              clearComposerOnSuccess: true,
              restoreComposerOnFailure: true,
            }
          );
        }
      });
    }

    elements.uploadButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (elements.fileInput) {
          elements.fileInput.click();
        }
      });
    });

    if (elements.fileInput) {
      elements.fileInput.addEventListener("change", function (event) {
        const files = Array.from((event.target && event.target.files) || []);
        uploadFiles(files).finally(function () {
          elements.fileInput.value = "";
        });
      });
    }

    const deepLinkedIndustry = normalizeIndustry(new URL(window.location.href).searchParams.get("industry"));
    if (deepLinkedIndustry) {
      enterIndustry(deepLinkedIndustry, { skipFocus: false });
    } else {
      render();
    }

    refreshAuth(false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-idx-assistant]").forEach(initAssistant);
  });
})();
