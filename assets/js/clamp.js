$(function () {
  const defaults = {
    minimumSize: "16",
    maximumSize: "32",
    minimumViewport: "320",
    maximumViewport: "1440",
    rootSize: "16",
    property: "font-size"
  };
  const $minimumSize = $("#minimum-size");
  const $maximumSize = $("#maximum-size");
  const $minimumViewport = $("#minimum-viewport");
  const $maximumViewport = $("#maximum-viewport");
  const $rootSize = $("#root-font-size");
  const $property = $("#css-property");
  const $slider = $("#viewport-slider");
  const $code = $("#generated-css");
  const $validation = $("#clamp-validation");
  const $copyStatus = $("#clamp-copy-status");
  const $previewTarget = $("#preview-target");
  const $previewViewport = $("#preview-viewport");
  const $chart = $("#scale-chart");

  function parseNumber(value) {
    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return null;
    }
    const rounded = Math.abs(value) < 0.00005 ? 0 : Number(value.toFixed(4));
    return String(rounded);
  }

  function calculateClamp(settings) {
    const slope = (settings.maximumSize - settings.minimumSize) /
      (settings.maximumViewport - settings.minimumViewport);
    const intercept = settings.minimumSize - slope * settings.minimumViewport;
    const minimumRem = settings.minimumSize / settings.rootSize;
    const maximumRem = settings.maximumSize / settings.rootSize;
    const interceptRem = intercept / settings.rootSize;
    const vwCoefficient = slope * 100;

    if (![slope, intercept, minimumRem, maximumRem, interceptRem, vwCoefficient].every(Number.isFinite)) {
      return null;
    }

    const middle = slope === 0
      ? formatNumber(minimumRem) + "rem"
      : "calc(" + formatNumber(interceptRem) + "rem " +
        (vwCoefficient < 0 ? "- " : "+ ") +
        formatNumber(Math.abs(vwCoefficient)) + "vw)";

    return {
      slope: slope,
      intercept: intercept,
      minimumSize: settings.minimumSize,
      maximumSize: settings.maximumSize,
      minimumViewport: settings.minimumViewport,
      maximumViewport: settings.maximumViewport,
      minimumRem: formatNumber(minimumRem),
      maximumRem: formatNumber(maximumRem),
      interceptRem: formatNumber(interceptRem),
      vwCoefficient: formatNumber(vwCoefficient),
      middle: middle
    };
  }

  function sizeAtViewport(calculation, viewportWidth) {
    const preferred = calculation.slope * viewportWidth + calculation.intercept;
    return Math.min(calculation.maximumSize, Math.max(calculation.minimumSize, preferred));
  }

  function readSettings() {
    const values = {
      minimumSize: parseNumber($minimumSize.val()),
      maximumSize: parseNumber($maximumSize.val()),
      minimumViewport: parseNumber($minimumViewport.val()),
      maximumViewport: parseNumber($maximumViewport.val()),
      rootSize: parseNumber($rootSize.val())
    };

    const fields = [
      { key: "minimumSize", label: "Minimum size" },
      { key: "maximumSize", label: "Maximum size" },
      { key: "minimumViewport", label: "Minimum viewport width" },
      { key: "maximumViewport", label: "Maximum viewport width" },
      { key: "rootSize", label: "Root font size" }
    ];
    for (let index = 0; index < fields.length; index += 1) {
      const field = fields[index];
      if (values[field.key] === null) {
        return { error: field.label + " must be a valid number." };
      }
    }
    if (values.minimumSize < 0 || values.maximumSize < 0) {
      return { error: "Size values must be 0 or greater." };
    }
    if (values.minimumSize > values.maximumSize) {
      return { error: "Minimum size must be less than or equal to maximum size." };
    }
    if (values.minimumViewport <= 0 || values.maximumViewport <= 0) {
      return { error: "Viewport widths must be greater than 0." };
    }
    if (values.minimumViewport >= values.maximumViewport) {
      return { error: "Minimum viewport width must be less than maximum viewport width." };
    }
    if (values.rootSize <= 0) {
      return { error: "Root font size must be greater than 0." };
    }
    return { settings: values };
  }

  function buildCss(property, calculation) {
    return property + ": clamp(\n" +
      "  " + calculation.minimumRem + "rem,\n" +
      "  " + calculation.middle + ",\n" +
      "  " + calculation.maximumRem + "rem\n" +
      ");";
  }

  function highlightCode(css) {
    const tokenPattern = /([a-z-]+)(?=\s*:|\()|(-?(?:\d*\.?\d+)(?:rem|vw|px))|([+-])/g;
    let lastIndex = 0;
    let match;
    $code.empty();

    while ((match = tokenPattern.exec(css)) !== null) {
      if (match.index > lastIndex) {
        $code.append(document.createTextNode(css.slice(lastIndex, match.index)));
      }
      const token = match[0];
      const tokenClass = match[1]
        ? (token === "clamp" || token === "calc" ? "code-token--function" : "code-token--property")
        : match[2]
          ? "code-token--number"
          : "code-token--operator";
      $("<span>").addClass("code-token " + tokenClass).text(token).appendTo($code);
      lastIndex = tokenPattern.lastIndex;
    }
    if (lastIndex < css.length) {
      $code.append(document.createTextNode(css.slice(lastIndex)));
    }
  }

  function updateSliderBounds(settings) {
    const sliderMinimum = Math.ceil(settings.minimumViewport);
    const sliderMaximum = Math.floor(settings.maximumViewport);
    if (sliderMinimum > sliderMaximum) {
      return null;
    }
    const previousValue = parseNumber(String($slider.val()));
    const sliderValue = Math.min(sliderMaximum, Math.max(sliderMinimum, previousValue === null ? sliderMinimum : previousValue));
    $slider.attr("min", sliderMinimum).attr("max", sliderMaximum).val(sliderValue);
    $("#slider-min-label").text(formatNumber(settings.minimumViewport) + "px");
    $("#slider-max-label").text(formatNumber(settings.maximumViewport) + "px");
    return sliderValue;
  }

  function renderChart(calculation, viewportWidth) {
    const left = 66;
    const right = 770;
    const top = 28;
    const bottom = 222;
    const plotWidth = right - left;
    const plotHeight = bottom - top;
    const viewportStart = 0;
    const viewportEnd = Math.max(calculation.maximumViewport * 1.1, calculation.maximumViewport + 1);
    const sizeRange = calculation.maximumSize - calculation.minimumSize;
    const sizePadding = sizeRange === 0 ? Math.max(calculation.maximumSize * 0.15, 1) : sizeRange * 0.18;
    const sizeStart = Math.max(0, calculation.minimumSize - sizePadding);
    const sizeEnd = calculation.maximumSize + sizePadding;
    const sizeSpan = Math.max(sizeEnd - sizeStart, 1);
    const xForViewport = function (value) {
      return left + (value - viewportStart) / (viewportEnd - viewportStart) * plotWidth;
    };
    const yForSize = function (value) {
      return bottom - (value - sizeStart) / sizeSpan * plotHeight;
    };
    const xMin = xForViewport(calculation.minimumViewport);
    const xMax = xForViewport(calculation.maximumViewport);
    const yMin = yForSize(calculation.minimumSize);
    const yMax = yForSize(calculation.maximumSize);
    const currentViewport = Math.min(viewportEnd, Math.max(viewportStart, viewportWidth));
    const currentSize = sizeAtViewport(calculation, currentViewport);
    const markerX = xForViewport(currentViewport);
    const markerY = yForSize(currentSize);
    const gridMarkup = [];
    const axisMarkup = [];
    const tickCount = 4;

    for (let index = 0; index <= tickCount; index += 1) {
      const y = top + index / tickCount * plotHeight;
      const size = sizeEnd - index / tickCount * sizeSpan;
      gridMarkup.push('<line x1="' + left + '" y1="' + y + '" x2="' + right + '" y2="' + y + '"></line>');
      axisMarkup.push('<text x="' + (left - 12) + '" y="' + (y + 4) + '" text-anchor="end">' + formatNumber(size) + '</text>');
    }

    for (let index = 0; index <= tickCount; index += 1) {
      const viewport = viewportStart + index / tickCount * viewportEnd;
      const x = xForViewport(viewport);
      gridMarkup.push('<line class="chart-grid__vertical" x1="' + x + '" y1="' + top + '" x2="' + x + '" y2="' + bottom + '"></line>');
      axisMarkup.push('<text x="' + x + '" y="' + (bottom + 22) + '" text-anchor="middle">' + Math.round(viewport) + '</text>');
    }

    $("#chart-svg-title").text("Responsive " + $property.val() + " scale");
    $("#chart-svg-description").text(
      "The computed size ranges from " + formatNumber(calculation.minimumSize) + " pixels at " +
      formatNumber(calculation.minimumViewport) + " pixels wide to " +
      formatNumber(calculation.maximumSize) + " pixels at " +
      formatNumber(calculation.maximumViewport) + " pixels wide."
    );
    $chart.find(".chart-grid").html(gridMarkup.join(""));
    $chart.find(".chart-regions").html(
      '<rect class="chart-region chart-region--minimum" x="' + left + '" y="' + top + '" width="' + Math.max(0, xMin - left) + '" height="' + plotHeight + '"></rect>' +
      '<rect class="chart-region chart-region--fluid" x="' + xMin + '" y="' + top + '" width="' + Math.max(0, xMax - xMin) + '" height="' + plotHeight + '"></rect>' +
      '<rect class="chart-region chart-region--maximum" x="' + xMax + '" y="' + top + '" width="' + Math.max(0, right - xMax) + '" height="' + plotHeight + '"></rect>'
    );
    $chart.find(".chart-axis").html(
      axisMarkup.join("") +
      '<text class="chart-axis__title" x="418" y="286" text-anchor="middle">Viewport width (px)</text>' +
      '<text class="chart-axis__title" transform="translate(16 125) rotate(-90)" text-anchor="middle">Computed size (px)</text>'
    );
    $chart.find(".chart-line").attr(
      "d",
      "M " + left + " " + yMin + " L " + xMin + " " + yMin +
      " L " + xMax + " " + yMax + " L " + right + " " + yMax
    );
    $chart.find(".chart-marker-line").attr("x1", markerX).attr("x2", markerX);
    $chart.find(".chart-marker").attr("cx", markerX).attr("cy", markerY);
  }

  function updatePreview(calculation, viewportWidth, property) {
    const computedSize = sizeAtViewport(calculation, viewportWidth);
    $("#preview-size").text(formatNumber(computedSize) + "px");
    $("#viewport-width").text(formatNumber(viewportWidth) + "px");
    $previewTarget.attr("class", "preview-demo-target clamp-preview-target--" + property);
    $previewTarget[0].style.cssText = "";

    if (property === "gap") {
      $previewTarget.css("display", "flex");
    }
    if (property === "width" || property === "height") {
      $previewTarget.addClass("clamp-preview-target--box");
    }
    $previewTarget.css(property, computedSize + "px");

    const minimum = Number($slider.attr("min"));
    const maximum = Number($slider.attr("max"));
    const relativeWidth = maximum === minimum ? 100 : 72 + (viewportWidth - minimum) / (maximum - minimum) * 28;
    $previewViewport.css("width", relativeWidth + "%");
    renderChart(calculation, viewportWidth);
  }

  function clearGeneratedState(message) {
    $validation.text(message);
    $code.empty().text("Enter valid settings to generate CSS.");
    $("#preview-size").text("—");
    $("#viewport-width").text("—");
    $previewTarget.attr("class", "preview-demo-target clamp-preview-target--font-size").removeAttr("style");
    $previewViewport.css("width", "100%");
    $chart.find(".chart-grid, .chart-regions, .chart-axis").empty();
    $chart.find(".chart-line").attr("d", "");
    $chart.find(".chart-marker-line").attr("x1", 66).attr("x2", 66);
    $chart.find(".chart-marker").attr("cx", 66).attr("cy", 222);
  }

  function updateGenerator() {
    $copyStatus.text("");
    const result = readSettings();
    if (result.error) {
      clearGeneratedState(result.error);
      return;
    }

    const settings = result.settings;
    const calculation = calculateClamp(settings);
    if (!calculation) {
      clearGeneratedState("These values are outside the supported calculation range.");
      return;
    }

    const sliderValue = updateSliderBounds(settings);
    if (sliderValue === null) {
      clearGeneratedState("The viewport range must include at least one whole pixel for the preview slider.");
      return;
    }

    $validation.text("");
    highlightCode(buildCss($property.val(), calculation));
    updatePreview(calculation, sliderValue, $property.val());
  }

  function resetGenerator() {
    $minimumSize.val(defaults.minimumSize);
    $maximumSize.val(defaults.maximumSize);
    $minimumViewport.val(defaults.minimumViewport);
    $maximumViewport.val(defaults.maximumViewport);
    $rootSize.val(defaults.rootSize);
    $property.val(defaults.property);
    $slider.attr("min", defaults.minimumViewport).attr("max", defaults.maximumViewport);
    $slider.val(defaults.minimumViewport);
    updateGenerator();
  }

  $minimumSize.add($maximumSize).add($minimumViewport).add($maximumViewport).add($rootSize)
    .on("input change", updateGenerator);
  $property.on("change", updateGenerator);
  $slider.on("input change", updateGenerator);
  $("#reset-clamp").on("click", resetGenerator);

  $("#copy-clamp-css").on("click", async function () {
    const css = $code.text().trim();
    if (!css || css === "Enter valid settings to generate CSS.") {
      $copyStatus.text("Enter valid settings before copying CSS.");
      return;
    }
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard access is unavailable in this browser context.");
      }
      await navigator.clipboard.writeText(css);
      $copyStatus.text("CSS copied to clipboard.");
    } catch (error) {
      $copyStatus.text("Could not copy automatically. Select and copy the CSS manually.");
    }
  });

  updateGenerator();
});
