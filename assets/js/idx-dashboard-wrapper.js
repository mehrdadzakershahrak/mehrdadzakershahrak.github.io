(function () {
  const IDX_V2_PORTAL_URL = "https://idx.mehrdadzaker.com/v2/portal";
  const IDX_LOGIN_URL =
    "https://idx.mehrdadzaker.com/auth/login?return_to=" + encodeURIComponent(IDX_V2_PORTAL_URL);

  function qs(root, sel) {
    return root.querySelector(sel);
  }

  function setText(el, text) {
    if (!el) return;
    el.textContent = text || "";
  }

  async function initWrapper() {
    const root = document.querySelector("[data-idx-dashboard-wrapper]");
    if (!root) return;

    const loginLink = qs(root, "[data-idx-dashboard-login]");
    const statusTitle = qs(root, "[data-idx-dashboard-status-title]");
    const statusCopy = qs(root, "[data-idx-dashboard-status-copy]");
    const detail = qs(root, "[data-idx-dashboard-detail]");

    if (loginLink) {
      loginLink.href = IDX_LOGIN_URL;
    }

    setText(statusTitle, "Opening IDX v2");
    setText(statusCopy, "Redirecting to the live portal now.");
    setText(
      detail,
      "This page is a static handoff only. Product auth and all supported workflows now live on idx.mehrdadzaker.com."
    );
    window.location.replace(IDX_V2_PORTAL_URL);
  }

  document.addEventListener("DOMContentLoaded", function () {
    initWrapper();
  });
})();
