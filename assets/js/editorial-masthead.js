/**
 * Editorial masthead interactions — vanilla, no dependencies.
 *
 *   1. Theme toggle — flips [data-theme] on <html>, persists to localStorage
 *      under key 'eh-theme' (same key used by the pre-paint script in
 *      _includes/head/custom.html).
 *   2. Burger → mobile nav sheet — toggles [hidden] + aria-expanded.
 *
 * Designed to coexist with masthead-menu.js (legacy) and editorial-home.js
 * (homepage-specific).
 */
(function () {
  "use strict";

  /* -------------------------------------------------------------- */
  /* Theme toggle                                                   */
  /* -------------------------------------------------------------- */
  var toggle = document.getElementById("eh-theme-toggle");
  if (toggle) {
    toggle.addEventListener("click", function () {
      var root = document.documentElement;
      var current =
        root.getAttribute("data-theme") ||
        (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light");
      var next = current === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try {
        window.localStorage.setItem("eh-theme", next);
      } catch (e) {
        /* privacy mode / disabled storage — best effort */
      }
    });
  }

  /* -------------------------------------------------------------- */
  /* Burger → mobile nav sheet                                      */
  /* -------------------------------------------------------------- */
  var burger = document.getElementById("eh-masthead-burger");
  var sheet = document.getElementById("eh-masthead-sheet");

  if (burger && sheet) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      burger.setAttribute("aria-expanded", open ? "false" : "true");
      if (open) {
        sheet.setAttribute("hidden", "");
      } else {
        sheet.removeAttribute("hidden");
      }
    });

    /* Close sheet when a link inside it is tapped. */
    sheet.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        burger.setAttribute("aria-expanded", "false");
        sheet.setAttribute("hidden", "");
      }
    });

    /* Close sheet on Escape. */
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        burger.setAttribute("aria-expanded", "false");
        sheet.setAttribute("hidden", "");
        burger.focus();
      }
    });
  }
})();
