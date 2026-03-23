(function () {
  function initMastheadMenu() {
    var wrap = document.querySelector("[data-mdz-menu-wrap]");
    if (!wrap) return;

    var toggle = wrap.querySelector("[data-mdz-menu-toggle]");
    var overlay = wrap.querySelector("[data-mdz-menu-overlay]");
    var closeBtn = wrap.querySelector("[data-mdz-menu-close]");
    var menuLinks = overlay ? overlay.querySelectorAll("a") : [];
    if (!toggle || !overlay) return;

    function setOpen(state) {
      wrap.classList.toggle("is-open", state);
      toggle.setAttribute("aria-expanded", state ? "true" : "false");
      overlay.setAttribute("aria-hidden", state ? "false" : "true");
      document.body.classList.toggle("mdz-menu-lock", state);
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
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth >= 1024 && wrap.classList.contains("is-open")) {
        setOpen(false);
      }
    });

    setOpen(false);
  }

  document.addEventListener("DOMContentLoaded", initMastheadMenu);
})();
