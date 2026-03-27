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

  function normalizeIndustry(value) {
    const key = normalizeString(value);
    return Object.prototype.hasOwnProperty.call(INDUSTRIES, key) ? key : null;
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

    const auth = window.MdzAuth;
    if (auth && auth.getApiBaseUrl) {
      return normalizeString(auth.getApiBaseUrl()).replace(/\/+$/, "");
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

  function normalizeDocument(value) {
    const id = getDocumentId(value);
    if (!id) return null;

    if (typeof value === "string") {
      return {
        id: id,
        title: id,
        status: "",
        ocrStatus: "",
      };
    }

    return {
      id: id,
      title: normalizeString(value.title || value.name || value.filename || value.file_name || id) || id,
      status: normalizeString(value.status || ""),
      ocrStatus: normalizeString(value.ocr_status || value.ocrStatus || ""),
      raw: value,
    };
  }

  function mergeDocuments(existingDocuments, incomingDocuments, incomingDocumentIds) {
    const byId = new Map();

    (existingDocuments || []).forEach(function (item) {
      const normalized = normalizeDocument(item);
      if (normalized) byId.set(normalized.id, normalized);
    });

    (incomingDocuments || []).forEach(function (item) {
      const normalized = normalizeDocument(item);
      if (normalized) {
        const previous = byId.get(normalized.id) || {};
        byId.set(normalized.id, Object.assign({}, previous, normalized));
      }
    });

    uniqueStrings((incomingDocumentIds || []).map(getDocumentId)).forEach(function (id) {
      if (!byId.has(id)) {
        byId.set(id, {
          id: id,
          title: id,
          status: "",
          ocrStatus: "",
        });
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

    function setState(next) {
      state = next;
      render();
    }

    function patchState(patch) {
      setState(Object.assign({}, state, patch));
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

      setIndustryQuery(normalized);
      setState(resetAssistantState(normalized));
      if (!(options && options.skipFocus)) focusComposer();
    }

    function returnToPhase1() {
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

    async function sendChatMessage(message, overrides) {
      const text = normalizeString(message);
      const endpoint = buildIdxUrl("/idx/assistant/chat");

      if (!text || !canSend() || !endpoint) return;

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

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
        if (error && (error.status === 401 || error.status === 403)) {
          authState = {
            checked: true,
            authenticated: false,
            missingConfig: authState.missingConfig,
          };
          patchState({
            isSending: false,
          });
          return;
        }

        patchState({
          messages: nextMessages.concat(createMessage("assistant", "Sorry, something went wrong. Please try again.")),
          isSending: false,
        });
      }
    }

    async function pollDocument(documentId) {
      const endpoint = buildIdxUrl("/idx/documents/" + encodeURIComponent(documentId));
      const deadline = Date.now() + POLL_TIMEOUT_MS;

      while (Date.now() < deadline) {
        const response = await fetchJson(endpoint, { method: "GET" });
        const documentData = normalizeDocument(response) || normalizeDocument({ document_id: documentId });
        const status = normalizeStatus(documentData.status);
        const ocrStatus = normalizeStatus(documentData.ocrStatus);

        if (status === READY_STATUS && ocrStatus === READY_STATUS) {
          return documentData;
        }

        if (TERMINAL_FAILURE_STATUSES.has(status) || TERMINAL_FAILURE_STATUSES.has(ocrStatus)) {
          throw new Error("Document processing failed.");
        }

        await delay(POLL_INTERVAL_MS);
      }

      throw new Error("Timed out waiting for the uploaded document to finish processing.");
    }

    async function uploadFiles(files) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const validFiles = (files || []).filter(function (file) {
        return file && ((file.type || "").toLowerCase() === "application/pdf" || /\.pdf$/i.test(file.name || ""));
      });

      if (!validFiles.length || !endpoint || state.isUploading) return;

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      patchState({
        isUploading: true,
        uploadError: "",
      });

      try {
        const uploadedDocuments = [];

        for (const file of validFiles) {
          const formData = new FormData();
          formData.append("file", file, file.name);

          const uploadResponse = await fetchJson(endpoint, {
            method: "POST",
            body: formData,
            headers: {},
          });

          const uploadIds = uniqueStrings(
            []
              .concat(
                getDocumentId(uploadResponse.document_id),
                getDocumentId(uploadResponse.id),
                Array.isArray(uploadResponse.document_ids) ? uploadResponse.document_ids.map(getDocumentId) : [],
                Array.isArray(uploadResponse.documents) ? uploadResponse.documents.map(getDocumentId) : []
              )
              .filter(Boolean)
          );

          if (!uploadIds.length) {
            throw new Error("Upload completed without a document identifier.");
          }

          for (const documentId of uploadIds) {
            uploadedDocuments.push(await pollDocument(documentId));
          }
        }

        const mergedDocuments = mergeDocuments(state.documents, uploadedDocuments, uploadedDocuments.map(function (item) {
          return item.id;
        }));
        const mergedDocumentIds = uniqueStrings(state.documentIds.concat(uploadedDocuments.map(function (item) {
          return item.id;
        })));

        patchState({
          documents: mergedDocuments,
          documentIds: mergedDocumentIds,
          isUploading: false,
          uploadError: "",
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
          isUploading: false,
          uploadError: (error && error.message) || "Could not upload documents right now.",
        });
      }
    }

    function toggleDocument(documentId) {
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

    async function dispatchAction(action) {
      const kind = actionKind(action);
      const payload = actionPayload(action);

      if (!kind) return;

      if (kind === "prompt") {
        const prompt = normalizeString(payload.prompt || payload.text || payload.message || "");
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
        emptyState.className = "mdz-idx__empty";
        emptyState.textContent = "Pick a starter prompt, upload a PDF, or ask a question to start the assistant workspace.";
        elements.transcript.appendChild(emptyState);
        return;
      }

      state.messages.forEach(function (message) {
        const messageEl = document.createElement("div");
        messageEl.className = "demo-chat__msg" + (message.role === "user" ? " demo-chat__msg--user" : "");

        const bubbleEl = document.createElement("div");
        bubbleEl.className = "demo-chat__bubble";
        bubbleEl.textContent = message.text;

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
        const button = document.createElement("button");
        button.type = "button";
        button.className = "mdz-idx__doc-chip" + (state.documentIds.includes(documentItem.id) ? " is-active" : "");
        button.textContent = documentItem.title;
        button.setAttribute("aria-pressed", state.documentIds.includes(documentItem.id) ? "true" : "false");
        button.addEventListener("click", function () {
          toggleDocument(documentItem.id);
        });
        elements.documentContext.appendChild(button);
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

    function render() {
      const config = industryConfig();
      const showPhase2 = state.phase === "phase_2" && !!config;

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
      renderTranscript();
      renderPromptChips();
      renderActionChips();
      renderDocumentContext();
      renderReferences();

      if (elements.sendButton) {
        const inputValue = normalizeString(elements.input && elements.input.value);
        elements.sendButton.disabled = !showPhase2 || !inputValue || state.isSending || !authState.authenticated;
      }

      if (elements.uploadButtons.length) {
        elements.uploadButtons.forEach(function (button) {
          button.disabled = !showPhase2 || state.isUploading || !authState.authenticated;
          button.classList.toggle("mdz-idx__upload-primary", !state.documentIds.length);
        });
      }

      if (elements.input) {
        elements.input.disabled = !showPhase2 || state.isSending;
      }

      setText(elements.sendStatus, state.isSending ? "Sending prompt..." : "");

      if (elements.uploadStatus) {
        setText(elements.uploadStatus, state.isUploading ? "Uploading and polling..." : state.documentIds.length ? state.documentIds.length + " document(s) selected" : "");
      }

      if (elements.uploadError) {
        const hasError = !!normalizeString(state.uploadError);
        elements.uploadError.hidden = !hasError;
        setText(elements.uploadError, state.uploadError);
      }

      if (elements.summarizeSelected) {
        const hasSelectedDocuments = state.documentIds.length > 0;
        elements.summarizeSelected.hidden = !hasSelectedDocuments;
        elements.summarizeSelected.disabled = !showPhase2 || !hasSelectedDocuments || state.isSending;
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
