(function () {
  const STORAGE_EMAIL_KEY = "mdz_demo_email";

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function nowIso() {
    return new Date().toISOString();
  }

  function getStoredEmail() {
    try {
      return window.localStorage.getItem(STORAGE_EMAIL_KEY) || "";
    } catch {
      return "";
    }
  }

  function setStoredEmail(email) {
    try {
      window.localStorage.setItem(STORAGE_EMAIL_KEY, email);
    } catch {
      /* ignore */
    }
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
  }

  function appendMessage(bodyEl, role, text) {
    const msg = document.createElement("div");
    msg.className = "demo-chat__msg" + (role === "user" ? " demo-chat__msg--user" : "");
    const bubble = document.createElement("div");
    bubble.className = "demo-chat__bubble";
    bubble.textContent = text;
    msg.appendChild(bubble);
    bodyEl.appendChild(msg);
    bodyEl.scrollTop = bodyEl.scrollHeight;
  }

  async function postJson(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const contentType = res.headers.get("content-type") || "";
    let data = null;
    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      const txt = await res.text().catch(() => "");
      data = { reply: txt };
    }
    if (!res.ok) {
      const err = new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function initDemoChat(root) {
    const demoId = root.getAttribute("data-demo-id") || "";
    const chatEndpoint = root.getAttribute("data-chat-endpoint") || "";
    const leadsEndpoint = root.getAttribute("data-leads-endpoint") || "";
    const turnstileSiteKey = root.getAttribute("data-turnstile-site-key") || "";

    const bodyEl = qs(root, "[data-demo-chat-body]");
    const inputEl = qs(root, "[data-demo-chat-input]");
    const sendBtn = qs(root, "[data-demo-chat-send]");
    const resetBtn = qs(root, "[data-demo-chat-reset]");
    const statusEl = qs(root, "[data-demo-chat-status]");
    const hintEl = qs(root, "[data-demo-chat-hint]");

    const modalEl = document.querySelector("[data-demo-email-modal]");
    const modalForm = modalEl ? qs(modalEl, "[data-demo-email-form]") : null;
    const modalEmailInput = modalEl ? qs(modalEl, "[data-demo-email-input]") : null;
    const modalErrorEl = modalEl ? qs(modalEl, "[data-demo-email-error]") : null;
    const modalCancel = modalEl ? qs(modalEl, "[data-demo-email-cancel]") : null;
    const modalOptIn = modalEl ? qs(modalEl, "[data-demo-newsletter-optin]") : null;

    let pendingMessage = "";
    let busy = false;

    function setBusy(v) {
      busy = v;
      if (sendBtn) sendBtn.disabled = v;
      if (resetBtn) resetBtn.disabled = v;
      if (inputEl) inputEl.disabled = v;
      setText(statusEl, v ? "Working…" : "");
    }

    function openModal() {
      if (!modalEl) return;
      if (modalErrorEl) {
        modalErrorEl.style.display = "none";
        modalErrorEl.textContent = "";
      }
      if (modalEmailInput) modalEmailInput.value = getStoredEmail() || "";
      modalEl.setAttribute("aria-hidden", "false");
      setTimeout(() => modalEmailInput && modalEmailInput.focus(), 30);
    }

    function closeModal() {
      if (!modalEl) return;
      modalEl.setAttribute("aria-hidden", "true");
    }

    function getTurnstileTokenForChat() {
      if (!turnstileSiteKey) return Promise.resolve("");
      const el = qs(root, "[data-demo-chat-turnstile]");
      if (!el || !window.turnstile) return Promise.resolve("");

      return new Promise((resolve) => {
        try {
          const widgetId = window.turnstile.render(el, {
            sitekey: turnstileSiteKey,
            size: "invisible",
            callback: (token) => {
              try {
                window.turnstile.remove(widgetId);
              } catch {
                /* ignore */
              }
              resolve(token || "");
            },
            "error-callback": () => {
              try {
                window.turnstile.remove(widgetId);
              } catch {
                /* ignore */
              }
              resolve("");
            },
          });
          window.turnstile.execute(widgetId);
        } catch {
          resolve("");
        }
      });
    }

    function getTurnstileTokenFromModal() {
      if (!turnstileSiteKey) return "";
      const el = modalEl ? qs(modalEl, "[data-demo-email-turnstile]") : null;
      if (!el) return "";
      const response = el.querySelector('textarea[name="cf-turnstile-response"], input[name="cf-turnstile-response"]');
      return response && response.value ? response.value : "";
    }

    async function captureLead(email) {
      if (!leadsEndpoint) return;
      const payload = {
        email,
        source: "demo_gate",
        demo: demoId,
        pageUrl: window.location.href,
        ts: nowIso(),
        newsletterOptIn: !!(modalOptIn && modalOptIn.checked),
      };
      const token = getTurnstileTokenFromModal();
      if (token) payload.turnstileToken = token;
      await postJson(leadsEndpoint, payload);
    }

    async function ensureEmailGate() {
      const email = getStoredEmail();
      if (validEmail(email)) return email;
      openModal();
      return "";
    }

    async function sendMessage(message) {
      if (!chatEndpoint) {
        appendMessage(bodyEl, "assistant", "Chat endpoint is not configured yet.");
        return;
      }

      const email = getStoredEmail();
      const turnstileToken = await getTurnstileTokenForChat();
      const payload = {
        message,
        demo_id: demoId,
        pageContext: { url: window.location.href, title: document.title },
      };
      if (validEmail(email)) payload.email = email;
      if (turnstileToken) payload.turnstileToken = turnstileToken;

      const data = await postJson(chatEndpoint, payload);
      const reply = (data && (data.reply || data.response || data.output || data.text)) || "";
      appendMessage(bodyEl, "assistant", reply || "No response.");
    }

    async function sendUserTurn(message, includeStatusCode) {
      appendMessage(bodyEl, "user", message);
      try {
        setBusy(true);
        await sendMessage(message);
      } catch (e) {
        const status = includeStatusCode && e && e.status ? ` (${e.status})` : "";
        appendMessage(bodyEl, "assistant", `Sorry—something went wrong${status}. Please try again.`);
      } finally {
        setBusy(false);
      }
    }

    async function onSend() {
      if (busy) return;
      const msg = String((inputEl && inputEl.value) || "").trim();
      if (!msg) return;

      if (!(await ensureEmailGate())) {
        pendingMessage = msg;
        setText(hintEl, "Enter your email to unlock chat.");
        return;
      }

      setText(hintEl, "");
      if (inputEl) inputEl.value = "";
      await sendUserTurn(msg, true);
    }

    function onReset() {
      if (!bodyEl) return;
      bodyEl.innerHTML = "";
      appendMessage(bodyEl, "assistant", "Conversation reset. Ask a new question.");
    }

    if (sendBtn) sendBtn.addEventListener("click", onSend);
    if (resetBtn) resetBtn.addEventListener("click", onReset);
    if (inputEl) {
      inputEl.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") onSend();
      });
    }

    if (modalCancel) modalCancel.addEventListener("click", () => closeModal());
    if (modalEl) {
      modalEl.addEventListener("click", (e) => {
        if (e.target === modalEl) closeModal();
      });
    }

    if (modalForm) {
      modalForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!modalEmailInput) return;
        const email = String(modalEmailInput.value || "").trim();
        if (!validEmail(email)) {
          if (modalErrorEl) {
            modalErrorEl.style.display = "block";
            modalErrorEl.textContent = "Please enter a valid email address.";
          }
          return;
        }
        try {
          if (modalErrorEl) {
            modalErrorEl.style.display = "none";
            modalErrorEl.textContent = "";
          }
          await captureLead(email);
          setStoredEmail(email);
          closeModal();

          if (pendingMessage) {
            const msg = pendingMessage;
            pendingMessage = "";
            await sendUserTurn(msg, false);
          }
        } catch (err) {
          if (modalErrorEl) {
            modalErrorEl.style.display = "block";
            modalErrorEl.textContent =
              "Could not save your email right now. Please try again in a moment.";
          }
        }
      });
    }
  }

  function initLoginCapture() {
    const pageEl = document.querySelector("[data-lead-capture]");
    if (!pageEl) return;
    const leadsEndpoint = pageEl.getAttribute("data-leads-endpoint") || "";
    const turnstileSiteKey = pageEl.getAttribute("data-turnstile-site-key") || "";
    const form = qs(pageEl, "[data-lead-form]");
    const emailInput = qs(pageEl, "[data-lead-email]");
    const msgEl = qs(pageEl, "[data-lead-msg]");
    if (!form || !emailInput) return;

    emailInput.value = getStoredEmail() || "";

    function getTurnstileTokenFromPage() {
      if (!turnstileSiteKey) return "";
      const el = qs(pageEl, "[data-lead-turnstile]");
      if (!el) return "";
      const response = el.querySelector('textarea[name="cf-turnstile-response"], input[name="cf-turnstile-response"]');
      return response && response.value ? response.value : "";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = String(emailInput.value || "").trim();
      if (!validEmail(email)) {
        setText(msgEl, "Please enter a valid email.");
        return;
      }
      setText(msgEl, "Saving…");
      try {
        if (leadsEndpoint) {
          const payload = {
            email,
            source: "login",
            pageUrl: window.location.href,
            ts: nowIso(),
          };
          const token = getTurnstileTokenFromPage();
          if (token) payload.turnstileToken = token;
          await postJson(leadsEndpoint, payload);
        }
        setStoredEmail(email);
        setText(msgEl, "Done. You can now use the demos.");
      } catch {
        setText(msgEl, "Could not save right now. Please try again.");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    qsa(document, "[data-demo-chat]").forEach(initDemoChat);
    initLoginCapture();
  });
})();
