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

  /* ------------------------------------------------------------------
     Canvas Game of Life — smooth 2D rendering with draw interaction
     ------------------------------------------------------------------ */
  var lifeCanvas = document.querySelector("[data-life-canvas]");
  if (!lifeCanvas) return;

  var lifeStage = document.querySelector("[data-life-stage]");
  var toggleButton = document.querySelector("[data-life-toggle]");
  var randomButton = document.querySelector("[data-life-random]");
  var clearButton = document.querySelector("[data-life-clear]");
  var speedInput = document.querySelector("[data-life-speed]");
  var generationLabel = document.querySelector("[data-life-generation]");
  var presetButtons = Array.prototype.slice.call(
    document.querySelectorAll("[data-life-preset]")
  );
  var ctx = lifeCanvas.getContext("2d");
  var dpr = 1;
  var cols = 0;
  var rows = 0;
  var cell = 10;
  var current = new Uint8Array(0);
  var next = new Uint8Array(0);
  var age = new Float32Array(0);
  var glow = new Float32Array(0);
  var visual = new Float32Array(0);
  var running = !reduced;
  var drawing = false;
  var lastStep = 0;
  var lastFrame = 0;
  var generation = 0;
  var tickMs = speedInput ? 1000 / Number(speedInput.value || 9) : 110;
  var visible = true;

  function idx(x, y) {
    return y * cols + x;
  }

  function wrap(n, max) {
    if (n < 0) return max - 1;
    if (n >= max) return 0;
    return n;
  }

  function resizeLife() {
    var rect = lifeCanvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    lifeCanvas.width = Math.max(1, Math.floor(rect.width * dpr));
    lifeCanvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = rect.width < 520 ? 8 : 10;
    cols = Math.max(24, Math.floor(rect.width / cell));
    rows = Math.max(20, Math.floor(rect.height / cell));
    current = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    age = new Float32Array(cols * rows);
    glow = new Float32Array(cols * rows);
    visual = new Float32Array(cols * rows);
    seedRandom(0.21);
  }

  function setCell(x, y, alive) {
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    var i = idx(x, y);
    current[i] = alive ? 1 : 0;
    age[i] = alive ? Math.max(age[i], 1) : 0;
    glow[i] = alive ? 1 : glow[i];
    visual[i] = alive ? Math.max(visual[i], 0.82) : visual[i];
  }

  function seedRandom(density) {
    generation = 0;
    for (var i = 0; i < current.length; i++) {
      var alive = Math.random() < density;
      current[i] = alive ? 1 : 0;
      next[i] = 0;
      age[i] = alive ? Math.random() * 6 + 1 : 0;
      glow[i] = alive ? Math.random() * 0.5 + 0.2 : 0;
      visual[i] = alive ? Math.random() * 0.28 + 0.72 : 0;
    }
    updateGeneration();
  }

  function clearLife() {
    generation = 0;
    current.fill(0);
    next.fill(0);
    age.fill(0);
    glow.fill(0);
    visual.fill(0);
    updateGeneration();
  }

  function stamp(pattern, centerX, centerY) {
    pattern.forEach(function (point) {
      setCell(centerX + point[0], centerY + point[1], true);
    });
  }

  function seedPreset(name) {
    clearLife();
    var cx = Math.floor(cols / 2);
    var cy = Math.floor(rows / 2);
    if (name === "pulsar") {
      var pulsar = [
        [-4,-6],[-3,-6],[-2,-6],[2,-6],[3,-6],[4,-6],
        [-6,-4],[-1,-4],[1,-4],[6,-4],[-6,-3],[-1,-3],[1,-3],[6,-3],[-6,-2],[-1,-2],[1,-2],[6,-2],
        [-4,-1],[-3,-1],[-2,-1],[2,-1],[3,-1],[4,-1],
        [-4,1],[-3,1],[-2,1],[2,1],[3,1],[4,1],
        [-6,2],[-1,2],[1,2],[6,2],[-6,3],[-1,3],[1,3],[6,3],[-6,4],[-1,4],[1,4],[6,4],
        [-4,6],[-3,6],[-2,6],[2,6],[3,6],[4,6]
      ];
      stamp(pulsar, cx, cy);
    } else {
      stamp([[0,-1],[1,0],[-1,1],[0,1],[1,1]], cx, cy);
      stamp([[0,-1],[1,0],[-1,1],[0,1],[1,1]], cx - 13, cy - 7);
      stamp([[0,-1],[1,0],[-1,1],[0,1],[1,1]], cx + 12, cy + 6);
    }
    running = true;
    updateToggle();
  }

  function stepLife() {
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var neighbors = 0;
        for (var oy = -1; oy <= 1; oy++) {
          for (var ox = -1; ox <= 1; ox++) {
            if (ox || oy) neighbors += current[idx(wrap(x + ox, cols), wrap(y + oy, rows))];
          }
        }
        var i = idx(x, y);
        var alive = current[i] === 1;
        var born = !alive && neighbors === 3;
        var survives = alive && (neighbors === 2 || neighbors === 3);
        next[i] = born || survives ? 1 : 0;
        if (next[i]) {
          age[i] = alive ? Math.min(age[i] + 1, 30) : 1;
          glow[i] = born ? 1 : Math.max(glow[i], 0.45);
        }
      }
    }
    var swapCells = current;
    current = next;
    next = swapCells;
    next.fill(0);
    generation += 1;
    updateGeneration();
  }

  function updateGeneration() {
    if (generationLabel) {
      generationLabel.textContent = String(generation).padStart(4, "0");
    }
  }

  function updateToggle() {
    if (!toggleButton) return;
    toggleButton.textContent = running ? "Pause" : "Play";
    toggleButton.setAttribute("aria-pressed", running ? "true" : "false");
  }

  function paintAtEvent(event) {
    var rect = lifeCanvas.getBoundingClientRect();
    var x = Math.floor((event.clientX - rect.left) / cell);
    var y = Math.floor((event.clientY - rect.top) / cell);
    for (var oy = -1; oy <= 1; oy++) {
      for (var ox = -1; ox <= 1; ox++) {
        if (Math.abs(ox) + Math.abs(oy) < 3) setCell(x + ox, y + oy, true);
      }
    }
  }

  function drawLife(delta) {
    var width = lifeCanvas.clientWidth;
    var height = lifeCanvas.clientHeight;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "rgba(7, 11, 16, 0.18)";
    ctx.fillRect(0, 0, width, height);

    var visualEase = 1 - Math.pow(0.001, delta / 240);
    var glowEase = Math.pow(0.001, delta / 700);
    var gap = cell > 8 ? 1.6 : 1;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var i = idx(x, y);
        var live = current[i] === 1;
        var target = live ? 1 : 0;
        visual[i] += (target - visual[i]) * visualEase;
        if (!live && visual[i] < 0.01) visual[i] = 0;
        if (!live && glow[i] <= 0.02 && visual[i] <= 0.02) continue;
        var presence = Math.max(visual[i], glow[i] * 0.35);
        var intensity = presence * (0.56 + Math.min(age[i], 18) / 42);
        var hue = 184 + Math.min(age[i], 20) * 3.6;
        var alpha = Math.min(0.92, presence * 0.72 + Math.min(glow[i], 1) * 0.2);
        var px = x * cell + gap / 2;
        var py = y * cell + gap / 2;
        var pulse = Math.max(0, glow[i] - 0.55) * 1.8;
        var size = (cell - gap) * (0.72 + presence * 0.28) + pulse;
        var inset = (cell - gap - size) / 2;
        ctx.fillStyle = "hsla(" + hue + ", 86%, " + (52 + intensity * 18) + "%, " + alpha + ")";
        ctx.shadowColor = "hsla(" + hue + ", 90%, 62%, " + Math.min(alpha, 0.65) + ")";
        ctx.shadowBlur = 5 + presence * 9 + glow[i] * 6;
        ctx.beginPath();
        ctx.roundRect(px + inset, py + inset, size, size, Math.max(2, cell * 0.22));
        ctx.fill();
        glow[i] *= live ? Math.max(glowEase, 0.9) : glowEase;
        if (!live) age[i] *= glowEase;
      }
    }
    ctx.shadowBlur = 0;
  }

  function frame(now) {
    var delta = lastFrame ? Math.min(now - lastFrame, 64) : 16;
    lastFrame = now;
    if (visible && running && now - lastStep > tickMs) {
      stepLife();
      lastStep = now;
    }
    drawLife(delta);
    window.requestAnimationFrame(frame);
  }

  if (typeof ctx.roundRect !== "function") {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
      var radius = Math.min(r, w / 2, h / 2);
      this.moveTo(x + radius, y);
      this.arcTo(x + w, y, x + w, y + h, radius);
      this.arcTo(x + w, y + h, x, y + h, radius);
      this.arcTo(x, y + h, x, y, radius);
      this.arcTo(x, y, x + w, y, radius);
      return this;
    };
  }

  if (window.ResizeObserver && lifeStage) {
    new ResizeObserver(resizeLife).observe(lifeStage);
  } else {
    window.addEventListener("resize", resizeLife, { passive: true });
  }

  if (window.IntersectionObserver && lifeStage) {
    new IntersectionObserver(function (entries) {
      visible = entries[0] ? entries[0].isIntersecting : true;
    }).observe(lifeStage);
  }

  document.addEventListener("visibilitychange", function () {
    visible = !document.hidden;
  });

  lifeCanvas.addEventListener("pointerdown", function (event) {
    drawing = true;
    lifeCanvas.setPointerCapture(event.pointerId);
    paintAtEvent(event);
  });
  lifeCanvas.addEventListener("pointermove", function (event) {
    if (drawing) paintAtEvent(event);
  });
  lifeCanvas.addEventListener("pointerup", function () {
    drawing = false;
  });
  lifeCanvas.addEventListener("pointercancel", function () {
    drawing = false;
  });

  if (toggleButton) {
    toggleButton.addEventListener("click", function () {
      running = !running;
      updateToggle();
    });
  }
  if (randomButton) randomButton.addEventListener("click", function () { seedRandom(0.23); });
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      clearLife();
      running = false;
      updateToggle();
    });
  }
  if (speedInput) {
    speedInput.addEventListener("input", function () {
      tickMs = 1000 / Number(speedInput.value || 9);
    });
  }
  presetButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      seedPreset(button.getAttribute("data-life-preset"));
    });
  });

  resizeLife();
  updateToggle();
  window.requestAnimationFrame(frame);
})();
