$(function () {
  const defaultItems = function () {
    return Array.from({ length: 6 }, function (_, index) {
      return createItem(index + 1);
    });
  };

  function createItem(id) {
    return {
      id: id,
      columnStart: "",
      columnSpan: 1,
      rowStart: "",
      rowSpan: 1
    };
  }

  const defaults = {
    columns: 3,
    rows: 2,
    columnGap: 16,
    rowGap: 16,
    justifyItems: "stretch",
    alignItems: "stretch",
    justifyContent: "start",
    alignContent: "start",
    columnTemplate: "repeat(3, 1fr)",
    rowTemplate: "repeat(2, 1fr)",
    items: defaultItems()
  };

  const state = {
    columns: defaults.columns,
    rows: defaults.rows,
    columnGap: defaults.columnGap,
    rowGap: defaults.rowGap,
    justifyItems: defaults.justifyItems,
    alignItems: defaults.alignItems,
    justifyContent: defaults.justifyContent,
    alignContent: defaults.alignContent,
    columnTemplate: defaults.columnTemplate,
    rowTemplate: defaults.rowTemplate,
    items: defaultItems(),
    selectedItemId: null,
    preset: null
  };

  const alignmentValues = {
    justifyItems: ["stretch", "start", "center", "end"],
    alignItems: ["stretch", "start", "center", "end"],
    justifyContent: ["start", "center", "end", "space-between", "space-around", "space-evenly", "stretch"],
    alignContent: ["start", "center", "end", "space-between", "space-around", "space-evenly", "stretch"]
  };

  const presets = {
    "two-columns": {
      columns: 2,
      rows: 2,
      columnGap: 20,
      rowGap: 20,
      columnTemplate: "repeat(2, 1fr)",
      rowTemplate: "repeat(2, 1fr)",
      items: 4
    },
    "three-columns": {
      columns: 3,
      rows: 2,
      columnGap: 16,
      rowGap: 16,
      columnTemplate: "repeat(3, 1fr)",
      rowTemplate: "repeat(2, 1fr)",
      items: 6
    },
    "four-columns": {
      columns: 4,
      rows: 2,
      columnGap: 16,
      rowGap: 16,
      columnTemplate: "repeat(4, 1fr)",
      rowTemplate: "repeat(2, 1fr)",
      items: 8
    },
    sidebar: {
      columns: 2,
      rows: 2,
      columnGap: 24,
      rowGap: 20,
      columnTemplate: "250px 1fr",
      rowTemplate: "repeat(2, 1fr)",
      items: 3,
      placements: {
        1: { columnStart: "1", columnSpan: 1, rowStart: "1", rowSpan: 2 },
        2: { columnStart: "2", columnSpan: 1, rowStart: "1", rowSpan: 1 },
        3: { columnStart: "2", columnSpan: 1, rowStart: "2", rowSpan: 1 }
      }
    },
    dashboard: {
      columns: 4,
      rows: 3,
      columnGap: 16,
      rowGap: 16,
      columnTemplate: "repeat(4, 1fr)",
      rowTemplate: "repeat(3, 1fr)",
      items: 7,
      placements: {
        1: { columnStart: "1", columnSpan: 2, rowStart: "1", rowSpan: 1 },
        2: { columnStart: "3", columnSpan: 2, rowStart: "1", rowSpan: 1 },
        3: { columnStart: "1", columnSpan: 1, rowStart: "2", rowSpan: 1 },
        4: { columnStart: "2", columnSpan: 2, rowStart: "2", rowSpan: 1 },
        5: { columnStart: "4", columnSpan: 1, rowStart: "2", rowSpan: 1 },
        6: { columnStart: "1", columnSpan: 2, rowStart: "3", rowSpan: 1 },
        7: { columnStart: "3", columnSpan: 2, rowStart: "3", rowSpan: 1 }
      }
    },
    gallery: {
      columns: 4,
      rows: 3,
      columnGap: 12,
      rowGap: 12,
      columnTemplate: "repeat(4, 1fr)",
      rowTemplate: "repeat(3, 1fr)",
      items: 12
    }
  };

  const $preview = $("#grid-preview");
  const $editor = $("#grid-item-editor");
  const $editorError = $("#grid-item-editor-error");
  let nextItemId = 7;

  function cssRuleForItem(item) {
    const hasCustomPlacement = item.columnStart !== "" || item.rowStart !== "" ||
      item.columnSpan !== 1 || item.rowSpan !== 1;
    if (!hasCustomPlacement) {
      return "";
    }

    return ".grid-item-" + item.id + " {\n" +
      "  grid-column: " + (item.columnStart || "auto") + " / span " + item.columnSpan + ";\n" +
      "  grid-row: " + (item.rowStart || "auto") + " / span " + item.rowSpan + ";\n" +
      "}";
  }

  function buildCss() {
    const declarations = [
      "  display: grid;",
      "  grid-template-columns: " + state.columnTemplate + ";",
      "  grid-template-rows: " + state.rowTemplate + ";",
      "  column-gap: " + state.columnGap + "px;",
      "  row-gap: " + state.rowGap + "px;",
      "  justify-items: " + state.justifyItems + ";",
      "  align-items: " + state.alignItems + ";",
      "  justify-content: " + state.justifyContent + ";",
      "  align-content: " + state.alignContent + ";"
    ];
    const output = [".grid-container {\n" + declarations.join("\n") + "\n}"];
    state.items.forEach(function (item) {
      const rule = cssRuleForItem(item);
      if (rule) {
        output.push(rule);
      }
    });
    return output.join("\n\n");
  }

  function buildHtml() {
    const items = state.items.map(function (item) {
      return '  <div class="grid-item grid-item-' + item.id + '">Item ' + item.id + "</div>";
    });
    return '<div class="grid-container">\n' + items.join("\n") + "\n</div>";
  }

  function highlightCode($target, source, kind) {
    const pattern = kind === "css"
      ? /(^|\n)(\.grid-container|\.grid-item-\d+)|([a-z-]+)(?=\s*:)|(\b(?:grid|repeat)\b)|(\b\d+(?:\.\d+)?(?:px|fr)\b)|(\b\d+\b)/g
      : /(<\/?)(div)(?=[\s>])|([a-z-]+)(?==)|("[^"]*")|(\bItem \d+\b)/g;
    let lastIndex = 0;
    let match;
    $target.empty();

    while ((match = pattern.exec(source)) !== null) {
      if (match.index > lastIndex) {
        $target.append(document.createTextNode(source.slice(lastIndex, match.index)));
      }
      const token = match[0];
      let tokenClass = "grid-code-token--value";
      if (kind === "css") {
        tokenClass = match[2] ? "grid-code-token--selector" :
          match[3] ? "grid-code-token--property" :
            match[4] ? "grid-code-token--function" : "grid-code-token--value";
      } else {
        tokenClass = match[1] || match[2] ? "grid-code-token--tag" :
          match[3] ? "grid-code-token--property" :
            match[4] ? "grid-code-token--string" : "grid-code-token--value";
      }
      $("<span>").addClass("grid-code-token " + tokenClass).text(token).appendTo($target);
      lastIndex = pattern.lastIndex;
    }
    if (lastIndex < source.length) {
      $target.append(document.createTextNode(source.slice(lastIndex)));
    }
  }

  function applyPlacement($element, item) {
    $element.css({
      gridColumn: item.columnStart === "" && item.columnSpan === 1
        ? ""
        : (item.columnStart || "auto") + " / span " + item.columnSpan,
      gridRow: item.rowStart === "" && item.rowSpan === 1
        ? ""
        : (item.rowStart || "auto") + " / span " + item.rowSpan
    });
  }

  function renderPreview() {
    $preview.empty();
    state.items.forEach(function (item) {
      const $item = $("<div>")
        .addClass("grid-preview-item")
        .toggleClass("is-selected", item.id === state.selectedItemId)
        .attr({
          "data-item-id": item.id,
          "role": "button",
          "tabindex": "0",
          "aria-pressed": String(item.id === state.selectedItemId),
          "aria-label": "Select grid item " + item.id
        })
        .append($("<span>").addClass("grid-preview-item__number").text(String(item.id)))
        .append($("<span>").addClass("grid-preview-item__label").text("Item " + item.id));
      applyPlacement($item, item);
      $preview.append($item);
    });

    $preview.css({
      gridTemplateColumns: state.columnTemplate,
      gridTemplateRows: state.rowTemplate,
      columnGap: state.columnGap + "px",
      rowGap: state.rowGap + "px",
      justifyItems: state.justifyItems,
      alignItems: state.alignItems,
      justifyContent: state.justifyContent,
      alignContent: state.alignContent
    });
    $("#grid-item-count").text(state.items.length + (state.items.length === 1 ? " item" : " items"));
    $("#preview-dimensions").text(state.columns + " cols × " + state.rows + " rows");
    $("#implicit-track-note").text(
      state.items.length > state.columns * state.rows
        ? "Extra items create implicit tracks automatically."
        : "Explicit tracks: " + state.columns + " columns × " + state.rows + " rows."
    );
    $("#remove-grid-item").prop("disabled", state.items.length <= 1);
    $("#add-grid-item").prop("disabled", state.items.length >= 36);
  }

  function renderEditor() {
    const item = state.items.find(function (entry) {
      return entry.id === state.selectedItemId;
    });
    if (!item) {
      state.selectedItemId = null;
      $editor.prop("hidden", true);
      return;
    }

    $editor.prop("hidden", false);
    $("#grid-item-editor-title").text("Edit Item " + item.id);
    $("#item-column-start").val(item.columnStart);
    $("#item-column-span").val(item.columnSpan);
    $("#item-row-start").val(item.rowStart);
    $("#item-row-span").val(item.rowSpan);
    $editorError.text("");
  }

  function render() {
    renderPreview();
    renderEditor();
    highlightCode($("#grid-css-code"), buildCss(), "css");
    highlightCode($("#grid-html-code"), buildHtml(), "html");
    $(".grid-preset-card").attr("aria-pressed", "false");
    if (state.preset) {
      $('.grid-preset-card[data-preset="' + state.preset + '"]').attr("aria-pressed", "true");
    }
  }

  function setRangeValue(id, value) {
    $("#" + id).val(value);
  }

  function bindNumberAndRange(numberId, rangeId, stateKey, minimum, maximum, step, onChange) {
    const $number = $("#" + numberId);
    const $range = $("#" + rangeId);
    $number.off(".gridValue").on("input.gridValue change.gridValue", function () {
      const rawValue = $(this).val();
      if (rawValue === "") {
        return;
      }
      const value = Number(rawValue);
      if (!Number.isFinite(value) || !Number.isInteger(value) || value < minimum || value > maximum) {
        $(this).attr("aria-invalid", "true");
        return;
      }
      $(this).removeAttr("aria-invalid");
      state[stateKey] = value;
      $range.val(value);
      if (typeof onChange === "function") {
        onChange(value);
      }
      render();
    });
    $range.off(".gridValue").on("input.gridValue change.gridValue", function () {
      const value = Number($(this).val());
      state[stateKey] = Math.min(maximum, Math.max(minimum, Math.round(value / step) * step));
      $number.val(state[stateKey]).removeAttr("aria-invalid");
      if (typeof onChange === "function") {
        onChange(state[stateKey]);
      }
      render();
    });
  }

  function validatePlacementValue($field, label, allowEmpty) {
    const rawValue = String($field.val()).trim();
    if (allowEmpty && rawValue === "") {
      $field.removeAttr("aria-invalid");
      return { value: "" };
    }
    const value = Number(rawValue);
    if (!Number.isInteger(value) || value < 1 || value > 12) {
      return { error: label + " must be a whole number from 1 to 12." };
    }
    $field.removeAttr("aria-invalid");
    return { value: String(value) };
  }

  function updateSelectedPlacement() {
    const item = state.items.find(function (entry) {
      return entry.id === state.selectedItemId;
    });
    if (!item) {
      return;
    }

    const columnStart = validatePlacementValue($("#item-column-start"), "Grid column start", true);
    const columnSpan = validatePlacementValue($("#item-column-span"), "Grid column span", false);
    const rowStart = validatePlacementValue($("#item-row-start"), "Grid row start", true);
    const rowSpan = validatePlacementValue($("#item-row-span"), "Grid row span", false);
    const errors = [columnStart, columnSpan, rowStart, rowSpan].filter(function (entry) {
      return entry.error;
    });
    if (errors.length) {
      [columnStart, columnSpan, rowStart, rowSpan].forEach(function (entry, index) {
        const fields = ["#item-column-start", "#item-column-span", "#item-row-start", "#item-row-span"];
        if (entry.error) {
          $(fields[index]).attr("aria-invalid", "true");
        }
      });
      $editorError.text(errors[0].error);
      return;
    }

    item.columnStart = columnStart.value;
    item.columnSpan = Number(columnSpan.value);
    item.rowStart = rowStart.value;
    item.rowSpan = Number(rowSpan.value);
    $editorError.text("");
    renderPreview();
    highlightCode($("#grid-css-code"), buildCss(), "css");
    highlightCode($("#grid-html-code"), buildHtml(), "html");
  }

  function setItemCount(count, placements) {
    const items = [];
    for (let index = 0; index < count; index += 1) {
      const id = index + 1;
      const item = createItem(id);
      if (placements && placements[id]) {
        Object.assign(item, placements[id]);
      }
      items.push(item);
    }
    state.items = items;
    state.selectedItemId = null;
    nextItemId = count + 1;
  }

  function applyPreset(name) {
    const preset = presets[name];
    if (!preset) {
      return;
    }
    state.columns = preset.columns;
    state.rows = preset.rows;
    state.columnGap = preset.columnGap;
    state.rowGap = preset.rowGap;
    state.columnTemplate = preset.columnTemplate;
    state.rowTemplate = preset.rowTemplate;
    state.justifyItems = "stretch";
    state.alignItems = "stretch";
    state.justifyContent = "start";
    state.alignContent = "start";
    state.preset = name;
    setItemCount(preset.items, preset.placements);
    $("#justify-items").val("stretch");
    $("#align-items").val("stretch");
    $("#justify-content").val("start");
    $("#align-content").val("start");
    $("#grid-columns-number").val(state.columns);
    $("#grid-columns-range").val(state.columns);
    $("#grid-rows-number").val(state.rows);
    $("#grid-rows-range").val(state.rows);
    $("#grid-column-gap").val(state.columnGap);
    $("#grid-column-gap-range").val(state.columnGap);
    $("#grid-row-gap").val(state.rowGap);
    $("#grid-row-gap-range").val(state.rowGap);
    render();
  }

  function resetGrid() {
    state.columns = defaults.columns;
    state.rows = defaults.rows;
    state.columnGap = defaults.columnGap;
    state.rowGap = defaults.rowGap;
    state.justifyItems = defaults.justifyItems;
    state.alignItems = defaults.alignItems;
    state.justifyContent = defaults.justifyContent;
    state.alignContent = defaults.alignContent;
    state.columnTemplate = defaults.columnTemplate;
    state.rowTemplate = defaults.rowTemplate;
    state.preset = null;
    setItemCount(defaults.items.length);
    $("#grid-columns-number, #grid-columns-range").val(defaults.columns).removeAttr("aria-invalid");
    $("#grid-rows-number, #grid-rows-range").val(defaults.rows).removeAttr("aria-invalid");
    $("#grid-column-gap, #grid-column-gap-range").val(defaults.columnGap).removeAttr("aria-invalid");
    $("#grid-row-gap, #grid-row-gap-range").val(defaults.rowGap).removeAttr("aria-invalid");
    $("#justify-items").val(defaults.justifyItems);
    $("#align-items").val(defaults.alignItems);
    $("#justify-content").val(defaults.justifyContent);
    $("#align-content").val(defaults.alignContent);
    render();
  }

  function copyText(value, $status, label) {
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      $status.text("Clipboard is unavailable. Select and copy the " + label + " manually.");
      return Promise.resolve(false);
    }
    return navigator.clipboard.writeText(value).then(function () {
      $status.text(label + " copied to clipboard.");
      return true;
    }).catch(function (error) {
      console.error("Unitwise could not copy " + label + ".", error);
      $status.text("Could not copy automatically. Select and copy the " + label + " manually.");
      return false;
    });
  }

  bindNumberAndRange("grid-columns-number", "grid-columns-range", "columns", 1, 12, 1, function (value) {
    state.columnTemplate = "repeat(" + value + ", 1fr)";
    state.preset = null;
  });
  bindNumberAndRange("grid-rows-number", "grid-rows-range", "rows", 1, 12, 1, function (value) {
    state.rowTemplate = "repeat(" + value + ", 1fr)";
    state.preset = null;
  });
  bindNumberAndRange("grid-column-gap", "grid-column-gap-range", "columnGap", 0, 100, 1, function () {
    state.preset = null;
  });
  bindNumberAndRange("grid-row-gap", "grid-row-gap-range", "rowGap", 0, 100, 1, function () {
    state.preset = null;
  });

  Object.keys(alignmentValues).forEach(function (key) {
    $("#" + key.replace(/[A-Z]/g, function (letter) { return "-" + letter.toLowerCase(); }))
      .off("change.gridAlignment")
      .on("change.gridAlignment", function () {
        const value = $(this).val();
        if (alignmentValues[key].indexOf(value) === -1) {
          return;
        }
        state[key] = value;
        state.preset = null;
        render();
      });
  });

  $preview.off("click.gridItem keydown.gridItem")
    .on("click.gridItem", ".grid-preview-item", function () {
      state.selectedItemId = Number($(this).attr("data-item-id"));
      render();
      $("#item-column-start").trigger("focus");
    })
    .on("keydown.gridItem", ".grid-preview-item", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        $(this).trigger("click");
      }
    });

  $("#grid-item-editor").off("input.gridPlacement change.gridPlacement")
    .on("input.gridPlacement change.gridPlacement", "input", updateSelectedPlacement);

  $("#add-grid-item").off("click.gridItems").on("click.gridItems", function () {
    if (state.items.length >= 36) {
      return;
    }
    state.items.push(createItem(nextItemId));
    nextItemId += 1;
    state.preset = null;
    render();
  });

  $("#remove-grid-item").off("click.gridItems").on("click.gridItems", function () {
    if (state.items.length <= 1) {
      return;
    }
    const removed = state.items.pop();
    if (state.selectedItemId === removed.id) {
      state.selectedItemId = null;
    }
    state.preset = null;
    render();
  });

  $(".grid-preset-card").off("click.gridPreset").on("click.gridPreset", function () {
    applyPreset($(this).attr("data-preset"));
  });

  $("#reset-grid").off("click.gridReset").on("click.gridReset", resetGrid);
  $("#copy-grid-css").off("click.gridCopy").on("click.gridCopy", function () {
    copyText(buildCss(), $("#grid-css-status"), "CSS");
  });
  $("#copy-grid-html").off("click.gridCopy").on("click.gridCopy", function () {
    copyText(buildHtml(), $("#grid-html-status"), "HTML");
  });

  render();
});
