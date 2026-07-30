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
  var toggleButtons = Array.prototype.slice.call(
    document.querySelectorAll("[data-life-toggle]")
  );
  var randomButton = document.querySelector("[data-life-random]");
  var clearButton = document.querySelector("[data-life-clear]");
  var speedInput = document.querySelector("[data-life-speed]");
  var speedValue = document.querySelector("[data-life-speed-value]");
  var generationLabel = document.querySelector("[data-life-generation]");
  var statusLabel = document.querySelector("[data-life-status]");
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
  var activeCells = new Uint32Array(0);
  var cellColors = [
    "hsl(184, 86%, 61%)",
    "hsl(194, 86%, 62%)",
    "hsl(205, 86%, 63%)",
    "hsl(216, 86%, 64%)",
    "hsl(227, 86%, 65%)",
    "hsl(238, 86%, 66%)",
  ];
  var running = !reduced;
  var drawing = false;
  var lastPaintedCell = -1;
  var touchPointer = false;
  var pointerStartX = 0;
  var pointerStartY = 0;
  var keyboardActive = false;
  var keyboardX = 0;
  var keyboardY = 0;
  var lastStep = 0;
  var lastFrame = 0;
  var lastPaint = 0;
  var generation = 0;
  var tickMs = speedInput ? 1000 / Number(speedInput.value || 9) : 110;
  var inViewport = true;
  var pageVisible = !document.hidden;
  var frameRequest = 0;
  var resizeRequest = 0;
  var renderPending = true;
  var mobileFrameMs = 1000 / 30;

  function idx(x, y) {
    return y * cols + x;
  }

  function resizeLife() {
    var rect = lifeCanvas.getBoundingClientRect();
    var newDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var bitmapWidth = Math.max(1, Math.floor(rect.width * newDpr));
    var bitmapHeight = Math.max(1, Math.floor(rect.height * newDpr));
    var newCell = rect.width < 520 ? 8 : rect.width < 720 ? 10 : 12;
    var newCols = Math.max(24, Math.floor(rect.width / newCell));
    var newRows = Math.max(20, Math.floor(rect.height / newCell));
    var gridChanged = newCols !== cols || newRows !== rows;
    var bitmapChanged =
      lifeCanvas.width !== bitmapWidth || lifeCanvas.height !== bitmapHeight;

    if (!gridChanged && !bitmapChanged && newCell === cell && newDpr === dpr) {
      return;
    }

    var oldCurrent = current;
    var oldAge = age;
    var oldGlow = glow;
    var oldVisual = visual;
    var oldCols = cols;
    var oldRows = rows;

    dpr = newDpr;
    if (bitmapChanged) {
      lifeCanvas.width = bitmapWidth;
      lifeCanvas.height = bitmapHeight;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    cell = newCell;
    cols = newCols;
    rows = newRows;

    if (gridChanged) {
      current = new Uint8Array(cols * rows);
      next = new Uint8Array(cols * rows);
      age = new Float32Array(cols * rows);
      glow = new Float32Array(cols * rows);
      visual = new Float32Array(cols * rows);
      activeCells = new Uint32Array(cols * rows);

      if (oldCurrent.length && oldCols && oldRows) {
        var offsetX = Math.floor((cols - oldCols) / 2);
        var offsetY = Math.floor((rows - oldRows) / 2);
        keyboardX += offsetX;
        keyboardY += offsetY;
        for (var oldY = 0; oldY < oldRows; oldY++) {
          var newY = oldY + offsetY;
          if (newY < 0 || newY >= rows) continue;
          for (var oldX = 0; oldX < oldCols; oldX++) {
            var newX = oldX + offsetX;
            if (newX < 0 || newX >= cols) continue;
            var oldIndex = oldY * oldCols + oldX;
            var newIndex = newY * cols + newX;
            current[newIndex] = oldCurrent[oldIndex];
            age[newIndex] = oldAge[oldIndex];
            glow[newIndex] = oldGlow[oldIndex];
            visual[newIndex] = oldVisual[oldIndex];
          }
        }
      } else {
        seedRandom(0.21);
        keyboardX = Math.floor(cols / 2);
        keyboardY = Math.floor(rows / 2);
      }
    }

    keyboardX = Math.max(0, Math.min(cols - 1, keyboardX));
    keyboardY = Math.max(0, Math.min(rows - 1, keyboardY));
    requestRender();
  }

  function scheduleResize() {
    if (resizeRequest) return;
    resizeRequest = window.requestAnimationFrame(function () {
      resizeRequest = 0;
      resizeLife();
    });
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
      var rowAbove = (y === 0 ? rows - 1 : y - 1) * cols;
      var rowHere = y * cols;
      var rowBelow = (y === rows - 1 ? 0 : y + 1) * cols;
      for (var x = 0; x < cols; x++) {
        var left = x === 0 ? cols - 1 : x - 1;
        var right = x === cols - 1 ? 0 : x + 1;
        var neighbors =
          current[rowAbove + left] +
          current[rowAbove + x] +
          current[rowAbove + right] +
          current[rowHere + left] +
          current[rowHere + right] +
          current[rowBelow + left] +
          current[rowBelow + x] +
          current[rowBelow + right];
        var i = rowHere + x;
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
    toggleButtons.forEach(function (button) {
      button.textContent = running ? "Pause" : "Play";
      button.setAttribute("aria-pressed", running ? "true" : "false");
    });
  }

  function updateStatus(message) {
    if (!statusLabel) return;
    statusLabel.textContent =
      message +
      " Generation " +
      generation +
      ". Simulation " +
      (running ? "running." : "paused.");
  }

  function canRender() {
    return inViewport && pageVisible;
  }

  function requestFrame() {
    if (!frameRequest && canRender() && (running || renderPending)) {
      frameRequest = window.requestAnimationFrame(frame);
    }
  }

  function requestRender() {
    renderPending = true;
    requestFrame();
  }

  function syncAnimation() {
    if (!canRender() || (!running && !renderPending)) {
      if (frameRequest) {
        window.cancelAnimationFrame(frameRequest);
        frameRequest = 0;
      }
      return;
    }
    requestFrame();
  }

  function paintAtEvent(event) {
    var rect = lifeCanvas.getBoundingClientRect();
    var x = Math.floor((event.clientX - rect.left) / cell);
    var y = Math.floor((event.clientY - rect.top) / cell);
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    var center = idx(x, y);
    if (center === lastPaintedCell) return;
    lastPaintedCell = center;
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
    var liveGlowEase = Math.pow(0.9, delta / 16.67);
    var gap = cell > 8 ? 1.6 : 1;
    var glowThreshold = 0.42;
    var activeCount = 0;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.shadowColor = "rgba(75, 220, 245, 0.62)";
    ctx.shadowBlur = cell > 10 ? 14 : 11;
    ctx.fillStyle = "rgb(96, 225, 245)";
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < cols; x++) {
        var i = idx(x, y);
        var live = current[i] === 1;
        var target = live ? 1 : 0;
        visual[i] += (target - visual[i]) * visualEase;
        if (!live && visual[i] < 0.01) visual[i] = 0;
        if (!live && glow[i] <= 0.02 && visual[i] <= 0.02) continue;
        activeCells[activeCount++] = i;
        var presence = Math.max(visual[i], glow[i] * 0.35);
        var px = x * cell + gap / 2;
        var py = y * cell + gap / 2;
        var pulse = Math.max(0, glow[i] - 0.55) * 1.8;
        var size = (cell - gap) * (0.72 + presence * 0.28) + pulse;
        var inset = (cell - gap - size) / 2;
        if (glow[i] > glowThreshold) {
          ctx.globalAlpha = Math.min(0.32, glow[i] * 0.24);
          ctx.fillRect(px + inset - 0.5, py + inset - 0.5, size + 1, size + 1);
        }
        glow[i] *= live ? Math.max(glowEase, liveGlowEase) : glowEase;
        if (!live) age[i] *= glowEase;
      }
    }
    ctx.restore();

    ctx.save();
    for (var n = 0; n < activeCount; n++) {
      var ii = activeCells[n];
      var visiblePresence = visual[ii];
      if (visiblePresence <= 0.02) continue;
      var xx = ii % cols;
      var yy = Math.floor(ii / cols);
      var visiblePx = xx * cell + gap / 2;
      var visiblePy = yy * cell + gap / 2;
      var visibleSize = (cell - gap) * (0.72 + visiblePresence * 0.28);
      var visibleInset = (cell - gap - visibleSize) / 2;
      var colorIndex = Math.min(
        cellColors.length - 1,
        Math.floor(Math.min(age[ii], 24) / 4)
      );
      ctx.fillStyle = cellColors[colorIndex];
      ctx.globalAlpha = Math.min(0.92, visiblePresence * 0.74);
      ctx.fillRect(
        visiblePx + visibleInset,
        visiblePy + visibleInset,
        visibleSize,
        visibleSize
      );
    }
    ctx.restore();

    if (keyboardActive) {
      ctx.save();
      ctx.strokeStyle = "rgba(255, 255, 255, 0.92)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        keyboardX * cell + 1,
        keyboardY * cell + 1,
        Math.max(2, cell - 2),
        Math.max(2, cell - 2)
      );
      ctx.restore();
    }
  }

  function frame(now) {
    frameRequest = 0;
    if (!canRender()) return;

    var delta = lastFrame ? Math.min(now - lastFrame, 64) : 16;
    lastFrame = now;
    if (running && now - lastStep > tickMs) {
      stepLife();
      lastStep = now;
      renderPending = true;
    }

    var paintInterval = lifeCanvas.clientWidth < 720 ? mobileFrameMs : 0;
    if (
      renderPending &&
      (!paintInterval || !lastPaint || now - lastPaint >= paintInterval)
    ) {
      drawLife(delta);
      lastPaint = now;
      renderPending = running;
    }

    requestFrame();
  }

  if (window.ResizeObserver && lifeStage) {
    new ResizeObserver(scheduleResize).observe(lifeStage);
  } else {
    window.addEventListener("resize", scheduleResize, { passive: true });
  }

  if (window.IntersectionObserver && lifeStage) {
    new IntersectionObserver(function (entries) {
      inViewport = entries[0] ? entries[0].isIntersecting : true;
      syncAnimation();
    }).observe(lifeStage);
  }

  document.addEventListener("visibilitychange", function () {
    pageVisible = !document.hidden;
    syncAnimation();
  });

  lifeCanvas.addEventListener("pointerdown", function (event) {
    touchPointer = event.pointerType === "touch";
    drawing = !touchPointer;
    lastPaintedCell = -1;
    pointerStartX = event.clientX;
    pointerStartY = event.clientY;
    if (drawing) {
      lifeCanvas.setPointerCapture(event.pointerId);
      paintAtEvent(event);
      requestRender();
    }
  });
  lifeCanvas.addEventListener("pointermove", function (event) {
    if (touchPointer && !drawing) {
      var deltaX = event.clientX - pointerStartX;
      var deltaY = event.clientY - pointerStartY;
      if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
        drawing = true;
        lifeCanvas.setPointerCapture(event.pointerId);
      } else {
        return;
      }
    }
    if (drawing) {
      paintAtEvent(event);
      requestRender();
    }
  });
  lifeCanvas.addEventListener("pointerup", function (event) {
    if (
      touchPointer &&
      !drawing &&
      Math.abs(event.clientX - pointerStartX) <= 8 &&
      Math.abs(event.clientY - pointerStartY) <= 8
    ) {
      paintAtEvent(event);
      requestRender();
    }
    drawing = false;
    touchPointer = false;
    lastPaintedCell = -1;
  });
  lifeCanvas.addEventListener("pointercancel", function () {
    drawing = false;
    touchPointer = false;
    lastPaintedCell = -1;
  });

  lifeCanvas.addEventListener("focus", function () {
    keyboardActive = true;
    requestRender();
  });
  lifeCanvas.addEventListener("blur", function () {
    keyboardActive = false;
    requestRender();
  });
  lifeCanvas.addEventListener("keydown", function (event) {
    var handled = true;
    if (event.key === "ArrowLeft") {
      keyboardX = keyboardX === 0 ? cols - 1 : keyboardX - 1;
    } else if (event.key === "ArrowRight") {
      keyboardX = keyboardX === cols - 1 ? 0 : keyboardX + 1;
    } else if (event.key === "ArrowUp") {
      keyboardY = keyboardY === 0 ? rows - 1 : keyboardY - 1;
    } else if (event.key === "ArrowDown") {
      keyboardY = keyboardY === rows - 1 ? 0 : keyboardY + 1;
    } else if (event.key === " " || event.key === "Enter") {
      var keyboardIndex = idx(keyboardX, keyboardY);
      setCell(keyboardX, keyboardY, current[keyboardIndex] !== 1);
      updateStatus("Keyboard cell toggled.");
    } else {
      handled = false;
    }
    if (!handled) return;
    event.preventDefault();
    requestRender();
  });

  toggleButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      running = !running;
      lastStep = window.performance ? performance.now() : 0;
      updateToggle();
      renderPending = running;
      syncAnimation();
      updateStatus(running ? "Simulation started." : "Simulation paused.");
    });
  });
  if (randomButton) {
    randomButton.addEventListener("click", function () {
      seedRandom(0.23);
      requestRender();
      updateStatus("Board randomized.");
    });
  }
  if (clearButton) {
    clearButton.addEventListener("click", function () {
      clearLife();
      running = false;
      updateToggle();
      requestRender();
      updateStatus("Board cleared.");
    });
  }
  if (speedInput) {
    speedInput.addEventListener("input", function () {
      tickMs = 1000 / Number(speedInput.value || 9);
      if (speedValue) speedValue.textContent = speedInput.value + "/s";
    });
    speedInput.addEventListener("change", function () {
      updateStatus("Speed set to " + speedInput.value + " generations per second.");
    });
  }
  presetButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      seedPreset(button.getAttribute("data-life-preset"));
      requestRender();
      updateStatus(button.textContent.trim() + " pattern loaded.");
    });
  });

  resizeLife();
  updateToggle();
  updateStatus("Board ready.");
  requestFrame();
})();
