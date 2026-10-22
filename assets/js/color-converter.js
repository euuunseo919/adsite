$(function () {
  "use strict";

  const SHADE_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const colorState = {
    rgb: { r: 37, g: 99, b: 235 },
    alpha: 1,
    previewMode: "background",
    contrast: {
      foreground: { rgb: { r: 37, g: 99, b: 235 }, alpha: 1 },
      background: { rgb: { r: 255, g: 255, b: 255 }, alpha: 1 }
    }
  };
  const $hex = $("#color-hex");
  const $copyStatus = $("#color-copy-status");

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cleanNumber(value, digits) {
    return Number(value.toFixed(digits)).toString();
  }

  function normalizeHex(value) {
    if (typeof value !== "string") return null;
    let hex = value.trim().replace(/^#/, "");
    if (![3, 4, 6, 8].includes(hex.length) || !/^[0-9a-f]+$/i.test(hex)) return null;
    if (hex.length <= 4) hex = hex.split("").map(function (digit) { return digit + digit; }).join("");
    return "#" + hex.toUpperCase();
  }

  function validateColor(value) {
    return normalizeHex(value) !== null;
  }

  function hexToRgb(value) {
    const normalized = normalizeHex(value);
    if (!normalized) return null;
    const hex = normalized.slice(1);
    return {
      r: parseInt(hex.slice(0, 2), 16),
      g: parseInt(hex.slice(2, 4), 16),
      b: parseInt(hex.slice(4, 6), 16),
      alpha: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    };
  }

  function rgbToHex(rgb, alpha) {
    function channelToHex(channel) {
      return Math.round(clamp(channel, 0, 255)).toString(16).padStart(2, "0").toUpperCase();
    }
    const hex = "#" + channelToHex(rgb.r) + channelToHex(rgb.g) + channelToHex(rgb.b);
    return alpha < 1 ? hex + channelToHex(alpha * 255) : hex;
  }

  function rgbToHsl(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    let hue = 0;
    let saturation = 0;
    const lightness = (max + min) / 2;

    if (delta !== 0) {
      saturation = delta / (1 - Math.abs(2 * lightness - 1));
      if (max === r) hue = ((g - b) / delta) % 6;
      else if (max === g) hue = (b - r) / delta + 2;
      else hue = (r - g) / delta + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }
    return { h: hue, s: saturation * 100, l: lightness * 100 };
  }

  function hslToRgb(hue, saturation, lightness) {
    const h = ((hue % 360) + 360) % 360 / 360;
    const s = clamp(saturation, 0, 100) / 100;
    const l = clamp(lightness, 0, 100) / 100;
    if (s === 0) {
      const gray = Math.round(l * 255);
      return { r: gray, g: gray, b: gray };
    }
    const hueToChannel = function (p, q, t) {
      let value = t;
      if (value < 0) value += 1;
      if (value > 1) value -= 1;
      if (value < 1 / 6) return p + (q - p) * 6 * value;
      if (value < 1 / 2) return q;
      if (value < 2 / 3) return p + (q - p) * (2 / 3 - value) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: Math.round(hueToChannel(p, q, h + 1 / 3) * 255),
      g: Math.round(hueToChannel(p, q, h) * 255),
      b: Math.round(hueToChannel(p, q, h - 1 / 3) * 255)
    };
  }

  function formatColor(format, rgb, alpha) {
    if (format === "hex") return rgbToHex(rgb, alpha);
    if (format === "rgb") {
      const channels = rgb.r + ", " + rgb.g + ", " + rgb.b;
      return alpha < 1 ? "rgba(" + channels + ", " + cleanNumber(alpha, 5) + ")" : "rgb(" + channels + ")";
    }
    const hsl = rgbToHsl(rgb);
    const values = Math.round(hsl.h) % 360 + ", " + Math.round(hsl.s) + "%, " + Math.round(hsl.l) + "%";
    return alpha < 1 ? "hsla(" + values + ", " + cleanNumber(alpha, 5) + ")" : "hsl(" + values + ")";
  }

  function currentHsl() {
    return rgbToHsl(colorState.rgb);
  }

  function showError($input, $message, text) {
    $input.attr("aria-invalid", String(Boolean(text)));
    $message.text(text || "");
  }

  function setIfNotFocused(selector, value) {
    const $input = $(selector);
    if (document.activeElement !== $input[0]) $input.val(value);
  }

  function setNumberPair(id, value, digits) {
    const text = cleanNumber(value, digits);
    setIfNotFocused("#" + id, text);
    $("#" + id + "-range").val(value);
  }

  function composite(foreground, background) {
    const alpha = foreground.alpha === undefined ? 1 : foreground.alpha;
    return {
      r: foreground.r * alpha + background.r * (1 - alpha),
      g: foreground.g * alpha + background.g * (1 - alpha),
      b: foreground.b * alpha + background.b * (1 - alpha)
    };
  }

  function relativeLuminance(rgb) {
    function linear(channel) {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
    }
    return 0.2126 * linear(rgb.r) + 0.7152 * linear(rgb.g) + 0.0722 * linear(rgb.b);
  }

  function contrastRatio(first, second) {
    const high = Math.max(relativeLuminance(first), relativeLuminance(second));
    const low = Math.min(relativeLuminance(first), relativeLuminance(second));
    return (high + 0.05) / (low + 0.05);
  }

  function renderContrast() {
    const canvas = { r: 255, g: 255, b: 255 };
    const background = composite(colorState.contrast.background.rgb, canvas);
    const foreground = composite(colorState.contrast.foreground.rgb, background);
    const ratio = contrastRatio(foreground, background);
    $("#contrast-ratio").text(ratio.toFixed(2) + ":1");
    $("#contrast-sample").css({
      color: "rgb(" + Math.round(foreground.r) + ", " + Math.round(foreground.g) + ", " + Math.round(foreground.b) + ")",
      backgroundColor: "rgb(" + Math.round(background.r) + ", " + Math.round(background.g) + ", " + Math.round(background.b) + ")"
    });
    const checks = [
      { label: "WCAG AA · Normal text", threshold: 4.5 },
      { label: "WCAG AA · Large text", threshold: 3 },
      { label: "WCAG AAA · Normal text", threshold: 7 },
      { label: "WCAG AAA · Large text", threshold: 4.5 }
    ];
    $("#contrast-checks").empty();
    checks.forEach(function (check) {
      const pass = ratio >= check.threshold;
      const $item = $("<li>").toggleClass("is-pass", pass).toggleClass("is-fail", !pass);
      $("<span>", { class: "contrast-check-icon", "aria-hidden": "true", text: pass ? "✓" : "×" }).appendTo($item);
      $("<span>", { text: check.label }).appendTo($item);
      $("<strong>", { text: (pass ? "PASS" : "FAIL") + " · " + check.threshold + ":1" }).appendTo($item);
      $("#contrast-checks").append($item);
    });
  }

  function paletteColors() {
    const base = currentHsl();
    const baseLightness = base.l;
    return SHADE_STEPS.map(function (shade, index) {
      let lightness;
      if (shade <= 500) {
        const progress = index / 5;
        lightness = 100 + (baseLightness - 100) * progress;
      } else {
        const progress = (shade - 500) / 450;
        lightness = baseLightness + (5 - baseLightness) * progress;
      }
      const rgb = hslToRgb(base.h, base.s, lightness);
      return { shade: shade, rgb: rgb, hex: rgbToHex(rgb, 1) };
    });
  }

  function paletteCss(colors) {
    return ":root {\n" + colors.map(function (item) {
      return "  --color-" + item.shade + ": " + item.hex + ";";
    }).join("\n") + "\n}";
  }

  function renderPalette() {
    const colors = paletteColors();
    const $palette = $("#color-palette-grid").empty();
    colors.forEach(function (item) {
      const $button = $("<button>", {
        type: "button",
        class: "color-shade" + (item.shade === 500 ? " is-base" : ""),
        "data-shade": item.shade,
        "aria-label": "Apply shade " + item.shade + ", " + item.hex
      });
      $("<span>", { class: "color-shade-swatch", "aria-hidden": "true" }).css("backgroundColor", item.hex).appendTo($button);
      $("<span>", { class: "color-shade-label", text: item.shade }).appendTo($button);
      $("<span>", { class: "color-shade-hex", text: item.hex }).appendTo($button);
      $("<span>", { class: "color-shade-copy", "aria-hidden": "true", text: "Apply color" }).appendTo($button);
      $palette.append($button);
    });
    $("#copy-palette-css").data("palette-css", paletteCss(colors));
  }

  function render() {
    const rgb = colorState.rgb;
    const alpha = colorState.alpha;
    const hsl = currentHsl();
    const hex = rgbToHex(rgb, alpha);
    const rgbText = formatColor("rgb", rgb, alpha);
    const hslText = formatColor("hsl", rgb, alpha);
    const cssColor = alpha < 1
      ? "rgb(" + rgb.r + " " + rgb.g + " " + rgb.b + " / " + cleanNumber(alpha, 5) + ")"
      : "rgb(" + rgb.r + " " + rgb.g + " " + rgb.b + ")";

    if (!validateColor($hex.val()) || document.activeElement !== $hex[0]) {
      $hex.val(hex);
      showError($hex, $("#color-error"), "");
    }
    $("#color-hex-picker").val(rgbToHex(rgb, 1).toLowerCase());
    $("#rgb-output").text(rgbText);
    $("#hsl-output").text(hslText);
    $("#preview-hex").text(hex);
    $("#preview-rgb").text(rgbText);
    $("#preview-hsl").text(hslText);

    [["rgb-r", rgb.r, 0], ["rgb-g", rgb.g, 0], ["rgb-b", rgb.b, 0], ["rgb-a", alpha, 5],
      ["hsl-h", hsl.h, 2], ["hsl-s", hsl.s, 2], ["hsl-l", hsl.l, 2], ["hsl-a", alpha, 5]].forEach(function (item) {
      setNumberPair(item[0], item[1], item[2]);
    });
    $("#adjust-hue").val(hsl.h);
    $("#adjust-saturation").val(hsl.s);
    $("#adjust-lightness").val(hsl.l);
    $("#adjust-alpha").val(alpha * 100);
    $("#adjust-hue-value").text(Math.round(hsl.h) + "°");
    $("#adjust-saturation-value").text(Math.round(hsl.s) + "%");
    $("#adjust-lightness-value").text(Math.round(hsl.l) + "%");
    $("#adjust-alpha-value").text(Math.round(alpha * 100) + "%");

    const checker = "linear-gradient(45deg, #e2e8f0 25%, transparent 25%), linear-gradient(-45deg, #e2e8f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e2e8f0 75%), linear-gradient(-45deg, transparent 75%, #e2e8f0 75%)";
    const checkerSize = "16px 16px";
    const mode = colorState.previewMode;
    const opaquePreview = composite({ r: rgb.r, g: rgb.g, b: rgb.b, alpha: alpha }, { r: 255, g: 255, b: 255 });
    const previewSurfaces = mode === "background" ? [opaquePreview] : [{ r: 255, g: 255, b: 255 }];
    const minimumContrast = function (textColor) {
      return Math.min.apply(null, previewSurfaces.map(function (surface) {
        return contrastRatio(surface, textColor);
      }));
    };
    const contrastText = minimumContrast({ r: 255, g: 255, b: 255 }) >= minimumContrast({ r: 15, g: 23, b: 42 })
      ? "#ffffff"
      : "#0f172a";
    $("#color-preview-mode").val(mode);
    $("#color-swatch").css({
      backgroundColor: mode === "background" ? cssColor : "transparent",
      backgroundImage: checker,
      backgroundSize: checkerSize,
      borderColor: mode === "border" ? cssColor : "transparent"
    }).toggleClass("is-border-mode", mode === "border");
    $("#color-preview-sample").css({
      color: mode === "text" ? cssColor : contrastText,
      borderColor: mode === "border" ? cssColor : "transparent",
      backgroundColor: mode === "background"
        ? "rgb(" + Math.round(opaquePreview.r) + " " + Math.round(opaquePreview.g) + " " + Math.round(opaquePreview.b) + ")"
        : mode === "text" ? "rgb(255 255 255 / 82%)" : "transparent"
    });
    $("#color-preview-sample strong").css("color", mode === "text" ? cssColor : contrastText);
    $("#color-preview-sample").toggleClass("is-text-mode", mode === "text");

    colorState.contrast.foreground = { rgb: Object.assign({}, rgb), alpha: alpha };
    setIfNotFocused("#contrast-foreground-hex", hex);
    setIfNotFocused("#contrast-foreground-alpha", cleanNumber(alpha, 5));
    $("#contrast-foreground-picker").val(rgbToHex(rgb, 1).toLowerCase());
    renderContrast();
    renderPalette();
  }

  function setColor(rgb, alpha) {
    colorState.rgb = {
      r: Math.round(clamp(rgb.r, 0, 255)),
      g: Math.round(clamp(rgb.g, 0, 255)),
      b: Math.round(clamp(rgb.b, 0, 255))
    };
    colorState.alpha = clamp(alpha, 0, 1);
    showError($hex, $("#color-error"), "");
    $("#color-channel-error").text("");
    $("#color-format-grid input[type=number]").attr("aria-invalid", "false");
    render();
  }

  function commitHex(value) {
    if (!validateColor(value)) {
      showError($hex, $("#color-error"), "Enter a valid HEX color: #RGB, #RRGGBB, #RGBA, or #RRGGBBAA.");
      return false;
    }
    const parsed = hexToRgb(value);
    setColor(parsed, parsed.alpha);
    return true;
  }

  function commitChannel(source, value) {
    const limits = {
      "rgb-r": [0, 255], "rgb-g": [0, 255], "rgb-b": [0, 255], "rgb-a": [0, 1],
      "hsl-h": [0, 360], "hsl-s": [0, 100], "hsl-l": [0, 100], "hsl-a": [0, 1]
    };
    const range = limits[source];
    const numeric = Number(value);
    const $input = $("#" + source);
    if (value === "" || !Number.isFinite(numeric) || numeric < range[0] || numeric > range[1]) {
      $input.attr("aria-invalid", "true");
      const names = { "rgb-r": "Red", "rgb-g": "Green", "rgb-b": "Blue", "rgb-a": "RGB alpha", "hsl-h": "Hue", "hsl-s": "Saturation", "hsl-l": "Lightness", "hsl-a": "HSL alpha" };
      $("#color-channel-error").text(names[source] + " must be between " + range[0] + " and " + range[1] + ".");
      return;
    }
    $input.attr("aria-invalid", "false");
    $("#color-channel-error").text("");
    if (source.startsWith("rgb-")) {
      const channel = source.slice(-1);
      if (channel === "a") colorState.alpha = numeric;
      else colorState.rgb[channel] = Math.round(numeric);
    } else {
      const hsl = currentHsl();
      const alpha = colorState.alpha;
      if (source === "hsl-h") hsl.h = numeric === 360 ? 0 : numeric;
      if (source === "hsl-s") hsl.s = numeric;
      if (source === "hsl-l") hsl.l = numeric;
      if (source === "hsl-a") colorState.alpha = numeric;
      colorState.rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
      if (source !== "hsl-a") colorState.alpha = alpha;
    }
    render();
  }

  async function copyText(value, statusSelector, label) {
    const $status = $(statusSelector);
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard access is unavailable. Use HTTPS or localhost to copy.");
      }
      await navigator.clipboard.writeText(value);
      $status.text(label + " copied to clipboard.");
    } catch (error) {
      $status.text(error.message || "Could not copy. Please select and copy manually.");
    }
  }

  function randomColor() {
    setColor({
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256)
    }, 1);
  }

  function resetColor() {
    colorState.previewMode = "background";
    setColor({ r: 37, g: 99, b: 235 }, 1);
    $("#color-hex").val("#2563EB");
    $("#color-copy-status, #palette-copy-status").text("");
  }

  $hex.on("input.colorConverter", function () {
    if (validateColor(this.value)) commitHex(this.value);
    else showError($hex, $("#color-error"), "");
  }).on("change.colorConverter blur.colorConverter", function () {
    if (this.value.trim()) commitHex(this.value);
    else showError($hex, $("#color-error"), "Enter a HEX color value.");
  });

  $("#color-hex-picker").on("input.colorConverter change.colorConverter", function () {
    const parsed = hexToRgb(this.value);
    setColor(parsed, 1);
  });

  $("#color-format-grid").on("input.colorConverter change.colorConverter", "input[type=number]", function () {
    commitChannel(this.id, this.value);
  });
  $("#color-format-grid").on("input.colorConverter change.colorConverter", "input[type=range]", function () {
    const inputId = this.id.replace("-range", "");
    $("#" + inputId).val(this.value);
    commitChannel(inputId, this.value);
  });

  $("#color-preview-mode").on("change.colorConverter", function () {
    colorState.previewMode = this.value;
    render();
  });
  $("#adjust-hue, #adjust-saturation, #adjust-lightness, #adjust-alpha").on("input.colorConverter", function () {
    const hsl = currentHsl();
    if (this.id === "adjust-hue") hsl.h = Number(this.value) === 360 ? 0 : Number(this.value);
    if (this.id === "adjust-saturation") hsl.s = Number(this.value);
    if (this.id === "adjust-lightness") hsl.l = Number(this.value);
    colorState.rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    if (this.id === "adjust-alpha") colorState.alpha = Number(this.value) / 100;
    render();
  });

  $("#contrast-foreground-hex").on("input.colorConverter change.colorConverter", function () {
    if (!validateColor(this.value)) {
      showError($(this), $("#contrast-foreground-error"), "Enter a valid HEX color.");
      return;
    }
    showError($(this), $("#contrast-foreground-error"), "");
    const parsed = hexToRgb(this.value);
    colorState.contrast.foreground = { rgb: parsed, alpha: parsed.alpha };
    $("#contrast-foreground-alpha").val(parsed.alpha);
    $("#contrast-foreground-picker").val(rgbToHex(parsed, 1).toLowerCase());
    renderContrast();
  });
  $("#contrast-background-hex").on("input.colorConverter change.colorConverter", function () {
    if (!validateColor(this.value)) {
      showError($(this), $("#contrast-background-error"), "Enter a valid HEX color.");
      return;
    }
    showError($(this), $("#contrast-background-error"), "");
    const parsed = hexToRgb(this.value);
    colorState.contrast.background = { rgb: parsed, alpha: parsed.alpha };
    $("#contrast-background-alpha").val(parsed.alpha);
    $("#contrast-background-picker").val(rgbToHex(parsed, 1).toLowerCase());
    renderContrast();
  });
  $("#contrast-foreground-picker, #contrast-background-picker").on("input.colorConverter change.colorConverter", function () {
    const foreground = this.id.includes("foreground");
    const parsed = hexToRgb(this.value);
    const key = foreground ? "foreground" : "background";
    colorState.contrast[key] = { rgb: parsed, alpha: 1 };
    $("#contrast-" + key + "-hex").val(rgbToHex(parsed, 1));
    $("#contrast-" + key + "-alpha").val(1);
    $("#contrast-" + key + "-alpha").attr("aria-invalid", "false");
    showError($("#contrast-" + key + "-hex"), $("#contrast-" + key + "-error"), "");
    renderContrast();
  });
  $("#contrast-foreground-alpha, #contrast-background-alpha").on("input.colorConverter change.colorConverter", function () {
    const foreground = this.id.includes("foreground");
    const key = foreground ? "foreground" : "background";
    const $error = $("#contrast-" + key + "-error");
    const alpha = Number(this.value);
    if (this.value === "" || !Number.isFinite(alpha) || alpha < 0 || alpha > 1) {
      $(this).attr("aria-invalid", "true");
      $error.text("Alpha must be between 0 and 1.");
      return;
    }
    $(this).attr("aria-invalid", "false");
    $error.text("");
    colorState.contrast[key].alpha = alpha;
    renderContrast();
  });

  $("#color-palette-grid").on("click.colorConverter", ".color-shade", function () {
    const shade = paletteColors().find(function (item) { return item.shade === Number($(this).attr("data-shade")); }.bind(this));
    if (shade) setColor(shade.rgb, 1);
  });
  $("#copy-palette-css").on("click.colorConverter", function () {
    copyText($(this).data("palette-css"), "#palette-copy-status", "Palette CSS");
  });
  $("[data-copy]").on("click.colorConverter", function () {
    const format = $(this).attr("data-copy");
    const value = format === "css"
      ? "color: " + (colorState.alpha < 1
        ? "rgb(" + colorState.rgb.r + " " + colorState.rgb.g + " " + colorState.rgb.b + " / " + cleanNumber(colorState.alpha, 5) + ")"
        : rgbToHex(colorState.rgb, 1)) + ";"
      : formatColor(format, colorState.rgb, colorState.alpha);
    copyText(value, "#color-copy-status", format === "css" ? "Color" : format.toUpperCase());
  });
  $("[data-color-action=reset]").on("click.colorConverter", resetColor);
  $("[data-color-action=random]").on("click.colorConverter", randomColor);

  $("#color-format-grid input[type=number]").attr("aria-describedby", "color-channel-error");
  render();
});
