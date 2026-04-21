/**
 * Editorial homepage interactions — vanilla, no dependencies.
 *   1. Smooth-scroll when nav links are clicked
 *   2. Scroll-spy to mark the active section in the side nav
 *   3. Click-to-expand work rows (accordion, one open at a time)
 *
 * Respects prefers-reduced-motion (no smooth scroll when reduced).
 */
(function () {
  "use strict";

  var reduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ------------------------------------------------------------------
     Smooth-scroll + scroll-spy
     ------------------------------------------------------------------ */
  var navLinks = Array.prototype.slice.call(
    document.querySelectorAll("[data-eh-nav-link]")
  );
  var sections = navLinks
    .map(function (link) {
      var id = link.getAttribute("data-target");
      var el = id ? document.getElementById(id) : null;
      return el ? { id: id, el: el } : null;
    })
    .filter(Boolean);

  function jumpTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top =
      el.getBoundingClientRect().top + window.pageYOffset - 80; /* topbar pad */
    window.scrollTo({
      top: top,
      behavior: reduced ? "auto" : "smooth",
    });
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      var id = link.getAttribute("data-target");
      if (!id) return;
      e.preventDefault();
      jumpTo(id);
      if (history && history.replaceState) {
        history.replaceState(null, "", "#" + id);
      }
    });
  });

  function setActive(id) {
    navLinks.forEach(function (link) {
      var match = link.getAttribute("data-target") === id;
      link.classList.toggle("is-active", match);
    });
  }

  function onScroll() {
    if (!sections.length) return;
    var y = window.pageYOffset + 120; /* account for sticky topbar */
    var current = sections[0].id;
    for (var i = 0; i < sections.length; i++) {
      var top =
        sections[i].el.getBoundingClientRect().top + window.pageYOffset;
      if (top <= y) current = sections[i].id;
    }
    setActive(current);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  onScroll();

  /* Honor initial #hash, if any, once fonts/layout settle. */
  if (window.location.hash) {
    setTimeout(function () {
      jumpTo(window.location.hash.replace("#", ""));
    }, 60);
  }

  /* ------------------------------------------------------------------
     Work accordion — one row open at a time
     ------------------------------------------------------------------ */
  var workRows = Array.prototype.slice.call(
    document.querySelectorAll("[data-eh-work-row]")
  );

  function closeAll(except) {
    workRows.forEach(function (row) {
      if (row !== except) row.setAttribute("aria-expanded", "false");
    });
  }

  workRows.forEach(function (row, i) {
    /* First row starts open, matching the design default. */
    row.setAttribute("aria-expanded", i === 0 ? "true" : "false");

    row.addEventListener("click", function (e) {
      /* Don't collapse when a nested link inside the detail is clicked. */
      if (e.target.closest && e.target.closest("a")) return;
      var open = row.getAttribute("aria-expanded") === "true";
      closeAll(row);
      row.setAttribute("aria-expanded", open ? "false" : "true");
    });

    /* Keyboard a11y — Space/Enter toggles. */
    row.setAttribute("tabindex", "0");
    row.setAttribute("role", "button");
    row.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        row.click();
      }
    });
  });
})();
