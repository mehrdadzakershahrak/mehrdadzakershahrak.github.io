(function () {
  // ---------- Mobile drawer w/ focus trap -------------------------------
  function initMastheadMenu() {
    var wrap = document.querySelector("[data-mdz-menu-wrap]");
    if (!wrap) return;

    var toggle = wrap.querySelector("[data-mdz-menu-toggle]");
    var overlay = wrap.querySelector("[data-mdz-menu-overlay]");
    var closeBtn = wrap.querySelector("[data-mdz-menu-close]");
    var menuLinks = overlay ? overlay.querySelectorAll("a") : [];
    if (!toggle || !overlay) return;

    var lastFocus = null;

    function focusables() {
      return overlay.querySelectorAll(
        'a, button, [tabindex]:not([tabindex="-1"])'
      );
    }

    function trap(event) {
      if (!wrap.classList.contains("is-open")) return;
      if (event.key !== "Tab") return;
      var nodes = focusables();
      if (!nodes.length) return;
      var first = nodes[0];
      var last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    function setOpen(state) {
      wrap.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
      overlay.setAttribute("aria-hidden", state ? "false" : "true");
      document.body.classList.toggle("mdz-menu-lock", state);
      if (state) {
        lastFocus = document.activeElement;
        // Defer so the drawer is paint-ready before we move focus.
        window.requestAnimationFrame(function () {
          if (closeBtn) closeBtn.focus();
        });
      } else if (lastFocus && typeof lastFocus.focus === "function") {
        lastFocus.focus();
      }
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      setOpen(!wrap.classList.contains("is-open"));
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        setOpen(false);
      });
    }

    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) setOpen(false);
    });

    menuLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setOpen(false);
      trap(event);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && wrap.classList.contains("is-open")) {
        setOpen(false);
      }
    });

    setOpen(false);
  }

  // ---------- Shrink-on-scroll for the sticky masthead -------------------
  function initMastheadScroll() {
    var masthead = document.querySelector(".mdz-masthead");
    if (!masthead) return;

    var ticking = false;
    var threshold = 8;

    function update() {
      var scrolled = window.scrollY > threshold;
      masthead.classList.toggle("is-scrolled", scrolled);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
  }

  // ---------- Theme toggle (dark mode, Stage 9) --------------------------
  function initThemeToggle() {
    var btn = document.querySelector("[data-mdz-theme-toggle]");
    var root = document.documentElement;
    if (!btn) return;

    function applyTheme(theme) {
      if (theme === "dark") {
        root.setAttribute("data-theme", "dark");
      } else {
        root.setAttribute("data-theme", "light");
      }
      btn.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
      btn.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }

    // Source-of-truth order: stored > data-theme already on <html> > OS pref.
    var stored = null;
    try {
      stored = window.localStorage.getItem("mdz-theme");
    } catch (e) {
      stored = null;
    }
    var initial = stored || root.getAttribute("data-theme") ||
      (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light");
    applyTheme(initial);

    btn.addEventListener("click", function () {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        window.localStorage.setItem("mdz-theme", next);
      } catch (e) {
        /* private mode / storage disabled — ignore */
      }
    });
  }

  function boot() {
    initMastheadMenu();
    initMastheadScroll();
    initThemeToggle();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
