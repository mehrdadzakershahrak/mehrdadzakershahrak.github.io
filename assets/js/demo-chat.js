(function () {
  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from(root.querySelectorAll(sel));
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
  }

  function currentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function resetConversation(bodyEl, text) {
    if (!bodyEl) return;
    bodyEl.innerHTML = "";
    appendMessage(bodyEl, "assistant", text);
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
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = res.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => "");
      data = { reply: text };
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
    const auth = window.MdzAuth;
    const demoId = root.getAttribute("data-demo-id") || "";

    const bodyEl = qs(root, "[data-demo-chat-body]");
    const inputEl = qs(root, "[data-demo-chat-input]");
    const sendBtn = qs(root, "[data-demo-chat-send]");
    const resetBtn = qs(root, "[data-demo-chat-reset]");
    const statusEl = qs(root, "[data-demo-chat-status]");
    const hintEl = qs(root, "[data-demo-chat-hint]");
    const footerEl = qs(root, "[data-demo-chat-footer]");
    const gateEl = qs(root, "[data-demo-chat-gate]");
    const gateMsgEl = qs(root, "[data-demo-chat-gate-msg]");
    const gateLinkEl = qs(root, "[data-demo-chat-login]");

    const authApiBaseUrl = auth && auth.getApiBaseUrl ? auth.getApiBaseUrl() : "";
    const chatEndpoint = authApiBaseUrl ? authApiBaseUrl.replace(/\/+$/, "") + "/api/demo-chat" : "";

    let busy = false;
    let authenticated = false;

    function setBusy(value) {
      busy = value;
      if (sendBtn) sendBtn.disabled = value || !authenticated;
      if (resetBtn) resetBtn.disabled = value || !authenticated;
      if (inputEl) inputEl.disabled = value || !authenticated;
      setText(statusEl, value ? "Working…" : authenticated ? "Signed in" : "");
    }

    function showGate(message, showButton) {
      authenticated = false;
      if (footerEl) footerEl.hidden = true;
      if (gateEl) gateEl.hidden = false;
      if (gateMsgEl) gateMsgEl.textContent = message;
      if (gateLinkEl) {
        gateLinkEl.hidden = !showButton;
        if (auth && auth.buildLoginUrl) {
          gateLinkEl.href = auth.buildLoginUrl(currentRelativeUrl());
        }
      }
      resetConversation(bodyEl, message);
      setText(hintEl, "");
      setBusy(false);
    }

    function showChatReady() {
      authenticated = true;
      if (footerEl) footerEl.hidden = false;
      if (gateEl) gateEl.hidden = true;
      if (!bodyEl.children.length || bodyEl.children.length === 1) {
        resetConversation(bodyEl, "Ask a question to try this demo.");
      }
      setText(hintEl, "");
      setBusy(false);
    }

    async function ensureSession() {
      if (!auth || !auth.isConfigured || !auth.isConfigured()) {
        showGate("Sign-in is not configured yet. Set auth_api_base_url and google_client_id to enable this demo.", false);
        return false;
      }

      setText(statusEl, "Checking sign-in…");
      const session = await auth.getSession(true);

      if (session && session.authenticated) {
        showChatReady();
        return true;
      }

      showGate("Sign in with Google to use this demo.", true);
      return false;
    }

    async function sendMessage(message) {
      if (!chatEndpoint) {
        appendMessage(bodyEl, "assistant", "Chat endpoint is not configured yet.");
        return;
      }

      const payload = {
        demo_id: demoId,
        message,
        pageContext: {
          url: window.location.href,
          title: document.title,
        },
      };

      const data = await postJson(chatEndpoint, payload);
      const reply = (data && (data.reply || data.response || data.output || data.text)) || "";
      appendMessage(bodyEl, "assistant", reply || "No response.");
    }

    async function onSend() {
      if (busy) return;

      const message = String((inputEl && inputEl.value) || "").trim();
      if (!message) return;

      if (!authenticated) {
        if (auth && auth.buildLoginUrl) {
          window.location.assign(auth.buildLoginUrl(currentRelativeUrl()));
        }
        return;
      }

      appendMessage(bodyEl, "user", message);
      if (inputEl) inputEl.value = "";

      try {
        setBusy(true);
        await sendMessage(message);
      } catch (err) {
        if (err && (err.status === 401 || err.status === 403)) {
          showGate("Your session expired. Sign in again to continue using this demo.", true);
          return;
        }
        appendMessage(bodyEl, "assistant", "Sorry—something went wrong. Please try again.");
      } finally {
        if (authenticated) setBusy(false);
      }
    }

    function onReset() {
      resetConversation(bodyEl, authenticated ? "Conversation reset. Ask a new question." : "Sign in with Google to use this demo.");
    }

    if (sendBtn) sendBtn.addEventListener("click", onSend);
    if (resetBtn) resetBtn.addEventListener("click", onReset);
    if (inputEl) {
      inputEl.addEventListener("keydown", (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === "Enter") onSend();
      });
    }

    ensureSession().catch(() => {
      showGate("Could not verify your sign-in state right now. Please try again in a moment.", true);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-demo-chat]").forEach(initDemoChat);
  });
})();
