$(function () {
  "use strict";

  const DEFAULT_PREVIEW = {
    background: "#F1F5F9",
    cardBackground: "#FFFFFF",
    borderRadius: 16
  };
  const MAX_LAYERS = 8;
  let nextLayerId = 2;

  function createLayer(id, values) {
    return Object.assign({
      id: id,
      x: 0,
      y: 8,
      blur: 24,
      spread: 0,
      color: "#000000",
      opacity: 15,
      inset: false,
      enabled: true
    }, values || {});
  }

  function createInitialState() {
    nextLayerId = 2;
    return {
      layers: [createLayer(1)],
      selectedLayerId: 1,
      preview: Object.assign({}, DEFAULT_PREVIEW),
      includePreviewStyles: false
    };
  }

  let state = createInitialState();
  const $layerList = $("#shadow-layer-list");
  const $previewCard = $("#shadow-preview-card");
  const $copyStatus = $("#shadow-copy-status");

  function selectedLayer() {
    return state.layers.find(function (layer) {
      return layer.id === state.selectedLayerId;
    }) || null;
  }

  function formatAlpha(opacity) {
    const alpha = Number((opacity / 100).toFixed(2));
    return String(alpha);
  }

  function createLayerValue(layer) {
    const inset = layer.inset ? "inset " : "";
    return inset + layer.x + "px " + layer.y + "px " + layer.blur + "px " +
      layer.spread + "px rgba(" +
      parseInt(layer.color.slice(1, 3), 16) + ", " +
      parseInt(layer.color.slice(3, 5), 16) + ", " +
      parseInt(layer.color.slice(5, 7), 16) + ", " +
      formatAlpha(layer.opacity) + ")";
  }

  function createShadowValue(currentState) {
    const activeLayers = currentState.layers.filter(function (layer) {
      return layer.enabled;
    });
    if (!activeLayers.length) return "none";
    return activeLayers.map(createLayerValue).join(",\n  ");
  }

  function createCss(currentState) {
    const value = createShadowValue(currentState);
    let lines;
    if (value === "none") {
      lines = [".shadow-box {", "  box-shadow: none;", "}"];
    } else if (value.indexOf("\n") === -1) {
      lines = [".shadow-box {", "  box-shadow: " + value + ";", "}"];
    } else {
      lines = [".shadow-box {", "  box-shadow:"];
      const activeLayers = currentState.layers.filter(function (layer) {
        return layer.enabled;
      });
      activeLayers.forEach(function (layer, index) {
        lines.push("    " + createLayerValue(layer) + (index === activeLayers.length - 1 ? ";" : ","));
      });
      lines.push("}");
    }
    if (currentState.includePreviewStyles) {
      lines.push(
        "",
        ".shadow-box {",
        "  background-color: " + currentState.preview.cardBackground + ";",
        "  border-radius: " + currentState.preview.borderRadius + "px;",
        "}",
        "",
        ".shadow-preview-stage {",
        "  padding: 64px;",
        "  background-color: " + currentState.preview.background + ";",
        "}"
      );
    }
    return lines.join("\n");
  }

  function escapeHtml(text) {
    return text.replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function highlightCss(css) {
    return escapeHtml(css)
      .replace(/^([ \t]*)([\w-]+)(:)/gm, '$1<span class="shadow-code-property">$2</span>$3')
      .replace(/(:[ \t]*)([^;\n]+)(;)/g, '$1<span class="shadow-code-value">$2</span>$3');
  }

  function renderLayers() {
    $layerList.empty();
    state.layers.forEach(function (layer, index) {
      const isSelected = layer.id === state.selectedLayerId;
      const $item = $("<li>", {
        class: "shadow-layer" + (isSelected ? " is-selected" : "") + (layer.enabled ? "" : " is-disabled"),
        "data-layer-id": layer.id
      });
      const $select = $("<button>", {
        class: "shadow-layer-select",
        type: "button",
        "aria-pressed": String(isSelected),
        "aria-label": "Select shadow layer " + (index + 1)
      }).append(
        $("<span>", { class: "shadow-layer-color", "aria-hidden": "true" }),
        $("<span>", { class: "shadow-layer-name", text: "Layer " + (index + 1) }),
        $("<span>", { class: "shadow-layer-state", text: layer.enabled ? (layer.inset ? "Inset" : "Outset") : "Disabled" })
      );
      $select.find(".shadow-layer-color").css("background-color", layer.color);
      const $actions = $("<span>", { class: "shadow-layer-actions" });
      const $toggle = $("<button>", {
        class: "shadow-layer-icon shadow-layer-toggle",
        type: "button",
        "aria-pressed": String(layer.enabled),
        "aria-label": (layer.enabled ? "Disable" : "Enable") + " layer " + (index + 1),
        title: layer.enabled ? "Disable layer" : "Enable layer",
        text: layer.enabled ? "●" : "○"
      });
      const $up = $("<button>", {
        class: "shadow-layer-icon shadow-layer-up",
        type: "button",
        "aria-label": "Move layer " + (index + 1) + " up",
        title: "Move up",
        text: "↑",
        disabled: index === 0
      });
      const $down = $("<button>", {
        class: "shadow-layer-icon shadow-layer-down",
        type: "button",
        "aria-label": "Move layer " + (index + 1) + " down",
        title: "Move down",
        text: "↓",
        disabled: index === state.layers.length - 1
      });
      const $remove = $("<button>", {
        class: "shadow-layer-icon shadow-layer-remove",
        type: "button",
        "aria-label": "Remove layer " + (index + 1),
        title: "Remove layer",
        text: "×",
        disabled: state.layers.length <= 1
      });
      $actions.append($toggle, $up, $down, $remove);
      $item.append($select, $actions);
      $layerList.append($item);
    });
    $("#shadow-layer-count").text(state.layers.length + " / " + MAX_LAYERS + " layers");
    $("#add-shadow-layer").prop("disabled", state.layers.length >= MAX_LAYERS);
  }

  function syncLayerControls() {
    const layer = selectedLayer();
    if (!layer) return;
    $("#shadow-editor-title").text("Layer " + (state.layers.findIndex(function (item) {
      return item.id === layer.id;
    }) + 1) + " settings");
    $("#shadow-x, #shadow-x-range").val(layer.x);
    $("#shadow-y, #shadow-y-range").val(layer.y);
    $("#shadow-blur, #shadow-blur-range").val(layer.blur);
    $("#shadow-spread, #shadow-spread-range").val(layer.spread);
    $("#shadow-color-picker").val(layer.color);
    $("#shadow-hex").val(layer.color);
    $("#shadow-opacity, #shadow-opacity-range").val(layer.opacity);
    $("#shadow-type").val(layer.inset ? "inset" : "outset");
  }

  function syncPreviewControls() {
    $("#preview-background, #preview-background-picker").val(state.preview.background);
    $("#card-background, #card-background-picker").val(state.preview.cardBackground);
    $("#card-radius, #card-radius-range").val(state.preview.borderRadius);
    $("#include-preview-styles").prop("checked", state.includePreviewStyles);
  }

  function renderPreview() {
    const activeLayers = state.layers.filter(function (layer) {
      return layer.enabled;
    });
    const shadowValue = activeLayers.length
      ? activeLayers.map(createLayerValue).join(", ")
      : "none";
    $("#shadow-preview-stage").css("background-color", state.preview.background);
    $previewCard.css({
      backgroundColor: state.preview.cardBackground,
      borderRadius: state.preview.borderRadius + "px",
      boxShadow: shadowValue
    });
    $("#shadow-visible-count").text(activeLayers.length + (activeLayers.length === 1 ? " active layer" : " active layers"));
  }

  function renderCode() {
    $("#shadow-css-code").html(highlightCss(createCss(state)));
  }

  function render() {
    renderLayers();
    syncLayerControls();
    syncPreviewControls();
    renderPreview();
    renderCode();
  }

  function isHexColor(value) {
    return /^#[0-9a-fA-F]{6}$/.test(value);
  }

  function updateLayerNumber(property, value, min, max, selector) {
    const layer = selectedLayer();
    if (!layer) return;
    const number = Number(value);
    if (value === "" || !Number.isFinite(number) || number < min || number > max) {
      $("#shadow-settings-error").text("Enter a value from " + min + " to " + max + ".");
      return;
    }
    layer[property] = Math.round(number);
    $("#shadow-settings-error").text("");
    if (selector && selector.type === "number") {
      const suffix = selector.id.replace("shadow-", "");
      $("#shadow-" + suffix + "-range").val(layer[property]);
      renderLayers();
      renderPreview();
      renderCode();
      return;
    }
    render();
  }

  function updateShadowColor(value, source) {
    const layer = selectedLayer();
    if (!layer) return;
    if (!isHexColor(value)) {
      $("#shadow-color-error").text("Enter a valid HEX color, for example #2563EB.");
      return;
    }
    layer.color = value.toUpperCase();
    $("#shadow-color-error").text("");
    if (source !== "picker") $("#shadow-color-picker").val(layer.color);
    render();
  }

  function updatePreviewColor(value, property, pickerSelector, errorId, source) {
    if (!isHexColor(value)) {
      $("#" + errorId).text("Enter a valid HEX color, for example #F1F5F9.");
      return;
    }
    state.preview[property] = value.toUpperCase();
    $("#" + errorId).text("");
    if (source !== "picker") $(pickerSelector).val(state.preview[property]);
    render();
  }

  function reorderLayer(layerId, offset) {
    const index = state.layers.findIndex(function (layer) { return layer.id === layerId; });
    const targetIndex = index + offset;
    if (index < 0 || targetIndex < 0 || targetIndex >= state.layers.length) return;
    const selectedId = state.selectedLayerId;
    const moved = state.layers.splice(index, 1)[0];
    state.layers.splice(targetIndex, 0, moved);
    state.selectedLayerId = selectedId;
    render();
  }

  function removeLayer(layerId) {
    if (state.layers.length <= 1) return;
    const index = state.layers.findIndex(function (layer) { return layer.id === layerId; });
    if (index < 0) return;
    state.layers.splice(index, 1);
    if (state.selectedLayerId === layerId) {
      state.selectedLayerId = state.layers[Math.min(index, state.layers.length - 1)].id;
    }
    render();
  }

  function presetLayer(x, y, blur, spread, color, opacity, inset) {
    return createLayer(nextLayerId++, {
      x: x,
      y: y,
      blur: blur,
      spread: spread,
      color: color,
      opacity: opacity,
      inset: Boolean(inset),
      enabled: true
    });
  }

  function applyPreset(name) {
    const presets = {
      soft: {
        layers: [[0, 4, 16, 0, "#0F172A", 8, false]]
      },
      medium: {
        layers: [[0, 8, 24, 0, "#0F172A", 15, false]]
      },
      strong: {
        layers: [[0, 16, 32, -4, "#0F172A", 28, false]]
      },
      floating: {
        layers: [[0, 2, 4, 0, "#0F172A", 8, false], [0, 16, 36, -8, "#0F172A", 18, false]]
      },
      material: {
        layers: [[0, 2, 5, -1, "#000000", 20, false], [0, 8, 16, 1, "#000000", 14, false]]
      },
      neumorphism: {
        background: "#E2E8F0",
        cardBackground: "#E2E8F0",
        layers: [[8, 8, 18, 0, "#94A3B8", 45, false], [-8, -8, 18, 0, "#FFFFFF", 90, false]]
      },
      inner: {
        layers: [[0, 3, 8, 0, "#0F172A", 18, true]]
      },
      layered: {
        layers: [[0, 1, 2, 0, "#0F172A", 7, false], [0, 4, 8, 0, "#0F172A", 8, false], [0, 12, 24, -4, "#0F172A", 12, false]]
      }
    };
    const preset = presets[name];
    if (!preset) return;
    state.layers = preset.layers.map(function (values) {
      return presetLayer.apply(null, values);
    });
    state.selectedLayerId = state.layers[0].id;
    state.preview = Object.assign({}, DEFAULT_PREVIEW, {
      background: preset.background || DEFAULT_PREVIEW.background,
      cardBackground: preset.cardBackground || DEFAULT_PREVIEW.cardBackground
    });
    state.includePreviewStyles = false;
    $("#shadow-color-error, #preview-color-error, #shadow-settings-error").text("");
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
      $copyStatus.text(error.message || "Could not copy. Please select and copy the code manually.");
    }
  }

  function resetState() {
    state = createInitialState();
    $("#shadow-color-error, #preview-color-error, #shadow-settings-error").text("");
    $copyStatus.text("");
    render();
  }

  $layerList.on("click.boxShadow", ".shadow-layer-select", function () {
    state.selectedLayerId = Number($(this).closest(".shadow-layer").attr("data-layer-id"));
    $("#shadow-color-error, #shadow-settings-error").text("");
    render();
  });
  $layerList.on("keydown.boxShadow", ".shadow-layer-select", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $(this).trigger("click");
    }
  });
  $layerList.on("click.boxShadow", ".shadow-layer-toggle", function () {
    const id = Number($(this).closest(".shadow-layer").attr("data-layer-id"));
    const layer = state.layers.find(function (item) { return item.id === id; });
    if (!layer) return;
    layer.enabled = !layer.enabled;
    render();
  });
  $layerList.on("click.boxShadow", ".shadow-layer-up", function () {
    reorderLayer(Number($(this).closest(".shadow-layer").attr("data-layer-id")), -1);
  });
  $layerList.on("click.boxShadow", ".shadow-layer-down", function () {
    reorderLayer(Number($(this).closest(".shadow-layer").attr("data-layer-id")), 1);
  });
  $layerList.on("click.boxShadow", ".shadow-layer-remove", function () {
    removeLayer(Number($(this).closest(".shadow-layer").attr("data-layer-id")));
  });

  $("#add-shadow-layer").on("click.boxShadow", function () {
    if (state.layers.length >= MAX_LAYERS) return;
    const layer = createLayer(nextLayerId++);
    state.layers.push(layer);
    state.selectedLayerId = layer.id;
    $("#shadow-settings-error").text("");
    render();
    $("#shadow-y").trigger("focus");
  });

  const numberControlMap = [
    ["x", "#shadow-x", "#shadow-x-range", -100, 100],
    ["y", "#shadow-y", "#shadow-y-range", -100, 100],
    ["blur", "#shadow-blur", "#shadow-blur-range", 0, 100],
    ["spread", "#shadow-spread", "#shadow-spread-range", -100, 100],
    ["opacity", "#shadow-opacity", "#shadow-opacity-range", 0, 100]
  ];
  numberControlMap.forEach(function (control) {
    const property = control[0];
    const numberSelector = control[1];
    const rangeSelector = control[2];
    const min = control[3];
    const max = control[4];
    $(numberSelector).on("input.boxShadow change.boxShadow", function () {
      updateLayerNumber(property, this.value, min, max, this);
    });
    $(rangeSelector).on("input.boxShadow change.boxShadow", function () {
      updateLayerNumber(property, this.value, min, max, this);
    });
  });

  $("#shadow-color-picker").on("input.boxShadow change.boxShadow", function () {
    updateShadowColor(this.value, "picker");
  });
  $("#shadow-hex").on("input.boxShadow change.boxShadow", function () {
    updateShadowColor(this.value, "hex");
  });
  $("#shadow-type").on("change.boxShadow", function () {
    const layer = selectedLayer();
    if (!layer) return;
    layer.inset = $(this).val() === "inset";
    render();
  });

  $("#preview-background-picker").on("input.boxShadow change.boxShadow", function () {
    updatePreviewColor(this.value, "background", "#preview-background", "preview-color-error", "picker");
  });
  $("#preview-background").on("input.boxShadow change.boxShadow", function () {
    updatePreviewColor(this.value, "background", "#preview-background-picker", "preview-color-error", "hex");
  });
  $("#card-background-picker").on("input.boxShadow change.boxShadow", function () {
    updatePreviewColor(this.value, "cardBackground", "#card-background", "preview-color-error", "picker");
  });
  $("#card-background").on("input.boxShadow change.boxShadow", function () {
    updatePreviewColor(this.value, "cardBackground", "#card-background-picker", "preview-color-error", "hex");
  });
  $("#card-radius, #card-radius-range").on("input.boxShadow change.boxShadow", function () {
    const value = Number(this.value);
    if (this.value === "" || !Number.isFinite(value) || value < 0 || value > 100) {
      $("#preview-color-error").text("Border radius must be between 0px and 100px.");
      return;
    }
    state.preview.borderRadius = Math.round(value);
    $("#preview-color-error").text("");
    $("#card-radius-range").val(state.preview.borderRadius);
    if (this.type === "number") {
      renderPreview();
      renderCode();
      return;
    }
    render();
  });
  $("#include-preview-styles").on("change.boxShadow", function () {
    state.includePreviewStyles = this.checked;
    renderCode();
  });

  $(".shadow-preset").on("click.boxShadow", function () {
    applyPreset($(this).attr("data-shadow-preset"));
  });
  $("#copy-shadow-css").on("click.boxShadow", function () {
    copyText(createCss(state), "CSS");
  });
  $("#copy-shadow-value").on("click.boxShadow", function () {
    copyText(createShadowValue(state), "Box-shadow value");
  });
  $("#reset-shadow, #reset-shadow-code").on("click.boxShadow", resetState);

  render();
});
