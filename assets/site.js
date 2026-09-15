(function () {
  "use strict";

  /* ================= the figure =================
   *
   * A Minecraft skin is a 64x64 atlas of box faces. Every part of the player
   * is a rectangular prism whose six faces are laid out around its own origin
   * in a fixed cross pattern, so one function can slice any part out of the
   * sheet given that origin and the box size in model units.
   *
   * This rebuilds the figure as real CSS 3D boxes. No canvas, no WebGL, no
   * library: 12 boxes, 72 faces, each one a div with a background-position
   * into the same texture.
   */

  var SHEET = 64; // the atlas is 64 texture pixels square

  /* Face layout around a box origin (u, v), for a box w wide, h tall, d deep.
     Every value is in texture pixels.
       [ uOffset, vOffset, faceWidth, faceHeight ] */
  function faces(u, v, w, h, d) {
    return {
      top:    [u + d,         v,     w, d],
      bottom: [u + d + w,     v,     w, d],
      right:  [u,             v + d, d, h],
      front:  [u + d,         v + d, w, h],
      left:   [u + d + w,     v + d, d, h],
      back:   [u + d + w + d, v + d, w, h]
    };
  }

  /* Model units. The player is 32 tall; the origin sits at its middle, so
     every part's y is measured from there. x is positive toward the player's
     left, which is the viewer's right when the figure faces out. */
  var PARTS = [
    // name        w   h   d     x    y      base uv     overlay uv   overlay scale
    ["head",       8,  8,  8,    0, -12,    [0, 0],      [32, 0],     1.125],
    ["body",       8, 12,  4,    0,  -2,    [16, 16],    [16, 32],    1.06],
    ["arm-right",  4, 12,  4,   -6,  -2,    [40, 16],    [40, 32],    1.06],
    ["arm-left",   4, 12,  4,    6,  -2,    [32, 48],    [48, 48],    1.06],
    ["leg-right",  4, 12,  4,   -2,  10,    [0, 16],     [0, 32],     1.06],
    ["leg-left",   4, 12,  4,    2,  10,    [16, 48],    [0, 48],     1.06]
  ];

  /* Which way each face points, and how far out along that direction it sits.
     `half` names the box dimension whose half-extent is the push distance. */
  var ORIENT = {
    front:  { rot: "",                  half: "d" },
    back:   { rot: "rotateY(180deg) ",  half: "d" },
    // The sheet's "right" is the player's right, which is screen -X when the
    // figure faces the viewer. Swapping these two mirrors the whole skin.
    right:  { rot: "rotateY(-90deg) ",  half: "w" },
    left:   { rot: "rotateY(90deg) ",   half: "w" },
    top:    { rot: "rotateX(90deg) ",   half: "h" },
    bottom: { rot: "rotateX(-90deg) ",  half: "h" }
  };

  function buildBox(unit, w, h, d, uv, cls) {
    var box = document.createElement("div");
    box.className = cls;

    var px = { w: w * unit, h: h * unit, d: d * unit };
    var set = faces(uv[0], uv[1], w, h, d);

    Object.keys(set).forEach(function (name) {
      var f = set[name];
      var o = ORIENT[name];

      /* Face size in CSS pixels comes from the texture region, so a face is
         never stretched relative to the pixels it is showing. */
      var fw = f[2] * unit;
      var fh = f[3] * unit;

      var el = document.createElement("div");
      el.className = "face";
      el.style.width = fw + "px";
      el.style.height = fh + "px";
      el.style.marginLeft = -fw / 2 + "px";
      el.style.marginTop = -fh / 2 + "px";
      el.style.backgroundSize = SHEET * unit + "px " + SHEET * unit + "px";
      el.style.backgroundPosition = -f[0] * unit + "px " + -f[1] * unit + "px";
      el.style.transform = o.rot + "translateZ(" + px[o.half] / 2 + "px)";
      box.appendChild(el);
    });

    return box;
  }

  function buildFigure(unit) {
    var spin = document.createElement("div");
    spin.className = "model__spin";

    PARTS.forEach(function (p) {
      var name = p[0], w = p[1], h = p[2], d = p[3];
      var x = p[4], y = p[5], baseUV = p[6], overUV = p[7], overScale = p[8];

      var part = document.createElement("div");
      part.className = "part part--" + name;
      part.style.transform =
        "translate3d(" + x * unit + "px," + y * unit + "px,0)";

      part.appendChild(buildBox(unit, w, h, d, baseUV, "box box--base"));

      /* The second skin layer is the same box a few percent larger. Without
         the expansion the two surfaces sit on the same plane and the figure
         flickers as it turns, which is z-fighting rather than a paint bug. */
      part.appendChild(
        buildBox(unit * overScale, w, h, d, overUV, "box box--overlay")
      );

      spin.appendChild(part);
    });

    var model = document.createElement("div");
    model.className = "model";
    model.appendChild(spin);
    return model;
  }

  function readUnit() {
    /* The stylesheet is the single source of truth for how big the figure is;
       it steps the value up at wider viewports. */
    return parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--skin-unit")
    );
  }

  function mountFigure() {
    var stage = document.getElementById("stage");
    if (!stage) return;

    var unit = readUnit();
    if (!unit || unit <= 0) return; // no usable scale: keep the flat avatar

    var model = buildFigure(unit);
    var hint = stage.querySelector(".stage__hint");

    stage.insertBefore(model, hint || null);
    stage.setAttribute("data-ready", "");
    if (hint) hint.hidden = false;

    /* The angle the visitor has dragged to. Kept out here so it survives a
       rebuild: the figure should not snap back to facing front just because
       the window crossed a breakpoint. */
    var spin = 0;
    var dragging = false;
    var lastX = 0;
    var pointer = null;

    function apply() {
      model.style.setProperty("--spin", spin.toFixed(2) + "deg");
    }

    function release(e) {
      if (!dragging || (e && e.pointerId !== undefined && e.pointerId !== pointer)) return;
      dragging = false;
      pointer = null;
      model.removeAttribute("data-held");
    }

    /* Re-bound after every rebuild, because the listeners live on the element
       that gets replaced. */
    function attachDrag() {
      model.addEventListener("pointerdown", function (e) {
        dragging = true;
        pointer = e.pointerId;
        lastX = e.clientX;
        model.setAttribute("data-held", "");
        /* Capture so a fast drag that leaves the figure still tracks, and so
           the release arrives even if the pointer ends up elsewhere. */
        if (model.setPointerCapture) model.setPointerCapture(e.pointerId);
      });

      model.addEventListener("pointermove", function (e) {
        if (!dragging || e.pointerId !== pointer) return;
        spin += (e.clientX - lastX) * 0.55;
        lastX = e.clientX;
        apply();
      });

      model.addEventListener("pointerup", release);
      model.addEventListener("pointercancel", release);
    }

    /* A pointer lost without either event (tab switch mid-drag) would
       otherwise leave the idle turn paused for good. Bound once, on window. */
    window.addEventListener("blur", release);

    /* Face sizes are baked into inline styles at build time, so crossing a
       breakpoint changes --skin-unit but leaves the boxes at the old scale.
       Rebuild, and only when the number actually changed — a resize that does
       not cross a step costs nothing. */
    var resizeAt = null;
    window.addEventListener(
      "resize",
      function () {
        window.clearTimeout(resizeAt);
        resizeAt = window.setTimeout(function () {
          var next = readUnit();
          if (!next || next <= 0 || next === unit) return;
          unit = next;
          var fresh = buildFigure(unit);
          fresh.style.setProperty("--spin", spin.toFixed(2) + "deg");
          model.replaceWith(fresh);
          model = fresh;
          attachDrag();
        }, 150);
      },
      { passive: true }
    );

    attachDrag();
    apply();
  }

  /* ================= copy the handle ================= */

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

  function wireCopy() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".copy"));

    buttons.forEach(function (button) {
      var value = button.getAttribute("data-copy") || "";
      var hint = button.querySelector(".copy__hint");
      var resetAt = null;

      button.setAttribute("aria-label", "Copy the handle " + value);

      /* Silent-ish success: the word under the handle changes for a moment
         and nothing on the page moves. No toast for a visible result. */
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
  }

  mountFigure();
  wireCopy();
})();
