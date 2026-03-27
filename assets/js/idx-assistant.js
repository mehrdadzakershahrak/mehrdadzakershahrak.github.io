(function () {
  const INDUSTRIES = {
    legal: {
      label: "Legal",
      title: "Legal AI",
      copy: "Summaries, drafting support, and document Q&A workflows.",
      starterPrompts: [
        "Summarize this clause in plain English and list potential risks: ...",
        "Create a checklist of issues to review in this contract: ...",
        "Extract dates, parties, and obligations from: ...",
      ],
    },
    finance: {
      label: "Finance",
      title: "Finance AI",
      copy: "Analysis helpers, narrative summaries, and checklist-style guidance.",
      starterPrompts: [
        "Turn these notes into an investment memo: ...",
        "Summarize these earnings highlights and risks: ...",
        "List questions I should ask before making a decision about: ...",
      ],
    },
    healthcare: {
      label: "Healthcare",
      title: "Healthcare AI",
      copy: "Intake summaries, care-plan drafts, and administrative workflow support.",
      starterPrompts: [
        "Summarize this visit note and list follow-up questions: ...",
        "Draft a patient-friendly explanation for these findings: ...",
        "Generate a discharge checklist from this context: ...",
      ],
    },
    procurement: {
      label: "Procurement",
      title: "Procurement AI",
      copy: "RFP summaries, vendor comparison, and sourcing checklist workflows.",
      starterPrompts: [
        "Summarize this RFP and extract requirements, deadlines, and evaluation criteria: ...",
        "Compare these vendor responses and identify major gaps, risks, and follow-up questions: ...",
        "Create a sourcing checklist and next-step plan for this procurement request: ...",
      ],
    },
    "real-estate": {
      label: "Real Estate",
      title: "Real Estate AI",
      copy: "Listing insights, comps reasoning, and deal memo generation.",
      starterPrompts: [
        "Create a due diligence checklist for buying a small multifamily property in Chicago.",
        "Turn these property notes into a deal memo: ...",
        "Summarize this listing and extract red flags: ...",
      ],
    },
  };

  const READY_STATUS = "ready";
  const POLL_INTERVAL_MS = 2000;
  const POLL_TIMEOUT_MS = 120000;
  const TERMINAL_FAILURE_STATUSES = new Set(["error", "failed", "cancelled", "canceled"]);

  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function currentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function currentOrigin() {
    return window.location.origin.replace(/\/+$/, "");
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = value || "";
  }

  function normalizeString(value) {
    return typeof value === "string" ? value.trim() : "";
  }

  function extractErrorMessage(value) {
    if (typeof value === "string") return normalizeString(value);
    if (!value || typeof value !== "object") return "";
    return normalizeString(value.message || value.error || value.detail || value.reason || "");
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

  function buildRuntimeIssue(error, options) {
    const endpoint = normalizeString(options && options.endpoint);
    const action = normalizeString((options && options.action) || "request");
    const endpointOrigin = urlOrigin(endpoint);
    const message = extractErrorMessage(error) || normalizeString(error && error.message);

    if (!endpoint) {
      return {
        title: "IDX API is not configured",
        body: "This workspace does not have a valid IDX API base URL yet, so browser requests cannot be sent.",
        message: "The assistant workspace is missing its IDX API configuration.",
        emphasize: true,
      };
    }

    if (error && (error.status === 401 || error.status === 403)) {
      return {
        title: "IDX session is not available",
        body:
          (endpointOrigin ? endpointOrigin + " rejected the browser request." : "The IDX API rejected the browser request.") +
          " Sign in again, then verify that the IDX domain can read the same session.",
        message: "The IDX API rejected this request. Sign in again and retry.",
        emphasize: true,
      };
    }

    if (error && error.status === 404) {
      return {
        title: "IDX route was not found",
        body:
          "The website reached " +
          endpoint +
          ", but that route returned 404. The IDX host is reachable, but the expected endpoint is not available there.",
        message: "The configured IDX route for " + action + " is not available right now.",
        emphasize: true,
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
        message: "The browser could not complete this IDX request because the API is blocked from this website.",
        emphasize: true,
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
        message: "The IDX service returned a server error while handling this request.",
        emphasize: true,
      };
    }

    return {
      title: "Request could not be completed",
      body: message || "The request did not complete successfully.",
      message: message || "The request did not complete successfully.",
      emphasize: false,
    };
  }

  function createInitialState() {
    return {
      phase: "phase_1",
      selectedIndustry: "general",
      sessionId: null,
      messages: [],
      references: [],
      nextActions: [],
      starterPrompts: [],
      documentIds: [],
      workspaceId: null,
      documents: [],
      isSending: false,
      isUploading: false,
      uploadError: "",
    };
  }

  function getBootstrapStarterPrompts(industry) {
    const config = INDUSTRIES[industry];
    return config ? config.starterPrompts.slice() : [];
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
      const error = new Error((data && (data.error || data.message)) || "Request failed.");
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data || {};
  }

  async function postJson(url, payload) {
    return fetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function getDocumentId(value) {
    if (!value) return "";
    if (typeof value === "string") return normalizeString(value);
    if (typeof value === "object") {
      if (value.document && typeof value.document === "object") {
        return getDocumentId(value.document) || normalizeString(value.document_id || value.id || "");
      }
      return normalizeString(value.document_id || value.id || "");
    }
    return "";
  }

  function uniqueStrings(values) {
    const seen = new Set();
    const result = [];

    (values || []).forEach(function (value) {
      const normalized = normalizeString(value);
      if (!normalized || seen.has(normalized)) return;
      seen.add(normalized);
      result.push(normalized);
    });

    return result;
  }

  function normalizeDocument(value, fallback) {
    const fallbackValue = fallback && typeof fallback === "object" ? fallback : {};
    const raw = unwrapDocumentPayload(value);
    const id = getDocumentId(raw) || getDocumentId(fallbackValue);
    if (!id) return null;

    const normalized = {
      id: id,
      title:
        normalizeString(
          (raw && (raw.title || raw.name || raw.filename || raw.file_name || raw.original_filename)) ||
            fallbackValue.title ||
            fallbackValue.fileName ||
            id
        ) || id,
      status: normalizeString((raw && (raw.document_status || raw.status)) || fallbackValue.status || ""),
      jobStatus: normalizeString(
        (raw && (raw.job_status || raw.jobStatus || (raw.document_status ? raw.status : ""))) || fallbackValue.jobStatus || ""
      ),
      ocrStatus: normalizeString((raw && (raw.ocr_status || raw.ocrStatus)) || fallbackValue.ocrStatus || ""),
      indexStatus: normalizeString((raw && (raw.index_status || raw.indexStatus)) || fallbackValue.indexStatus || ""),
      lifecycle: normalizeString((raw && raw.lifecycle) || fallbackValue.lifecycle || ""),
      error:
        extractErrorMessage(raw && (raw.error || (raw.result && raw.result.error) || raw.message)) ||
        normalizeString(fallbackValue.error || ""),
      fileName:
        normalizeString(
          (raw && (raw.filename || raw.file_name || raw.original_filename || raw.name)) || fallbackValue.fileName || ""
        ) || "",
      raw: raw || fallbackValue.raw || value || null,
    };

    normalized.lifecycle = normalized.lifecycle || resolveDocumentLifecycle(normalized);
    return normalized;
  }

  function unwrapDocumentPayload(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    if (!(value.document && typeof value.document === "object")) return value;

    return Object.assign({}, value, value.document, {
      document_id: getDocumentId(value.document) || value.document_id || value.id || "",
    });
  }

  function mergeDocuments(existingDocuments, incomingDocuments, incomingDocumentIds) {
    const byId = new Map();

    (existingDocuments || []).forEach(function (item) {
      const normalized = normalizeDocument(item, item);
      if (normalized) byId.set(normalized.id, normalized);
    });

    (incomingDocuments || []).forEach(function (item) {
      const normalized = normalizeDocument(item, item);
      if (normalized) {
        const previous = byId.get(normalized.id) || {};
        byId.set(normalized.id, Object.assign({}, previous, normalized));
      }
    });

    uniqueStrings((incomingDocumentIds || []).map(getDocumentId)).forEach(function (id) {
      if (!byId.has(id)) {
        byId.set(
          id,
          normalizeDocument(
            {
              id: id,
              title: id,
              status: "processing",
              ocr_status: "pending",
            },
            {
              lifecycle: "processing",
            }
          )
        );
      }
    });

    return Array.from(byId.values());
  }

  function normalizePrompts(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function normalizeReferences(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function normalizeActions(values) {
    return Array.isArray(values) ? values.filter(Boolean) : [];
  }

  function normalizeMessageText(value) {
    if (value == null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return String(value.message || value.text || value.content || "").trim();
    }
    return String(value);
  }

  function createMessage(role, text) {
    return {
      id: String(Date.now()) + Math.random().toString(16).slice(2),
      role: role,
      text: text,
    };
  }

  function promptLabel(prompt) {
    if (typeof prompt === "string") return prompt;
    return normalizeString(prompt.label || prompt.title || prompt.prompt || prompt.text || prompt.message || "");
  }

  function promptValue(prompt) {
    if (typeof prompt === "string") return prompt;
    return normalizeString(prompt.prompt || prompt.text || prompt.message || prompt.label || prompt.title || "");
  }

  function actionKind(action) {
    return normalizeString(action && (action.kind || action.type || ""));
  }

  function actionPayload(action) {
    if (!action || typeof action !== "object") return {};
    return action.payload && typeof action.payload === "object" ? action.payload : {};
  }

  function actionLabel(action) {
    const payload = actionPayload(action);
    return normalizeString(action && (action.label || action.title || payload.label || payload.title || actionKind(action))) || "Action";
  }

  function referenceUrl(reference) {
    if (!reference) return "";
    if (typeof reference === "string") return normalizeString(reference);
    return normalizeString(reference.url || reference.href || reference.link || "");
  }

  function referenceTitle(reference) {
    if (!reference) return "";
    if (typeof reference === "string") return normalizeString(reference);
    return normalizeString(reference.title || reference.label || reference.name || referenceUrl(reference));
  }

  function referenceMeta(reference) {
    if (!reference || typeof reference !== "object") return "";
    return normalizeString(reference.snippet || reference.description || reference.source || "");
  }

  function normalizeStatus(value) {
    return normalizeString(value).toLowerCase();
  }

  function isDevelopmentEnvironment() {
    const hostname = window.location.hostname || "";
    return hostname === "127.0.0.1" || hostname === "localhost" || /\.local$/.test(hostname);
  }

  function logNormalizationIssue(label, payload) {
    if (!isDevelopmentEnvironment()) return;
    console.warn("[idx-assistant] " + label, payload);
  }

  function humanizeValue(value) {
    const text = normalizeString(value).replace(/[-_]+/g, " ");
    if (!text) return "";
    return text.replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }

  function resolveDocumentLifecycle(documentItem) {
    const status = normalizeStatus(documentItem && documentItem.status);
    const jobStatus = normalizeStatus(documentItem && documentItem.jobStatus);
    const ocrStatus = normalizeStatus(documentItem && documentItem.ocrStatus);
    const indexStatus = normalizeStatus(documentItem && documentItem.indexStatus);
    const error = normalizeString(documentItem && documentItem.error);

    if (
      error ||
      TERMINAL_FAILURE_STATUSES.has(status) ||
      TERMINAL_FAILURE_STATUSES.has(jobStatus) ||
      TERMINAL_FAILURE_STATUSES.has(ocrStatus) ||
      TERMINAL_FAILURE_STATUSES.has(indexStatus)
    ) {
      return "failed";
    }

    if (status === READY_STATUS && ocrStatus === READY_STATUS && indexStatus === READY_STATUS) {
      return "ready";
    }

    if (status === "uploading" || jobStatus === "uploading") {
      return "uploading";
    }

    return "processing";
  }

  function isReadyDocument(documentItem) {
    return resolveDocumentLifecycle(documentItem) === "ready";
  }

  function createPendingDocument(file) {
    const title = normalizeString(file && file.name) || "Untitled PDF";
    return normalizeDocument(
      {
        id: "local-upload-" + String(Date.now()) + "-" + Math.random().toString(16).slice(2),
        title: title,
        status: "uploading",
        ocr_status: "pending",
        index_status: "pending",
      },
      {
        title: title,
        fileName: title,
        lifecycle: "uploading",
      }
    );
  }

  function replaceDocuments(existingDocuments, matchIds, replacements) {
    const matchSet = new Set(uniqueStrings(matchIds || []));
    const next = [];
    let inserted = false;

    (existingDocuments || []).forEach(function (item) {
      if (matchSet.has(item.id)) {
        if (!inserted) {
          (replacements || []).forEach(function (replacement) {
            const normalized = normalizeDocument(replacement, replacement);
            if (normalized) next.push(normalized);
          });
          inserted = true;
        }
        return;
      }

      next.push(item);
    });

    if (!inserted) {
      (replacements || []).forEach(function (replacement) {
        const normalized = normalizeDocument(replacement, replacement);
        if (normalized) next.unshift(normalized);
      });
    }

    return next;
  }

  function upsertDocument(existingDocuments, documentItem, matchIds) {
    const normalized = normalizeDocument(documentItem, documentItem);
    if (!normalized) return existingDocuments || [];
    return replaceDocuments(existingDocuments, uniqueStrings([normalized.id].concat(matchIds || [])), [normalized]);
  }

  function extractUploadDocumentRecords(response, file) {
    const raw = response && typeof response === "object" ? response : {};
    const fallbackTitle = normalizeString(file && file.name) || "Uploaded PDF";
    const records = [];
    const seen = new Set();

    function pushRecord(value, fallback) {
      const normalized = normalizeDocument(
        value,
        Object.assign(
          {
            title: fallbackTitle,
            fileName: fallbackTitle,
            lifecycle: "processing",
            status: "processing",
            ocrStatus: "pending",
            indexStatus: "pending",
          },
          fallback || {}
        )
      );

      if (!normalized || seen.has(normalized.id)) return;
      seen.add(normalized.id);
      records.push(
        normalizeDocument(
          Object.assign({}, normalized, {
            status: normalized.status || "processing",
            ocrStatus: normalized.ocrStatus || "pending",
            indexStatus: normalized.indexStatus || "pending",
            lifecycle: "processing",
            error: "",
          }),
          normalized
        )
      );
    }

    if (raw.document && typeof raw.document === "object") {
      pushRecord(raw.document);
    }

    if (Array.isArray(raw.documents)) {
      raw.documents.forEach(function (item) {
        pushRecord(item);
      });
    }

    if (Array.isArray(raw.items)) {
      raw.items.forEach(function (item) {
        pushRecord(item);
      });
    }

    pushRecord(raw);

    uniqueStrings(
      []
        .concat(getDocumentId(raw.document_id))
        .concat(getDocumentId(raw.id))
        .concat(Array.isArray(raw.document_ids) ? raw.document_ids.map(getDocumentId) : [])
    ).forEach(function (id) {
      pushRecord({ id: id });
    });

    if (!records.length) {
      logNormalizationIssue("Upload response could not be normalized into document records.", response);
    }

    return records;
  }

  function summarizeUploadStatus(documents, selectedDocumentIds, isUploading) {
    const counts = {
      uploading: 0,
      processing: 0,
      ready: 0,
      failed: 0,
    };

    (documents || []).forEach(function (item) {
      const lifecycle = resolveDocumentLifecycle(item);
      if (Object.prototype.hasOwnProperty.call(counts, lifecycle)) {
        counts[lifecycle] += 1;
      }
    });

    if (counts.uploading > 0) {
      return counts.uploading === 1 ? "Uploading 1 file" : "Uploading " + counts.uploading + " files";
    }

    if (counts.processing > 0) {
      return counts.processing === 1 ? "Processing 1 document" : "Processing " + counts.processing + " documents";
    }

    if ((selectedDocumentIds || []).length > 0) {
      return selectedDocumentIds.length === 1 ? "1 document selected" : selectedDocumentIds.length + " documents selected";
    }

    if (counts.failed > 0 && !isUploading) {
      return counts.failed === 1 ? "1 upload failed" : counts.failed + " uploads failed";
    }

    return "";
  }

  function documentStatusLabel(documentItem) {
    const lifecycle = resolveDocumentLifecycle(documentItem);

    if (lifecycle === "uploading") {
      return "Uploading";
    }

    if (lifecycle === "processing") {
      const status = normalizeStatus(documentItem && documentItem.status);
      const ocrStatus = normalizeStatus(documentItem && documentItem.ocrStatus);
      const indexStatus = normalizeStatus(documentItem && documentItem.indexStatus);

      if (status === READY_STATUS && ocrStatus === READY_STATUS && indexStatus && indexStatus !== READY_STATUS) {
        return "Indexing";
      }

      if (status === READY_STATUS && ocrStatus && ocrStatus !== READY_STATUS) {
        return "OCR Processing";
      }

      return humanizeValue(indexStatus || status || ocrStatus || "processing") || "Processing";
    }

    if (lifecycle === "failed") {
      return "Failed";
    }

    return "Ready";
  }

  function documentStatusDetail(documentItem, isSelected) {
    const lifecycle = resolveDocumentLifecycle(documentItem);
    const status = normalizeStatus(documentItem && documentItem.status);
    const ocrStatus = normalizeStatus(documentItem && documentItem.ocrStatus);
    const indexStatus = normalizeStatus(documentItem && documentItem.indexStatus);

    if (lifecycle === "ready") {
      return isSelected ? "Active assistant context" : "Ready to include as context";
    }

    if (lifecycle === "failed") {
      return "This file is not available as assistant context.";
    }

    if (status === READY_STATUS && ocrStatus === READY_STATUS && indexStatus && indexStatus !== READY_STATUS) {
      return "Indexing this PDF for assistant context.";
    }

    if (status === READY_STATUS && ocrStatus && ocrStatus !== READY_STATUS) {
      return "Extracting text from this PDF for assistant context.";
    }

    return "Preparing this PDF for assistant context.";
  }

  function buildLoginHref(auth) {
    if (!auth || !auth.buildLoginUrl) return "/login/";
    return auth.buildLoginUrl(currentRelativeUrl());
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
      transcript: qs(root, "[data-idx-transcript]"),
      form: qs(root, "[data-idx-form]"),
      input: qs(root, "[data-idx-input]"),
      sendButton: qs(root, "[data-idx-send]"),
      uploadButtons: qsa(root, "[data-idx-upload-button], [data-idx-upload-entry]"),
      fileInput: qs(root, "[data-idx-file-input]"),
      starterPrompts: qs(root, "[data-idx-starter-prompts]"),
      nextActions: qs(root, "[data-idx-next-actions]"),
      documentContext: qs(root, "[data-idx-document-context]"),
      references: qs(root, "[data-idx-references]"),
      sendStatus: qs(root, "[data-idx-send-status]"),
      uploadStatus: qs(root, "[data-idx-upload-status]"),
      uploadError: qs(root, "[data-idx-upload-error]"),
      summarizeSelected: qs(root, "[data-idx-summarize-selected]"),
    };

    let state = createInitialState();
    let authState = {
      checked: false,
      authenticated: false,
      missingConfig: false,
    };
    let workspaceNotice = null;

    function setState(next) {
      state = next;
      render();
    }

    function patchState(patch) {
      setState(Object.assign({}, state, patch));
    }

    function setWorkspaceNotice(issue) {
      workspaceNotice = issue || null;
    }

    function industryConfig() {
      return INDUSTRIES[state.selectedIndustry] || null;
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

    function focusComposer() {
      if (!elements.input) return;
      window.requestAnimationFrame(function () {
        elements.input.focus();
      });
    }

    function resetAssistantState(industry) {
      return {
        phase: "phase_2",
        selectedIndustry: industry,
        sessionId: null,
        messages: [],
        references: [],
        nextActions: [],
        starterPrompts: getBootstrapStarterPrompts(industry),
        documentIds: [],
        workspaceId: null,
        documents: [],
        isSending: false,
        isUploading: false,
        uploadError: "",
      };
    }

    function enterIndustry(industry, options) {
      const normalized = normalizeIndustry(industry);
      if (!normalized) return;

      setWorkspaceNotice(null);
      setIndustryQuery(normalized);
      setState(resetAssistantState(normalized));
      if (!(options && options.skipFocus)) focusComposer();
    }

    function returnToPhase1() {
      setWorkspaceNotice(null);
      patchState({
        phase: "phase_1",
        selectedIndustry: "general",
      });
      setIndustryQuery("");
    }

    function canSend() {
      return state.phase === "phase_2" && state.selectedIndustry !== "general" && !state.isSending;
    }

    async function ensureAuthenticated() {
      const session = authState.checked ? authState : await refreshAuth(true);
      return !!session.authenticated;
    }

    function normalizePolledDocument(response, fallbackDocument) {
      const normalized = normalizeDocument(
        response,
        Object.assign(
          {
            id: fallbackDocument.id,
            title: fallbackDocument.title,
            fileName: fallbackDocument.fileName,
            status: fallbackDocument.status || "processing",
            ocrStatus: fallbackDocument.ocrStatus || "pending",
            indexStatus: fallbackDocument.indexStatus || "pending",
            lifecycle: "processing",
          },
          fallbackDocument || {}
        )
      );

      if (!normalized) {
        logNormalizationIssue("Poll response could not be normalized into a document record.", response);
        return null;
      }

      normalized.lifecycle = resolveDocumentLifecycle(normalized);
      return normalized;
    }

    async function sendChatMessage(message, overrides) {
      const text = normalizeString(message);
      const endpoint = buildIdxUrl("/idx/assistant/chat");

      if (!text || !canSend()) return;
      if (!endpoint) {
        setWorkspaceNotice(buildRuntimeIssue(null, { action: "assistant chat", endpoint: "" }));
        render();
        return;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      setWorkspaceNotice(null);
      const nextMessages = state.messages.concat(createMessage("user", text));
      patchState({
        messages: nextMessages,
        isSending: true,
      });

      if (elements.input && (!overrides || !overrides.preserveInput)) {
        elements.input.value = "";
      }

      const payload = {
        industry: state.selectedIndustry,
        message: text,
        document_ids: overrides && overrides.documentIds ? overrides.documentIds : state.documentIds,
        workspace_id: overrides && Object.prototype.hasOwnProperty.call(overrides, "workspaceId") ? overrides.workspaceId : state.workspaceId,
        session_id: overrides && Object.prototype.hasOwnProperty.call(overrides, "sessionId") ? overrides.sessionId : state.sessionId,
      };

      try {
        const response = await postJson(endpoint, payload);
        const assistantText = normalizeMessageText(response.message) || "No response.";
        const responseDocumentIds = uniqueStrings(
          (Array.isArray(response.document_ids) ? response.document_ids.map(getDocumentId) : []).concat(
            Array.isArray(response.documents) ? response.documents.map(getDocumentId) : []
          )
        );
        const mergedDocuments = mergeDocuments(state.documents, response.documents, responseDocumentIds);
        setWorkspaceNotice(null);

        patchState({
          phase: normalizeString(response.phase) === "phase_1" ? "phase_1" : "phase_2",
          sessionId: normalizeString(response.session_id) || state.sessionId,
          messages: nextMessages.concat(createMessage("assistant", assistantText)),
          references: normalizeReferences(response.references),
          nextActions: normalizeActions(response.next_actions),
          starterPrompts: normalizePrompts(response.starter_prompts),
          documentIds: uniqueStrings(responseDocumentIds),
          workspaceId: response.workspace_id == null ? null : response.workspace_id,
          documents: mergedDocuments,
          isSending: false,
          uploadError: "",
        });
      } catch (error) {
        const issue = buildRuntimeIssue(error, {
          action: "assistant chat",
          endpoint: endpoint,
        });
        if (error && (error.status === 401 || error.status === 403)) {
          authState = {
            checked: true,
            authenticated: false,
            missingConfig: authState.missingConfig,
          };
          setWorkspaceNotice(issue);
          if (elements.input && (!overrides || !overrides.preserveInput)) {
            elements.input.value = text;
          }
          patchState({
            isSending: false,
          });
          return;
        }

        setWorkspaceNotice(issue);
        if (elements.input && (!overrides || !overrides.preserveInput)) {
          elements.input.value = text;
        }
        patchState({
          messages: nextMessages.concat(createMessage("assistant", issue.message)),
          isSending: false,
        });
      }
    }

    async function pollDocument(documentItem, onProgress) {
      const fallbackDocument = normalizeDocument(documentItem, documentItem);
      const endpoint = buildIdxUrl("/idx/documents/" + encodeURIComponent(fallbackDocument.id));
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      while (Date.now() < deadline) {
        const response = await fetchJson(endpoint, { method: "GET" });
        const documentData = normalizePolledDocument(response, fallbackDocument);

        if (!documentData) {
          const malformed = new Error("Document processing returned an unreadable response.");
          malformed.document = normalizeDocument(
            Object.assign({}, fallbackDocument, {
              lifecycle: "failed",
              error: "Document processing returned an unreadable response.",
            }),
            fallbackDocument
          );
          throw malformed;
        }

        if (onProgress) {
          onProgress(documentData, response);
        }

        if (documentData.lifecycle === "ready") {
          return documentData;
        }

        if (documentData.lifecycle === "failed") {
          const failure = new Error(documentData.error || "Document processing failed.");
          failure.document = documentData;
          throw failure;
        }

        await delay(POLL_INTERVAL_MS);
      }

      const timeoutError = new Error("Timed out waiting for the uploaded document to finish processing.");
      timeoutError.document = normalizeDocument(
        Object.assign({}, fallbackDocument, {
          lifecycle: "failed",
          error: "Timed out waiting for the uploaded document to finish processing.",
        }),
        fallbackDocument
      );
      throw timeoutError;
    }

    async function uploadFiles(files) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const incomingFiles = Array.from(files || []);
      const validFiles = (files || []).filter(function (file) {
        return file && ((file.type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(file.name || ""));
      });

      if (!incomingFiles.length) return;

      if (!validFiles.length) {
        patchState({
          uploadError: "Only PDF files are supported.",
        });
        return;
      }

      if (!endpoint) {
        setWorkspaceNotice(buildRuntimeIssue(null, { action: "document upload", endpoint: "" }));
        patchState({
          uploadError: "The upload endpoint is not configured.",
        });
        return;
      }

      if (state.isUploading) return;

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      setWorkspaceNotice(null);
      patchState({
        isUploading: true,
        uploadError: "",
      });

      for (const file of validFiles) {
        const pendingDocument = createPendingDocument(file);
        patchState({
          documents: [pendingDocument].concat(state.documents),
        });

        try {
          const formData = new FormData();
          formData.append("files", file, file.name);

          const uploadResponse = await fetchJson(endpoint, {
            method: "POST",
            body: formData,
            headers: {},
          });

          const uploadDocuments = extractUploadDocumentRecords(uploadResponse, file);

          if (!uploadDocuments.length) {
            throw new Error("Upload completed but no document could be attached.");
          }

          patchState({
            documents: replaceDocuments(state.documents, [pendingDocument.id], uploadDocuments),
          });

          for (const uploadDocument of uploadDocuments) {
            try {
              const readyDocument = await pollDocument(uploadDocument, function (progressDocument) {
                patchState({
                  documents: upsertDocument(state.documents, progressDocument, [uploadDocument.id]),
                });
              });

              setWorkspaceNotice(null);
              patchState({
                documents: upsertDocument(
                  state.documents,
                  Object.assign({}, readyDocument, {
                    lifecycle: "ready",
                    error: "",
                  }),
                  [uploadDocument.id]
                ),
                documentIds: uniqueStrings(state.documentIds.concat(readyDocument.id)),
                uploadError: "",
              });
            } catch (pollError) {
              const issue = buildRuntimeIssue(pollError, {
                action: "document status check",
                endpoint: buildIdxUrl("/idx/documents/" + encodeURIComponent(uploadDocument.id)),
              });
              const failedDocument = normalizeDocument(
                (pollError && pollError.document) ||
                  Object.assign({}, uploadDocument, {
                    lifecycle: "failed",
                    error: issue.message || (pollError && pollError.message) || "Document processing failed.",
                  }),
                {
                  id: uploadDocument.id,
                  title: uploadDocument.title,
                  fileName: uploadDocument.fileName,
                  lifecycle: "failed",
                }
              );

              if (issue.emphasize) {
                setWorkspaceNotice(issue);
              }
              patchState({
                documents: upsertDocument(state.documents, failedDocument, [uploadDocument.id]),
                documentIds: state.documentIds.filter(function (id) {
                  return id !== uploadDocument.id;
                }),
                uploadError: failedDocument.error || "Document processing failed.",
              });
            }
          }
        } catch (error) {
          const issue = buildRuntimeIssue(error, {
            action: "document upload",
            endpoint: endpoint,
          });
          if (error && (error.status === 401 || error.status === 403)) {
            authState = {
              checked: true,
              authenticated: false,
              missingConfig: authState.missingConfig,
            };
          }

          if (issue.emphasize) {
            setWorkspaceNotice(issue);
          }
          const failedPendingDocument = normalizeDocument(
            Object.assign({}, pendingDocument, {
              lifecycle: "failed",
              status: "failed",
              ocrStatus: "failed",
              indexStatus: "failed",
              error: issue.message || (error && error.message) || "Could not upload this PDF right now.",
            }),
            pendingDocument
          );

          patchState({
            documents: replaceDocuments(state.documents, [pendingDocument.id], [failedPendingDocument]),
            uploadError: failedPendingDocument.error || "Could not upload this PDF right now.",
          });
        }
      }

      patchState({
        isUploading: false,
      });
    }

    function toggleDocument(documentId) {
      const documentItem = state.documents.find(function (item) {
        return item.id === documentId;
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

    function prefillComposer(text) {
      if (!elements.input) return;
      elements.input.value = text;
      render();
      focusComposer();
    }

    function actionRequestPayload(payload) {
      return payload && payload.request && typeof payload.request === "object" ? payload.request : null;
    }

    async function dispatchAction(action) {
      const kind = actionKind(action);
      const payload = actionPayload(action);
      const request = actionRequestPayload(payload);

      if (!kind) return;

      if (kind === "prompt") {
        const prompt = normalizeString(payload.prompt || payload.text || payload.message || (request && request.message) || "");
        if (prompt) prefillComposer(prompt);
        return;
      }

      if (kind === "upload") {
        if (elements.fileInput) elements.fileInput.click();
        return;
      }

      if (kind === "open_reference") {
        const url = normalizeString(payload.url || action.url || "");
        if (url) window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      if (kind === "run_tool") {
        const toolName = normalizeString(payload.tool_name || payload.tool || action.tool_name || action.name || "");

        if (request && normalizeString(request.message)) {
          await sendChatMessage(request.message, {
            documentIds: Array.isArray(request.document_ids) ? uniqueStrings(request.document_ids.map(getDocumentId)) : state.documentIds,
            workspaceId:
              Object.prototype.hasOwnProperty.call(request, "workspace_id") && request.workspace_id != null
                ? request.workspace_id
                : state.workspaceId,
          });
          return;
        }

        if (toolName === "run_summarize") {
          const requestedDocumentIds = Array.isArray(payload.document_ids)
            ? payload.document_ids.map(getDocumentId)
            : Array.isArray(payload.arguments && payload.arguments.document_ids)
              ? payload.arguments.document_ids.map(getDocumentId)
              : state.documentIds;
          const requestedWorkspaceId =
            payload.workspace_id ||
            (payload.arguments && payload.arguments.workspace_id) ||
            state.workspaceId ||
            null;

          await sendChatMessage("Summarize this document.", {
            documentIds: uniqueStrings(requestedDocumentIds),
            workspaceId: requestedWorkspaceId,
          });
        }
      }
    }

    function renderTranscript() {
      if (!elements.transcript) return;

      elements.transcript.innerHTML = "";

      if (!state.messages.length) {
        const emptyState = document.createElement("div");
        emptyState.className = "mdz-idx__empty mdz-idx__empty--transcript";

        const title = document.createElement("strong");
        title.textContent = state.documentIds.length ? "Ask about the selected documents" : "Start with a prompt or a PDF";
        emptyState.appendChild(title);

        const copy = document.createElement("p");
        copy.textContent = state.documentIds.length
          ? "Your selected PDFs are ready as assistant context. Ask a direct question, request a summary, or use a follow-up chip."
          : "Pick a starter prompt, upload a PDF, or ask a question to start the assistant workspace.";
        emptyState.appendChild(copy);

        elements.transcript.appendChild(emptyState);
        return;
      }

      state.messages.forEach(function (message) {
        const messageEl = document.createElement("article");
        messageEl.className = "mdz-idx__message mdz-idx__message--" + message.role;

        const metaEl = document.createElement("div");
        metaEl.className = "mdz-idx__message-meta";
        metaEl.textContent = message.role === "user" ? "You" : "Assistant";

        const bubbleEl = document.createElement("div");
        bubbleEl.className = "mdz-idx__message-bubble";
        bubbleEl.textContent = message.text;

        messageEl.appendChild(metaEl);
        messageEl.appendChild(bubbleEl);
        elements.transcript.appendChild(messageEl);
      });

      elements.transcript.scrollTop = elements.transcript.scrollHeight;
    }

    function renderPromptChips() {
      if (!elements.starterPrompts) return;

      elements.starterPrompts.innerHTML = "";

      if (!state.starterPrompts.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "Starter prompts will appear here.";
        elements.starterPrompts.appendChild(empty);
        return;
      }

      state.starterPrompts.forEach(function (prompt) {
        const text = promptValue(prompt);
        const label = promptLabel(prompt) || text;
        if (!text) return;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "mdz-idx__chip";
        button.textContent = label;
        button.addEventListener("click", function () {
          prefillComposer(text);
        });
        elements.starterPrompts.appendChild(button);
      });
    }

    function renderActionChips() {
      if (!elements.nextActions) return;

      elements.nextActions.innerHTML = "";

      if (!state.nextActions.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "The server can return follow-up actions here.";
        elements.nextActions.appendChild(empty);
        return;
      }

      state.nextActions.forEach(function (action) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mdz-idx__chip";
        button.textContent = actionLabel(action);
        button.disabled = state.isSending || state.isUploading;
        button.addEventListener("click", function () {
          dispatchAction(action);
        });
        elements.nextActions.appendChild(button);
      });
    }

    function renderDocumentContext() {
      if (!elements.documentContext) return;

      elements.documentContext.innerHTML = "";
      elements.documentContext.classList.toggle("mdz-idx__document-context--empty", !state.documents.length);

      if (!state.documents.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "No documents selected yet. Upload is the primary next step.";
        elements.documentContext.appendChild(empty);
        return;
      }

      state.documents.forEach(function (documentItem) {
        const normalized = normalizeDocument(documentItem, documentItem);
        const lifecycle = resolveDocumentLifecycle(normalized);
        const isSelected = lifecycle === "ready" && state.documentIds.includes(normalized.id);
        const isSelectable = lifecycle === "ready";
        const card = document.createElement(isSelectable ? "button" : "div");

        if (isSelectable) {
          card.type = "button";
          card.setAttribute("aria-pressed", isSelected ? "true" : "false");
          card.addEventListener("click", function () {
            toggleDocument(normalized.id);
          });
        }

        card.className =
          "mdz-idx__document-card is-" + lifecycle + (isSelected ? " is-active" : "") + (isSelectable ? " is-selectable" : "");

        const topRow = document.createElement("div");
        topRow.className = "mdz-idx__document-top";

        const copy = document.createElement("div");
        copy.className = "mdz-idx__document-copy";

        const title = document.createElement("strong");
        title.className = "mdz-idx__document-title";
        title.textContent = normalized.title;
        copy.appendChild(title);

        const detail = document.createElement("p");
        detail.className = "mdz-idx__document-detail";
        detail.textContent = documentStatusDetail(normalized, isSelected);
        copy.appendChild(detail);

        const badge = document.createElement("span");
        badge.className = "mdz-idx__document-badge is-" + lifecycle;
        badge.textContent = documentStatusLabel(normalized);

        topRow.appendChild(copy);
        topRow.appendChild(badge);
        card.appendChild(topRow);

        if (normalized.fileName && normalized.fileName !== normalized.title) {
          const fileMeta = document.createElement("p");
          fileMeta.className = "mdz-idx__document-meta";
          fileMeta.textContent = normalized.fileName;
          card.appendChild(fileMeta);
        }

        if (lifecycle === "failed" && normalized.error) {
          const error = document.createElement("p");
          error.className = "mdz-idx__document-error";
          error.textContent = normalized.error;
          card.appendChild(error);
        }

        elements.documentContext.appendChild(card);
      });
    }

    function renderReferences() {
      if (!elements.references) return;

      elements.references.innerHTML = "";

      if (!state.references.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "References returned by the assistant will appear here.";
        elements.references.appendChild(empty);
        return;
      }

      state.references.forEach(function (reference) {
        const url = referenceUrl(reference);
        if (!url) return;

        const item = document.createElement("a");
        item.className = "mdz-idx__reference";
        item.href = url;
        item.target = "_blank";
        item.rel = "noopener noreferrer";

        const title = document.createElement("strong");
        title.textContent = referenceTitle(reference);
        item.appendChild(title);

        const meta = referenceMeta(reference);
        if (meta) {
          const metaEl = document.createElement("span");
          metaEl.textContent = meta;
          item.appendChild(metaEl);
        }

        elements.references.appendChild(item);
      });

      if (!elements.references.children.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__empty-inline";
        empty.textContent = "References returned by the assistant will appear here.";
        elements.references.appendChild(empty);
      }
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
        setText(elements.authGateCopy, "Sign in with Google to send prompts or upload documents in the assistant workspace.");
      }

      if (elements.authLogin) {
        elements.authLogin.hidden = !!authState.missingConfig;
        elements.authLogin.href = buildLoginHref(auth);
      }
    }

    function renderNotice() {
      if (!elements.notice) return;

      const visible = !!(workspaceNotice && (workspaceNotice.title || workspaceNotice.body));
      elements.notice.hidden = !visible;
      if (!visible) return;

      setText(elements.noticeTitle, workspaceNotice.title);
      setText(elements.noticeCopy, workspaceNotice.body);
    }

    function render() {
      const config = industryConfig();
      const showPhase2 = state.phase === "phase_2" && !!config;
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
      renderTranscript();
      renderPromptChips();
      renderActionChips();
      renderDocumentContext();
      renderReferences();

      if (elements.sendButton) {
        const inputValue = normalizeString(elements.input && elements.input.value);
        elements.sendButton.disabled = !showPhase2 || !inputValue || state.isSending || authBlocked;
      }

      if (elements.uploadButtons.length) {
        elements.uploadButtons.forEach(function (button) {
          button.disabled = !showPhase2 || state.isUploading || authBlocked;
          button.classList.toggle("mdz-idx__upload-primary", !state.documentIds.length);
        });
      }

      if (elements.input) {
        elements.input.disabled = !showPhase2 || state.isSending || authBlocked;
      }

      setText(elements.sendStatus, state.isSending ? "Sending to assistant..." : "");

      if (elements.uploadStatus) {
        setText(elements.uploadStatus, summarizeUploadStatus(state.documents, state.documentIds, state.isUploading));
      }

      if (elements.uploadError) {
        const hasError = !!normalizeString(state.uploadError);
        elements.uploadError.hidden = !hasError;
        setText(elements.uploadError, state.uploadError);
      }

      if (elements.summarizeSelected) {
        const hasSelectedDocuments = state.documentIds.length > 0;
        elements.summarizeSelected.hidden = !hasSelectedDocuments;
        elements.summarizeSelected.disabled = !showPhase2 || !hasSelectedDocuments || state.isSending || authBlocked;
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
        sendChatMessage(elements.input && elements.input.value);
      });
    }

    if (elements.input) {
      elements.input.addEventListener("input", render);
      elements.input.addEventListener("keydown", function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
          event.preventDefault();
          sendChatMessage(elements.input.value);
        }
      });
    }

    elements.uploadButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (elements.fileInput) elements.fileInput.click();
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

    if (elements.summarizeSelected) {
      elements.summarizeSelected.addEventListener("click", function () {
        prefillComposer("Summarize this document.");
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
