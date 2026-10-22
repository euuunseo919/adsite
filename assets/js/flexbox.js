$(function () {
  "use strict";

  const DEFAULTS = {
    container: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "nowrap",
      justifyContent: "flex-start",
      alignItems: "stretch",
      alignContent: "stretch",
      rowGap: 16,
      columnGap: 16,
      minHeight: 300,
      separateGaps: false
    },
    itemCount: 4
  };
  const MAX_ITEMS = 20;
  const MIN_ITEMS = 1;
  const $preview = $("#flexbox-preview");
  const $editor = $("#flexbox-item-editor");
  const $copyStatus = $("#flexbox-copy-status");

  function createItem(id) {
    return {
      id: id,
      grow: 0,
      shrink: 1,
      basisValue: "",
      basisUnit: "auto",
      alignSelf: "auto",
      order: 0
    };
  }

  function createInitialState() {
    return {
      container: Object.assign({}, DEFAULTS.container),
      items: Array.from({ length: DEFAULTS.itemCount }, function (_, index) {
        return createItem(index + 1);
      }),
      selectedItemId: null
    };
  }

  let state = createInitialState();

  function clampNumber(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function findSelectedItem() {
    return state.items.find(function (item) {
      return item.id === state.selectedItemId;
    }) || null;
  }

  function isDefaultItem(item) {
    return item.grow === 0 && item.shrink === 1 && item.basisUnit === "auto" &&
      item.alignSelf === "auto" && item.order === 0;
  }

  function formatBasis(item) {
    if (item.basisUnit === "auto") return "auto";
    return String(item.basisValue) + item.basisUnit;
  }

  function createCss(currentState) {
    const container = currentState.container;
    const lines = [
      ".flex-container {",
      "  display: " + container.display + ";",
      "  flex-direction: " + container.flexDirection + ";",
      "  flex-wrap: " + container.flexWrap + ";",
      "  justify-content: " + container.justifyContent + ";",
      "  align-items: " + container.alignItems + ";",
      "  align-content: " + container.alignContent + ";"
    ];

    if (container.rowGap === container.columnGap) {
      lines.push("  gap: " + container.rowGap + "px;");
    } else {
      lines.push("  row-gap: " + container.rowGap + "px;");
      lines.push("  column-gap: " + container.columnGap + "px;");
    }
    lines.push("  min-height: " + container.minHeight + "px;", "}", "", ".flex-container .flex-item {", "  box-sizing: border-box;", "  min-width: 112px;", "  min-height: 72px;", "}");

    currentState.items.forEach(function (item) {
      if (isDefaultItem(item)) return;
      lines.push("", ".flex-item-" + item.id + " {");
      if (item.grow !== 0) lines.push("  flex-grow: " + item.grow + ";");
      if (item.shrink !== 1) lines.push("  flex-shrink: " + item.shrink + ";");
      if (item.basisUnit !== "auto") lines.push("  flex-basis: " + formatBasis(item) + ";");
      if (item.alignSelf !== "auto") lines.push("  align-self: " + item.alignSelf + ";");
      if (item.order !== 0) lines.push("  order: " + item.order + ";");
      lines.push("}");
    });
    return lines.join("\n");
  }

  function createHtml(currentState) {
    const children = currentState.items.map(function (item) {
      return "  <div class=\"flex-item flex-item-" + item.id + "\">Item " + item.id + "</div>";
    });
    return "<div class=\"flex-container\">\n" + children.join("\n") + "\n</div>";
  }

  function escapeHtml(value) {
    return value.replace(/[&<>"']/g, function (character) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "\"": "&quot;",
        "'": "&#39;"
      }[character];
    });
  }

  function highlightCode(code, isHtml) {
    let safeCode = escapeHtml(code);
    if (isHtml) {
      return safeCode.replace(/(&lt;\/?[\w-]+|&gt;)/g, '<span class="code-tag">$1</span>')
        .replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g, '<span class="code-attribute">$1</span>$2<span class="code-string">$3</span>');
    }
    return safeCode.replace(/^([ \t]*)([\w-]+)(:)/gm, '$1<span class="code-property">$2</span>$3')
      .replace(/(:[ \t]*)([^;\n]+)(;)/g, '$1<span class="code-value">$2</span>$3');
  }

  function setNumberValue(selector, value) {
    $(selector).val(value);
  }

  function syncSettings() {
    const container = state.container;
    $("#flex-display").val(container.display);
    $("#flex-direction").val(container.flexDirection);
    $("#flex-wrap").val(container.flexWrap);
    $("#flex-justify-content").val(container.justifyContent);
    $("#flex-align-items").val(container.alignItems);
    $("#flex-align-content").val(container.alignContent);
    $("#separate-gaps").prop("checked", container.separateGaps);
    $("#shared-gap-controls").prop("hidden", container.separateGaps);
    $("#separate-gap-controls").prop("hidden", !container.separateGaps);
    setNumberValue("#flex-gap", container.rowGap);
    setNumberValue("#flex-gap-range", container.rowGap);
    setNumberValue("#flex-row-gap", container.rowGap);
    setNumberValue("#flex-row-gap-range", container.rowGap);
    setNumberValue("#flex-column-gap", container.columnGap);
    setNumberValue("#flex-column-gap-range", container.columnGap);
    setNumberValue("#flex-container-height", container.minHeight);
    setNumberValue("#flex-container-height-range", container.minHeight);
    $("#flexbox-item-count").text(state.items.length + (state.items.length === 1 ? " item" : " items"));
    $("#add-flex-item").prop("disabled", state.items.length >= MAX_ITEMS);
    $("#remove-flex-item").prop("disabled", state.items.length <= MIN_ITEMS);

    const selectedItem = findSelectedItem();
    $editor.prop("hidden", !selectedItem);
    if (selectedItem) {
      $("#flexbox-item-editor-title").text("Edit Item " + selectedItem.id);
      $("#item-grow").val(selectedItem.grow);
      $("#item-shrink").val(selectedItem.shrink);
      $("#item-basis-unit").val(selectedItem.basisUnit);
      $("#item-basis-value").val(selectedItem.basisValue);
      $("#item-basis-value").prop("disabled", selectedItem.basisUnit === "auto");
      $("#item-basis-value").attr("placeholder", selectedItem.basisUnit === "auto" ? "auto" : "0");
      $("#item-align-self").val(selectedItem.alignSelf);
      $("#item-order").val(selectedItem.order);
    }
  }

  function updatePreview() {
    const container = state.container;
    $preview.css({
      display: container.display,
      flexDirection: container.flexDirection,
      flexWrap: container.flexWrap,
      justifyContent: container.justifyContent,
      alignItems: container.alignItems,
      alignContent: container.alignContent,
      rowGap: container.rowGap + "px",
      columnGap: container.columnGap + "px",
      minHeight: container.minHeight + "px",
      width: container.display === "inline-flex" ? "auto" : "100%"
    });
    $preview.empty();
    state.items.forEach(function (item) {
      const $item = $("<div>", {
        class: "flexbox-preview-item" + (item.id === state.selectedItemId ? " is-selected" : ""),
        text: "Item " + item.id,
        role: "button",
        tabindex: "0",
        "aria-pressed": item.id === state.selectedItemId ? "true" : "false",
        "aria-label": "Select Flex item " + item.id
      });
      $item.css({
        flexGrow: item.grow,
        flexShrink: item.shrink,
        flexBasis: formatBasis(item),
        alignSelf: item.alignSelf,
        order: item.order
      }).attr("data-item-id", item.id);
      $preview.append($item);
    });
    $("#flexbox-preview-stage").toggleClass("is-inline-flex", container.display === "inline-flex");
    $("#flexbox-preview-summary").text(container.display + " · " + container.flexDirection + " · " + container.flexWrap);
    $("#flexbox-line-hint").text(container.flexWrap === "nowrap"
      ? "Choose wrap to create multiple lines and explore align-content."
      : "Align content distributes wrapped lines across the cross axis.");
  }

  function updateCode() {
    const css = createCss(state);
    const html = createHtml(state);
    $("#flex-css-code").html(highlightCode(css, false));
    $("#flex-html-code").html(highlightCode(html, true));
  }

  function render() {
    syncSettings();
    updatePreview();
    updateCode();
  }

  function showInputError(message) {
    $("#flexbox-item-editor-error").text(message);
  }

  function updateItemProperty(property, value, min, max) {
    const item = findSelectedItem();
    if (!item) return;
    const numericValue = Number(value);
    if (value === "" || !Number.isFinite(numericValue) || numericValue < min || numericValue > max) {
      showInputError("Enter a number from " + min + " to " + max + ".");
      return;
    }
    item[property] = numericValue;
    showInputError("");
    render();
  }

  function updateGap(property, value) {
    const numericValue = Number(value);
    if (value === "" || !Number.isFinite(numericValue) || numericValue < 0 || numericValue > 100) {
      $("#flexbox-setting-error").text("Gap values must be between 0px and 100px.");
      return;
    }
    const gapValue = Math.round(numericValue);
    $("#flexbox-setting-error").text("");
    state.container[property] = gapValue;
    if (!state.container.separateGaps) {
      state.container.rowGap = gapValue;
      state.container.columnGap = gapValue;
    }
    render();
  }

  function applyPreset(name) {
    const presets = {
      "horizontal-center": function () {
        state.container.justifyContent = "center";
        state.container.alignItems = "center";
        state.container.minHeight = 300;
        state.items = Array.from({ length: 4 }, function (_, index) { return createItem(index + 1); });
      },
      "space-between": function () {
        state.container.justifyContent = "space-between";
        state.container.alignItems = "center";
        state.container.minHeight = 300;
        state.items = Array.from({ length: 4 }, function (_, index) { return createItem(index + 1); });
      },
      "vertical-stack": function () {
        state.container.flexDirection = "column";
        state.container.flexWrap = "nowrap";
        state.container.rowGap = 16;
        state.container.columnGap = 16;
        state.container.separateGaps = false;
        state.container.minHeight = 300;
        state.items = Array.from({ length: 4 }, function (_, index) { return createItem(index + 1); });
      },
      navigation: function () {
        state.container.flexDirection = "row";
        state.container.flexWrap = "nowrap";
        state.container.justifyContent = "flex-start";
        state.container.alignItems = "center";
        state.container.minHeight = 120;
        state.items = Array.from({ length: 4 }, function (_, index) { return createItem(index + 1); });
        state.items[0].grow = 1;
      },
      "card-layout": function () {
        state.container.flexDirection = "row";
        state.container.flexWrap = "wrap";
        state.container.justifyContent = "flex-start";
        state.container.alignItems = "stretch";
        state.container.alignContent = "flex-start";
        state.container.rowGap = 16;
        state.container.columnGap = 16;
        state.container.separateGaps = false;
        state.container.minHeight = 320;
        state.items = Array.from({ length: 6 }, function (_, index) {
          const item = createItem(index + 1);
          item.basisValue = 180;
          item.basisUnit = "px";
          return item;
        });
      },
      "equal-columns": function () {
        state.container.flexDirection = "row";
        state.container.flexWrap = "nowrap";
        state.container.justifyContent = "flex-start";
        state.container.alignItems = "stretch";
        state.container.minHeight = 240;
        state.items = Array.from({ length: 4 }, function (_, index) {
          const item = createItem(index + 1);
          item.grow = 1;
          item.basisValue = 0;
          item.basisUnit = "%";
          return item;
        });
      },
      sidebar: function () {
        state.container.flexDirection = "row";
        state.container.flexWrap = "nowrap";
        state.container.justifyContent = "flex-start";
        state.container.alignItems = "stretch";
        state.container.minHeight = 300;
        state.items = [createItem(1), createItem(2)];
        state.items[0].basisValue = 220;
        state.items[0].basisUnit = "px";
        state.items[0].shrink = 0;
        state.items[1].grow = 1;
        state.items[1].basisValue = 0;
        state.items[1].basisUnit = "%";
      },
      "responsive-wrap": function () {
        state.container.flexDirection = "row";
        state.container.flexWrap = "wrap";
        state.container.justifyContent = "flex-start";
        state.container.alignItems = "stretch";
        state.container.alignContent = "space-between";
        state.container.rowGap = 16;
        state.container.columnGap = 16;
        state.container.separateGaps = false;
        state.container.minHeight = 400;
        state.items = Array.from({ length: 8 }, function (_, index) {
          const item = createItem(index + 1);
          item.basisValue = 180;
          item.basisUnit = "px";
          return item;
        });
      }
    };
    if (!presets[name]) return;
    state.container = Object.assign({}, DEFAULTS.container);
    state.items = Array.from({ length: DEFAULTS.itemCount }, function (_, index) {
      return createItem(index + 1);
    });
    presets[name]();
    state.selectedItemId = null;
    showInputError("");
    $("#flexbox-setting-error").text("");
    render();
    $("#generator-title").get(0).scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectTab(tabName, shouldFocus) {
    const isCss = tabName === "css";
    $("#css-tab").toggleClass("is-active", isCss).attr("aria-selected", String(isCss)).attr("tabindex", isCss ? "0" : "-1");
    $("#html-tab").toggleClass("is-active", !isCss).attr("aria-selected", String(!isCss)).attr("tabindex", isCss ? "-1" : "0");
    $("#css-panel").prop("hidden", !isCss);
    $("#html-panel").prop("hidden", isCss);
    if (shouldFocus) $(isCss ? "#css-tab" : "#html-tab").trigger("focus");
  }

  async function copyText(text, description) {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard access is unavailable. Use a secure browser context to copy code.");
      }
      await navigator.clipboard.writeText(text);
      $copyStatus.text(description + " copied to clipboard.");
    } catch (error) {
      $copyStatus.text(error.message || "Could not copy code. Please select and copy it manually.");
    }
  }

  function resetState() {
    state = createInitialState();
    showInputError("");
    $("#flexbox-setting-error").text("");
    $copyStatus.text("");
    render();
  }

  $("#flex-display, #flex-direction, #flex-wrap, #flex-justify-content, #flex-align-items, #flex-align-content").on("change.flexbox", function () {
    const keyMap = {
      "flex-display": "display",
      "flex-direction": "flexDirection",
      "flex-wrap": "flexWrap",
      "flex-justify-content": "justifyContent",
      "flex-align-items": "alignItems",
      "flex-align-content": "alignContent"
    };
    state.container[keyMap[this.id]] = $(this).val();
    render();
  });

  $("#separate-gaps").on("change.flexbox", function () {
    if (!this.checked) {
      state.container.rowGap = state.container.columnGap;
      state.container.separateGaps = false;
    } else {
      state.container.separateGaps = true;
    }
    render();
  });

  $("#flex-gap, #flex-gap-range").on("input.flexbox change.flexbox", function () {
    updateGap("rowGap", this.value);
  });
  $("#flex-row-gap, #flex-row-gap-range").on("input.flexbox change.flexbox", function () {
    updateGap("rowGap", this.value);
  });
  $("#flex-column-gap, #flex-column-gap-range").on("input.flexbox change.flexbox", function () {
    updateGap("columnGap", this.value);
  });
  $("#flex-container-height, #flex-container-height-range").on("input.flexbox change.flexbox", function () {
    const value = Number(this.value);
    if (this.value === "" || !Number.isFinite(value) || value < 150 || value > 600) {
      $("#flexbox-setting-error").text("Preview min-height must be between 150px and 600px.");
      return;
    }
    $("#flexbox-setting-error").text("");
    state.container.minHeight = clampNumber(Math.round(value / 10) * 10, 150, 600);
    render();
  });

  $("#add-flex-item").on("click.flexbox", function () {
    if (state.items.length >= MAX_ITEMS) return;
    const nextId = state.items.reduce(function (max, item) { return Math.max(max, item.id); }, 0) + 1;
    state.items.push(createItem(nextId));
    render();
  });
  $("#remove-flex-item").on("click.flexbox", function () {
    if (state.items.length <= MIN_ITEMS) return;
    const removed = state.items.pop();
    if (removed && removed.id === state.selectedItemId) state.selectedItemId = null;
    render();
  });

  $preview.on("click.flexbox", ".flexbox-preview-item", function () {
    state.selectedItemId = Number($(this).attr("data-item-id"));
    showInputError("");
    render();
    $("#item-grow").trigger("focus");
  });
  $preview.on("keydown.flexbox", ".flexbox-preview-item", function (event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      $(this).trigger("click");
    }
  });

  $("#item-grow").on("input.flexbox change.flexbox", function () {
    updateItemProperty("grow", this.value, 0, 10);
  });
  $("#item-shrink").on("input.flexbox change.flexbox", function () {
    updateItemProperty("shrink", this.value, 0, 10);
  });
  $("#item-order").on("input.flexbox change.flexbox", function () {
    updateItemProperty("order", this.value, -10, 10);
  });
  $("#item-basis-unit").on("change.flexbox", function () {
    const item = findSelectedItem();
    if (!item) return;
    item.basisUnit = $(this).val();
    item.basisValue = item.basisUnit === "auto" ? "" : (item.basisValue === "" ? 0 : item.basisValue);
    showInputError("");
    render();
    if (item.basisUnit !== "auto") $("#item-basis-value").trigger("focus");
  });
  $("#item-basis-value").on("input.flexbox change.flexbox", function () {
    const item = findSelectedItem();
    if (!item || item.basisUnit === "auto") return;
    const value = Number(this.value);
    if (this.value === "" || !Number.isFinite(value) || value < 0 || value > 2000) {
      showInputError("Flex basis must be a number from 0 to 2000.");
      return;
    }
    item.basisValue = value;
    showInputError("");
    render();
  });
  $("#item-align-self").on("change.flexbox", function () {
    const item = findSelectedItem();
    if (!item) return;
    item.alignSelf = $(this).val();
    render();
  });

  $(".flexbox-preset").on("click.flexbox", function () {
    applyPreset($(this).attr("data-preset"));
  });
  $("#reset-flexbox, #reset-flexbox-code").on("click.flexbox", resetState);
  $("#css-tab").on("click.flexbox", function () { selectTab("css", false); });
  $("#html-tab").on("click.flexbox", function () { selectTab("html", false); });
  $(".flexbox-tabs").on("keydown.flexbox", ".flexbox-tab", function (event) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      selectTab(this.id === "css-tab" ? "html" : "css", true);
    }
  });
  $("#copy-flex-css").on("click.flexbox", function () {
    copyText(createCss(state), "CSS");
  });
  $("#copy-flex-html").on("click.flexbox", function () {
    copyText(createHtml(state), "HTML");
  });
  $("#copy-flex-all").on("click.flexbox", function () {
    copyText(createCss(state) + "\n\n" + createHtml(state), "CSS and HTML");
  });

  render();
});
