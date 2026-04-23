/**
 * Site-wide analytics dispatcher.
 *
 * Listens for clicks on any element carrying a data-analytics attribute and
 * emits the event through whatever analytics backend happens to be loaded
 * (gtag, dataLayer, plausible) plus a CustomEvent ('eh:analytics') on
 * window so future integrations can subscribe without another redeploy.
 *
 * Event shape:
 *   {
 *     name:   <string>   // value of data-analytics
 *     source: <string>   // value of data-analytics-source (optional)
 *     href:   <string>   // target URL for <a> elements (optional)
 *     meta:   <object>   // any other data-analytics-* attributes, camel-cased
 *   }
 *
 * Conventions (keep names short + snake_case):
 *   cta_contact_click       — primary "start a conversation" CTA
 *   cta_work_click          — "read the full story" / work-page CTAs
 *   idx_demo_start          — IDX demo entry points
 *   newsletter_subscribe    — newsletter sign-ups
 *   theme_toggle            — user flipped dark/light
 *   nav_click               — primary nav link
 *   search_submit           — homepage search form submit
 */
(function () {
  function collectMeta(el) {
    var meta = {};
    if (!el || !el.dataset) return meta;
    Object.keys(el.dataset).forEach(function (key) {
      if (key === "analytics" || key === "analyticsSource") return;
      if (key.indexOf("analytics") === 0) {
        // data-analytics-foo-bar -> fooBar (already camelCased by dataset)
        var short = key.replace(/^analytics/, "");
        short = short.charAt(0).toLowerCase() + short.slice(1);
        meta[short] = el.dataset[key];
      }
    });
    return meta;
  }

  function dispatch(payload) {
    // 1) CustomEvent so page-specific code can subscribe without racing us
    try {
      window.dispatchEvent(new CustomEvent("eh:analytics", { detail: payload }));
    } catch (e) { /* old browsers: no-op */ }

    // 2) Google Analytics (gtag) — if loaded, fire an event
    if (typeof window.gtag === "function") {
      window.gtag("event", payload.name, {
        event_category: payload.source || "site",
        event_label: payload.href || undefined,
      });
    }

    // 3) GTM dataLayer — if in use
    if (Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: payload.name,
        analytics_source: payload.source,
        analytics_href: payload.href,
        analytics_meta: payload.meta,
      });
    }

    // 4) Plausible — tagged events API
    if (typeof window.plausible === "function") {
      window.plausible(payload.name, {
        props: Object.assign(
          { source: payload.source || "site" },
          payload.meta || {},
          payload.href ? { href: payload.href } : {}
        ),
      });
    }
  }

  // Build a payload from an element that carries data-analytics
  function payloadFromElement(el) {
    var href = null;
    if (el.tagName === "A" && el.getAttribute("href")) {
      href = el.getAttribute("href");
    }
    return {
      name: el.dataset.analytics,
      source: el.dataset.analyticsSource || null,
      href: href,
      meta: collectMeta(el),
    };
  }

  // Global click delegation — supports nested markup (e.g. <a><span>)
  document.addEventListener(
    "click",
    function (event) {
      var el = event.target.closest && event.target.closest("[data-analytics]");
      if (!el) return;
      dispatch(payloadFromElement(el));
    },
    { capture: true }
  );

  // Homepage search submit
  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.matches || !form.matches("[data-analytics-submit]")) return;
    dispatch({
      name: form.getAttribute("data-analytics-submit"),
      source: form.getAttribute("data-analytics-source") || "form",
      href: form.getAttribute("action") || null,
      meta: {},
    });
  });

  // Expose for debugging / hand-rolled events from console
  window.ehAnalytics = { dispatch: dispatch };
})();
