/**
 * Static RAG demo switcher (Stage 10).
 *
 * Wires up [data-mdz-rag-root] to behave as a WAI-ARIA tablist:
 *  - click a tab → activate matching panel, hide others
 *  - Left/Right/Home/End → roving tabindex between tabs
 *  - Enter/Space on a focused tab → activate
 *
 * If JS is disabled the first panel is already the only one without
 * [hidden], so the component degrades to a static card.
 */
(function () {
  function initRagDemo(root) {
    var tabs = Array.prototype.slice.call(
      root.querySelectorAll("[data-mdz-rag-tab]")
    );
    var panels = Array.prototype.slice.call(
      root.querySelectorAll("[data-mdz-rag-panel]")
    );
    if (!tabs.length || !panels.length) return;

    function activate(tab, opts) {
      opts = opts || {};
      var key = tab.getAttribute("data-mdz-rag-tab");

      tabs.forEach(function (t) {
        var isActive = t === tab;
        t.classList.toggle("is-active", isActive);
        t.setAttribute("aria-selected", isActive ? "true" : "false");
        t.setAttribute("tabindex", isActive ? "0" : "-1");
      });

      panels.forEach(function (p) {
        var isMatch = p.getAttribute("data-mdz-rag-panel") === key;
        p.classList.toggle("is-active", isMatch);
        if (isMatch) {
          p.removeAttribute("hidden");
        } else {
          p.setAttribute("hidden", "");
        }
      });

      if (opts.focus !== false) tab.focus();
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        activate(tab, { focus: false });
      });

      tab.addEventListener("keydown", function (event) {
        var nextIndex = null;
        switch (event.key) {
          case "ArrowRight":
            nextIndex = (index + 1) % tabs.length;
            break;
          case "ArrowLeft":
            nextIndex = (index - 1 + tabs.length) % tabs.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = tabs.length - 1;
            break;
          default:
            return;
        }
        event.preventDefault();
        activate(tabs[nextIndex]);
      });
    });
  }

  function boot() {
    var roots = document.querySelectorAll("[data-mdz-rag-root]");
    roots.forEach(initRagDemo);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
