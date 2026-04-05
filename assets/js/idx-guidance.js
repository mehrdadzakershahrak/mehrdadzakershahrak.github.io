(function () {
  const INDUSTRY_PRESETS = {
    legal: {
      title: "Legal document review with uploaded sources",
      intro:
        "Upload contracts and related source material when you need faster clause review without losing the exact language on the page. IDX helps legal teams ask focused questions across agreements, exhibits, and policies, then verify the answer against the cited source before sharing it.",
      documentsTitle: "Good documents to upload",
      documents: [
        "MSAs, NDAs, order forms, statements of work, policy documents, and exhibit packs.",
        "Diligence files that combine core agreements with amendments, schedules, and supporting attachments.",
        "Internal policy or compliance material that needs comparison against contract language.",
      ],
      promptsTitle: "Example prompts",
      prompts: [
        "What renewal dates, notice periods, and termination triggers appear in these agreements? Include the source pages.",
        "Show me the liability caps, indemnity language, and any carve-outs across this document set.",
        "Which required clauses are missing or inconsistent between the MSA, SOW, and order form?",
      ],
      valueTitle: "Why source-backed answers matter here",
      valueSummary:
        "Legal review depends on exact wording. Source-backed answers help teams move faster on first-pass analysis while keeping the clause and page reference visible for review.",
    },
    finance: {
      title: "Finance document review with uploaded sources",
      intro:
        "Use IDX when the answer is buried in filings, reporting packs, lender materials, or investment memos. It helps finance teams pull fast answers from uploaded source material while keeping the supporting page attached to the result.",
      documentsTitle: "Good documents to upload",
      documents: [
        "10-Ks, 10-Qs, board decks, investment committee memos, and quarterly reporting packs.",
        "Lender packages, covenant schedules, audit support PDFs, and supporting reference documents.",
        "Mixed source sets where narrative, numbers, and footnotes need to be checked together.",
      ],
      promptsTitle: "Example prompts",
      prompts: [
        "What risks, covenant terms, or liquidity constraints are mentioned in these sources? Cite the source pages.",
        "Where do the revenue, margin, or cash-flow assumptions change between the board deck and the memo?",
        "Find the passages that support this number and show me the original page references.",
      ],
      valueTitle: "Why source-backed answers matter here",
      valueSummary:
        "Finance workflows need traceable support, not just a summary. IDX ties each answer back to the source file so teams can validate numbers and narrative before they circulate.",
    },
    "real-estate": {
      title: "Real estate document review with uploaded sources",
      intro:
        "Real estate review often spans leases, diligence reports, listing packets, and operating documents. IDX helps you ask focused questions across the source set and jump back to the cited page before the answer moves into a deal conversation.",
      documentsTitle: "Good documents to upload",
      documents: [
        "Leases, estoppels, property condition reports, diligence binders, and listing packets.",
        "Inspection reports, title-related PDFs, and supporting transaction documents that need cross-reference review.",
        "Deal files where obligations, deadlines, and property risks are spread across multiple sources.",
      ],
      promptsTitle: "Example prompts",
      prompts: [
        "What rent escalations, renewal options, and notice deadlines appear in these lease documents?",
        "Summarize the property risks or deferred maintenance items mentioned in the inspection and diligence reports.",
        "Where do these documents disagree on obligations, dates, or property details? Include sources.",
      ],
      valueTitle: "Why source-backed answers matter here",
      valueSummary:
        "Deals move across many files and small details matter. Source-backed answers make it easier to review faster without losing the exact page where the obligation, date, or risk appears.",
    },
    healthcare: {
      title: "Healthcare administrative review with uploaded sources",
      intro:
        "Healthcare administrative work often involves intake packets, policies, consent forms, and care-related sources that must be reviewed carefully. IDX helps teams ask source-specific questions and keep the answer tied to the original page for administrative review.",
      documentsTitle: "Good documents to upload",
      documents: [
        "Intake packets, payer forms, consent documents, and administrative policy binders.",
        "Care-plan paperwork, discharge instructions, and supporting sources used in administrative handoffs.",
        "Document sets where missing fields, required forms, or policy requirements need to be checked quickly.",
      ],
      promptsTitle: "Example prompts",
      prompts: [
        "Which required fields, signatures, or attachments are missing from these intake or consent documents?",
        "What does this policy packet say about the documentation required for this administrative workflow?",
        "Show me the source passages that answer this operational question so I can review the underlying page.",
      ],
      valueTitle: "Why source-backed answers matter here",
      valueSummary:
        "In healthcare operations, answers need to stay grounded in the source set. IDX helps teams review faster while keeping citations visible for administrative confirmation.",
    },
    procurement: {
      title: "Procurement review with uploaded sources",
      intro:
        "Procurement work is full of RFQs, vendor submissions, statements of work, and pricing sheets that need side-by-side review. IDX helps teams upload the source set, ask targeted questions, and trace every answer back to the source page.",
      documentsTitle: "Good documents to upload",
      documents: [
        "RFPs, RFQs, vendor proposals, statements of work, and requirements matrices.",
        "Pricing attachments, compliance documents, and supporting vendor response material.",
        "Procurement packets where deadlines, deliverables, and non-compliance risks need to be compared quickly.",
      ],
      promptsTitle: "Example prompts",
      prompts: [
        "What submission deadlines, mandatory requirements, and evaluation criteria appear across these procurement sources?",
        "Which vendor response items look non-compliant, incomplete, or unsupported by the requested document?",
        "Compare the pricing sheets and statements of work and show where the terms or deliverables differ.",
      ],
      valueTitle: "Why source-backed answers matter here",
      valueSummary:
        "Procurement decisions depend on comparing source material quickly and defensibly. Source-backed answers help teams move faster while preserving the trail behind each finding.",
    },
  };

  function qs(root, selector) {
    return root.querySelector(selector);
  }

  function qsa(root, selector) {
    return Array.from(root.querySelectorAll(selector));
  }

  function setText(node, value) {
    if (!node) return;
    node.textContent = value || "";
  }

  function setList(root, values, className) {
    if (!root) return;
    root.innerHTML = "";
    values.forEach(function (value) {
      const item = document.createElement("li");
      if (className) item.className = className;
      item.textContent = value;
      root.appendChild(item);
    });
  }

  function normalizePreset(value) {
    const key = String(value || "").trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(INDUSTRY_PRESETS, key) ? key : "legal";
  }

  function selectPreset(root, presetKey, moveFocus) {
    const key = normalizePreset(presetKey);
    const preset = INDUSTRY_PRESETS[key];
    const tabs = qsa(root, "[data-idx-industry-tab]");

    tabs.forEach(function (tab) {
      const selected = normalizePreset(tab.getAttribute("data-idx-industry-tab")) === key;
      tab.setAttribute("aria-selected", selected ? "true" : "false");
      tab.setAttribute("tabindex", selected ? "0" : "-1");
      if (selected && moveFocus) tab.focus();
    });

    setText(qs(root, "[data-idx-industry-title]"), preset.title);
    setText(qs(root, "[data-idx-industry-intro]"), preset.intro);
    setText(qs(root, "[data-idx-industry-documents-title]"), preset.documentsTitle);
    setList(qs(root, "[data-idx-industry-documents]"), preset.documents, "mdz-idx__instruction-item");
    setText(qs(root, "[data-idx-industry-prompts-title]"), preset.promptsTitle);
    setList(qs(root, "[data-idx-industry-prompts]"), preset.prompts, "mdz-idx__prompt-item");
    setText(qs(root, "[data-idx-industry-value-title]"), preset.valueTitle);
    setText(qs(root, "[data-idx-industry-value-summary]"), preset.valueSummary);
  }

  function initGuidance(root) {
    const tabs = qsa(root, "[data-idx-industry-tab]");
    if (!tabs.length) return;

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectPreset(root, tab.getAttribute("data-idx-industry-tab"), false);
      });
      tab.addEventListener("keydown", function (event) {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
          return;
        }
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = tabs.length - 1;
        const nextTab = tabs[nextIndex];
        selectPreset(root, nextTab.getAttribute("data-idx-industry-tab"), true);
      });
    });

    const selected = tabs.find(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    });
    selectPreset(root, selected ? selected.getAttribute("data-idx-industry-tab") : "legal", false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-idx-guidance]").forEach(initGuidance);
  });
})();
