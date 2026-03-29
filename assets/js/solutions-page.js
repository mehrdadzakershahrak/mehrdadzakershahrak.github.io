(function () {
  function qsa(root, selector) {
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function getPanelForTab(panels, tab) {
    var panelId = tab && tab.getAttribute("aria-controls");
    if (!panelId) return null;

    for (var index = 0; index < panels.length; index += 1) {
      if (panels[index].id === panelId) return panels[index];
    }

    return null;
  }

  function initSolutionsTabs(root) {
    var tabs = qsa(root, "[data-solutions-tab]");
    var panels = qsa(root, "[data-solutions-panel]");
    if (!tabs.length || !panels.length) return;

    function selectTab(tab, shouldFocus) {
      var activePanel = getPanelForTab(panels, tab);
      if (!tab || !activePanel) return;

      tabs.forEach(function (entry) {
        var isActive = entry === tab;
        entry.classList.toggle("is-active", isActive);
        entry.setAttribute("aria-selected", isActive ? "true" : "false");
        entry.tabIndex = isActive ? 0 : -1;
      });

      panels.forEach(function (panel) {
        var isActive = panel === activePanel;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });

      if (shouldFocus) {
        tab.focus();
      }
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener("click", function () {
        selectTab(tab, false);
      });

      tab.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          selectTab(tab, true);
          return;
        }

        if (!tabs.length) return;

        var nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          nextIndex = (index + 1) % tabs.length;
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          nextIndex = (index - 1 + tabs.length) % tabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = tabs.length - 1;
        } else {
          return;
        }

        event.preventDefault();
        selectTab(tabs[nextIndex], true);
      });
    });

    var selectedTab = tabs.find(function (tab) {
      return tab.getAttribute("aria-selected") === "true";
    }) || tabs[0];

    selectTab(selectedTab, false);
  }

  document.addEventListener("DOMContentLoaded", function () {
    qsa(document, "[data-solutions-tabs]").forEach(initSolutionsTabs);
  });
})();
