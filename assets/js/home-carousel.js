(function () {
  var SWIPE_THRESHOLD = 48;
  var DRAG_START_THRESHOLD = 16;
  var forEach = Array.prototype.forEach;

  function each(list, fn) {
    forEach.call(list, fn);
  }

  function setClass(el, className, enabled) {
    if (!el) return;
    if (enabled) {
      el.classList.add(className);
    } else {
      el.classList.remove(className);
    }
  }

  function clampIndex(index, slideCount) {
    return (index + slideCount) % slideCount;
  }

  function readAutoplayMs(root) {
    var value = parseInt(root.getAttribute("data-mdz-carousel-autoplay-ms"), 10);
    return isNaN(value) ? 0 : Math.max(value, 0);
  }

  function getTrackGap(track) {
    var styles = window.getComputedStyle(track);
    var gap = parseFloat(styles.columnGap || styles.gap || "0");
    return isNaN(gap) ? 0 : gap;
  }

  function getPeekRatio(root) {
    var value = parseFloat(window.getComputedStyle(root).getPropertyValue("--carousel-peek-ratio"));
    return isNaN(value) ? 0.14 : Math.max(value, 0);
  }

  function cloneShell(shell) {
    var clone = shell.cloneNode(true);
    var slide = clone.querySelector(".mdz-carousel__slide");
    clone.setAttribute("data-mdz-carousel-clone", "true");
    clone.setAttribute("aria-hidden", "true");
    if (slide) {
      slide.setAttribute("aria-hidden", "true");
      slide.tabIndex = -1;
    }
    return clone;
  }

  function initCarousel(root) {
    var viewport = root.querySelector("[data-mdz-carousel-viewport]");
    var track = root.querySelector("[data-mdz-carousel-track]");
    var dots = Array.prototype.slice.call(root.querySelectorAll("[data-mdz-carousel-dot]"));
    var prevBtn = root.querySelector("[data-mdz-carousel-prev]");
    var nextBtn = root.querySelector("[data-mdz-carousel-next]");
    var dotsWrap = root.querySelector("[data-mdz-carousel-dots]");
    var originalShells = track ? Array.prototype.slice.call(track.children) : [];
    var slideCount = originalShells.length;
    var autoplayMs = readAutoplayMs(root);
    var shells = [];
    var index = 0;
    var position = 0;
    var dragOffsetX = 0;
    var pointerStartX = 0;
    var pointerStartY = 0;
    var activePointerId = null;
    var isPointerDown = false;
    var isDragging = false;
    var suppressClick = false;
    var pressedSlide = null;
    var pressedOnControl = false;
    var autoplayTimer = null;
    var resizeRaf = 0;
    var autoplayState = {
      hover: false,
      focus: false,
      hidden: document.visibilityState !== "visible",
      pointer: false
    };

    if (
      slideCount === 0 ||
      !viewport ||
      !track ||
      root.getAttribute("data-mdz-carousel-ready") === "true" ||
      root.getAttribute("data-mdz-carousel-ready") === "pending"
    ) return;
    root.setAttribute("data-mdz-carousel-ready", "pending");

    function measure() {
      var viewportWidth = viewport.clientWidth;
      var gap = getTrackGap(track);
      var peekPx = viewportWidth * getPeekRatio(root);
      var leadOffset = peekPx + gap;
      var slideWidth = Math.max(viewportWidth - (2 * leadOffset), 0);

      return {
        gap: gap,
        leadOffset: leadOffset,
        slideWidth: slideWidth,
        viewportWidth: viewportWidth
      };
    }

    function bindSlideLink(slide) {
      if (!slide || slide.getAttribute("data-mdz-carousel-link-bound") === "true") return;

      slide.setAttribute("data-mdz-carousel-link-bound", "true");
      slide.addEventListener("click", function (event) {
        var isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

        if (suppressClick) {
          event.preventDefault();
          event.stopPropagation();
          return;
        }

        if (
          event.defaultPrevented ||
          isModifiedClick ||
          !slide.href ||
          slide.target === "_blank" ||
          slide.hasAttribute("download")
        ) {
          return;
        }

        event.preventDefault();
        window.location.assign(slide.href);
      });
    }

    function syncShellWidths(slideWidth) {
      each(shells, function (shell) {
        shell.style.width = slideWidth + "px";
        shell.style.flexBasis = slideWidth + "px";
      });
    }

    function applyTransform(offsetX) {
      var metrics = measure();
      syncShellWidths(metrics.slideWidth);
      var step = metrics.slideWidth + metrics.gap;
      track.style.transform = "translate3d(" + (metrics.leadOffset - (position * step) + (offsetX || 0)) + "px, 0, 0)";
    }

    function setTrackTransition(enabled) {
      setClass(track, "is-no-transition", !enabled);
    }

    function syncControls() {
      each(shells, function (shell, shellIndex) {
        var active = shellIndex === position;
        var slide = shell.querySelector(".mdz-carousel__slide");
        var isClone = shell.getAttribute("data-mdz-carousel-clone") === "true";
        setClass(shell, "is-active", active);
        if (slide) {
          var focusable = active && !isClone;
          slide.setAttribute("aria-hidden", focusable ? "false" : "true");
          slide.tabIndex = focusable ? 0 : -1;
        }
      });

      each(dots, function (dot, dotIndex) {
        var active = dotIndex === index;
        setClass(dot, "is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });

      if (prevBtn && nextBtn) {
        var disabled = slideCount <= 1;
        prevBtn.disabled = disabled;
        nextBtn.disabled = disabled;
        prevBtn.setAttribute("aria-disabled", disabled ? "true" : "false");
        nextBtn.setAttribute("aria-disabled", disabled ? "true" : "false");
      }
    }

    function render(immediate, offsetX) {
      syncControls();
      setTrackTransition(!immediate);
      applyTransform(offsetX || 0);
      if (immediate) {
        track.getBoundingClientRect();
        setTrackTransition(true);
      }
    }

    function jumpTo(realIndex) {
      index = clampIndex(realIndex, slideCount);
      position = slideCount > 1 ? index + 1 : index;
      render(true, 0);
    }

    function moveTo(targetPosition, targetIndex) {
      position = targetPosition;
      index = clampIndex(targetIndex, slideCount);
      render(false, 0);
    }

    function shouldAutoplay() {
      return autoplayMs > 0 &&
        slideCount > 1 &&
        !autoplayState.hover &&
        !autoplayState.focus &&
        !autoplayState.hidden &&
        !autoplayState.pointer;
    }

    function stopAutoplay() {
      if (autoplayTimer) {
        window.clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function showNext() {
      if (slideCount <= 1 || isDragging) return;
      moveTo(position + 1, index + 1);
    }

    function showPrev() {
      if (slideCount <= 1 || isDragging) return;
      moveTo(position - 1, index - 1);
    }

    function syncAutoplay(restart) {
      if (restart) stopAutoplay();
      if (!shouldAutoplay()) {
        stopAutoplay();
        return;
      }

      if (!autoplayTimer) {
        autoplayTimer = window.setInterval(function () {
          showNext();
        }, autoplayMs);
      }
    }

    function handleWraparound() {
      if (position === 0) {
        jumpTo(slideCount - 1);
      } else if (position === slideCount + 1) {
        jumpTo(0);
      }
    }

    function shouldStartDrag(deltaX, deltaY) {
      return Math.abs(deltaX) >= DRAG_START_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY);
    }

    function resetPointerState() {
      activePointerId = null;
      isPointerDown = false;
      isDragging = false;
      dragOffsetX = 0;
      pointerStartX = 0;
      pointerStartY = 0;
      pressedSlide = null;
      pressedOnControl = false;
      autoplayState.pointer = false;
      setClass(viewport, "is-dragging", false);
      setTrackTransition(true);
    }

    function beginDrag(deltaX) {
      isDragging = true;
      autoplayState.pointer = true;
      setClass(viewport, "is-dragging", true);
      setTrackTransition(false);
      dragOffsetX = deltaX;
      syncAutoplay();
    }

    function finishDrag(clientX, allowClickFallback) {
      var deltaX = clientX - pointerStartX;
      var shouldSwipe = Math.abs(deltaX) >= SWIPE_THRESHOLD;
      var fallbackSlide = !pressedOnControl ? pressedSlide : null;

      resetPointerState();

      if (shouldSwipe) {
        suppressClick = true;
        if (deltaX < 0) {
          showNext();
        } else {
          showPrev();
        }
      } else {
        render(false, 0);
        if (allowClickFallback && fallbackSlide && typeof fallbackSlide.click === "function") {
          window.setTimeout(function () {
            fallbackSlide.click();
          }, 0);
        }
      }

      if (shouldSwipe) {
        window.setTimeout(function () {
          suppressClick = false;
        }, 0);
      }
      syncAutoplay(true);
    }

    try {
      root.classList.add("is-enhanced");

      if (slideCount <= 1) {
        root.classList.add("is-static");
        if (prevBtn) prevBtn.hidden = true;
        if (nextBtn) nextBtn.hidden = true;
        if (dotsWrap) dotsWrap.hidden = true;
        shells = originalShells;
        each(shells, function (shell) {
          bindSlideLink(shell.querySelector(".mdz-carousel__slide"));
        });
        render(true, 0);
        root.setAttribute("data-mdz-carousel-ready", "true");
        return;
      }

      track.insertBefore(cloneShell(originalShells[slideCount - 1]), originalShells[0]);
      track.appendChild(cloneShell(originalShells[0]));
      shells = Array.prototype.slice.call(track.children);
      each(shells, function (shell) {
        bindSlideLink(shell.querySelector(".mdz-carousel__slide"));
      });
      position = 1;

      render(true, 0);
      root.setAttribute("data-mdz-carousel-ready", "true");

      if (prevBtn) {
        prevBtn.addEventListener("click", function (event) {
          event.preventDefault();
          showPrev();
          syncAutoplay(true);
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", function (event) {
          event.preventDefault();
          showNext();
          syncAutoplay(true);
        });
      }

      each(dots, function (dot, dotIndex) {
        dot.addEventListener("click", function () {
          moveTo(dotIndex + 1, dotIndex);
          syncAutoplay(true);
        });
      });

      root.addEventListener("keydown", function (event) {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          showNext();
          syncAutoplay(true);
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          showPrev();
          syncAutoplay(true);
        }
      });

      viewport.addEventListener("pointerdown", function (event) {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        activePointerId = event.pointerId;
        pointerStartX = event.clientX;
        pointerStartY = event.clientY;
        dragOffsetX = 0;
        isPointerDown = true;
        autoplayState.pointer = true;
        pressedOnControl = !!event.target.closest("[data-mdz-carousel-prev], [data-mdz-carousel-next], [data-mdz-carousel-dot]");
        pressedSlide = !pressedOnControl ? event.target.closest(".mdz-carousel__slide") : null;
        syncAutoplay();
      });

      window.addEventListener("pointermove", function (event) {
        var deltaX;
        var deltaY;

        if (!isPointerDown || event.pointerId !== activePointerId || pressedOnControl) return;
        deltaX = event.clientX - pointerStartX;
        deltaY = event.clientY - pointerStartY;

        if (!isDragging) {
          if (!shouldStartDrag(deltaX, deltaY)) return;
          beginDrag(deltaX);
        }

        dragOffsetX = deltaX;
        applyTransform(dragOffsetX);
      });

      window.addEventListener("pointerup", function (event) {
        if (!isPointerDown || event.pointerId !== activePointerId) return;
        if (!isDragging) {
          window.setTimeout(function () {
            resetPointerState();
            syncAutoplay(true);
          }, 0);
          return;
        }
        finishDrag(event.clientX, true);
      });

      window.addEventListener("pointercancel", function (event) {
        if (!isPointerDown || event.pointerId !== activePointerId) return;
        if (!isDragging) {
          resetPointerState();
          syncAutoplay(true);
          return;
        }
        finishDrag(pointerStartX, false);
      });

      viewport.addEventListener("dragstart", function (event) {
        event.preventDefault();
      });

      viewport.addEventListener("click", function (event) {
        if (!suppressClick) return;
        event.preventDefault();
        event.stopPropagation();
      }, true);

      track.addEventListener("transitionend", function (event) {
        if (event.propertyName !== "transform") return;
        handleWraparound();
      });

      root.addEventListener("mouseenter", function () {
        autoplayState.hover = true;
        syncAutoplay();
      });

      root.addEventListener("mouseleave", function () {
        autoplayState.hover = false;
        syncAutoplay(true);
      });

      root.addEventListener("focusin", function () {
        autoplayState.focus = true;
        syncAutoplay();
      });

      root.addEventListener("focusout", function () {
        window.setTimeout(function () {
          autoplayState.focus = root.contains(document.activeElement);
          syncAutoplay(true);
        }, 0);
      });

      document.addEventListener("visibilitychange", function () {
        autoplayState.hidden = document.visibilityState !== "visible";
        syncAutoplay(true);
      });

      window.addEventListener("resize", function () {
        if (resizeRaf) return;
        resizeRaf = window.requestAnimationFrame(function () {
          resizeRaf = 0;
          render(true, 0);
        });
      });

      syncAutoplay(true);
    } catch (error) {
      stopAutoplay();
      root.classList.remove("is-enhanced");
      root.removeAttribute("data-mdz-carousel-ready");
      if (window.console && typeof window.console.error === "function") {
        window.console.error("Failed to initialize homepage carousel", error);
      }
    }
  }

  function initCarousels() {
    var carousels = document.querySelectorAll("[data-mdz-carousel]");
    if (!carousels.length) return;
    each(carousels, initCarousel);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initCarousels);
  } else {
    initCarousels();
  }

  window.addEventListener("pageshow", initCarousels);
})();
