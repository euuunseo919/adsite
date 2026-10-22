$(function () {
  const defaults = {
    value: "16",
    inputUnit: "px",
    outputUnit: "rem",
    rootSize: "16",
    emSize: "16"
  };
  const commonPixelValues = [4, 8, 12, 14, 16, 20, 24, 32, 40, 48, 64];
  const $inputValue = $("#input-value");
  const $inputUnit = $("#input-unit");
  const $outputUnit = $("#output-unit");
  const $rootSize = $("#root-size");
  const $emSize = $("#em-size");
  const $result = $("#conversion-result");
  const $message = $("#form-message");
  const units = {
    px: "PX",
    rem: "REM",
    em: "EM"
  };

  function parseFiniteNumber(value) {
    if (typeof value !== "string" || value.trim() === "") {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function formatNumber(value) {
    if (!Number.isFinite(value)) {
      return null;
    }
    return String(Number(value.toFixed(4)));
  }

  function convertValue(value, fromUnit, toUnit, rootSize, emSize) {
    const pixelValue = fromUnit === "px"
      ? value
      : fromUnit === "rem"
        ? value * rootSize
        : value * emSize;

    if (!Number.isFinite(pixelValue)) {
      return null;
    }

    const convertedValue = toUnit === "px"
      ? pixelValue
      : toUnit === "rem"
        ? pixelValue / rootSize
        : pixelValue / emSize;

    return formatNumber(convertedValue);
  }

  function getValidBaseSize($field, label) {
    const value = parseFiniteNumber($field.val());
    if (value === null || value <= 0) {
      return { error: label + " must be a number greater than 0." };
    }
    return { value: value };
  }

  function renderConversionTable(rootSize) {
    const rows = [];
    for (let index = 0; index < commonPixelValues.length; index += 2) {
      const left = commonPixelValues[index];
      const right = commonPixelValues[index + 1];
      const leftRem = formatNumber(left / rootSize);
      const rightRem = right === undefined ? null : formatNumber(right / rootSize);
      rows.push(
        "<tr>" +
          "<td>" + left + "px</td>" +
          "<td>" + leftRem + "rem</td>" +
          (right === undefined ? "<td></td><td></td>" : "<td>" + right + "px</td><td>" + rightRem + "rem</td>") +
        "</tr>"
      );
    }
    $("#conversion-table-body").html(rows.join(""));
    $("#table-root-size").text(formatNumber(rootSize));
    $("#table-rem-value").text(formatNumber(rootSize) + "px");
  }

  function updateConversion() {
    $message.removeClass("is-success").text("");
    const value = parseFiniteNumber($inputValue.val());
    const root = getValidBaseSize($rootSize, "Root font size");
    const em = getValidBaseSize($emSize, "EM base size");

    if (root.value !== undefined) {
      renderConversionTable(root.value);
    } else {
      $("#table-root-size").text("—");
      $("#table-rem-value").text("—");
      $("#conversion-table-body").empty();
    }

    if (value === null) {
      $result.text("—");
      $message.text("Enter a valid number to convert.");
      return;
    }
    if (root.error) {
      $result.text("—");
      $message.text(root.error);
      return;
    }
    if (em.error) {
      $result.text("—");
      $message.text(em.error);
      return;
    }

    const fromUnit = $inputUnit.val();
    const toUnit = $outputUnit.val();
    const convertedValue = convertValue(value, fromUnit, toUnit, root.value, em.value);
    if (convertedValue === null) {
      $result.text("—");
      $message.text("The result is outside the supported numeric range.");
      return;
    }
    $result.empty().append(document.createTextNode(convertedValue + " "));
    $("<span>").text(units[toUnit].toLowerCase()).appendTo($result);
  }

  function setDefaults() {
    $inputValue.val(defaults.value);
    $inputUnit.val(defaults.inputUnit);
    $outputUnit.val(defaults.outputUnit);
    $rootSize.val(defaults.rootSize);
    $emSize.val(defaults.emSize);
    updateConversion();
  }

  $inputValue.add($inputUnit).add($outputUnit).add($rootSize).add($emSize)
    .on("input change", updateConversion);

  $("#swap-units").on("click", function () {
    const previousResult = $result.text().trim().split(/\s+/)[0];
    if (previousResult !== "—" && parseFiniteNumber(previousResult) !== null) {
      $inputValue.val(previousResult);
    }
    const previousInputUnit = $inputUnit.val();
    $inputUnit.val($outputUnit.val());
    $outputUnit.val(previousInputUnit);
    updateConversion();
    $inputValue.trigger("focus");
  });

  $("#reset-converter").on("click", setDefaults);

  $("#copy-result").on("click", async function () {
    const resultValue = $result.text().trim();
    if (resultValue === "—" || $message.text()) {
      $message.removeClass("is-success").text("Enter valid values before copying a result.");
      return;
    }

    try {
      if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
        throw new Error("Clipboard access is unavailable in this browser context.");
      }
      await navigator.clipboard.writeText(resultValue);
      $message.addClass("is-success").text("Copied " + resultValue + " to clipboard.");
    } catch (error) {
      $message.removeClass("is-success").text("Could not copy automatically. Select and copy the result manually.");
    }
  });

  updateConversion();
});
