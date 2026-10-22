$(function () {
  "use strict";

  const DEFAULTS = {
    type: "linear",
    linear: { angle: 90 },
    radial: { shape: "circle", size: "farthest-corner", x: 50, y: 50, position: "center" },
    conic: { angle: 0, x: 50, y: 50 },
    stops: [
      { id: 1, color: "#2563EB", position: 0 },
      { id: 2, color: "#9333EA", position: 100 }
    ],
    preview: { shape: "rounded", size: "large", showText: true, textColor: "white", checkerboard: false }
  };
  const MAX_STOPS = 10;
  const MIN_STOPS = 2;
  const DIRECTIONS = [
    { angle: 0, name: "To Top" },
    { angle: 45, name: "To Top Right" },
    { angle: 90, name: "To Right" },
    { angle: 135, name: "To Bottom Right" },
    { angle: 180, name: "To Bottom" },
    { angle: 225, name: "To Bottom Left" },
    { angle: 270, name: "To Left" },
    { angle: 315, name: "To Top Left" }
  ];
  const PRESETS = [
    { id: "ocean", name: "Ocean Blue", type: "linear", angle: 120, stops: [["#0EA5E9", 0], ["#2563EB", 52], ["#312E81", 100]] },
    { id: "purple", name: "Purple Dream", type: "linear", angle: 135, stops: [["#A855F7", 0], ["#EC4899", 100]] },
    { id: "sunset", name: "Sunset Orange", type: "linear", angle: 110, stops: [["#F97316", 0], ["#EF4444", 55], ["#7C3AED", 100]] },
    { id: "mint", name: "Mint Fresh", type: "linear", angle: 120, stops: [["#34D399", 0], ["#06B6D4", 100]] },
    { id: "pink", name: "Pink Blossom", type: "linear", angle: 135, stops: [["#FBCFE8", 0], ["#F472B6", 52], ["#A855F7", 100]] },
    { id: "night", name: "Dark Night", type: "linear", angle: 135, stops: [["#0F172A", 0], ["#312E81", 55], ["#581C87", 100]] },
    { id: "pastel", name: "Pastel Sky", type: "linear", angle: 120, stops: [["#BAE6FD", 0], ["#DDD6FE", 52], ["#FBCFE8", 100]] },
    { id: "aurora", name: "Aurora", type: "linear", angle: 115, stops: [["#22C55E", 0], ["#06B6D4", 36], ["#8B5CF6", 70], ["#EC4899", 100]] },
    { id: "radial", name: "Radial Glow", type: "radial", shape: "circle", size: "farthest-corner", x: 45, y: 42, stops: [["#FDE68A", 0], ["#F97316", 45], ["#7C2D12", 100]] },
    { id: "conic", name: "Conic Spectrum", type: "conic", angle: 0, x: 50, y: 50, stops: [["#EF4444", 0], ["#F59E0B", 17], ["#22C55E", 34], ["#06B6D4", 51], ["#3B82F6", 68], ["#A855F7", 84], ["#EF4444", 100]] }
  ];
  const $stopList = $("#gradient-stop-list");
  const $stopTrack = $("#gradient-bar-track");
  const $preview = $("#gradient-preview-surface");
  const $copyStatus = $("#gradient-copy-status");
  let nextStopId = 3;
  let draggingStopId = null;
  let state = createInitialState();

  function createInitialState() {
    nextStopId = 3;
    return {
      type: DEFAULTS.type,
      linear: Object.assign({}, DEFAULTS.linear),
      radial: Object.assign({}, DEFAULTS.radial),
      conic: Object.assign({}, DEFAULTS.conic),
      stops: DEFAULTS.stops.map(function (stop) { return Object.assign({}, stop); }),
      preview: Object.assign({}, DEFAULTS.preview),
      selectedStopId: 1
    };
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function validHex(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function orderedStops(stops) {
    const source = stops || state.stops;
    return source.slice().sort(function (a, b) {
      return a.position - b.position || source.indexOf(a) - source.indexOf(b);
    });
  }

  function stopListCss(stops) {
    return stops.map(function (stop) {
      return stop.color.toUpperCase() + " " + stop.position + "%";
    });
  }

  function gradientValue(current) {
    const stops = stopListCss(orderedStops(current.stops)).join(", ");
    if (current.type === "radial") {
      const radialPosition = current.radial.position === "custom" ||
        !["center", "top", "bottom", "left", "right"].includes(current.radial.position)
        ? current.radial.x + "% " + current.radial.y + "%"
        : current.radial.position;
      return "radial-gradient(" + current.radial.shape + " " + current.radial.size + " at " + radialPosition + ", " + stops + ")";
    }
    if (current.type === "conic") {
      return "conic-gradient(from " + current.conic.angle + "deg at " + current.conic.x + "% " + current.conic.y + "%, " + stops + ")";
    }
    return "linear-gradient(" + current.linear.angle + "deg, " + stops + ")";
  }

  function generatedCss(current) {
    const stops = stopListCss(orderedStops(current.stops));
    let heading;
    let closing = ")";
    if (current.type === "radial") {
      const pos = current.radial.position === "custom" ||
        !["center", "top", "bottom", "left", "right"].includes(current.radial.position)
        ? current.radial.x + "% " + current.radial.y + "%"
        : current.radial.position;
      heading = "radial-gradient(\n    " + current.radial.shape + " " + current.radial.size + " at " + pos + ",";
    } else if (current.type === "conic") {
      heading = "conic-gradient(\n    from " + current.conic.angle + "deg at " + current.conic.x + "% " + current.conic.y + "%,";
    } else {
      heading = "linear-gradient(\n    " + current.linear.angle + "deg,";
    }
    const body = stops.map(function (stop) { return "    " + stop; }).join(",\n");
    return ".gradient-box {\n  background: " + heading + "\n" + body + "\n  " + closing + ";\n}";
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function highlightCss(css) {
    return escapeHtml(css)
      .replace(/^([ \t]*)([\w-]+)(:)/gm, '$1<span class="gradient-code-property">$2</span>$3')
      .replace(/(:[ \t]*)([^;\n]+)(;)/g, '$1<span class="gradient-code-value">$2</span>$3');
  }

  function renderPresets() {
    const $presets = $("#gradient-presets").empty();
    PRESETS.forEach(function (preset) {
      const preview = preset.type === "linear"
        ? "linear-gradient(" + preset.angle + "deg, " + preset.stops.map(function (stop) { return stop[0] + " " + stop[1] + "%"; }).join(", ") + ")"
        : preset.type === "radial"
          ? "radial-gradient(" + preset.shape + " " + preset.size + " at " + preset.x + "% " + preset.y + "%, " + preset.stops.map(function (stop) { return stop[0] + " " + stop[1] + "%"; }).join(", ") + ")"
          : "conic-gradient(from " + preset.angle + "deg at " + preset.x + "% " + preset.y + "%, " + preset.stops.map(function (stop) { return stop[0] + " " + stop[1] + "%"; }).join(", ") + ")";
      const $button = $("<button>", {
        class: "gradient-preset",
        type: "button",
        "data-gradient-preset": preset.id,
        "aria-label": "Apply " + preset.name + " gradient preset"
      });
      $("<span>", { class: "gradient-preset-swatch", "aria-hidden": "true" }).css("background", preview).appendTo($button);
      $("<strong>", { text: preset.name }).appendTo($button);
      $presets.append($button);
    });
  }

  function renderStopList() {
    $stopList.empty();
    orderedStops().forEach(function (stop, index) {
      const $card = $("<article>", {
        class: "gradient-stop-card" + (stop.id === state.selectedStopId ? " is-selected" : ""),
        "data-stop-id": stop.id
      });
      const $header = $("<div>", { class: "gradient-stop-card__header" });
      const $select = $("<button>", {
        class: "gradient-stop-select",
        type: "button",
        "aria-pressed": String(stop.id === state.selectedStopId),
        text: "Stop " + (index + 1)
      });
      const $actions = $("<div>", { class: "gradient-stop-actions" });
      const $up = $("<button>", { class: "gradient-stop-action stop-up", type: "button", text: "↑", "aria-label": "Move stop " + (index + 1) + " up", disabled: index === 0 });
      const $down = $("<button>", { class: "gradient-stop-action stop-down", type: "button", text: "↓", "aria-label": "Move stop " + (index + 1) + " down", disabled: index === state.stops.length - 1 });
      const $remove = $("<button>", { class: "gradient-stop-action stop-remove", type: "button", text: "×", "aria-label": "Remove stop " + (index + 1), disabled: state.stops.length <= MIN_STOPS });
      $actions.append($up, $down, $remove);
      $header.append($select, $actions);
      const $colorLabel = $("<label>", { class: "gradient-color-label", text: "Color" });
      const $colorWrap = $("<div>", { class: "gradient-color-control" });
      const $picker = $("<input>", { type: "color", class: "stop-color-picker", value: stop.color, "aria-label": "Color for stop " + (index + 1) });
      const $hex = $("<input>", { type: "text", class: "stop-color-hex", value: stop.color, maxlength: 7, spellcheck: "false", autocomplete: "off", "aria-label": "HEX color for stop " + (index + 1), "aria-describedby": "gradient-validation" });
      $colorWrap.append($picker, $hex);
      const $positionLabel = $("<label>", { class: "gradient-position-label", text: "Position" });
      const $positionControls = $("<div>", { class: "gradient-stop-position-control" });
      const $position = $("<input>", { type: "number", class: "stop-position-number", min: 0, max: 100, step: 1, value: stop.position, "aria-label": "Position for stop " + (index + 1) });
      const $percent = $("<span>", { text: "%" });
      $positionControls.append($position, $percent);
      const $range = $("<input>", { type: "range", class: "gradient-range stop-position-range", min: 0, max: 100, step: 1, value: stop.position, "aria-label": "Position slider for stop " + (index + 1) });
      const $error = $("<p>", { class: "gradient-stop-error", role: "alert" });
      $card.append($header, $colorLabel, $colorWrap, $positionLabel, $positionControls, $range, $error);
      $stopList.append($card);
    });
    $("#gradient-stop-count").text(state.stops.length);
    $("#add-gradient-stop").prop("disabled", state.stops.length >= MAX_STOPS);
  }

  function renderBar() {
    $stopTrack.empty();
    const colors = stopListCss(orderedStops()).join(", ");
    $stopTrack.css("background", "transparent");
    $("#gradient-bar").css("background-image", "linear-gradient(90deg, " + colors + ")");
    orderedStops().forEach(function (stop, index) {
      const $handle = $("<button>", {
        class: "gradient-stop-handle" + (stop.id === state.selectedStopId ? " is-selected" : ""),
        type: "button",
        "data-stop-id": stop.id,
        "aria-label": "Color stop " + (index + 1) + " at " + stop.position + " percent",
        "aria-valuemin": "0",
        "aria-valuemax": "100",
        "aria-valuenow": String(stop.position),
        role: "slider",
        tabindex: "0"
      }).css({ left: stop.position + "%", backgroundColor: stop.color });
      $stopTrack.append($handle);
    });
  }

  function syncTypeControls() {
    $("#gradient-type").val(state.type);
    $("#linear-settings").prop("hidden", state.type !== "linear");
    $("#radial-settings").prop("hidden", state.type !== "radial");
    $("#conic-settings").prop("hidden", state.type !== "conic");
    $("#linear-angle, #linear-angle-range").val(state.linear.angle);
    $("#radial-shape").val(state.radial.shape);
    $("#radial-size").val(state.radial.size);
    $("#radial-position").val(state.radial.position);
    $("#radial-custom-position").prop("hidden", state.radial.position !== "custom");
    $("#radial-x, #radial-x-range").val(state.radial.x);
    $("#radial-y, #radial-y-range").val(state.radial.y);
    $("#conic-angle, #conic-angle-range").val(state.conic.angle);
    $("#conic-x, #conic-x-range").val(state.conic.x);
    $("#conic-y, #conic-y-range").val(state.conic.y);
    const direction = DIRECTIONS.find(function (entry) { return entry.angle === state.linear.angle; });
    $("#linear-direction-name").text(direction ? direction.name : "Custom angle");
    $(".gradient-direction-grid button").each(function () {
      $(this).toggleClass("is-active", Number($(this).attr("data-angle")) === state.linear.angle);
    });
  }

  function syncPreviewOptions() {
    $("#preview-shape").val(state.preview.shape);
    $("#preview-size").val(state.preview.size);
    $("#preview-show-text").prop("checked", state.preview.showText);
    $("#preview-text-color").val(state.preview.textColor);
    $("#preview-checkerboard").prop("checked", state.preview.checkerboard);
  }

  function renderPreview() {
    const value = gradientValue(state);
    $preview.css("background-image", value);
    $("#gradient-preview-type").text(
      state.type === "linear" ? "Linear · " + state.linear.angle + "°" :
        state.type === "radial" ? "Radial · " + state.radial.shape :
          "Conic · " + state.conic.angle + "°"
    );
    $("#gradient-preview-summary").text(state.stops.length + " color stops · " + state.type.charAt(0).toUpperCase() + state.type.slice(1));
    $preview.attr("aria-label", state.type.charAt(0).toUpperCase() + state.type.slice(1) + " gradient with " + state.stops.length + " color stops");
    $preview.removeClass("gradient-shape-rectangle gradient-shape-rounded gradient-shape-circle gradient-size-small gradient-size-medium gradient-size-large gradient-checkerboard gradient-text-white gradient-text-dark");
    $preview.addClass("gradient-shape-" + state.preview.shape + " gradient-size-" + state.preview.size);
    if (state.preview.checkerboard) $preview.addClass("gradient-checkerboard");
    $("#gradient-preview-stage").toggleClass("is-checkerboard", state.preview.checkerboard);
    $preview.toggleClass("has-gradient-text", state.preview.showText);
    $("#gradient-preview-text").toggle(state.preview.showText)
      .toggleClass("gradient-text-white", state.preview.textColor === "white")
      .toggleClass("gradient-text-dark", state.preview.textColor === "dark");
  }

  function renderCode() {
    $("#gradient-css-code").html(highlightCss(generatedCss(state)));
  }

  function render() {
    syncTypeControls();
    syncPreviewOptions();
    renderStopList();
    renderBar();
    renderPreview();
    renderCode();
  }

  function setStopPosition(stopId, rawValue, showError) {
    const stop = state.stops.find(function (item) { return item.id === stopId; });
    if (!stop) return;
    const number = Number(rawValue);
    if (rawValue === "" || !Number.isFinite(number) || number < 0 || number > 100) {
      if (showError) {
        $('.gradient-stop-card[data-stop-id="' + stopId + '"] .gradient-stop-error').text("Position must be between 0% and 100%.");
      }
      return;
    }
    stop.position = Math.round(number * 100) / 100;
    $("#gradient-validation").text("");
    $('.gradient-stop-card[data-stop-id="' + stopId + '"] .stop-position-number, .gradient-stop-card[data-stop-id="' + stopId + '"] .stop-position-range').val(stop.position);
    syncStopLive();
  }

  function syncStopLive() {
    orderedStops().forEach(function (stop, index) {
      const $card = $('.gradient-stop-card[data-stop-id="' + stop.id + '"]');
      $card.find(".stop-color-picker").val(stop.color);
      $card.find(".stop-color-hex").val(stop.color);
      $card.find(".stop-position-number, .stop-position-range").val(stop.position);
      $card.find(".gradient-stop-select").attr("aria-pressed", String(stop.id === state.selectedStopId)).text("Stop " + (index + 1));
    });
    renderBar();
    renderPreview();
    renderCode();
  }

  function updateStopColor(stopId, value, source) {
    const stop = state.stops.find(function (item) { return item.id === stopId; });
    if (!stop) return;
    if (!validHex(value)) {
      $('.gradient-stop-card[data-stop-id="' + stopId + '"] .gradient-stop-error').text("Enter a valid HEX color, for example #2563EB.");
      return;
    }
    stop.color = value.toUpperCase();
    $("#gradient-validation").text("");
    $('.gradient-stop-card[data-stop-id="' + stopId + '"] .gradient-stop-error').text("");
    if (source === "picker") $('.gradient-stop-card[data-stop-id="' + stopId + '"] .stop-color-hex').val(stop.color);
    else $('.gradient-stop-card[data-stop-id="' + stopId + '"] .stop-color-picker').val(stop.color);
    syncStopLive();
  }

  function selectStop(stopId) {
    if (!state.stops.some(function (stop) { return stop.id === stopId; })) return;
    state.selectedStopId = stopId;
    renderStopList();
    renderBar();
  }

  function moveStop(stopId, offset) {
    const ordered = orderedStops();
    const index = ordered.findIndex(function (stop) { return stop.id === stopId; });
    const target = index + offset;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const selected = ordered[index];
    const neighbor = ordered[target];
    const selectedPosition = selected.position;
    selected.position = neighbor.position;
    neighbor.position = selectedPosition;
    const sourceIndex = state.stops.indexOf(selected);
    const targetIndex = state.stops.indexOf(neighbor);
    state.stops[sourceIndex] = neighbor;
    state.stops[targetIndex] = selected;
    state.selectedStopId = selected.id;
    render();
  }

  function applyPreset(presetId) {
    const preset = PRESETS.find(function (item) { return item.id === presetId; });
    if (!preset) return;
    state.type = preset.type;
    if (preset.type === "linear") state.linear.angle = preset.angle;
    if (preset.type === "radial") {
      state.radial.shape = preset.shape;
      state.radial.size = preset.size;
      state.radial.x = preset.x;
      state.radial.y = preset.y;
      state.radial.position = "custom";
    }
    if (preset.type === "conic") {
      state.conic.angle = preset.angle;
      state.conic.x = preset.x;
      state.conic.y = preset.y;
    }
    state.stops = preset.stops.map(function (stop, index) {
      return { id: index + 1, color: stop[0], position: stop[1] };
    });
    nextStopId = state.stops.length + 1;
    state.selectedStopId = state.stops[0].id;
    $("#gradient-validation").text("");
    $copyStatus.text("");
    render();
  }

  function randomHex() {
    return "#" + Math.floor(Math.random() * 0x1000000).toString(16).padStart(6, "0").toUpperCase();
  }

  function randomizeColors() {
    state.stops.forEach(function (stop) { stop.color = randomHex(); });
    $("#gradient-validation").text("");
    render();
  }

  function randomizeAll() {
    const types = ["linear", "radial", "conic"];
    state.type = types[Math.floor(Math.random() * types.length)];
    state.linear.angle = Math.floor(Math.random() * 361);
    state.radial.shape = Math.random() < 0.5 ? "circle" : "ellipse";
    state.radial.size = ["closest-side", "closest-corner", "farthest-side", "farthest-corner"][Math.floor(Math.random() * 4)];
    state.radial.position = "custom";
    state.radial.x = Math.floor(Math.random() * 101);
    state.radial.y = Math.floor(Math.random() * 101);
    state.conic.angle = Math.floor(Math.random() * 361);
    state.conic.x = Math.floor(Math.random() * 101);
    state.conic.y = Math.floor(Math.random() * 101);
    const count = 2 + Math.floor(Math.random() * 4);
    state.stops = Array.from({ length: count }, function (_, index) {
      const position = index === 0 ? 0 : index === count - 1 ? 100 : Math.round(index * 100 / (count - 1));
      return { id: index + 1, color: randomHex(), position: position };
    });
    nextStopId = count + 1;
    state.selectedStopId = state.stops[0].id;
    $("#gradient-validation").text("");
    render();
  }

  async function copyText(value, label) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard access is unavailable. Use HTTPS or localhost to copy.");
      }
      await navigator.clipboard.writeText(value);
      $copyStatus.text(label + " copied to clipboard.");
    } catch (error) {
      $copyStatus.text(error.message || "Could not copy. Please select and copy manually.");
    }
  }

  function reset() {
    state = createInitialState();
    $("#gradient-validation").text("");
    $(".gradient-stop-error").text("");
    $copyStatus.text("");
    render();
  }

  function updateNumericState(selector, stateKey, property, min, max) {
    $(selector).on("input.gradient change.gradient", function () {
      const number = Number(this.value);
      if (this.value === "" || !Number.isFinite(number) || number < min || number > max) {
        $("#gradient-validation").text("Enter a value between " + min + " and " + max + ".");
        return;
      }
      state[stateKey][property] = Math.round(number * 100) / 100;
      $("#gradient-validation").text("");
      render();
    });
  }

  $("#gradient-type").on("change.gradient", function () {
    state.type = $(this).val();
    render();
  });
  updateNumericState("#linear-angle, #linear-angle-range", "linear", "angle", 0, 360);
  updateNumericState("#conic-angle, #conic-angle-range", "conic", "angle", 0, 360);
  updateNumericState("#radial-x, #radial-x-range", "radial", "x", 0, 100);
  updateNumericState("#radial-y, #radial-y-range", "radial", "y", 0, 100);
  updateNumericState("#conic-x, #conic-x-range", "conic", "x", 0, 100);
  updateNumericState("#conic-y, #conic-y-range", "conic", "y", 0, 100);
  $("#radial-shape").on("change.gradient", function () { state.radial.shape = $(this).val(); render(); });
  $("#radial-size").on("change.gradient", function () { state.radial.size = $(this).val(); render(); });
  $("#radial-position").on("change.gradient", function () {
    const position = $(this).val();
    state.radial.position = position;
    const positions = {
      center: [50, 50],
      top: [50, 0],
      bottom: [50, 100],
      left: [0, 50],
      right: [100, 50]
    };
    if (positions[position]) {
      state.radial.x = positions[position][0];
      state.radial.y = positions[position][1];
    }
    render();
  });
  $(".gradient-direction-grid").on("click.gradient", "button", function () {
    state.linear.angle = Number($(this).attr("data-angle"));
    render();
  });

  $("#add-gradient-stop").on("click.gradient", function () {
    if (state.stops.length >= MAX_STOPS) return;
    const ordered = orderedStops();
    const first = ordered[ordered.length - 2];
    const last = ordered[ordered.length - 1];
    const newPosition = Math.round((first.position + last.position) / 2);
    const stop = { id: nextStopId++, color: randomHex(), position: newPosition };
    state.stops.push(stop);
    state.selectedStopId = stop.id;
    render();
  });
  $stopList.on("click.gradient", ".gradient-stop-select", function () {
    selectStop(Number($(this).closest(".gradient-stop-card").attr("data-stop-id")));
  });
  $stopList.on("click.gradient", ".stop-up", function () {
    moveStop(Number($(this).closest(".gradient-stop-card").attr("data-stop-id")), -1);
  });
  $stopList.on("click.gradient", ".stop-down", function () {
    moveStop(Number($(this).closest(".gradient-stop-card").attr("data-stop-id")), 1);
  });
  $stopList.on("click.gradient", ".stop-remove", function () {
    if (state.stops.length <= MIN_STOPS) return;
    const id = Number($(this).closest(".gradient-stop-card").attr("data-stop-id"));
    state.stops = state.stops.filter(function (stop) { return stop.id !== id; });
    if (state.selectedStopId === id) state.selectedStopId = state.stops[0].id;
    render();
  });
  $stopList.on("input.gradient change.gradient", ".stop-position-number, .stop-position-range", function (event) {
    const id = Number($(this).closest(".gradient-stop-card").attr("data-stop-id"));
    setStopPosition(id, this.value, this.type === "number");
    if (event.type === "change") render();
  });
  $stopList.on("input.gradient change.gradient", ".stop-color-picker", function () {
    const id = Number($(this).closest(".gradient-stop-card").attr("data-stop-id"));
    updateStopColor(id, this.value, "picker");
  });
  $stopList.on("input.gradient change.gradient", ".stop-color-hex", function () {
    const id = Number($(this).closest(".gradient-stop-card").attr("data-stop-id"));
    updateStopColor(id, this.value, "hex");
  });

  $stopTrack.on("click.gradient", ".gradient-stop-handle", function () {
    state.selectedStopId = Number($(this).attr("data-stop-id"));
    render();
  });
  $stopTrack.on("keydown.gradient", ".gradient-stop-handle", function (event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") return;
    event.preventDefault();
    const stop = state.stops.find(function (item) { return item.id === Number($(this).attr("data-stop-id")); }.bind(this));
    if (!stop) return;
    if (event.key === "Home") stop.position = 0;
    else if (event.key === "End") stop.position = 100;
    else stop.position = clamp(stop.position + (event.shiftKey ? 10 : 1) * (event.key === "ArrowRight" ? 1 : -1), 0, 100);
    state.selectedStopId = stop.id;
    render();
    $stopTrack.find('[data-stop-id="' + stop.id + '"]').trigger("focus");
  });
  $stopTrack.on("pointerdown.gradient", ".gradient-stop-handle", function (event) {
    draggingStopId = Number($(this).attr("data-stop-id"));
    state.selectedStopId = draggingStopId;
    this.setPointerCapture(event.originalEvent.pointerId);
    event.preventDefault();
  });
  $stopTrack.on("pointermove.gradient pointerup.gradient pointercancel.gradient", function (event) {
    if (draggingStopId === null || event.type !== "pointermove") {
      if (event.type === "pointerup" || event.type === "pointercancel") draggingStopId = null;
      return;
    }
    const bounds = this.getBoundingClientRect();
    const percent = clamp((event.originalEvent.clientX - bounds.left) / bounds.width * 100, 0, 100);
    const stop = state.stops.find(function (item) { return item.id === draggingStopId; });
    if (stop) {
      stop.position = Math.round(percent);
      const $handle = $stopTrack.find('[data-stop-id="' + stop.id + '"]');
      $handle.css("left", stop.position + "%").attr("aria-valuenow", String(stop.position))
        .attr("aria-label", "Color stop at " + stop.position + " percent");
      $('.gradient-stop-card[data-stop-id="' + stop.id + '"] .stop-position-number, .gradient-stop-card[data-stop-id="' + stop.id + '"] .stop-position-range').val(stop.position);
      $("#gradient-bar").css("background-image", "linear-gradient(90deg, " + stopListCss(orderedStops()).join(", ") + ")");
      renderPreview();
      renderCode();
    }
  });
  $(document).on("pointerup.gradient pointercancel.gradient", function () { draggingStopId = null; });

  $("#preview-shape").on("change.gradient", function () { state.preview.shape = $(this).val(); render(); });
  $("#preview-size").on("change.gradient", function () { state.preview.size = $(this).val(); render(); });
  $("#preview-text-color").on("change.gradient", function () { state.preview.textColor = $(this).val(); render(); });
  $("#preview-show-text").on("change.gradient", function () { state.preview.showText = this.checked; render(); });
  $("#preview-checkerboard").on("change.gradient", function () { state.preview.checkerboard = this.checked; render(); });
  $("#gradient-presets").on("click.gradient", ".gradient-preset", function () {
    applyPreset($(this).attr("data-gradient-preset"));
  });
  $("#randomize-colors").on("click.gradient", randomizeColors);
  $("#randomize-all").on("click.gradient", randomizeAll);
  $("#copy-gradient-css").on("click.gradient", function () { copyText(generatedCss(state), "CSS"); });
  $("#copy-gradient-value").on("click.gradient", function () { copyText(gradientValue(state), "Gradient value"); });
  $("#reset-gradient-code, #reset-gradient").on("click.gradient", reset);

  state.selectedStopId = state.stops[0].id;
  renderPresets();
  render();
});
