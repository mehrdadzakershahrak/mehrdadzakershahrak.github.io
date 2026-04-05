(function () {
  const IDX_V2_PORTAL_URL = "https://idx.mehrdadzaker.com/v2/portal";
  const RETURN_TO = "/idx/dashboard/";

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

    const auth = window.MdzAuth || null;
    const loginLink = qs(root, "[data-idx-dashboard-login]");
    const statusTitle = qs(root, "[data-idx-dashboard-status-title]");
    const statusCopy = qs(root, "[data-idx-dashboard-status-copy]");
    const detail = qs(root, "[data-idx-dashboard-detail]");

    if (loginLink && auth && typeof auth.buildLoginUrl === "function") {
      loginLink.href = auth.buildLoginUrl(RETURN_TO);
    }

    if (!auth || typeof auth.getSession !== "function") {
      setText(statusTitle, "Website sign-in required");
      setText(statusCopy, "This wrapper could not load the website auth helper. Sign in first, then open IDX v2.");
      return;
    }

    setText(statusTitle, "Checking sign-in");
    setText(statusCopy, "Verifying website access before opening IDX v2.");

    const session = await auth.getSession(true);
    if (session && session.authenticated) {
      setText(statusTitle, "Opening IDX v2");
      setText(statusCopy, "You are signed in. Redirecting to the live portal now.");
      window.location.replace(IDX_V2_PORTAL_URL);
      return;
    }

    setText(statusTitle, "Website sign-in required");
    if (session && session.localServiceUnavailable) {
      setText(
        statusCopy,
        "Local auth is not running. Start the local auth stub or use the direct IDX v2 link if you want to bypass the website wrapper."
      );
    } else if (session && session.missingConfig) {
      setText(statusCopy, "The website auth service is not configured yet. Sign-in cannot be verified from this wrapper.");
    } else {
      setText(statusCopy, "Sign in on this site first, then this page will hand you off to IDX v2.");
    }

    if (detail) {
      setText(
        detail,
        "This wrapper no longer loads the old website dashboard client. It only checks website sign-in and forwards into the live app."
      );
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    initWrapper();
  });
})();
