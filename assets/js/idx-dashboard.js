(function () {
  const INDUSTRY_PRESETS = {
    general: {
      label: "All workflows",
      title: "Chat with uploaded PDFs across document-heavy workflows",
      intro:
        "IDX is useful when the work starts with a document, not a blank chat box. Upload a focused set of PDFs, ask practical questions once the files are ready, and keep the source page attached to every answer.",
      documents_title: "Good documents to upload",
      documents: [
        "Contracts, policy manuals, diligence files, filings, vendor packets, and similar PDFs tied to one workflow.",
        "Document sets where the answer may be spread across exhibits, appendices, attachments, or supporting files.",
        "Source files that need faster review without losing page-level traceability.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "What deadlines, obligations, or exceptions are mentioned across these documents? Include the source pages.",
        "Summarize the parts of this PDF set that affect the decision I need to make today, with citations.",
        "Compare these documents and show where the terms, numbers, or requirements do not match.",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "The value is not just speed. IDX turns a PDF set into searchable working context so answers can be checked against the original page before they are shared, escalated, or used in a decision.",
    },
    legal: {
      label: "Legal AI",
      title: "Legal document review with uploaded PDFs",
      intro:
        "Upload contracts and related PDFs when you need faster clause review without losing the exact language on the page. IDX helps legal teams ask focused questions across agreements, exhibits, and policy files, then verify the answer against the cited source before sharing it.",
      documents_title: "Good documents to upload",
      documents: [
        "MSAs, NDAs, order forms, statements of work, policy documents, and exhibit packs.",
        "Diligence files that combine core agreements with amendments, schedules, and supporting attachments.",
        "Internal policy or compliance PDFs that need clause-level comparison against contract language.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "What renewal dates, notice periods, and termination triggers appear in these agreements? Include the source pages.",
        "Show me the liability caps, indemnity language, and any carve-outs across this document set.",
        "Which required clauses are missing or inconsistent between the MSA, SOW, and order form?",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "Legal review depends on exact wording. Source-backed answers help teams move faster on first-pass analysis while keeping the clause and page reference visible for review.",
    },
    finance: {
      label: "Finance AI",
      title: "Finance document review with uploaded PDFs",
      intro:
        "Use IDX when the answer is buried in filings, reporting packs, lender materials, or investment memos. It helps finance teams pull fast answers from uploaded PDFs while keeping the supporting page attached to the result.",
      documents_title: "Good documents to upload",
      documents: [
        "10-Ks, 10-Qs, board decks, investment committee memos, and quarterly reporting packs.",
        "Lender packages, covenant schedules, audit support PDFs, and supporting reference documents.",
        "Mixed document sets where narrative, numbers, and footnotes need to be checked together.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "What risks, covenant terms, or liquidity constraints are mentioned in these PDFs? Cite the source pages.",
        "Where do the revenue, margin, or cash-flow assumptions change between the board deck and the memo?",
        "Find the passages that support this number and show me the original page references.",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "Finance workflows need traceable support, not just a summary. IDX helps tie each answer back to the source file so teams can validate numbers and narrative before they circulate.",
    },
    healthcare: {
      label: "Healthcare AI",
      title: "Healthcare administrative review with uploaded PDFs",
      intro:
        "Healthcare administrative work often involves intake packets, policies, consent forms, and care-related PDFs that must be reviewed carefully. IDX helps teams ask document-specific questions and keep the answer tied to the original page for administrative review.",
      documents_title: "Good documents to upload",
      documents: [
        "Intake packets, payer forms, consent documents, and administrative policy binders.",
        "Care-plan paperwork, discharge instructions, and supporting PDFs used in administrative handoffs.",
        "Document sets where missing fields, required forms, or policy requirements need to be checked quickly.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "Which required fields, signatures, or attachments are missing from these intake or consent PDFs?",
        "What does this policy packet say about the documentation required for this administrative workflow?",
        "Show me the source passages that answer this operational question so I can review the underlying page.",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "In healthcare operations, answers need to stay grounded in the document set. IDX helps teams review faster while keeping citations visible for administrative confirmation.",
    },
    procurement: {
      label: "Procurement AI",
      title: "Procurement review with uploaded PDFs",
      intro:
        "Procurement work is full of RFQs, vendor submissions, statements of work, and pricing sheets that need side-by-side review. IDX helps teams upload the document set, ask targeted questions, and trace every answer back to the source page.",
      documents_title: "Good documents to upload",
      documents: [
        "RFPs, RFQs, vendor proposals, statements of work, and requirements matrices.",
        "Pricing attachments, compliance documents, and supporting vendor response PDFs.",
        "Procurement packets where deadlines, deliverables, and non-compliance risks need to be compared quickly.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "What submission deadlines, mandatory requirements, and evaluation criteria appear across these procurement PDFs?",
        "Which vendor response items look non-compliant, incomplete, or unsupported by the requested document?",
        "Compare the pricing sheets and statements of work and show where the terms or deliverables differ.",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "Procurement decisions depend on comparing source material quickly and defensibly. Source-backed answers help teams move faster while preserving the document trail behind each finding.",
    },
    "real-estate": {
      label: "Real Estate AI",
      title: "Real estate document review with uploaded PDFs",
      intro:
        "Real estate review often spans leases, diligence reports, listing packets, and operating documents. IDX helps you ask focused questions across the uploaded PDFs and jump back to the cited page before the answer moves into a deal conversation.",
      documents_title: "Good documents to upload",
      documents: [
        "Leases, estoppels, property condition reports, diligence binders, and listing packets.",
        "Inspection reports, title-related PDFs, and supporting transaction documents that need cross-reference review.",
        "Deal files where obligations, deadlines, and property risks are spread across multiple PDFs.",
      ],
      prompts_title: "Example prompts",
      prompts: [
        "What rent escalations, renewal options, and notice deadlines appear in these lease documents?",
        "Summarize the property risks or deferred maintenance items mentioned in the inspection and diligence reports.",
        "Where do these documents disagree on obligations, dates, or property details? Include sources.",
      ],
      value_title: "Why source-backed answers matter here",
      value_summary:
        "Deals move across many PDFs and small details matter. Source-backed answers make it easier to review faster without losing the exact page where the obligation, date, or risk appears.",
    },
  };

  const READY_STATUS = "ready";
  const FAST_POLL_INTERVAL_MS = 2000;
  const SLOW_POLL_INTERVAL_MS = 10000;
  const FAST_POLL_WINDOW_MS = 120000;
  const FAILURE_STATUSES = new Set(["error", "failed", "cancelled", "canceled"]);
  const STATUS_FILTERS = ["all", "ready", "processing", "queued", "failed"];

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

  function isPlainObject(value) {
    return !!value && typeof value === "object" && !Array.isArray(value);
  }

  function normalizeIndustryPreset(value) {
    const key = normalizeString(value);
    return Object.prototype.hasOwnProperty.call(INDUSTRY_PRESETS, key) ? key : "general";
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

  function deleteJson(url) {
    return fetchJson(url, {
      method: "DELETE",
    });
  }

  function getDocumentId(value) {
    if (!value) return "";
    if (typeof value === "string") return normalizeString(value);
    if (!isPlainObject(value)) return "";
    if (value.document && isPlainObject(value.document)) {
      return getDocumentId(value.document) || normalizeString(value.document_id || value.id || "");
    }
    return normalizeString(value.document_id || value.id || "");
  }

  function getJobId(value) {
    if (!isPlainObject(value)) return "";
    return normalizeString(value.job_id || value.jobId || "");
  }

  function normalizeTags(value) {
    if (Array.isArray(value)) {
      return uniqueStrings(
        value.map(function (item) {
          return typeof item === "string" ? item : "";
        })
      );
    }

    const single = normalizeString(value);
    return single ? [single] : [];
  }

  function normalizeMetadata(value) {
    return isPlainObject(value) ? value : {};
  }

  function extractViewerUrl(value) {
    if (!isPlainObject(value)) return "";
    return normalizeString(value.url || value.viewer_url || value.viewerUrl || "");
  }

  function normalizeDocumentRecord(value, fallback) {
    const raw = isPlainObject(value) ? value : {};
    const base = isPlainObject(fallback) ? fallback : {};
    const nestedDocument = isPlainObject(raw.document) ? raw.document : null;
    const documentId = getDocumentId(raw) || getDocumentId(nestedDocument) || getDocumentId(base);

    return {
      local_id: normalizeString(raw.local_id || raw.localId || base.local_id || ""),
      document_id: documentId,
      job_id: getJobId(raw) || getJobId(base),
      file_name:
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
        ) || documentId || normalizeString(base.file_name) || "Uploaded PDF",
      status: normalizeString(
        raw.document_status || raw.status || (nestedDocument && nestedDocument.status) || base.document_status || base.status || ""
      ),
      job_status: normalizeString(raw.job_status || raw.jobStatus || base.job_status || ""),
      ocr_status: normalizeString(
        raw.ocr_status || raw.ocrStatus || (nestedDocument && nestedDocument.ocr_status) || base.ocr_status || ""
      ),
      index_status: normalizeString(
        raw.index_status || raw.indexStatus || (nestedDocument && nestedDocument.index_status) || base.index_status || ""
      ),
      progress:
        typeof raw.progress === "number"
          ? raw.progress
          : typeof base.progress === "number"
            ? base.progress
            : null,
      tags: normalizeTags(raw.tags || (nestedDocument && nestedDocument.tags) || base.tags),
      metadata: normalizeMetadata(raw.metadata || raw.metadata_json || (nestedDocument && nestedDocument.metadata) || base.metadata),
      url: extractViewerUrl(raw) || extractViewerUrl(nestedDocument) || extractViewerUrl(base),
      created_at: normalizeString(raw.created_at || base.created_at || ""),
      error:
        extractErrorMessage(raw.error || raw.detail || raw.reason || (raw.result && raw.result.error)) ||
        extractErrorMessage(base.error) ||
        "",
      timed_out: !!(raw.timed_out || raw.timedOut || base.timed_out),
      is_polling: !!(raw.is_polling || raw.isPolling || base.is_polling),
      last_poll_at: normalizeString(raw.last_poll_at || raw.lastPollAt || base.last_poll_at || ""),
      raw: raw || base.raw || null,
    };
  }

  function normalizeDocumentList(values) {
    return ensureArray(values)
      .map(function (value) {
        return normalizeDocumentRecord(value, value);
      })
      .filter(function (item) {
        return !!(item.document_id || item.local_id);
      });
  }

  function normalizeSearchResult(value) {
    const raw = isPlainObject(value) ? value : {};
    const url = extractViewerUrl(raw);
    const documentId = getDocumentId(raw);
    const citationId = normalizeString(raw.citation_id || raw.citationId || "");
    const chunkId = normalizeString(raw.chunk_id || raw.chunkId || "");
    const id = citationId || chunkId || documentId || normalizeString(raw.id || "");

    if (!id) return null;

    return {
      id: id,
      document_id: documentId,
      citation_id: citationId,
      chunk_id: chunkId,
      file_name: normalizeString(raw.file_name || raw.filename || raw.title || raw.name || "") || "Document",
      page_number: raw.page_number != null ? Number(raw.page_number) || null : null,
      text: normalizeString(raw.text || raw.excerpt || raw.snippet || raw.description || ""),
      url: url,
      score: typeof raw.score === "number" ? raw.score : null,
      raw: raw,
    };
  }

  function normalizeSearchResultsPayload(value) {
    const raw = isPlainObject(value) ? value : {};
    return {
      query: normalizeString(raw.query || ""),
      mode: normalizeString(raw.mode || ""),
      results: ensureArray(raw.results)
        .map(normalizeSearchResult)
        .filter(Boolean),
    };
  }

  function createLoadingStates() {
    return {
      auth: false,
      documents: false,
      search: false,
      uploadCount: 0,
    };
  }

  function createErrors() {
    return {
      notice: null,
    };
  }

  function computeStats(documents, uploadQueue) {
    const merged = new Map();

    normalizeDocumentList(documents).forEach(function (documentItem) {
      const key = documentItem.document_id || documentItem.local_id;
      if (!key) return;
      merged.set(key, documentItem);
    });

    normalizeDocumentList(uploadQueue).forEach(function (queueItem) {
      const key = queueItem.document_id || queueItem.local_id;
      if (!key) return;
      merged.set(key, Object.assign({}, merged.get(key) || {}, queueItem));
    });

    const counts = {
      total: 0,
      ready: 0,
      processing: 0,
      queued: 0,
      failed: 0,
    };

    merged.forEach(function (item) {
      counts.total += 1;
      const status = classifyDocumentStatus(item);
      if (Object.prototype.hasOwnProperty.call(counts, status)) {
        counts[status] += 1;
      }
    });

    return counts;
  }

  function createInitialState() {
    const documents = [];
    const uploadQueue = [];
    return {
      documents: documents,
      uploadQueue: uploadQueue,
      stats: computeStats(documents, uploadQueue),
      searchQuery: "",
      searchResults: {
        query: "",
        mode: "",
        results: [],
      },
      selectedStatusFilter: "all",
      deletingDocumentIds: [],
      loadingStates: createLoadingStates(),
      errors: createErrors(),
    };
  }

  function queueIdentity(item) {
    const record = normalizeDocumentRecord(item, item);
    return record.document_id || record.local_id;
  }

  function classifyDocumentStatus(value) {
    const record = normalizeDocumentRecord(value, value);
    if (!(record.document_id || record.local_id)) return "processing";

    const status = normalizeString(record.status).toLowerCase();
    const jobStatus = normalizeString(record.job_status).toLowerCase();
    const ocrStatus = normalizeString(record.ocr_status).toLowerCase();
    const indexStatus = normalizeString(record.index_status).toLowerCase();

    if (record.error || FAILURE_STATUSES.has(status) || FAILURE_STATUSES.has(jobStatus) || FAILURE_STATUSES.has(ocrStatus) || FAILURE_STATUSES.has(indexStatus)) {
      return "failed";
    }

    if (status === "queued" || jobStatus === "queued") {
      return "queued";
    }

    if (status === READY_STATUS && ocrStatus === READY_STATUS && indexStatus === READY_STATUS) {
      return "ready";
    }

    return "processing";
  }

  function statusLabel(value) {
    const status = classifyDocumentStatus(value);
    if (status === "ready") return "Ready";
    if (status === "queued") return "Queued";
    if (status === "failed") return "Failed";
    return "Processing";
  }

  function statusDetail(value) {
    const record = normalizeDocumentRecord(value, value);
    const status = classifyDocumentStatus(record);

    if (status === "ready") {
      return "Ready for search and viewer access.";
    }

    if (status === "failed") {
      return record.error || "IDX processing failed for this document.";
    }

    if (record.timed_out) {
      return "Parsing and indexing is still running. Background polling continues while the page stays open.";
    }

    if (status === "queued") {
      return "Queued for IDX parsing and indexing.";
    }

    if (typeof record.progress === "number" && record.progress >= 0) {
      return "Parsing and indexing... " + Math.round(record.progress) + "%";
    }

    return "Parsing and indexing...";
  }

  function statusMeta(value) {
    const record = normalizeDocumentRecord(value, value);
    const parts = [];

    if (normalizeString(record.status)) {
      parts.push("status " + normalizeString(record.status).toLowerCase());
    }
    if (normalizeString(record.ocr_status)) {
      parts.push("ocr " + normalizeString(record.ocr_status).toLowerCase());
    }
    if (normalizeString(record.index_status)) {
      parts.push("index " + normalizeString(record.index_status).toLowerCase());
    }

    return parts.join(" | ");
  }

  function hasViewerUrl(value) {
    return !!normalizeString(normalizeDocumentRecord(value, value).url);
  }

  function matchesStatusFilter(value, filter) {
    const normalizedFilter = normalizeString(filter || "all").toLowerCase();
    if (normalizedFilter === "all") return true;
    return classifyDocumentStatus(value) === normalizedFilter;
  }

  function previewMetadata(metadata) {
    return Object.entries(normalizeMetadata(metadata))
      .slice(0, 3)
      .map(function (entry) {
        const key = normalizeString(entry[0]);
        const value = entry[1];
        if (!key) return "";
        if (value == null) return key;
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          return key + ": " + String(value);
        }
        return key;
      })
      .filter(Boolean);
  }

  function createLocalQueueItem(file) {
    return normalizeDocumentRecord(
      {
        local_id: "upload-" + String(Date.now()) + "-" + Math.random().toString(16).slice(2),
        file_name: normalizeString(file && file.name) || "Uploaded PDF",
        status: "uploading",
        ocr_status: "pending",
        index_status: "pending",
      },
      null
    );
  }

  function extractUploadItems(response, file) {
    const raw = isPlainObject(response) ? response : {};
    const fallbackName = normalizeString(file && file.name) || "Uploaded PDF";
    const items = [];
    const seen = new Set();

    function pushRecord(value, fallback) {
      const normalized = normalizeDocumentRecord(
        value,
        Object.assign(
          {
            file_name: fallbackName,
            status: "queued",
            ocr_status: "pending",
            index_status: "pending",
          },
          fallback || {}
        )
      );

      if (!(normalized.document_id || normalized.local_id)) return;
      const key = normalized.document_id || normalized.local_id;
      if (seen.has(key)) return;
      seen.add(key);
      items.push(normalized);
    }

    ensureArray(raw.items).forEach(function (item) {
      pushRecord(item);
    });

    if (!items.length && raw.document && isPlainObject(raw.document)) {
      pushRecord(raw.document);
    }

    if (!items.length && Array.isArray(raw.documents)) {
      raw.documents.forEach(function (item) {
        pushRecord(item);
      });
    }

    if (!items.length) {
      pushRecord(raw);
    }

    return items;
  }

  function upsertQueueItem(list, item) {
    const normalized = normalizeDocumentRecord(item, item);
    const identity = queueIdentity(normalized);
    if (!identity) return normalizeDocumentList(list);

    const next = [];
    let inserted = false;

    normalizeDocumentList(list).forEach(function (existing) {
      const existingIdentity = queueIdentity(existing);
      const sameDocument = normalized.document_id && existing.document_id && normalized.document_id === existing.document_id;

      if (existingIdentity === identity || sameDocument) {
        if (!inserted) {
          next.push(Object.assign({}, existing, normalized));
          inserted = true;
        }
        return;
      }

      next.push(existing);
    });

    if (!inserted) {
      next.unshift(normalized);
    }

    return next;
  }

  function removeQueueItem(list, identity) {
    const normalizedIdentity = normalizeString(identity);
    return normalizeDocumentList(list).filter(function (item) {
      return queueIdentity(item) !== normalizedIdentity && item.document_id !== normalizedIdentity;
    });
  }

  function replaceQueueItems(list, matchIdentities, replacements) {
    const matchSet = new Set(
      ensureArray(matchIdentities)
        .map(function (value) {
          return normalizeString(value);
        })
        .filter(Boolean)
    );

    const next = [];
    let inserted = false;

    normalizeDocumentList(list).forEach(function (item) {
      const identity = queueIdentity(item);
      if (matchSet.has(identity) || (item.document_id && matchSet.has(item.document_id))) {
        if (!inserted) {
          normalizeDocumentList(replacements).forEach(function (replacement) {
            next.push(replacement);
          });
          inserted = true;
        }
        return;
      }

      next.push(item);
    });

    if (!inserted) {
      normalizeDocumentList(replacements).forEach(function (replacement) {
        next.unshift(replacement);
      });
    }

    return next;
  }

  function reconcileQueueWithDocuments(queue, documents, clearPollTimer) {
    const documentMap = new Map();
    normalizeDocumentList(documents).forEach(function (documentItem) {
      if (documentItem.document_id) {
        documentMap.set(documentItem.document_id, documentItem);
      }
    });

    const nextQueue = [];
    normalizeDocumentList(queue).forEach(function (queueItem) {
      if (!queueItem.document_id) {
        nextQueue.push(queueItem);
        return;
      }

      const documentItem = documentMap.get(queueItem.document_id);
      if (!documentItem) {
        nextQueue.push(queueItem);
        return;
      }

      const merged = Object.assign({}, queueItem, documentItem, {
        job_id: queueItem.job_id || documentItem.job_id,
        timed_out: queueItem.timed_out,
        is_polling: queueItem.is_polling,
        last_poll_at: queueItem.last_poll_at,
      });

      if (classifyDocumentStatus(merged) === "ready") {
        clearPollTimer(queueItem.document_id);
        return;
      }

      nextQueue.push(merged);
    });

    return nextQueue;
  }

  function mergePolledQueueItem(current, jobPayload, documentPayload, timedOut) {
    const job = isPlainObject(jobPayload) ? jobPayload : {};
    const document = isPlainObject(documentPayload) ? documentPayload : {};
    const base = normalizeDocumentRecord(current, current);

    return normalizeDocumentRecord(
      {
        local_id: base.local_id,
        document_id: base.document_id,
        job_id: base.job_id || getJobId(job),
        file_name: normalizeString(document.file_name || job.file_name || base.file_name),
        status: normalizeString(document.status || job.document_status || base.status || job.status),
        job_status: normalizeString(job.status || base.job_status),
        ocr_status: normalizeString(document.ocr_status || job.ocr_status || base.ocr_status),
        index_status: normalizeString(document.index_status || job.index_status || base.index_status),
        progress: typeof job.progress === "number" ? job.progress : base.progress,
        tags: document.tags || base.tags,
        metadata: document.metadata || base.metadata,
        url: extractViewerUrl(document) || extractViewerUrl(job) || base.url,
        error: extractErrorMessage(document.error || job.error) || base.error,
        timed_out: timedOut,
        is_polling: false,
        last_poll_at: new Date().toISOString(),
      },
      base
    );
  }

  function normalizeSearchButtonState(searchResults) {
    const payload = searchResults && typeof searchResults === "object" ? searchResults : { query: "", results: [] };
    return {
      query: normalizeString(payload.query || ""),
      mode: normalizeString(payload.mode || ""),
      results: ensureArray(payload.results),
    };
  }

  function initGuidance(root) {
    function industryPresetFromHash(value) {
      const normalized = normalizeString(value || "").replace(/^#/, "");
      return normalizeIndustryPreset(normalized);
    }

    const initialPreset = industryPresetFromHash(window.location.hash);
    const elements = {
      tabs: qsa(root, "[data-idx-industry-tab]"),
      panel: qs(root, "#idx-guidance-panel"),
      presetTitle: qs(root, "[data-idx-industry-title]"),
      presetIntro: qs(root, "[data-idx-industry-intro]"),
      presetDocumentsTitle: qs(root, "[data-idx-industry-documents-title]"),
      presetDocuments: qs(root, "[data-idx-industry-documents]"),
      presetPromptsTitle: qs(root, "[data-idx-industry-prompts-title]"),
      presetPrompts: qs(root, "[data-idx-industry-prompts]"),
      presetValueTitle: qs(root, "[data-idx-industry-value-title]"),
      presetValueSummary: qs(root, "[data-idx-industry-value-summary]"),
    };

    let selectedIndustryPreset = initialPreset === "general" ? "legal" : initialPreset;

    function renderList(list, items, className) {
      if (!list) return;
      list.innerHTML = "";

      ensureArray(items).forEach(function (itemText) {
        const text = normalizeString(itemText);
        if (!text) return;

        const item = document.createElement("li");
        if (className) item.className = className;
        item.textContent = text;
        list.appendChild(item);
      });
    }

    function selectPreset(preset, shouldFocus) {
      selectedIndustryPreset = normalizeIndustryPreset(preset);
      if (selectedIndustryPreset === "general") {
        selectedIndustryPreset = "legal";
      }
      setIndustryHash(selectedIndustryPreset);
      renderIndustryPreset();

      if (shouldFocus) {
        const selectedTab = elements.tabs.find(function (tab) {
          return normalizeIndustryPreset(tab.getAttribute("data-idx-industry-tab")) === selectedIndustryPreset;
        });
        if (selectedTab) selectedTab.focus();
      }
    }

    function setIndustryHash(preset) {
      const url = new URL(window.location.href);
      const normalized = normalizeIndustryPreset(preset);
      if (normalized && normalized !== "general") {
        url.hash = normalized;
      } else {
        url.hash = "";
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    }

    function renderIndustryPreset() {
      const preset = INDUSTRY_PRESETS[selectedIndustryPreset] || INDUSTRY_PRESETS.general;

      setText(elements.presetTitle, preset.title);
      setText(elements.presetIntro, preset.intro);
      setText(elements.presetDocumentsTitle, preset.documents_title);
      renderList(elements.presetDocuments, preset.documents, "mdz-idx__detail-item");
      setText(elements.presetPromptsTitle, preset.prompts_title);
      renderList(elements.presetPrompts, ensureArray(preset.prompts).slice(0, 3), "mdz-idx__prompt-item");
      setText(elements.presetValueTitle, preset.value_title);
      setText(elements.presetValueSummary, preset.value_summary);

      elements.tabs.forEach(function (tab) {
        const key = normalizeIndustryPreset(tab.getAttribute("data-idx-industry-tab"));
        const isActive = key === selectedIndustryPreset;
        tab.classList.toggle("is-active", isActive);
        tab.setAttribute("aria-selected", isActive ? "true" : "false");
        tab.tabIndex = isActive ? 0 : -1;

        if (isActive && elements.panel) {
          const labelledBy = normalizeString(tab.id);
          if (labelledBy) {
            elements.panel.setAttribute("aria-labelledby", labelledBy);
          }
        }
      });
    }

    elements.tabs.forEach(function (tab, index) {
      const preset = normalizeIndustryPreset(tab.getAttribute("data-idx-industry-tab"));

      tab.addEventListener("click", function () {
        selectPreset(preset, false);
      });

      tab.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectPreset(preset, true);
          return;
        }

        if (!elements.tabs.length) return;

        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % elements.tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + elements.tabs.length) % elements.tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = elements.tabs.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        const nextTab = elements.tabs[nextIndex];
        if (!nextTab) return;
        selectPreset(nextTab.getAttribute("data-idx-industry-tab"), true);
      });
    });

    window.addEventListener("hashchange", function () {
      const nextPreset = industryPresetFromHash(window.location.hash);
      const normalizedPreset = nextPreset === "general" ? "legal" : nextPreset;

      if (normalizedPreset !== selectedIndustryPreset) {
        selectPreset(normalizedPreset, false);
      }
    });

    renderIndustryPreset();
    setIndustryHash(selectedIndustryPreset);
  }

  function initDashboard(root) {
    const auth = window.MdzAuth || null;
    const elements = {
      refreshDocs: qs(root, "[data-idx-refresh-docs]"),
      preauth: qs(root, "[data-idx-preauth]"),
      preauthSummary: qs(root, "[data-idx-preauth-summary]"),
      app: qs(root, "[data-idx-dashboard-app]"),
      authGate: qs(root, "[data-idx-auth-gate]"),
      authGateTitle: qs(root, "[data-idx-auth-gate-title]"),
      authGateCopy: qs(root, "[data-idx-auth-gate-copy]"),
      authLogin: qs(root, "[data-idx-auth-login]"),
      notice: qs(root, "[data-idx-notice]"),
      noticeTitle: qs(root, "[data-idx-notice-title]"),
      noticeCopy: qs(root, "[data-idx-notice-copy]"),
      statTotal: qs(root, "[data-idx-stat-total]"),
      statReady: qs(root, "[data-idx-stat-ready]"),
      statProcessing: qs(root, "[data-idx-stat-processing]"),
      statFailed: qs(root, "[data-idx-stat-failed]"),
      searchForm: qs(root, "[data-idx-search-form]"),
      searchInput: qs(root, "[data-idx-search-input]"),
      searchSubmit: qs(root, "[data-idx-search-submit]"),
      searchClear: qs(root, "[data-idx-search-clear]"),
      searchStatus: qs(root, "[data-idx-search-status]"),
      filterButtons: qsa(root, "[data-idx-filter]"),
      documentsStatus: qs(root, "[data-idx-documents-status]"),
      emptyState: qs(root, "[data-idx-empty-state]"),
      emptyTitle: qs(root, "[data-idx-empty-title]"),
      emptyCopy: qs(root, "[data-idx-empty-copy]"),
      tableWrap: qs(root, "[data-idx-table-wrap]"),
      documentRows: qs(root, "[data-idx-document-rows]"),
      uploadStatus: qs(root, "[data-idx-upload-status]"),
      dropzone: qs(root, "[data-idx-dropzone]"),
      uploadButtons: qsa(root, "[data-idx-upload-button]"),
      fileInput: qs(root, "[data-idx-file-input]"),
      uploadQueue: qs(root, "[data-idx-upload-queue]"),
      searchResults: qs(root, "[data-idx-search-results]"),
    };

    let state = createInitialState();
    let authState = {
      checked: false,
      authenticated: false,
      missingConfig: false,
    };
    let dragDepth = 0;
    const pollTimers = Object.create(null);
    const pollMeta = Object.create(null);

    function deriveState(next) {
      const normalizedDocuments = normalizeDocumentList(next.documents);
      const normalizedQueue = normalizeDocumentList(next.uploadQueue);
      return Object.assign({}, next, {
        documents: normalizedDocuments,
        uploadQueue: normalizedQueue,
        stats: computeStats(normalizedDocuments, normalizedQueue),
      });
    }

    function setState(next) {
      state = deriveState(next);
      render();
    }

    function patchState(patch) {
      setState(Object.assign({}, state, patch));
    }

    function updateLoading(patch) {
      patchState({
        loadingStates: Object.assign({}, state.loadingStates, patch),
      });
    }

    function setNotice(notice) {
      patchState({
        errors: Object.assign({}, state.errors, {
          notice: notice || null,
        }),
      });
    }

    function clearNotice() {
      patchState({
        errors: Object.assign({}, state.errors, {
          notice: null,
        }),
      });
    }

    function handleAuthFailure(error) {
      if (error && (error.status === 401 || error.status === 403)) {
        authState = {
          checked: true,
          authenticated: false,
          missingConfig: authState.missingConfig,
        };
      }
    }

    function buildLoginHref() {
      if (!auth || !auth.buildLoginUrl) return "/login/";
      return auth.buildLoginUrl(currentRelativeUrl());
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

      updateLoading({ auth: false });
      render();
      return authState;
    }

    async function ensureAuthenticated() {
      const session = authState.checked ? authState : await refreshAuth(true);
      return !!session.authenticated;
    }

    function clearPollTimer(documentId) {
      if (!pollTimers[documentId]) return;
      window.clearTimeout(pollTimers[documentId]);
      delete pollTimers[documentId];
    }

    function schedulePoll(documentId, delayMs) {
      clearPollTimer(documentId);
      pollTimers[documentId] = window.setTimeout(function () {
        runQueuePoll(documentId);
      }, delayMs);
    }

    function nextPollDelay(item) {
      const record = normalizeDocumentRecord(item, item);
      return record.timed_out ? SLOW_POLL_INTERVAL_MS : FAST_POLL_INTERVAL_MS;
    }

    async function loadDocuments(options) {
      const endpoint = buildIdxUrl("/idx/documents/?limit=100");

      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "document library", endpoint: "" }));
        return null;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return null;
      }

      updateLoading({ documents: true });

      try {
        const response = await fetchJson(endpoint, { method: "GET" });
        const documents = normalizeDocumentList(response && response.documents);
        const nextQueue = reconcileQueueWithDocuments(state.uploadQueue, documents, clearPollTimer);

        patchState({
          documents: documents,
          uploadQueue: nextQueue,
        });

        if (!(options && options.preserveNotice)) {
          clearNotice();
        }

        return documents;
      } catch (error) {
        handleAuthFailure(error);
        setNotice(
          buildUiNotice(error, {
            action: "document library",
            endpoint: endpoint,
          })
        );
        return null;
      } finally {
        updateLoading({ documents: false });
      }
    }

    async function performSearch() {
      const query = normalizeString(state.searchQuery);
      const endpoint = buildIdxUrl("/idx/search/documents");

      if (!query) {
        patchState({
          searchResults: {
            query: "",
            mode: "",
            results: [],
          },
        });
        return null;
      }

      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "document search", endpoint: "" }));
        return null;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return null;
      }

      updateLoading({ search: true });

      try {
        const response = await postJson(endpoint, {
          query: query,
          limit: 12,
        });

        patchState({
          searchResults: normalizeSearchResultsPayload(response),
        });
        clearNotice();
        return response;
      } catch (error) {
        handleAuthFailure(error);
        setNotice(
          buildUiNotice(error, {
            action: "document search",
            endpoint: endpoint,
          })
        );
        return null;
      } finally {
        updateLoading({ search: false });
      }
    }

    async function deleteDocument(documentId) {
      const normalizedId = normalizeString(documentId);
      if (!normalizedId) return;

      const documentItem =
        state.documents.find(function (item) {
          return item.document_id === normalizedId;
        }) ||
        state.uploadQueue.find(function (item) {
          return item.document_id === normalizedId;
        }) ||
        null;

      const fileName = normalizeString(documentItem && documentItem.file_name) || normalizedId;
      if (!window.confirm('Delete "' + fileName + '" from IDX?')) {
        return;
      }

      const endpoint = buildIdxUrl("/idx/documents/" + encodeURIComponent(normalizedId));
      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "document delete", endpoint: "" }));
        return;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      patchState({
        deletingDocumentIds: uniqueStrings(state.deletingDocumentIds.concat(normalizedId)),
      });

      try {
        await deleteJson(endpoint);
        clearPollTimer(normalizedId);
        delete pollMeta[normalizedId];

        patchState({
          documents: state.documents.filter(function (item) {
            return item.document_id !== normalizedId;
          }),
          uploadQueue: state.uploadQueue.filter(function (item) {
            return item.document_id !== normalizedId;
          }),
          searchResults: Object.assign({}, normalizeSearchButtonState(state.searchResults), {
            results: normalizeSearchButtonState(state.searchResults).results.filter(function (result) {
              return result.document_id !== normalizedId;
            }),
          }),
          deletingDocumentIds: state.deletingDocumentIds.filter(function (item) {
            return item !== normalizedId;
          }),
        });

        clearNotice();
        await loadDocuments({ preserveNotice: true });
      } catch (error) {
        handleAuthFailure(error);
        patchState({
          deletingDocumentIds: state.deletingDocumentIds.filter(function (item) {
            return item !== normalizedId;
          }),
        });
        setNotice(
          buildUiNotice(error, {
            action: "document delete",
            endpoint: endpoint,
          })
        );
      }
    }

    async function runQueuePoll(documentId) {
      const normalizedId = normalizeString(documentId);
      if (!normalizedId) return;

      const current = state.uploadQueue.find(function (item) {
        return item.document_id === normalizedId;
      });

      if (!current || !current.job_id) return;

      const startedAt = pollMeta[normalizedId] && pollMeta[normalizedId].startedAt ? pollMeta[normalizedId].startedAt : Date.now();
      pollMeta[normalizedId] = { startedAt: startedAt };

      const jobUrl = buildIdxUrl("/idx/jobs/" + encodeURIComponent(current.job_id));
      const documentUrl = buildIdxUrl("/idx/documents/" + encodeURIComponent(normalizedId));
      const timedOut = Date.now() - startedAt >= FAST_POLL_WINDOW_MS;

      patchState({
        uploadQueue: upsertQueueItem(state.uploadQueue, Object.assign({}, current, {
          is_polling: true,
          last_poll_at: new Date().toISOString(),
        })),
      });

      const [jobResult, documentResult] = await Promise.allSettled([
        fetchJson(jobUrl, { method: "GET" }),
        fetchJson(documentUrl, { method: "GET" }),
      ]);

      if (jobResult.status === "rejected" || documentResult.status === "rejected") {
        const error = jobResult.status === "rejected" ? jobResult.reason : documentResult.reason;
        const failedEndpoint = jobResult.status === "rejected" ? jobUrl : documentUrl;
        const nextItem = mergePolledQueueItem(
          current,
          jobResult.status === "fulfilled" ? jobResult.value : null,
          documentResult.status === "fulfilled" ? documentResult.value : null,
          timedOut
        );

        handleAuthFailure(error);

        patchState({
          uploadQueue: upsertQueueItem(
            state.uploadQueue,
            Object.assign({}, nextItem, {
              error: nextItem.error || extractErrorMessage(error && error.data) || extractErrorMessage(error),
            })
          ),
        });

        if (!(error && error.status === 401)) {
          setNotice(
            buildUiNotice(error, {
              action: "document polling",
              endpoint: failedEndpoint,
            })
          );
        }

        schedulePoll(normalizedId, nextPollDelay(nextItem));
        return;
      }

      const nextItem = mergePolledQueueItem(current, jobResult.value, documentResult.value, timedOut);
      const nextStatus = classifyDocumentStatus(nextItem);

      if (nextStatus === "ready") {
        clearPollTimer(normalizedId);
        delete pollMeta[normalizedId];
        patchState({
          uploadQueue: removeQueueItem(state.uploadQueue, normalizedId),
          documents: normalizeDocumentList(state.documents).map(function (item) {
            return item.document_id === normalizedId ? Object.assign({}, item, nextItem) : item;
          }),
        });
        await loadDocuments({ preserveNotice: true });
        return;
      }

      patchState({
        uploadQueue: upsertQueueItem(state.uploadQueue, nextItem),
      });

      if (nextStatus === "failed") {
        clearPollTimer(normalizedId);
        delete pollMeta[normalizedId];
        await loadDocuments({ preserveNotice: true });
        return;
      }

      schedulePoll(normalizedId, nextPollDelay(nextItem));
    }

    async function uploadSingleFile(file) {
      const endpoint = buildIdxUrl("/idx/documents/upload");
      const tempItem = createLocalQueueItem(file);

      patchState({
        uploadQueue: [tempItem].concat(state.uploadQueue),
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

        patchState({
          uploadQueue: replaceQueueItems(state.uploadQueue, [tempItem.local_id], uploadItems),
        });

        await loadDocuments({ preserveNotice: true });

        uploadItems.forEach(function (item) {
          if (item.document_id && item.job_id) {
            pollMeta[item.document_id] = { startedAt: Date.now() };
            schedulePoll(item.document_id, 0);
          }
        });
      } catch (error) {
        handleAuthFailure(error);
        patchState({
          uploadQueue: replaceQueueItems(state.uploadQueue, [tempItem.local_id], [
            Object.assign({}, tempItem, {
              status: "failed",
              error: extractErrorMessage(error && error.data) || extractErrorMessage(error) || "Could not upload this PDF right now.",
              is_polling: false,
            }),
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
        return;
      }

      if (!endpoint) {
        setNotice(buildUiNotice(null, { action: "document upload", endpoint: "" }));
        return;
      }

      if (!(await ensureAuthenticated())) {
        render();
        return;
      }

      clearNotice();
      updateLoading({
        uploadCount: state.loadingStates.uploadCount + validFiles.length,
      });

      loadDocuments({ preserveNotice: true });

      for (const file of validFiles) {
        await uploadSingleFile(file);
      }

      updateLoading({
        uploadCount: Math.max(0, state.loadingStates.uploadCount - validFiles.length),
      });
    }

    function renderAuthGate() {
      if (elements.authLogin) {
        elements.authLogin.href = buildLoginHref();
      }

      const appReady = authState.checked && authState.authenticated && !authState.missingConfig;

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
        setText(elements.authGateCopy, "Verifying sign-in for the IDX web dashboard.");
      } else if (authState.missingConfig) {
        elements.authGate.hidden = false;
        setText(elements.authGateTitle, "Sign-in unavailable");
        setText(elements.authGateCopy, "The site auth configuration is missing, so the IDX web dashboard cannot authenticate requests yet.");
      } else {
        elements.authGate.hidden = true;
      }
    }

    function renderNotice() {
      if (!elements.notice) return;

      const notice = state.errors.notice;
      const visible = !!(notice && (notice.title || notice.body));
      elements.notice.hidden = !visible;
      if (!visible) return;

      setText(elements.noticeTitle, notice.title);
      setText(elements.noticeCopy, notice.body);
    }

    function renderStats() {
      setText(elements.statTotal, String(state.stats.total));
      setText(elements.statReady, String(state.stats.ready));
      setText(elements.statProcessing, String(state.stats.processing + state.stats.queued));
      setText(elements.statFailed, String(state.stats.failed));
    }

    function renderFilters() {
      elements.filterButtons.forEach(function (button) {
        const filter = normalizeString(button.getAttribute("data-idx-filter")).toLowerCase();
        const isActive = filter === state.selectedStatusFilter;
        button.classList.toggle("is-active", isActive);
        button.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function renderDocumentsStatus() {
      if (!elements.documentsStatus) return;

      if (state.loadingStates.documents) {
        setText(elements.documentsStatus, "Refreshing library...");
        return;
      }

      const visibleRows = normalizeDocumentList(state.documents).filter(function (item) {
        return matchesStatusFilter(item, state.selectedStatusFilter);
      });

      if (!visibleRows.length) {
        setText(elements.documentsStatus, "");
        return;
      }

      const label = visibleRows.length === 1 ? "1 document" : visibleRows.length + " documents";
      setText(elements.documentsStatus, label);
    }

    function renderUploadStatus() {
      if (!elements.uploadStatus) return;

      const uploadCount = state.loadingStates.uploadCount;
      const queueCount = state.uploadQueue.length;

      if (uploadCount > 0) {
        setText(elements.uploadStatus, uploadCount === 1 ? "Uploading 1 file" : "Uploading " + uploadCount + " files");
        return;
      }

      if (queueCount > 0) {
        setText(elements.uploadStatus, queueCount === 1 ? "Tracking 1 queued file" : "Tracking " + queueCount + " queued files");
        return;
      }

      setText(elements.uploadStatus, "");
    }

    function renderSearchStatus() {
      if (!elements.searchStatus) return;

      if (state.loadingStates.search) {
        setText(elements.searchStatus, "Searching ready documents...");
        return;
      }

      const payload = normalizeSearchButtonState(state.searchResults);
      if (!payload.query) {
        setText(elements.searchStatus, "");
        return;
      }

      const label = payload.results.length === 1 ? "1 result" : payload.results.length + " results";
      setText(elements.searchStatus, label);
    }

    function createMetadataPills(item) {
      const fragment = document.createDocumentFragment();
      const tags = normalizeTags(item.tags);
      const metadata = previewMetadata(item.metadata);

      tags.forEach(function (tag) {
        const pill = document.createElement("span");
        pill.className = "mdz-idx__pill";
        pill.textContent = tag;
        fragment.appendChild(pill);
      });

      metadata.forEach(function (entry) {
        const pill = document.createElement("span");
        pill.className = "mdz-idx__pill mdz-idx__pill--muted";
        pill.textContent = entry;
        fragment.appendChild(pill);
      });

      if (!fragment.childNodes.length) {
        const empty = document.createElement("span");
        empty.className = "mdz-idx__helper";
        empty.textContent = "No tags or metadata";
        fragment.appendChild(empty);
      }

      return fragment;
    }

    function renderDocumentRows() {
      if (!elements.documentRows) return;
      elements.documentRows.innerHTML = "";

      const visibleRows = normalizeDocumentList(state.documents).filter(function (item) {
        return matchesStatusFilter(item, state.selectedStatusFilter);
      });

      visibleRows.forEach(function (item) {
        const row = document.createElement("tr");

        const fileCell = document.createElement("td");
        const fileWrap = document.createElement("div");
        fileWrap.className = "mdz-idx__table-file";

        const title = document.createElement("strong");
        title.textContent = item.file_name;
        fileWrap.appendChild(title);

        const detail = document.createElement("span");
        detail.textContent = item.document_id || "";
        fileWrap.appendChild(detail);
        fileCell.appendChild(fileWrap);

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "mdz-idx__document-badge is-" + classifyDocumentStatus(item);
        badge.textContent = statusLabel(item);
        statusCell.appendChild(badge);

        const meta = document.createElement("p");
        meta.className = "mdz-idx__table-detail";
        meta.textContent = statusDetail(item);
        statusCell.appendChild(meta);

        const contextCell = document.createElement("td");
        const pills = document.createElement("div");
        pills.className = "mdz-idx__pills";
        pills.appendChild(createMetadataPills(item));
        contextCell.appendChild(pills);

        const actionsCell = document.createElement("td");
        const actions = document.createElement("div");
        actions.className = "mdz-idx__row-actions";

        if (item.url) {
          const view = document.createElement("a");
          view.className = "btn btn--small mdz-cta mdz-cta--outline";
          view.href = item.url;
          view.target = "_blank";
          view.rel = "noopener noreferrer";
          view.textContent = "Open viewer";
          actions.appendChild(view);
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn--small mdz-cta mdz-cta--outline";
        remove.textContent = state.deletingDocumentIds.includes(item.document_id) ? "Deleting..." : "Delete";
        remove.disabled = !item.document_id || state.deletingDocumentIds.includes(item.document_id);
        remove.addEventListener("click", function () {
          deleteDocument(item.document_id);
        });
        actions.appendChild(remove);
        actionsCell.appendChild(actions);

        row.appendChild(fileCell);
        row.appendChild(statusCell);
        row.appendChild(contextCell);
        row.appendChild(actionsCell);
        elements.documentRows.appendChild(row);
      });
    }

    function renderEmptyState() {
      if (!elements.emptyState || !elements.tableWrap) return;

      const hasDocuments = normalizeDocumentList(state.documents).length > 0;
      const hasQueue = normalizeDocumentList(state.uploadQueue).length > 0;
      const visibleRows = normalizeDocumentList(state.documents).filter(function (item) {
        return matchesStatusFilter(item, state.selectedStatusFilter);
      });

      if (!hasDocuments && !hasQueue) {
        elements.emptyState.hidden = false;
        elements.tableWrap.hidden = true;
        setText(elements.emptyTitle, "Upload a PDF to start building your IDX document library.");
        setText(elements.emptyCopy, "Processing files stay visible in the upload queue while IDX parses and indexes them.");
        return;
      }

      if (!visibleRows.length) {
        elements.emptyState.hidden = false;
        elements.tableWrap.hidden = true;
        setText(elements.emptyTitle, "No documents match the current status filter.");
        setText(elements.emptyCopy, "Adjust the filter, upload more PDFs, or wait for queued items to finish parsing and indexing.");
        return;
      }

      elements.emptyState.hidden = true;
      elements.tableWrap.hidden = false;
    }

    function renderUploadQueue() {
      if (!elements.uploadQueue) return;
      elements.uploadQueue.innerHTML = "";

      const queueItems = normalizeDocumentList(state.uploadQueue);
      if (!queueItems.length) {
        const empty = document.createElement("p");
        empty.className = "mdz-idx__helper";
        empty.textContent = "No uploads are running right now. Use the drop zone or file picker to add PDFs.";
        elements.uploadQueue.appendChild(empty);
        return;
      }

      queueItems.forEach(function (item) {
        const card = document.createElement("article");
        card.className = "mdz-idx__document-card is-" + classifyDocumentStatus(item);

        const top = document.createElement("div");
        top.className = "mdz-idx__document-top";

        const copy = document.createElement("div");
        copy.className = "mdz-idx__document-copy";

        const title = document.createElement("strong");
        title.className = "mdz-idx__document-title";
        title.textContent = item.file_name;

        const detail = document.createElement("p");
        detail.className = "mdz-idx__document-detail";
        detail.textContent = statusDetail(item);

        const badge = document.createElement("span");
        badge.className = "mdz-idx__document-badge is-" + classifyDocumentStatus(item);
        badge.textContent = statusLabel(item);

        copy.appendChild(title);
        copy.appendChild(detail);
        top.appendChild(copy);
        top.appendChild(badge);
        card.appendChild(top);

        const meta = document.createElement("p");
        meta.className = "mdz-idx__document-meta";
        meta.textContent = [item.document_id ? "document_id " + item.document_id : "", item.job_id ? "job_id " + item.job_id : "", statusMeta(item)]
          .filter(Boolean)
          .join(" | ");
        card.appendChild(meta);

        if (item.error) {
          const error = document.createElement("p");
          error.className = "mdz-idx__document-error";
          error.textContent = item.error;
          card.appendChild(error);
        }

        const actions = document.createElement("div");
        actions.className = "mdz-idx__queue-actions";

        if (item.document_id && item.job_id && classifyDocumentStatus(item) !== "failed" && classifyDocumentStatus(item) !== "ready") {
          const refresh = document.createElement("button");
          refresh.type = "button";
          refresh.className = "btn btn--small mdz-cta mdz-cta--outline";
          refresh.textContent = item.is_polling ? "Refreshing..." : "Refresh status";
          refresh.disabled = !!item.is_polling;
          refresh.addEventListener("click", function () {
            pollMeta[item.document_id] = {
              startedAt: Date.now(),
            };
            runQueuePoll(item.document_id);
          });
          actions.appendChild(refresh);
        }

        if (item.url && classifyDocumentStatus(item) === "ready") {
          const view = document.createElement("a");
          view.className = "btn btn--small mdz-cta mdz-cta--outline";
          view.href = item.url;
          view.target = "_blank";
          view.rel = "noopener noreferrer";
          view.textContent = "Open viewer";
          actions.appendChild(view);
        }

        if (item.document_id) {
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "btn btn--small mdz-cta mdz-cta--outline";
          remove.textContent = state.deletingDocumentIds.includes(item.document_id) ? "Deleting..." : "Delete";
          remove.disabled = state.deletingDocumentIds.includes(item.document_id);
          remove.addEventListener("click", function () {
            deleteDocument(item.document_id);
          });
          actions.appendChild(remove);
        }

        if (actions.children.length) {
          card.appendChild(actions);
        }

        elements.uploadQueue.appendChild(card);
      });
    }

    function renderSearchResults() {
      if (!elements.searchResults) return;
      elements.searchResults.innerHTML = "";

      const payload = normalizeSearchButtonState(state.searchResults);

      if (!payload.query) {
        const helper = document.createElement("p");
        helper.className = "mdz-idx__helper";
        helper.textContent = "Search ready documents by keyword, clause, or source term. Results render as direct viewer links.";
        elements.searchResults.appendChild(helper);
        return;
      }

      if (!payload.results.length) {
        const helper = document.createElement("p");
        helper.className = "mdz-idx__helper";
        helper.textContent = "No ready documents matched this search.";
        elements.searchResults.appendChild(helper);
        return;
      }

      payload.results.forEach(function (result) {
        const card = document.createElement("article");
        card.className = "mdz-idx__search-result";

        const heading = document.createElement("div");
        heading.className = "mdz-idx__search-result-header";

        const title = document.createElement("strong");
        title.textContent = result.page_number ? result.file_name + ", page " + result.page_number : result.file_name;
        heading.appendChild(title);

        if (typeof result.score === "number") {
          const score = document.createElement("span");
          score.textContent = "score " + result.score.toFixed(2);
          heading.appendChild(score);
        }

        card.appendChild(heading);

        if (result.text) {
          const excerpt = document.createElement("p");
          excerpt.className = "mdz-idx__search-result-text";
          excerpt.textContent = result.text;
          card.appendChild(excerpt);
        }

        const meta = document.createElement("p");
        meta.className = "mdz-idx__search-result-meta";
        meta.textContent = [result.document_id ? "document_id " + result.document_id : "", result.citation_id ? "citation_id " + result.citation_id : ""]
          .filter(Boolean)
          .join(" | ");
        if (meta.textContent) {
          card.appendChild(meta);
        }

        const actions = document.createElement("div");
        actions.className = "mdz-idx__row-actions";

        if (result.url) {
          const open = document.createElement("a");
          open.className = "btn btn--small mdz-cta mdz-cta--outline";
          open.href = result.url;
          open.target = "_blank";
          open.rel = "noopener noreferrer";
          open.textContent = "Open viewer";
          actions.appendChild(open);
        } else {
          const helper = document.createElement("span");
          helper.className = "mdz-idx__helper";
          helper.textContent = "Viewer link unavailable.";
          actions.appendChild(helper);
        }

        card.appendChild(actions);
        elements.searchResults.appendChild(card);
      });
    }

    function renderDropzone(authBlocked) {
      if (!elements.dropzone) return;
      const blocked = authBlocked || state.loadingStates.uploadCount > 0;
      elements.dropzone.classList.toggle("is-disabled", blocked);
      elements.dropzone.setAttribute("aria-disabled", blocked ? "true" : "false");
      elements.dropzone.classList.toggle("is-busy", state.loadingStates.uploadCount > 0);
    }

    function render() {
      const authBlocked = !authState.checked || !authState.authenticated || !!authState.missingConfig;

      renderAuthGate();
      renderNotice();
      renderStats();
      renderFilters();
      renderDocumentsStatus();
      renderUploadStatus();
      renderSearchStatus();
      renderDocumentRows();
      renderEmptyState();
      renderUploadQueue();
      renderSearchResults();
      renderDropzone(authBlocked);

      if (elements.searchInput) {
        elements.searchInput.value = state.searchQuery;
        elements.searchInput.disabled = authBlocked || state.loadingStates.search;
      }

      if (elements.searchSubmit) {
        elements.searchSubmit.disabled = authBlocked || !normalizeString(state.searchQuery) || state.loadingStates.search;
      }

      if (elements.searchClear) {
        elements.searchClear.disabled = !normalizeString(state.searchQuery) && !normalizeSearchButtonState(state.searchResults).query;
      }

      if (elements.refreshDocs) {
        elements.refreshDocs.disabled = authBlocked || state.loadingStates.documents;
      }

      elements.uploadButtons.forEach(function (button) {
        button.disabled = authBlocked || state.loadingStates.uploadCount > 0;
      });

      if (elements.fileInput) {
        elements.fileInput.disabled = authBlocked || state.loadingStates.uploadCount > 0;
      }
    }

    if (elements.refreshDocs) {
      elements.refreshDocs.addEventListener("click", function () {
        loadDocuments();
      });
    }

    if (elements.searchForm) {
      elements.searchForm.addEventListener("submit", function (event) {
        event.preventDefault();
        performSearch();
      });
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener("input", function (event) {
        const nextQuery = event.target.value || "";
        patchState({
          searchQuery: nextQuery,
        });

        if (!normalizeString(nextQuery) && normalizeSearchButtonState(state.searchResults).query) {
          patchState({
            searchResults: {
              query: "",
              mode: "",
              results: [],
            },
          });
        }
      });
    }

    if (elements.searchClear) {
      elements.searchClear.addEventListener("click", function () {
        patchState({
          searchQuery: "",
          searchResults: {
            query: "",
            mode: "",
            results: [],
          },
        });
      });
    }

    elements.filterButtons.forEach(function (button) {
      const filter = normalizeString(button.getAttribute("data-idx-filter")).toLowerCase();
      if (!STATUS_FILTERS.includes(filter)) return;

      button.addEventListener("click", function () {
        patchState({
          selectedStatusFilter: filter,
        });
      });
    });

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

    if (elements.dropzone) {
      ["dragenter", "dragover"].forEach(function (eventName) {
        elements.dropzone.addEventListener(eventName, function (event) {
          event.preventDefault();
          event.stopPropagation();
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
        const files = Array.from((event.dataTransfer && event.dataTransfer.files) || []);
        uploadFiles(files);
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

    render();
    refreshAuth(false).then(function (session) {
      if (session && session.authenticated) {
        loadDocuments();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-idx-guidance]").forEach(initGuidance);
    qsa(document, "[data-idx-dashboard]").forEach(initDashboard);
  });
})();
