$(function () {
  "use strict";

  const DEFAULTS = {
    mediaType: "screen",
    conditions: {
      minWidth: { enabled: true, value: 768 },
      maxWidth: { enabled: true, value: 1199 },
      minHeight: { enabled: false, value: 600 },
      maxHeight: { enabled: false, value: 900 },
      orientation: "any",
      hover: "any",
      pointer: "any",
      reducedMotion: "any",
      colorScheme: "any"
    },
    preview: {
      width: 1024,
      height: 768,
      simulatedEnvironment: { hover: null, pointer: null, reducedMotion: null, colorScheme: null }
    },
    inputError: null,
    cssRule: ".container {\n  padding: 24px;\n}"
  };
  const DEVICE_PRESETS = {
    "mobile-small": { width: 320, height: 568 },
    mobile: { width: 375, height: 812 },
    "mobile-large": { width: 430, height: 932 },
    tablet: { width: 768, height: 1024 },
    laptop: { width: 1366, height: 768 },
    desktop: { width: 1440, height: 900 }
  };
  const PRESETS = [
    { id: "mobile-only", name: "Mobile Only", description: "Up to 767px", mediaType: "screen", minWidth: false, maxWidth: 767 },
    { id: "tablet-only", name: "Tablet Only", description: "768px – 1199px", mediaType: "screen", minWidth: 768, maxWidth: 1199 },
    { id: "desktop-only", name: "Desktop Only", description: "1200px and wider", mediaType: "screen", minWidth: 1200, maxWidth: false },
    { id: "small-screen", name: "Small Screen", description: "Up to 599px", mediaType: "screen", minWidth: false, maxWidth: 599 },
    { id: "large-screen", name: "Large Screen", description: "1200px and wider", mediaType: "screen", minWidth: 1200, maxWidth: false },
    { id: "portrait", name: "Portrait", description: "Orientation: portrait", mediaType: "screen", orientation: "portrait" },
    { id: "landscape", name: "Landscape", description: "Orientation: landscape", mediaType: "screen", orientation: "landscape" },
    { id: "dark-mode", name: "Dark Mode", description: "Prefers dark scheme", mediaType: "all", colorScheme: "dark" },
    { id: "reduced-motion", name: "Reduced Motion", description: "Reduced motion preference", mediaType: "all", reducedMotion: "reduce" },
    { id: "print", name: "Print Styles", description: "Print media type", mediaType: "print" }
  ];
  let mediaQueryState = createState();
  const $cssRule = $("#css-rule-editor");
  const $copyStatus = $("#mq-copy-status");
  let previewResizeObserver;

  function createState() {
    return {
      mediaType: DEFAULTS.mediaType,
      conditions: {
        minWidth: Object.assign({}, DEFAULTS.conditions.minWidth),
        maxWidth: Object.assign({}, DEFAULTS.conditions.maxWidth),
        minHeight: Object.assign({}, DEFAULTS.conditions.minHeight),
        maxHeight: Object.assign({}, DEFAULTS.conditions.maxHeight),
        orientation: DEFAULTS.conditions.orientation,
        hover: DEFAULTS.conditions.hover,
        pointer: DEFAULTS.conditions.pointer,
        reducedMotion: DEFAULTS.conditions.reducedMotion,
        colorScheme: DEFAULTS.conditions.colorScheme
      },
      preview: {
        width: DEFAULTS.preview.width,
        height: DEFAULTS.preview.height,
        simulatedEnvironment: Object.assign({}, DEFAULTS.preview.simulatedEnvironment)
      },
      inputError: null,
      cssRule: DEFAULTS.cssRule
    };
  }

  function validateConditions(state) {
    if (state.inputError) return { valid: false, message: state.inputError.message };
    const conditions = state.conditions;
    const measures = ["minWidth", "maxWidth", "minHeight", "maxHeight"];
    for (const key of measures) {
      const value = conditions[key].value;
      if (!Number.isFinite(value) || value < 0 || value > 5000) {
        return { valid: false, message: key + " must be between 0 and 5000px." };
      }
    }
    if (conditions.minWidth.enabled && conditions.maxWidth.enabled && conditions.minWidth.value > conditions.maxWidth.value) {
      return { valid: false, message: "Min Width must be less than or equal to Max Width." };
    }
    if (conditions.minHeight.enabled && conditions.maxHeight.enabled && conditions.minHeight.value > conditions.maxHeight.value) {
      return { valid: false, message: "Min Height must be less than or equal to Max Height." };
    }
    return { valid: true, message: "" };
  }

  function buildMediaQuery(state) {
    const validation = validateConditions(state);
    if (!validation.valid) return null;
    const conditions = state.conditions;
    const features = [];
    ["minWidth", "maxWidth", "minHeight", "maxHeight"].forEach(function (key) {
      if (!conditions[key].enabled) return;
      const feature = key.replace(/[A-Z]/g, function (letter) { return "-" + letter.toLowerCase(); });
      features.push("(" + feature + ": " + conditions[key].value + "px)");
    });
    if (conditions.orientation !== "any") features.push("(orientation: " + conditions.orientation + ")");
    if (conditions.hover !== "any") features.push("(hover: " + conditions.hover + ")");
    if (conditions.pointer !== "any") features.push("(pointer: " + conditions.pointer + ")");
    if (conditions.reducedMotion !== "any") features.push("(prefers-reduced-motion: " + conditions.reducedMotion + ")");
    if (conditions.colorScheme !== "any") features.push("(prefers-color-scheme: " + conditions.colorScheme + ")");
    const mediaType = state.mediaType === "all" && features.length ? "" : state.mediaType;
    const pieces = [];
    if (mediaType) pieces.push(mediaType);
    features.forEach(function (feature) { pieces.push(feature); });
    return "@media " + pieces.join(" and ");
  }

  function buildCssCode(state) {
    const query = buildMediaQuery(state);
    if (!query) return "";
    const body = state.cssRule.split("\n").map(function (line) { return line ? "  " + line : ""; }).join("\n");
    return query + " {\n" + body + "\n}";
  }

  function evaluateMediaConditions(state) {
    const validation = validateConditions(state);
    if (!validation.valid) return { status: "invalid", message: validation.message };
    const condition = state.conditions;
    const preview = state.preview;
    const knownResults = [];
    if (condition.minWidth.enabled) knownResults.push(preview.width >= condition.minWidth.value);
    if (condition.maxWidth.enabled) knownResults.push(preview.width <= condition.maxWidth.value);
    if (condition.minHeight.enabled) knownResults.push(preview.height >= condition.minHeight.value);
    if (condition.maxHeight.enabled) knownResults.push(preview.height <= condition.maxHeight.value);
    if (condition.orientation !== "any") {
      const orientation = preview.width > preview.height ? "landscape" : "portrait";
      knownResults.push(orientation === condition.orientation);
    }
    if (condition.hover !== "any") {
      const value = preview.simulatedEnvironment.hover;
      if (value === null) knownResults.push(null);
      else knownResults.push(condition.hover === "hover" ? value === "hover" : value === "none");
    }
    if (condition.pointer !== "any") {
      const value = preview.simulatedEnvironment.pointer;
      knownResults.push(value === null ? null : value === condition.pointer);
    }
    if (condition.reducedMotion !== "any") {
      const value = preview.simulatedEnvironment.reducedMotion;
      knownResults.push(value === null ? null : value === condition.reducedMotion);
    }
    if (condition.colorScheme !== "any") {
      const value = preview.simulatedEnvironment.colorScheme;
      knownResults.push(value === null ? null : value === condition.colorScheme);
    }
    if (knownResults.includes(false)) return { status: "no-match", message: "Query Does Not Match" };
    if (state.mediaType === "print") return { status: "unknown", message: "Cannot Determine: print cannot be evaluated in a screen preview." };
    if (knownResults.includes(null)) return { status: "unknown", message: "Cannot Determine: simulate environment features" };
    return { status: "match", message: "Query Matches" };
  }

  function getBreakpointRange(state) {
    const min = state.conditions.minWidth.enabled ? state.conditions.minWidth.value : 0;
    const max = state.conditions.maxWidth.enabled ? state.conditions.maxWidth.value : 1920;
    return { min: min, max: max, openMin: !state.conditions.minWidth.enabled, openMax: !state.conditions.maxWidth.enabled };
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character];
    });
  }

  function highlightCss(value) {
    return escapeHtml(value)
      .replace(/^(@media\b[^{]*)/m, '<span class="mq-code-at-rule">$1</span>')
      .replace(/(^|\n)(\s*)([\w.#:-]+)(\s*\{)/g, '$1$2<span class="mq-code-selector">$3</span>$4')
      .replace(/([\w-]+)(\s*:)/g, '<span class="mq-code-property">$1</span>$2');
  }

  function renderSummary() {
    const condition = mediaQueryState.conditions;
    const chips = ["Media Type: " + mediaQueryState.mediaType];
    ["minWidth", "maxWidth", "minHeight", "maxHeight"].forEach(function (key) {
      if (condition[key].enabled) {
        const label = key.replace(/([A-Z])/g, " $1").replace(/^./, function (letter) { return letter.toUpperCase(); });
        chips.push(label + ": " + condition[key].value + "px");
      }
    });
    ["orientation", "hover", "pointer", "reducedMotion", "colorScheme"].forEach(function (key) {
      if (condition[key] !== "any") {
        const labels = { reducedMotion: "Reduced Motion", colorScheme: "Color Scheme" };
        const label = labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
        chips.push(label + ": " + condition[key]);
      }
    });
    const $summary = $("#mq-condition-summary").empty();
    chips.forEach(function (chip) {
      $("<span>", { class: "mq-condition-chip", text: chip }).appendTo($summary);
    });
    $("#mq-summary-status").text($("#mq-match-status").text()).attr("class", "mq-summary-status " + $("#mq-match-status").attr("data-status"));
  }

  function renderBreakpoint() {
    const range = getBreakpointRange(mediaQueryState);
    const minPct = Math.min(100, range.min / 1920 * 100);
    const maxPct = Math.min(100, range.max / 1920 * 100);
    const currentPct = Math.min(100, mediaQueryState.preview.width / 1920 * 100);
    $("#mq-range-active").css({ left: minPct + "%", width: Math.max(0, maxPct - minPct) + "%" });
    $("#mq-range-current").css("left", currentPct + "%");
    $("#mq-range-min-label").text(range.openMin ? "Open" : range.min + "px").css("left", minPct + "%");
    $("#mq-range-max-label").text(range.openMax ? "Open" : range.max + "px").css("left", maxPct + "%");
    $("#mq-range-bar").attr("aria-label", (range.openMin ? "No minimum width" : "Minimum width " + range.min + " pixels") + ", " + (range.openMax ? "no maximum width" : "maximum width " + range.max + " pixels") + ", current viewport " + mediaQueryState.preview.width + " pixels");
  }

  function renderPreviewFrame() {
    const $outer = $("#mq-preview-outer");
    const $frame = $("#mq-preview-frame");
    const maxWidth = Math.max(0, $outer.parent().innerWidth());
    const maxHeight = 330;
    const scale = Math.min(maxWidth / mediaQueryState.preview.width, maxHeight / mediaQueryState.preview.height, 1);
    $outer.css({ width: mediaQueryState.preview.width * scale, height: mediaQueryState.preview.height * scale });
    $frame.css({
      width: mediaQueryState.preview.width,
      height: mediaQueryState.preview.height,
      transform: "scale(" + scale + ")"
    });
    $frame.toggleClass("is-narrow", mediaQueryState.preview.width < 600);
    $frame.toggleClass("is-match", $("#mq-match-status").attr("data-status") === "match");
    $frame.toggleClass("is-dark-simulation", mediaQueryState.preview.simulatedEnvironment.colorScheme === "dark");
    $frame.toggleClass("is-reduced-motion", mediaQueryState.preview.simulatedEnvironment.reducedMotion === "reduce");
  }

  function render() {
    const validation = validateConditions(mediaQueryState);
    $("#mq-validation").text(validation.message);
    $("#media-type").val(mediaQueryState.mediaType);
    const condition = mediaQueryState.conditions;
    ["minWidth", "maxWidth", "minHeight", "maxHeight"].forEach(function (key) {
      const inputId = key.replace(/[A-Z]/g, function (letter) { return "-" + letter.toLowerCase(); });
      $("#" + inputId + "-enabled").prop("checked", condition[key].enabled);
      const $input = $("#" + inputId);
      if (!mediaQueryState.inputError || mediaQueryState.inputError.key !== key) $input.val(condition[key].value);
      $input.attr("aria-invalid", String(Boolean(mediaQueryState.inputError && mediaQueryState.inputError.key === key) || (!validation.valid && validation.message.toLowerCase().includes(key.replace(/[A-Z]/g, " ").toLowerCase()))));
    });
    $("#mq-orientation").val(condition.orientation);
    $("#mq-hover").val(condition.hover);
    $("#mq-pointer").val(condition.pointer);
    $("#mq-motion").val(condition.reducedMotion);
    $("#mq-scheme").val(condition.colorScheme);
    $("#simulate-hover").val(mediaQueryState.preview.simulatedEnvironment.hover || "unknown");
    $("#simulate-pointer").val(mediaQueryState.preview.simulatedEnvironment.pointer || "unknown");
    $("#simulate-motion").val(mediaQueryState.preview.simulatedEnvironment.reducedMotion || "unknown");
    $("#simulate-scheme").val(mediaQueryState.preview.simulatedEnvironment.colorScheme || "unknown");
    if (!mediaQueryState.preview.inputError || mediaQueryState.preview.inputError.key !== "width") $("#viewport-width").val(mediaQueryState.preview.width);
    if (!mediaQueryState.preview.inputError || mediaQueryState.preview.inputError.key !== "height") $("#viewport-height").val(mediaQueryState.preview.height);
    $("#viewport-width-range").val(mediaQueryState.preview.width);
    $("#viewport-height-range").val(mediaQueryState.preview.height);
    $("#viewport-width-value").text(mediaQueryState.preview.width + "px");
    $("#viewport-height-value").text(mediaQueryState.preview.height + "px");
    $("#mq-preview-validation").text(mediaQueryState.preview.inputError ? mediaQueryState.preview.inputError.message : "");
    const query = validation.valid ? buildMediaQuery(mediaQueryState) : null;
    const result = !validation.valid
      ? { status: "invalid", message: "Fix invalid conditions before previewing." }
      : mediaQueryState.preview.inputError
        ? { status: "invalid", message: "Fix the viewport dimensions to evaluate this query." }
        : evaluateMediaConditions(mediaQueryState);
    $("#mq-match-status").text(result.message).attr("data-status", result.status).toggleClass("is-match", result.status === "match").toggleClass("is-no-match", result.status === "no-match").toggleClass("is-unknown", result.status === "unknown").toggleClass("is-invalid", result.status === "invalid");
    $("#mq-print-notice").prop("hidden", mediaQueryState.mediaType !== "print");
    $("#mq-preview-note").text(mediaQueryState.mediaType === "print"
      ? "The dimensions below are a screen simulation. Print media cannot be evaluated as a screen preview."
      : "Viewport and orientation conditions are simulated. Environment features use only the explicit simulation controls.");
    $("#generated-css").html(query ? highlightCss(buildCssCode(mediaQueryState)) : '<span class="mq-code-invalid">Resolve validation errors to generate a valid media query.</span>');
    $("#copy-css, #copy-query").prop("disabled", !query);
    renderSummary();
    renderBreakpoint();
    renderPreviewFrame();
  }

  function renderPresets() {
    const $presets = $("#mq-presets").empty();
    PRESETS.forEach(function (preset) {
      const $button = $("<button>", { type: "button", class: "mq-preset card", "data-preset": preset.id });
      $("<span>", { class: "mq-preset-icon", "aria-hidden": "true", text: preset.id === "print" ? "▤" : preset.id === "dark-mode" ? "◐" : preset.id === "reduced-motion" ? "↯" : "⌁" }).appendTo($button);
      $("<strong>", { text: preset.name }).appendTo($button);
      $("<span>", { text: preset.description }).appendTo($button);
      $presets.append($button);
    });
  }

  function applyPreset(id) {
    const preset = PRESETS.find(function (item) { return item.id === id; });
    if (!preset) return;
    const state = createState();
    state.mediaType = preset.mediaType;
    state.conditions.minWidth = { enabled: typeof preset.minWidth === "number", value: typeof preset.minWidth === "number" ? preset.minWidth : 768 };
    state.conditions.maxWidth = { enabled: typeof preset.maxWidth === "number", value: typeof preset.maxWidth === "number" ? preset.maxWidth : 1199 };
    state.conditions.orientation = preset.orientation || "any";
    state.conditions.colorScheme = preset.colorScheme || "any";
    state.conditions.reducedMotion = preset.reducedMotion || "any";
    mediaQueryState = state;
    $cssRule.val(mediaQueryState.cssRule);
    $("#device-preset").val("custom");
    $copyStatus.text("");
    render();
  }

  async function copyText(text, label) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard access is unavailable. Use HTTPS or localhost to copy.");
      }
      await navigator.clipboard.writeText(text);
      $copyStatus.text(label + " copied to clipboard.");
    } catch (error) {
      $copyStatus.text(error.message || "Could not copy. Please select and copy manually.");
    }
  }

  function reset() {
    mediaQueryState = createState();
    $cssRule.val(mediaQueryState.cssRule);
    $("#device-preset").val("custom");
    $copyStatus.text("");
    $("#mq-validation").text("");
    render();
  }

  $("#media-type").on("change.mediaQuery", function () { mediaQueryState.mediaType = this.value; render(); });
  $("#min-width-enabled, #max-width-enabled, #min-height-enabled, #max-height-enabled").on("change.mediaQuery", function () {
    const key = this.id.replace(/-enabled$/, "").replace(/-([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
    mediaQueryState.conditions[key].enabled = this.checked;
    render();
  });
  $("#min-width, #max-width, #min-height, #max-height").on("input.mediaQuery change.mediaQuery", function () {
    const key = this.id.replace(/-([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
    const number = Number(this.value);
    if (this.value === "" || !Number.isFinite(number) || number < 0 || number > 5000) {
      const key = this.id.replace(/-([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
      mediaQueryState.inputError = { key: key, message: "Values must be between 0 and 5000px." };
      render();
      return;
    }
    mediaQueryState.inputError = null;
    mediaQueryState.conditions[key].value = number;
    $(this).attr("aria-invalid", "false");
    render();
  });
  $("#mq-orientation").on("change.mediaQuery", function () { mediaQueryState.conditions.orientation = this.value; render(); });
  $("#mq-hover").on("change.mediaQuery", function () { mediaQueryState.conditions.hover = this.value; render(); });
  $("#mq-pointer").on("change.mediaQuery", function () { mediaQueryState.conditions.pointer = this.value; render(); });
  $("#mq-motion").on("change.mediaQuery", function () { mediaQueryState.conditions.reducedMotion = this.value; render(); });
  $("#mq-scheme").on("change.mediaQuery", function () { mediaQueryState.conditions.colorScheme = this.value; render(); });
  $("#simulate-hover, #simulate-pointer, #simulate-motion, #simulate-scheme").on("change.mediaQuery", function () {
    const keys = { "simulate-hover": "hover", "simulate-pointer": "pointer", "simulate-motion": "reducedMotion", "simulate-scheme": "colorScheme" };
    const value = this.value === "unknown" ? null : this.value;
    mediaQueryState.preview.simulatedEnvironment[keys[this.id]] = value;
    render();
  });
  $("#viewport-width, #viewport-width-range, #viewport-height, #viewport-height-range").on("input.mediaQuery change.mediaQuery", function () {
    const width = this.id.includes("width");
    const number = Number(this.value);
    const min = width ? 240 : 320;
    const max = width ? 1920 : 1200;
    if (!Number.isFinite(number) || number < min || number > max) {
      mediaQueryState.preview.inputError = {
        key: width ? "width" : "height",
        message: (width ? "Viewport width" : "Viewport height") + " must be between " + min + " and " + max + "px."
      };
      render();
      return;
    }
    mediaQueryState.preview.inputError = null;
    mediaQueryState.preview[width ? "width" : "height"] = number;
    $("#device-preset").val("custom");
    render();
  });
  $("#device-preset").on("change.mediaQuery", function () {
    const preset = DEVICE_PRESETS[this.value];
    if (!preset) return;
    mediaQueryState.preview.width = preset.width;
    mediaQueryState.preview.height = preset.height;
    mediaQueryState.preview.inputError = null;
    render();
  });
  $("#swap-orientation").on("click.mediaQuery", function () {
    const width = mediaQueryState.preview.width;
    mediaQueryState.preview.width = mediaQueryState.preview.height;
    mediaQueryState.preview.height = width;
    mediaQueryState.preview.width = clamp(mediaQueryState.preview.width, 240, 1920);
    mediaQueryState.preview.height = clamp(mediaQueryState.preview.height, 320, 1200);
    mediaQueryState.preview.inputError = null;
    $("#device-preset").val("custom");
    render();
  });
  $cssRule.on("input.mediaQuery", function () {
    mediaQueryState.cssRule = this.value;
    render();
  });
  $("#mq-presets").on("click.mediaQuery", ".mq-preset", function () { applyPreset($(this).attr("data-preset")); });
  $("#copy-css").on("click.mediaQuery", function () { copyText(buildCssCode(mediaQueryState), "CSS"); });
  $("#copy-query").on("click.mediaQuery", function () { copyText(buildMediaQuery(mediaQueryState), "Query"); });
  $("#reset-media-query").on("click.mediaQuery", reset);
  $(window).on("resize.mediaQuery", function () { renderPreviewFrame(); });

  function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

  if ("ResizeObserver" in window) {
    previewResizeObserver = new ResizeObserver(renderPreviewFrame);
    previewResizeObserver.observe($("#mq-preview-outer")[0]);
  }
  renderPresets();
  render();
});
