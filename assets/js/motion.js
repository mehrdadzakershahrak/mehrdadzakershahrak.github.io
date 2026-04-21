/**
 * Minimal motion system — opt-in scroll reveals using IntersectionObserver.
 *
 * Apply `data-mdz-reveal` to any element that should fade-and-rise into
 * view on scroll. Optionally set `data-mdz-reveal-delay` in ms to stagger
 * a group of siblings.
 *
 * Respects prefers-reduced-motion: when the user opts out, elements are
 * made visible immediately and the observer is never started. The CSS
 * token layer also zeros the duration tokens, so any CSS transitions tied
 * to --dur-* are instant as well.
 */
(function () {
  function boot() {
    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var nodes = document.querySelectorAll("[data-mdz-reveal]");
    if (!nodes.length) return;

    if (prefersReduced || typeof IntersectionObserver === "undefined") {
      nodes.forEach(function (n) {
        n.classList.add("is-revealed");
      });
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute("data-mdz-reveal-delay") || "0", 10);
          if (delay) {
            el.style.transitionDelay = delay + "ms";
          }
          el.classList.add("is-revealed");
          io.unobserve(el);
        });
      },
      { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );

    nodes.forEach(function (n) {
      io.observe(n);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
