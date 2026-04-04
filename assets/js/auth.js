(function () {
  const config = window.MDZ_AUTH_CONFIG || {};
  const configuredAuthApiBaseUrl = String(config.authApiBaseUrl || "").replace(/\/+$/, "");
  const configuredIdxApiBaseUrl = String(config.idxApiBaseUrl || "").replace(/\/+$/, "");
  const googleClientId = String(config.googleClientId || "").trim();
  const loginUrl = String(config.loginUrl || "/login/");
  const defaultReturnTo = String(config.defaultReturnTo || "/idx/dashboard/");
  const LOCAL_PREVIEW_STORAGE_KEY = "mdz_idx_local_preview_session_v1";
  const localDev = isLocalHostname(window.location.hostname);
  const authApiBaseUrl = resolveAuthApiBaseUrl();
  const idxApiBaseUrl = resolveIdxApiBaseUrl();

  let sessionPromise = null;

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

  function isConfigured() {
    return Boolean(authApiBaseUrl);
  }

  function isLocalHostname(hostname) {
    return hostname === "127.0.0.1" || hostname === "localhost";
  }

  function resolveLocalServiceBaseUrl(port) {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }

  function resolveAuthApiBaseUrl() {
    if (localDev) return resolveLocalServiceBaseUrl(8787);
    return configuredAuthApiBaseUrl;
  }

  function resolveIdxApiBaseUrl() {
    if (localDev) return resolveLocalServiceBaseUrl(8000);
    return configuredIdxApiBaseUrl;
  }

  function currentRelativeUrl() {
    return window.location.pathname + window.location.search + window.location.hash;
  }

  function sanitizeReturnTo(raw) {
    const fallback = defaultReturnTo;
    if (!raw) return fallback;

    try {
      const url = new URL(raw, window.location.origin);
      if (url.origin !== window.location.origin) return fallback;
      const relative = url.pathname + url.search + url.hash;
      if (!relative.startsWith("/") || relative.startsWith("//")) return fallback;
      return relative;
    } catch {
      return fallback;
    }
  }

  function buildLoginUrl(returnTo) {
    const target = sanitizeReturnTo(returnTo || currentRelativeUrl());
    const url = new URL(loginUrl, window.location.origin);
    url.searchParams.set("returnTo", target);
    return url.pathname + url.search + url.hash;
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

    const res = await fetch(url, request);
    const contentType = res.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await res.json().catch(() => null);
    } else {
      const text = await res.text().catch(() => "");
      data = text ? { message: text } : null;
    }

    if (!res.ok) {
      const err = new Error((data && (data.error || data.message)) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data || {};
  }

  function isNetworkStyleError(error) {
    const message = String((error && error.message) || "").toLowerCase();
    return error instanceof TypeError || /failed to fetch|load failed|networkerror|network request failed/.test(message);
  }

  function readLocalPreviewSession() {
    if (!localDev) return null;
    try {
      const raw = window.localStorage.getItem(LOCAL_PREVIEW_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed && parsed.enabled ? parsed : null;
    } catch (_error) {
      return null;
    }
  }

  function isLocalPreviewEnabled() {
    return !!readLocalPreviewSession();
  }

  function enableLocalPreview() {
    if (!localDev) return { authenticated: false };
    try {
      window.localStorage.setItem(
        LOCAL_PREVIEW_STORAGE_KEY,
        JSON.stringify({
          enabled: true,
          activatedAt: new Date().toISOString(),
        })
      );
    } catch (_error) {
      /* ignore storage failures */
    }

    sessionPromise = Promise.resolve({
      authenticated: true,
      previewMode: true,
    });

    return {
      authenticated: true,
      previewMode: true,
    };
  }

  function clearLocalPreview() {
    if (!localDev) return;
    try {
      window.localStorage.removeItem(LOCAL_PREVIEW_STORAGE_KEY);
    } catch (_error) {
      /* ignore storage failures */
    }
  }

  async function getSession(forceRefresh) {
    if (isLocalPreviewEnabled()) {
      return {
        authenticated: true,
        previewMode: true,
      };
    }
    if (!isConfigured()) return { authenticated: false, missingConfig: true };
    if (sessionPromise && !forceRefresh) return sessionPromise;

    sessionPromise = fetchJson(authApiBaseUrl + "/auth/session", { method: "GET" })
      .then((data) => ({
        authenticated: !!data.authenticated,
        previewMode: false,
      }))
      .catch((err) => {
        if (localDev && isNetworkStyleError(err)) {
          return {
            authenticated: false,
            error: err,
            localPreviewAvailable: true,
            localServiceUnavailable: true,
          };
        }
        if (err && (err.status === 401 || err.status === 403)) {
          return { authenticated: false };
        }
        return { authenticated: false, error: err };
      });

    return sessionPromise;
  }

  async function logout() {
    clearLocalPreview();
    if (!isConfigured()) return { authenticated: false };
    try {
      await fetchJson(authApiBaseUrl + "/auth/logout", { method: "POST" });
    } catch {
      /* ignore logout errors on the client */
    } finally {
      sessionPromise = Promise.resolve({ authenticated: false });
    }
    return { authenticated: false };
  }

  async function exchangeGoogleCredential(credential) {
    return fetchJson(authApiBaseUrl + "/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: credential }),
    });
  }

  function ensureLocalPreviewButton(root, returnTo) {
    if (!localDev || !root) return null;

    let button = qs(root, "[data-local-preview-button]");
    if (button) return button;

    button = document.createElement("button");
    button.type = "button";
    button.className = "btn btn--primary mdz-cta";
    button.setAttribute("data-local-preview-button", "true");
    button.textContent = "Continue in local preview";
    button.addEventListener("click", function () {
      enableLocalPreview();
      window.location.assign(returnTo);
    });
    root.appendChild(button);
    return button;
  }

  function setAuthLinkLabel(link, label) {
    const labelEl = link.querySelector("[data-auth-link-label]") || link.querySelector("span");
    if (labelEl) {
      labelEl.textContent = label;
    } else {
      link.textContent = label;
    }
  }

  function refreshAuthLinks(session) {
    qsa(document, "[data-auth-link]").forEach((link) => {
      const loginLabel = link.getAttribute("data-login-label") || "Login";
      const logoutLabel = link.getAttribute("data-logout-label") || "Sign Out";

      if (session && session.authenticated) {
        link.setAttribute("href", "#");
        link.setAttribute("data-auth-mode", "logout");
        setAuthLinkLabel(link, logoutLabel);
      } else {
        link.setAttribute("href", buildLoginUrl(currentRelativeUrl()));
        link.setAttribute("data-auth-mode", "login");
        setAuthLinkLabel(link, loginLabel);
      }
    });
  }

  async function initAuthLinks() {
    if (!qsa(document, "[data-auth-link]").length) return;
    const session = await getSession(false);
    refreshAuthLinks(session);
  }

  async function initLoginPage() {
    const root = document.querySelector("[data-google-login]");
    if (!root) return;

    const msgEl = qs(root, "[data-google-login-msg]");
    const buttonEl = qs(root, "[data-google-login-button]");
    const params = new URLSearchParams(window.location.search);
    const returnTo = sanitizeReturnTo(params.get("returnTo"));
    const previewButton = ensureLocalPreviewButton(root, returnTo);

    if (params.get("logout") === "1") {
      setText(msgEl, "Signing out…");
      await logout();
      params.delete("logout");
      const next = window.location.pathname + (params.toString() ? "?" + params.toString() : "");
      window.history.replaceState({}, "", next);
    }

    if (!isConfigured()) {
      setText(
        msgEl,
        localDev
          ? "Local auth is not available. Continue in local preview or start the auth and IDX services."
          : "Auth service is not configured yet. Set auth_api_base_url to enable Google sign-in."
      );
      return;
    }

    setText(msgEl, "Checking sign-in status…");
    const session = await getSession(true);
    refreshAuthLinks(session);

    if (session.authenticated) {
      window.location.assign(returnTo);
      return;
    }

    if (session.localServiceUnavailable && localDev) {
      setText(msgEl, "Local auth is not running. Continue in local preview or start the auth and IDX services.");
      if (previewButton) previewButton.hidden = false;
      return;
    }

    if (!googleClientId) {
      setText(
        msgEl,
        localDev
          ? "Google sign-in is not configured for the local auth service. Continue in local preview or configure the service."
          : "Google sign-in is not configured yet. Set google_client_id to render the sign-in button."
      );
      return;
    }

    if (!(window.google && window.google.accounts && window.google.accounts.id)) {
      setText(
        msgEl,
        localDev
          ? "Google sign-in could not load locally. Continue in local preview or refresh and try again."
          : "Google sign-in could not load. Refresh and try again."
      );
      return;
    }

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: async function (response) {
        if (!response || !response.credential) {
          setText(msgEl, "Google sign-in did not return a credential. Please try again.");
          return;
        }

        setText(msgEl, "Signing you in…");

        try {
          const result = await exchangeGoogleCredential(response.credential);
          sessionPromise = Promise.resolve({
            authenticated: !!result.authenticated,
          });
          refreshAuthLinks(await sessionPromise);
          window.location.assign(returnTo);
        } catch (err) {
          setText(msgEl, (err && err.message) || "Could not complete Google sign-in. Please try again.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonEl, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "pill",
      width: 340,
    });

    setText(msgEl, "Use your Google account to continue.");
  }

  document.addEventListener("click", function (event) {
    const link = event.target.closest("[data-auth-link][data-auth-mode='logout']");
    if (!link) return;

    event.preventDefault();

    logout().finally(function () {
      window.location.assign(currentRelativeUrl());
    });
  });

  window.MdzAuth = {
    buildLoginUrl: buildLoginUrl,
    enableLocalPreview: enableLocalPreview,
    getApiBaseUrl: function () {
      return authApiBaseUrl;
    },
    getIdxApiBaseUrl: function () {
      return idxApiBaseUrl;
    },
    getSession: getSession,
    isLocalDev: function () {
      return localDev;
    },
    isLocalPreview: isLocalPreviewEnabled,
    isConfigured: isConfigured,
    logout: logout,
  };

  document.addEventListener("DOMContentLoaded", function () {
    initAuthLinks();
    initLoginPage();
  });
})();
