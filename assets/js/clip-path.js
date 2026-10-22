(function ($) {
  "use strict";

  $(function () {
    const defaults = {
      type: "polygon",
      points: [
        { id: "p1", x: 50, y: 0 },
        { id: "p2", x: 100, y: 50 },
        { id: "p3", x: 50, y: 100 },
        { id: "p4", x: 0, y: 50 }
      ],
      circle: { radius: 50, x: 50, y: 50 },
      ellipse: { radiusX: 50, radiusY: 40, x: 50, y: 50 },
      inset: { top: 10, right: 10, bottom: 10, left: 10, radius: 0 },
      selectedId: "p1",
      showGrid: true,
      showPoints: true,
      snap: 0,
      backgroundMode: "gradient",
      solidColor: "#2563eb",
      previewSize: "large",
      previewSurface: "light",
      includePreview: false,
      customPoints: null
    };
    const presets = [
      { name: "Diamond", type: "polygon", points: [[50, 0], [100, 50], [50, 100], [0, 50]] },
      { name: "Triangle", type: "polygon", points: [[50, 0], [100, 100], [0, 100]] },
      { name: "Pentagon", type: "polygon", points: [[50, 0], [98, 36], [80, 94], [20, 94], [2, 36]] },
      { name: "Hexagon", type: "polygon", points: [[25, 4], [75, 4], [100, 50], [75, 96], [25, 96], [0, 50]] },
      { name: "Octagon", type: "polygon", points: [[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]] },
      { name: "Parallelogram", type: "polygon", points: [[25, 0], [100, 0], [75, 100], [0, 100]] },
      { name: "Trapezoid", type: "polygon", points: [[20, 0], [80, 0], [100, 100], [0, 100]] },
      { name: "Chevron", type: "polygon", points: [[0, 0], [75, 0], [100, 50], [75, 100], [0, 100], [25, 50]] },
      { name: "Arrow", type: "polygon", points: [[0, 25], [65, 25], [65, 0], [100, 50], [65, 100], [65, 75], [0, 75]] },
      { name: "Star", type: "polygon", points: [[50, 0], [61, 35], [98, 35], [68, 57], [79, 94], [50, 72], [21, 94], [32, 57], [2, 35], [39, 35]] },
      { name: "Cross", type: "polygon", points: [[35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65], [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35]] },
      { name: "Blob", type: "polygon", points: [[50, 0], [76, 10], [94, 27], [100, 51], [87, 75], [73, 94], [47, 100], [25, 88], [7, 74], [0, 48], [13, 25], [29, 5]] },
      { name: "Circle", type: "circle" },
      { name: "Ellipse", type: "ellipse" },
      { name: "Soft Inset", type: "inset" },
      { name: "Ticket", type: "polygon", points: [[10, 0], [90, 0], [90, 35], [100, 50], [90, 65], [90, 100], [10, 100], [10, 65], [0, 50], [10, 35]] }
    ];
    let state = clone(defaults);
    let undoStack = [];
    let redoStack = [];
    let draggingId = null;
    let dragStart = null;
    let imageObjectUrl = null;
    let statusTimer;

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function snapshot() {
      return clone(state);
    }

    function recordHistory(before) {
      undoStack.push(before);
      if (undoStack.length > 50) undoStack.shift();
      redoStack = [];
      updateHistoryButtons();
    }

    function updateHistoryButtons() {
      $("#clip-undo").prop("disabled", !undoStack.length);
      $("#clip-redo").prop("disabled", !redoStack.length);
    }

    function fmt(value) {
      return Number(Number(value).toFixed(2)).toString();
    }

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function cssValue() {
      if (state.type === "circle") {
        return "circle(" + fmt(state.circle.radius) + "% at " + fmt(state.circle.x) + "% " + fmt(state.circle.y) + "%)";
      }
      if (state.type === "ellipse") {
        return "ellipse(" + fmt(state.ellipse.radiusX) + "% " + fmt(state.ellipse.radiusY) + "% at " + fmt(state.ellipse.x) + "% " + fmt(state.ellipse.y) + "%)";
      }
      if (state.type === "inset") {
        const inset = state.inset;
        const base = [inset.top, inset.right, inset.bottom, inset.left].map(fmt).join("% ") + "%";
        return "inset(" + base + (inset.radius ? " round " + fmt(inset.radius) + "px" : "") + ")";
      }
      return "polygon(" + state.points.map(function (point) {
        return fmt(point.x) + "% " + fmt(point.y) + "%";
      }).join(", ") + ")";
    }

    function generatedCss() {
      let css = ".clipped-shape {\n  clip-path: " + cssValue() + ";\n}";
      if (state.includePreview) {
        const background = state.backgroundMode === "solid"
          ? state.solidColor
          : state.backgroundMode === "image"
            ? 'url("your-image.jpg") center / cover'
            : "linear-gradient(135deg, #2563eb, #7c3aed)";
        css += "\n\n/* Optional preview background */\n.clipped-shape {\n  background: " + background + ";\n}";
      }
      return css;
    }

    function renderPoints() {
      const pointsString = state.points.map(function (point) { return point.x + "," + point.y; }).join(" ") +
        (state.points.length ? " " + state.points[0].x + "," + state.points[0].y : "");
      $("#clip-editor-outline").attr("points", pointsString);
      const $handles = $("#clip-editor-handles").empty();
      state.points.forEach(function (point, index) {
        const selected = point.id === state.selectedId;
        const $circle = $(document.createElementNS("http://www.w3.org/2000/svg", "circle"))
          .attr({ cx: point.x, cy: point.y, r: selected ? 2.6 : 2.1, tabindex: 0, role: "button" })
          .attr("aria-label", "Point " + (index + 1) + ", X " + point.x + " percent, Y " + point.y + " percent")
          .attr("aria-pressed", selected ? "true" : "false")
          .attr("data-point-id", point.id)
          .toggleClass("is-selected", selected);
        $handles.append($circle);
      });
    }

    function renderPointList() {
      $("#clip-point-count").text(state.points.length);
      const $list = $("#clip-point-list").empty();
      state.points.forEach(function (point, index) {
        const $button = $("<button>", { type: "button", class: "clip-point-chip", text: "P" + (index + 1) })
          .attr("aria-label", "Select point " + (index + 1))
          .attr("aria-pressed", point.id === state.selectedId ? "true" : "false")
          .toggleClass("is-selected", point.id === state.selectedId)
          .attr("data-point-id", point.id);
        $list.append($button);
      });
      const selected = state.points.find(function (point) { return point.id === state.selectedId; });
      if (selected) {
        const index = state.points.indexOf(selected) + 1;
        $("#clip-point-number").text("Point " + index);
        $("#clip-point-x").val(selected.x);
        $("#clip-point-y").val(selected.y);
        $("#clip-selected-point").prop("hidden", false);
        $("#remove-clip-point").prop("disabled", state.points.length <= 3);
        $("#clip-coordinate-readout").text("Point " + index + " · X " + selected.x + "% · Y " + selected.y + "%");
      } else {
        $("#clip-selected-point").prop("hidden", true);
      }
      $("#add-clip-point").prop("disabled", state.points.length >= 20);
    }

    function renderShapeEditor() {
      const polygon = state.type === "polygon";
      $("#polygon-controls").prop("hidden", !polygon);
      $("#circle-fields").prop("hidden", state.type !== "circle");
      $("#ellipse-fields").prop("hidden", state.type !== "ellipse");
      $("#inset-fields").prop("hidden", state.type !== "inset");
      $("#clip-editor-svg").toggle(polygon);
      $("#clip-editor-grid").toggle(state.showGrid && polygon);
      $("#clip-editor-handles").toggle(state.showPoints && polygon);
      $("#clip-editor-outline").toggle(polygon);
      $("#clip-editor-shape").toggle(!polygon).css("clip-path", cssValue());
      renderPoints();
      renderPointList();
      $("#circle-radius").val(state.circle.radius);
      $("#circle-radius-value").text(fmt(state.circle.radius) + "%");
      $("#circle-x").val(state.circle.x);
      $("#circle-y").val(state.circle.y);
      $("#ellipse-radius-x").val(state.ellipse.radiusX);
      $("#ellipse-radius-x-value").text(fmt(state.ellipse.radiusX) + "%");
      $("#ellipse-radius-y").val(state.ellipse.radiusY);
      $("#ellipse-radius-y-value").text(fmt(state.ellipse.radiusY) + "%");
      $("#ellipse-x").val(state.ellipse.x);
      $("#ellipse-y").val(state.ellipse.y);
      $("#inset-top").val(state.inset.top);
      $("#inset-right").val(state.inset.right);
      $("#inset-bottom").val(state.inset.bottom);
      $("#inset-left").val(state.inset.left);
      $("#inset-radius").val(state.inset.radius);
      $("#inset-radius-value").text(fmt(state.inset.radius) + "px");
      const inset = state.inset;
      $("#inset-empty-note").prop("hidden", inset.top + inset.bottom >= 100 || inset.left + inset.right >= 100);
    }

    function renderPreview() {
      const $stage = $("#clip-preview-stage");
      const $art = $("#clip-preview-art");
      $stage.removeClass("clip-preview-stage--light clip-preview-stage--dark clip-preview-stage--checkerboard")
        .addClass("clip-preview-stage--" + state.previewSurface);
      $art.removeClass("clip-preview-art--small clip-preview-art--medium clip-preview-art--large")
        .addClass("clip-preview-art--" + state.previewSize)
        .css("clip-path", cssValue());
      if (state.backgroundMode === "solid") {
        $art.css("background-image", "none").css("background-color", state.solidColor);
      } else if (state.backgroundMode === "image" && imageObjectUrl) {
        $art.css("background-color", "").css("background-image", "url('" + imageObjectUrl + "')");
      } else {
        $art.css("background-color", "").css("background-image", "linear-gradient(135deg, #2563eb 0%, #7c3aed 52%, #ec4899 100%)");
      }
      $("#clip-solid-control").prop("hidden", state.backgroundMode !== "solid");
      $("#clip-image-control").prop("hidden", state.backgroundMode !== "image");
    }

    function renderCode() {
      const escapeHtml = function (value) {
        return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      };
      const html = generatedCss().split("\n").map(function (line) {
        if (/^\s*\/\*/.test(line)) return '<span class="clip-code-comment">' + escapeHtml(line) + "</span>";
        if (/^\s*\.clipped-shape/.test(line)) return '<span class="clip-code-selector">' + escapeHtml(line) + "</span>";
        const property = line.match(/^(\s*)([a-z-]+)(:)(.*)$/);
        if (!property) return escapeHtml(line);
        const value = escapeHtml(property[4])
          .replace(/\b(polygon|circle|ellipse|inset|linear-gradient)\b/g, '<span class="clip-code-function">$1</span>')
          .replace(/(\d+(?:\.\d+)?(?:%|px|deg)?)/g, '<span class="clip-code-number">$1</span>');
        return escapeHtml(property[1]) + '<span class="clip-code-property">' + property[2] + "</span>" + property[3] + value;
      }).join("\n");
      $("#clip-generated-css").html(html);
    }

    function render() {
      $("#clip-shape-type").val(state.type);
      $("#clip-show-grid").prop("checked", state.showGrid);
      $("#clip-show-points").prop("checked", state.showPoints);
      $("#clip-snap").val(String(state.snap));
      $("#clip-bg-mode").val(state.backgroundMode);
      $("#clip-solid-color").val(state.solidColor);
      $("#clip-preview-size").val(state.previewSize);
      $("#clip-preview-bg").val(state.previewSurface);
      $("#clip-include-preview").prop("checked", state.includePreview);
      renderShapeEditor();
      renderPreview();
      renderCode();
    }

    function setMessage(selector, message) {
      $(selector).text(message);
    }

    function updatePolygonPoint(id, axis, value, input) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) {
        setMessage("#clip-validation", "Point coordinates must be between 0 and 100 percent.");
        $(input).attr("aria-invalid", "true");
        return;
      }
      $(input).removeAttr("aria-invalid");
      setMessage("#clip-validation", "");
      const before = snapshot();
      const point = state.points.find(function (item) { return item.id === id; });
      if (!point) return;
      point[axis] = Number(fmt(number));
      recordHistory(before);
      render();
    }

    function nextPointId() {
      return "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    }

    function addPoint() {
      if (state.points.length >= 20) return;
      const before = snapshot();
      let insertIndex = state.points.length;
      let x = 50;
      let y = 50;
      if (state.points.length >= 2) {
        const selectedIndex = state.points.findIndex(function (point) { return point.id === state.selectedId; });
        const index = selectedIndex < 0 ? state.points.length - 1 : selectedIndex;
        const a = state.points[index];
        const b = state.points[(index + 1) % state.points.length];
        x = Number(fmt((a.x + b.x) / 2));
        y = Number(fmt((a.y + b.y) / 2));
        insertIndex = index + 1;
      }
      const point = { id: nextPointId(), x: x, y: y };
      state.points.splice(insertIndex, 0, point);
      state.selectedId = point.id;
      recordHistory(before);
      render();
      $("#clip-point-x").trigger("focus").trigger("select");
    }

    function removePoint(id) {
      if (state.points.length <= 3) {
        setMessage("#clip-validation", "A polygon needs at least 3 points.");
        return;
      }
      const before = snapshot();
      const index = state.points.findIndex(function (point) { return point.id === id; });
      if (index < 0) return;
      state.points.splice(index, 1);
      if (state.selectedId === id) state.selectedId = state.points[Math.max(0, index - 1)].id;
      recordHistory(before);
      setMessage("#clip-validation", "");
      render();
    }

    function changeScalar(path, value, min, max, input) {
      const number = Number(value);
      if (!Number.isFinite(number) || number < min || number > max) {
        $(input).attr("aria-invalid", "true");
        setMessage("#clip-validation", "Enter a value between " + min + " and " + max + ".");
        return;
      }
      $(input).removeAttr("aria-invalid");
      setMessage("#clip-validation", "");
      const before = snapshot();
      const keys = path.split(".");
      state[keys[0]][keys[1]] = Number(fmt(number));
      recordHistory(before);
      render();
    }

    function pointFromEvent(event) {
      const rect = $("#clip-editor-svg")[0].getBoundingClientRect();
      const original = event.originalEvent || event;
      const clientX = original.clientX;
      const clientY = original.clientY;
      let x = clamp((clientX - rect.left) / rect.width * 100, 0, 100);
      let y = clamp((clientY - rect.top) / rect.height * 100, 0, 100);
      if (state.snap) {
        x = clamp(Math.round(x / state.snap) * state.snap, 0, 100);
        y = clamp(Math.round(y / state.snap) * state.snap, 0, 100);
      }
      return { x: Number(fmt(x)), y: Number(fmt(y)) };
    }

    function selectPoint(id) {
      if (!state.points.some(function (point) { return point.id === id; })) return;
      state.selectedId = id;
      renderPoints();
      renderPointList();
    }

    function moveDraggedPoint(event) {
      if (!draggingId) return;
      const position = pointFromEvent(event);
      const point = state.points.find(function (item) { return item.id === draggingId; });
      if (!point) return;
      point.x = position.x;
      point.y = position.y;
      render();
    }

    function finishPointDrag() {
      if (!draggingId) return;
      if (JSON.stringify(dragStart) !== JSON.stringify(state)) recordHistory(dragStart);
      draggingId = null;
      dragStart = null;
      $(window).off(".clipPathDrag");
    }

    function applyPreset(preset) {
      const before = snapshot();
      if (preset.type === "polygon") {
        state.points = preset.points.map(function (coordinates) {
          return { id: nextPointId(), x: coordinates[0], y: coordinates[1] };
        });
        state.selectedId = state.points[0].id;
        state.customPoints = clone(state.points);
      } else if (state.type === "polygon") {
        state.customPoints = clone(state.points);
      }
      state.type = preset.type;
      recordHistory(before);
      setMessage("#clip-validation", "");
      render();
    }

    function loadHistory(source, destination) {
      if (!source.length) return;
      destination.push(snapshot());
      state = source.pop();
      updateHistoryButtons();
      render();
    }

    function resetShape() {
      const before = snapshot();
      state.type = "polygon";
      state.points = clone(defaults.points);
      state.selectedId = "p1";
      recordHistory(before);
      setMessage("#clip-validation", "");
      render();
    }

    function resetAll() {
      const before = snapshot();
      if (imageObjectUrl) {
        URL.revokeObjectURL(imageObjectUrl);
        imageObjectUrl = null;
      }
      state = clone(defaults);
      recordHistory(before);
      $("#clip-image-upload").val("");
      $("#clip-image-error").text("");
      setMessage("#clip-validation", "");
      render();
    }

    function copyText(text, label) {
      const fallback = function () {
        const $textarea = $("<textarea>").val(text).css({ position: "fixed", opacity: 0 }).appendTo("body");
        $textarea[0].select();
        let copied = false;
        try { copied = document.execCommand("copy"); } finally { $textarea.remove(); }
        announceCopy(copied, label);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          announceCopy(true, label);
        }).catch(fallback);
      } else fallback();
    }

    function announceCopy(success, label) {
      clearTimeout(statusTimer);
      $("#clip-copy-status").text(success ? label + " copied to clipboard." : "Could not copy. Please select and copy the code manually.");
      statusTimer = setTimeout(function () { $("#clip-copy-status").text(""); }, 4000);
    }

    function drawPresets() {
      const $grid = $("#clip-presets");
      presets.forEach(function (preset, index) {
        const value = preset.type === "polygon"
          ? "polygon(" + preset.points.map(function (point) { return point.join("% ") + "%"; }).join(", ") + ")"
          : preset.type === "circle" ? "circle(50%)" : preset.type === "ellipse" ? "ellipse(50% 40%)" : "inset(10% round 12px)";
        const $button = $("<button>", { class: "clip-preset-card", type: "button" })
          .attr("aria-label", "Apply " + preset.name + " shape preset");
        const $swatch = $("<span>", { class: "clip-preset-swatch clip-preset-swatch--" + (index + 1), "aria-hidden": "true" })
          .css("clip-path", value);
        $button.append($swatch, $("<span>", { class: "clip-preset-name", text: preset.name }), $("<span>", { class: "clip-preset-type", text: preset.type }));
        $button.on("click", function () { applyPreset(preset); });
        $grid.append($button);
      });
    }

    $("#clip-shape-type").on("change", function () {
      const before = snapshot();
      if (state.type === "polygon") state.customPoints = clone(state.points);
      state.type = this.value;
      if (state.type === "polygon" && state.customPoints) {
        state.points = clone(state.customPoints);
        if (!state.points.some(function (point) { return point.id === state.selectedId; })) state.selectedId = state.points[0].id;
      }
      recordHistory(before);
      render();
    });

    $("#circle-radius").on("input change", function () { changeScalar("circle.radius", this.value, 0, 100, this); });
    $("#circle-x").on("change", function () { changeScalar("circle.x", this.value, 0, 100, this); });
    $("#circle-y").on("change", function () { changeScalar("circle.y", this.value, 0, 100, this); });
    $("#ellipse-radius-x").on("input change", function () { changeScalar("ellipse.radiusX", this.value, 0, 100, this); });
    $("#ellipse-radius-y").on("input change", function () { changeScalar("ellipse.radiusY", this.value, 0, 100, this); });
    $("#ellipse-x").on("change", function () { changeScalar("ellipse.x", this.value, 0, 100, this); });
    $("#ellipse-y").on("change", function () { changeScalar("ellipse.y", this.value, 0, 100, this); });
    $("#inset-top, #inset-right, #inset-bottom, #inset-left").on("change", function () {
      changeScalar("inset." + this.id.replace("inset-", ""), this.value, 0, 100, this);
    });
    $("#inset-radius").on("input change", function () { changeScalar("inset.radius", this.value, 0, 100, this); });
    $("#clip-point-x, #clip-point-y").on("change", function () {
      updatePolygonPoint(state.selectedId, this.id.endsWith("-x") ? "x" : "y", this.value, this);
    });
    $("#add-clip-point").on("click", addPoint);
    $("#remove-clip-point").on("click", function () { removePoint(state.selectedId); });
    $("#clip-point-list").on("click", ".clip-point-chip", function () { selectPoint($(this).attr("data-point-id")); });
    $("#clip-editor-handles").on("click", "circle", function (event) {
      event.stopPropagation();
      selectPoint($(this).attr("data-point-id"));
    }).on("pointerdown", "circle", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      event.preventDefault();
      draggingId = $(this).attr("data-point-id");
      state.selectedId = draggingId;
      dragStart = snapshot();
      renderPointList();
      $("#clip-editor-handles circle").each(function () {
        const selected = $(this).attr("data-point-id") === draggingId;
        $(this).toggleClass("is-selected", selected).attr("aria-pressed", selected ? "true" : "false");
      });
      $(window).on("pointermove.clipPathDrag", moveDraggedPoint)
        .on("pointerup.clipPathDrag pointercancel.clipPathDrag", finishPointDrag);
    }).on("keydown", "circle", function (event) {
      const directions = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (!directions[event.key]) return;
      event.preventDefault();
      const before = snapshot();
      const point = state.points.find(function (item) { return item.id === $(this).attr("data-point-id"); }.bind(this));
      if (!point) return;
      const step = state.snap || (event.shiftKey ? 5 : 1);
      point.x = clamp(point.x + directions[event.key][0] * step, 0, 100);
      point.y = clamp(point.y + directions[event.key][1] * step, 0, 100);
      recordHistory(before);
      render();
      $("#clip-editor-handles circle[data-point-id='" + point.id + "']").trigger("focus");
    });

    $("#clip-editor-svg").on("click", function (event) {
      if ($(event.target).closest("circle").length || state.points.length >= 20) return;
      const position = pointFromEvent(event);
      const before = snapshot();
      let best = { distance: Infinity, index: state.points.length - 1, x: position.x, y: position.y };
      state.points.forEach(function (point, index) {
        const next = state.points[(index + 1) % state.points.length];
        const dx = next.x - point.x;
        const dy = next.y - point.y;
        const lengthSquared = dx * dx + dy * dy || 1;
        const t = clamp(((position.x - point.x) * dx + (position.y - point.y) * dy) / lengthSquared, 0, 1);
        const x = point.x + t * dx;
        const y = point.y + t * dy;
        const distance = Math.hypot(position.x - x, position.y - y);
        if (distance < best.distance) best = { distance: distance, index: index, x: Number(fmt(x)), y: Number(fmt(y)) };
      });
      if (best.distance > 12) return;
      const point = { id: nextPointId(), x: best.x, y: best.y };
      state.points.splice(best.index + 1, 0, point);
      state.selectedId = point.id;
      recordHistory(before);
      render();
    });

    $("#clip-show-grid").on("change", function () { state.showGrid = this.checked; renderShapeEditor(); });
    $("#clip-show-points").on("change", function () { state.showPoints = this.checked; renderShapeEditor(); });
    $("#clip-snap").on("change", function () { state.snap = Number(this.value); });
    $("#clip-reset-shape").on("click", resetShape);
    $("#clip-undo").on("click", function () { loadHistory(undoStack, redoStack); });
    $("#clip-redo").on("click", function () { loadHistory(redoStack, undoStack); });

    $("#clip-bg-mode").on("change", function () { state.backgroundMode = this.value; renderPreview(); renderCode(); });
    $("#clip-solid-color").on("input change", function () { state.solidColor = this.value; renderPreview(); renderCode(); });
    $("#clip-preview-size").on("change", function () { state.previewSize = this.value; renderPreview(); });
    $("#clip-preview-bg").on("change", function () { state.previewSurface = this.value; renderPreview(); });
    $("#clip-include-preview").on("change", function () { state.includePreview = this.checked; renderCode(); });
    $("#clip-image-upload").on("change", function () {
      const file = this.files && this.files[0];
      $("#clip-image-error").text("");
      if (!file) return;
      const validType = ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      if (!validType) {
        this.value = "";
        $("#clip-image-error").text("Choose a JPG, PNG, or WEBP image.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.value = "";
        $("#clip-image-error").text("Image must be 5 MB or smaller.");
        return;
      }
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
      imageObjectUrl = URL.createObjectURL(file);
      state.backgroundMode = "image";
      render();
    });
    $("#copy-clip-css").on("click", function () { copyText(generatedCss(), "CSS"); });
    $("#copy-clip-value").on("click", function () { copyText("clip-path: " + cssValue() + ";", "Clip-path value"); });
    $("#clip-reset-all").on("click", resetAll);
    $(window).on("beforeunload.clipPath", function () { if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl); });

    drawPresets();
    render();
    updateHistoryButtons();
  });
})(jQuery);
