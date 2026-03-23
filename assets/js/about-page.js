(function () {
  function initAboutPage() {
    var root = document.querySelector("[data-mdz-about-page]");
    if (!root) return;

    var toggle = root.querySelector("[data-mdz-about-toggle]");
    var content = root.querySelector("[data-mdz-about-content]");
    var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!toggle || !content) return;

    function scrollToContent() {
      content.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
    }

    toggle.addEventListener("click", function () {
      var isExpanded = toggle.getAttribute("aria-expanded") === "true";

      if (isExpanded) {
        scrollToContent();
        return;
      }

      content.hidden = false;
      root.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");

      window.requestAnimationFrame(function () {
        scrollToContent();
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initAboutPage);
})();
