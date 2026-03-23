(function () {
  function initSearchPageQuery() {
    var params = new URLSearchParams(window.location.search);
    var query = (params.get("q") || params.get("query") || "").trim();

    if (!query) return;

    function applyQuery() {
      var inputs = document.querySelectorAll("input#search");
      if (!inputs.length) return;

      var primaryInput = inputs[0];

      inputs.forEach(function (input) {
        input.value = query;
      });

      ["input", "change", "keyup"].forEach(function (eventName) {
        primaryInput.dispatchEvent(new Event(eventName, { bubbles: true }));
      });
    }

    window.setTimeout(applyQuery, 0);
  }

  document.addEventListener("DOMContentLoaded", initSearchPageQuery);
})();
