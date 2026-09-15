(function () {
  "use strict";

  /* ---------- rail position indicator ---------- */

  /* The rail says where you are in the document. IntersectionObserver is the
     trigger rather than a scroll listener, but the decision is recomputed from
     geometry on every callback: the observed anchors are headings, which are a
     few pixels tall, so "is it intersecting right now" is true for only a
     moment as each one passes and would leave the rail blank the rest of the
     time. Asking instead which anchor was the last to cross the reading line
     is correct in both scroll directions and at rest. */
  var dots = Array.prototype.slice.call(document.querySelectorAll(".rail__dots a"));

  if (dots.length && "IntersectionObserver" in window) {
    var pairs = dots
      .map(function (dot) {
        var href = dot.getAttribute("href");
        var target = href ? document.querySelector(href) : null;
        return target ? { dot: dot, target: target } : null;
      })
      .filter(Boolean);

    if (pairs.length) {
      /* The line sits a fifth of the way down the viewport. A heading counts as
         current once its top passes above that line. */
      var readingLine = function () {
        return window.innerHeight * 0.2;
      };

      var update = function () {
        var line = readingLine();
        var current = pairs[0];

        for (var i = 0; i < pairs.length; i++) {
          if (pairs[i].target.getBoundingClientRect().top <= line) {
            current = pairs[i];
          }
        }

        /* Bottom of the page: the last anchor wins even if it never crossed
           the line, otherwise the final section can never be reached on a
           short last section. */
        var atBottom =
          window.innerHeight + window.scrollY >= document.body.scrollHeight - 2;
        if (atBottom) {
          current = pairs[pairs.length - 1];
        }

        pairs.forEach(function (pair) {
          if (pair === current) {
            pair.dot.setAttribute("aria-current", "true");
          } else {
            pair.dot.removeAttribute("aria-current");
          }
        });
      };

      /* A tall sentinel band either side of the reading line means the
         callback fires on every crossing in both directions. */
      var observer = new IntersectionObserver(update, {
        rootMargin: "-20% 0px -20% 0px",
        threshold: [0, 1]
      });

      pairs.forEach(function (pair) {
        observer.observe(pair.target);
      });

      /* A passive scroll listener as well, deliberately. The observer is the
         cheap trigger, but it is throttled or suspended outright in a
         backgrounded or hidden tab, and a fast flick can carry a heading
         through the band between two deliveries. Either one leaves the rail
         pointing at the wrong section. update() reads four rectangles and
         writes nothing until it has read them all, so running it per scroll
         event does not thrash layout. This is a state indicator, not motion,
         which is why it does not fall under the no-scroll-listener rule for
         scroll-linked animation. */
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });

      update();
    }
  }

  /* ---------- copy the handle ---------- */

  var buttons = Array.prototype.slice.call(document.querySelectorAll(".copy"));

  function selectFallback(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "0";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    document.body.removeChild(field);
    return ok;
  }

  buttons.forEach(function (button) {
    var value = button.getAttribute("data-copy") || "";
    var hint = button.querySelector(".copy__hint");
    var resetAt = null;

    button.setAttribute("aria-label", "Copy the handle " + value);

    /* Silent-ish success: the word under the handle changes for a moment and
       nothing on the page moves. No toast for something already visible. */
    function report(word) {
      if (!hint) return;
      hint.textContent = word;
      button.setAttribute("data-state", "done");
      window.clearTimeout(resetAt);
      resetAt = window.setTimeout(function () {
        hint.textContent = "copy";
        button.removeAttribute("data-state");
      }, 1800);
    }

    button.addEventListener("click", function () {
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(value).then(
          function () {
            report("copied");
          },
          function () {
            report(selectFallback(value) ? "copied" : "select it");
          }
        );
        return;
      }
      report(selectFallback(value) ? "copied" : "select it");
    });
  });
})();
