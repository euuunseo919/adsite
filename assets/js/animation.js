(function ($) {
  "use strict";

  $(function () {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sessionSuffix = Math.random().toString(36).slice(2, 7);
    const limits = {
      opacity: [0, 1],
      translateX: [-300, 300],
      translateY: [-300, 300],
      scale: [0, 3],
      rotate: [-360, 360],
      borderRadius: [0, 50]
    };
    const animationTypes = [
      ["fade-in", "Fade In"], ["fade-out", "Fade Out"], ["slide-in", "Slide In"], ["slide-out", "Slide Out"],
      ["scale-in", "Scale In"], ["scale-out", "Scale Out"], ["rotate", "Rotate"], ["bounce", "Bounce"],
      ["pulse", "Pulse"], ["shake", "Shake"], ["swing", "Swing"], ["flip", "Flip"],
      ["zoom-in", "Zoom In"], ["zoom-out", "Zoom Out"], ["custom", "Custom Animation"]
    ];
    const presets = [
      { id: "fade-in", name: "Fade In", category: "entrance", type: "fade-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, translateY: 12, scale: 0.98 }], [100, { opacity: 1, translateY: 0, scale: 1 }]] },
      { id: "fade-out", name: "Fade Out", category: "exit", type: "fade-out", duration: 0.6, easing: "ease-in", frames: [[0, { opacity: 1 }], [100, { opacity: 0, translateY: -8 }]] },
      { id: "slide-left", name: "Slide Left", category: "entrance", type: "slide-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, translateX: 100 }], [100, { opacity: 1, translateX: 0 }]] },
      { id: "slide-right", name: "Slide Right", category: "entrance", type: "slide-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, translateX: -100 }], [100, { opacity: 1, translateX: 0 }]] },
      { id: "slide-up", name: "Slide Up", category: "entrance", type: "slide-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, translateY: 100 }], [100, { opacity: 1, translateY: 0 }]] },
      { id: "slide-down", name: "Slide Down", category: "entrance", type: "slide-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, translateY: -100 }], [100, { opacity: 1, translateY: 0 }]] },
      { id: "scale-in", name: "Scale In", category: "entrance", type: "scale-in", duration: 0.65, easing: "ease-out", frames: [[0, { opacity: 0, scale: 0.5 }], [100, { opacity: 1, scale: 1 }]] },
      { id: "scale-out", name: "Scale Out", category: "exit", type: "scale-out", duration: 0.6, easing: "ease-in", frames: [[0, { opacity: 1, scale: 1 }], [100, { opacity: 0, scale: 0.55 }]] },
      { id: "rotate-in", name: "Rotate In", category: "transform", type: "rotate", duration: 0.9, easing: "ease-out", frames: [[0, { opacity: 0, rotate: -160, scale: 0.7 }], [100, { opacity: 1, rotate: 0, scale: 1 }]] },
      { id: "bounce", name: "Bounce", category: "attention", type: "bounce", duration: 1.1, easing: "ease-in-out", frames: [[0, { translateY: 0 }], [28, { translateY: -44 }], [50, { translateY: 0 }], [72, { translateY: -20 }], [88, { translateY: 0 }], [100, { translateY: 0 }]] },
      { id: "pulse", name: "Pulse", category: "attention", type: "pulse", duration: 1.3, easing: "ease-in-out", frames: [[0, { scale: 1 }], [50, { scale: 1.12 }], [100, { scale: 1 }]] },
      { id: "shake", name: "Shake", category: "attention", type: "shake", duration: 0.7, easing: "ease-in-out", frames: [[0, { translateX: 0 }], [20, { translateX: -12, rotate: -4 }], [40, { translateX: 10, rotate: 3 }], [60, { translateX: -8, rotate: -2 }], [80, { translateX: 6, rotate: 1 }], [100, { translateX: 0, rotate: 0 }]] },
      { id: "swing", name: "Swing", category: "attention", type: "swing", duration: 1.2, easing: "ease-in-out", frames: [[0, { rotate: 0 }], [20, { rotate: 14 }], [40, { rotate: -10 }], [60, { rotate: 6 }], [80, { rotate: -4 }], [100, { rotate: 0 }]] },
      { id: "flip", name: "Flip", category: "transform", type: "flip", duration: 0.8, easing: "ease-in-out", frames: [[0, { opacity: 0, rotate: -180, scale: 0.7 }], [50, { opacity: 1, rotate: -90, scale: 0.85 }], [100, { opacity: 1, rotate: 0, scale: 1 }]] },
      { id: "zoom-in", name: "Zoom In", category: "entrance", type: "zoom-in", duration: 0.7, easing: "ease-out", frames: [[0, { opacity: 0, scale: 0.2 }], [100, { opacity: 1, scale: 1 }]] },
      { id: "zoom-out", name: "Zoom Out", category: "exit", type: "zoom-out", duration: 0.7, easing: "ease-in", frames: [[0, { opacity: 1, scale: 1 }], [100, { opacity: 0, scale: 0.2 }]] }
    ];
    const initialPreset = presets[0];
    let nextKeyframeId = 3;
    let activeAnimation = null;
    let previewFrame = null;
    let keyframeDragId = null;
    let copyTimer = null;
    let selectedCategory = "all";

    function makeAnimationName(type) {
      const slug = type.replace(/[^a-z0-9-]/gi, "").replace(/-([a-z])/g, function (_, letter) { return letter.toUpperCase(); });
      return "unitwise" + slug.charAt(0).toUpperCase() + slug.slice(1) + sessionSuffix;
    }

    function makeKeyframe(offset, values, id) {
      return {
        id: id || nextKeyframeId++,
        offset: offset,
        opacity: values.opacity === undefined ? 1 : values.opacity,
        translateX: values.translateX || 0,
        translateY: values.translateY || 0,
        scale: values.scale === undefined ? 1 : values.scale,
        rotate: values.rotate || 0,
        borderRadius: values.borderRadius === undefined ? 16 : values.borderRadius,
        borderRadiusCustom: values.borderRadiusCustom === undefined ? Object.prototype.hasOwnProperty.call(values, "borderRadius") : values.borderRadiusCustom,
        backgroundColor: values.backgroundColor || "#2563eb",
        backgroundColorCustom: values.backgroundColorCustom === undefined ? Object.prototype.hasOwnProperty.call(values, "backgroundColor") : values.backgroundColorCustom
      };
    }

    const animationState = {
      name: makeAnimationName("fade-in"),
      animationType: "fade-in",
      settings: {
        duration: 1,
        delay: 0,
        timingFunction: "ease",
        bezier: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
        stepCount: 4,
        stepPosition: "jump-end",
        iterationCount: "infinite",
        customIterationCount: 1,
        direction: "normal",
        fillMode: "both"
      },
      keyframes: [
        makeKeyframe(0, { opacity: 0 }, 1),
        makeKeyframe(100, { opacity: 1 }, 2)
      ],
      preview: {
        shape: "rounded",
        color: "#2563eb",
        background: "light",
        speed: 1,
        playing: !motionPreference.matches
      },
      selectedKeyframeId: 1,
      modified: false
    };
    let currentCategoryQuery = "";

    function clone(value) {
      return JSON.parse(JSON.stringify(value));
    }

    function clamp(value, minimum, maximum) {
      return Math.min(maximum, Math.max(minimum, value));
    }

    function formatNumber(value, places) {
      return String(Number(Number(value).toFixed(places === undefined ? 3 : places)));
    }

    function timingFunction() {
      const settings = animationState.settings;
      if (settings.timingFunction === "cubic-bezier") {
        return "cubic-bezier(" + [settings.bezier.x1, settings.bezier.y1, settings.bezier.x2, settings.bezier.y2].map(function (value) { return formatNumber(value, 3); }).join(", ") + ")";
      }
      if (settings.timingFunction === "steps") {
        return "steps(" + settings.stepCount + ", " + settings.stepPosition + ")";
      }
      return settings.timingFunction;
    }

    function normalizeKeyframes(frames) {
      return frames.map(function (frame) {
        const normalized = makeKeyframe(Number(frame.offset), frame, frame.id);
        Object.keys(limits).forEach(function (key) {
          normalized[key] = clamp(Number(normalized[key]), limits[key][0], limits[key][1]);
        });
        normalized.offset = Number(clamp(Number(normalized.offset), 0, 100).toFixed(2));
        if (!/^#[0-9a-f]{6}$/i.test(normalized.backgroundColor)) normalized.backgroundColor = "#2563eb";
        return normalized;
      }).sort(function (a, b) { return a.offset - b.offset; });
    }

    function validateAnimationState() {
      const settings = animationState.settings;
      if (!Number.isFinite(settings.duration) || settings.duration < 0.1 || settings.duration > 10) return "Duration must be between 0.1 and 10 seconds.";
      if (!Number.isFinite(settings.delay) || settings.delay < 0 || settings.delay > 5) return "Delay must be between 0 and 5 seconds.";
      if (settings.timingFunction === "cubic-bezier" &&
          (settings.bezier.x1 < 0 || settings.bezier.x1 > 1 || settings.bezier.x2 < 0 || settings.bezier.x2 > 1 ||
           settings.bezier.y1 < -5 || settings.bezier.y1 > 5 || settings.bezier.y2 < -5 || settings.bezier.y2 > 5)) {
        return "Bezier x values must be 0–1 and y values must be -5–5.";
      }
      if (settings.timingFunction === "steps" && (!Number.isInteger(settings.stepCount) || settings.stepCount < 1 || settings.stepCount > 100)) return "Step count must be a whole number from 1 to 100.";
      if (settings.timingFunction === "steps" && settings.stepPosition === "jump-none" && settings.stepCount < 2) return "jump-none requires at least 2 steps.";
      if (settings.iterationCount !== "infinite" && (!Number.isFinite(Number(settings.iterationCount)) || Number(settings.iterationCount) < 0)) return "Iteration count must be infinite or a number of 0 or greater.";
      const frames = normalizeKeyframes(animationState.keyframes);
      if (frames.length < 2 || frames.length > 12 || frames[0].offset !== 0 || frames[frames.length - 1].offset !== 100) return "Keep start and end keyframes at 0% and 100%, with 2–12 total frames.";
      for (let index = 1; index < frames.length; index += 1) {
        if (frames[index].offset <= frames[index - 1].offset) return "Keyframe positions must be unique and in ascending order.";
      }
      return "";
    }

    function animationIterationCount() {
      return animationState.settings.iterationCount === "infinite" ? Infinity : Number(animationState.settings.iterationCount);
    }

    function buildAnimationOptions() {
      const settings = animationState.settings;
      return {
        duration: settings.duration * 1000,
        delay: settings.delay * 1000,
        iterations: animationIterationCount(),
        direction: settings.direction,
        fill: settings.fillMode,
        easing: timingFunction()
      };
    }

    function transformValue(frame) {
      return "translate(" + formatNumber(frame.translateX) + "px, " + formatNumber(frame.translateY) + "px) rotate(" +
        formatNumber(frame.rotate) + "deg) scale(" + formatNumber(frame.scale) + ")";
    }

    function buildKeyframesCSS() {
      const frames = normalizeKeyframes(animationState.keyframes);
      const body = frames.map(function (frame) {
        let declarations = "  " + formatNumber(frame.offset, 2) + "% {\n" +
          "    opacity: " + formatNumber(frame.opacity) + ";\n" +
          "    transform: " + transformValue(frame) + ";\n";
        if (frame.borderRadiusCustom) declarations += "    border-radius: " + formatNumber(frame.borderRadius) + "%;\n";
        if (frame.backgroundColorCustom) declarations += "    background-color: " + frame.backgroundColor.toLowerCase() + ";\n";
        return declarations + "  }";
      }).join("\n\n");
      return "@keyframes " + animationState.name + " {\n" + body + "\n}";
    }

    function getIterationCss() {
      return animationState.settings.iterationCount === "infinite" ? "infinite" : formatNumber(Number(animationState.settings.iterationCount));
    }

    function getAnimationDeclarations() {
      const settings = animationState.settings;
      return [
        "animation-name: " + animationState.name + ";",
        "animation-duration: " + formatNumber(settings.duration) + "s;",
        "animation-timing-function: " + timingFunction() + ";",
        "animation-delay: " + formatNumber(settings.delay) + "s;",
        "animation-iteration-count: " + getIterationCss() + ";",
        "animation-direction: " + settings.direction + ";",
        "animation-fill-mode: " + settings.fillMode + ";",
        "animation-play-state: " + (animationState.preview.playing ? "running" : "paused") + ";"
      ];
    }

    function buildAnimationCSS() {
      const declarations = getAnimationDeclarations().map(function (declaration) { return "  " + declaration; }).join("\n");
      return ".animated-element {\n" + declarations + "\n}\n\n" + buildKeyframesCSS() +
        "\n\n@media (prefers-reduced-motion: reduce) {\n  .animated-element {\n    animation-duration: 0.01ms;\n    animation-iteration-count: 1;\n    animation-delay: 0s;\n  }\n}";
    }

    function buildAnimationShorthand() {
      const settings = animationState.settings;
      return "animation: " + animationState.name + " " + formatNumber(settings.duration) + "s " + timingFunction() + " " +
        formatNumber(settings.delay) + "s " + getIterationCss() + " " + settings.direction + " " + settings.fillMode + " " +
        (animationState.preview.playing ? "running" : "paused") + ";";
    }

    function getPreviewProgress(currentTime) {
      const settings = animationState.settings;
      const duration = settings.duration * 1000;
      const delay = settings.delay * 1000;
      const iterationCount = animationIterationCount();
      if (!Number.isFinite(currentTime) || duration <= 0) return { progress: 0, cycle: 1, before: true, ended: false };
      if (currentTime < delay) {
        const backwards = settings.fillMode === "backwards" || settings.fillMode === "both";
        const reverseStart = settings.direction === "reverse" || settings.direction === "alternate-reverse";
        return { progress: backwards && reverseStart ? 100 : 0, cycle: 1, before: true, ended: false };
      }
      const activeTime = currentTime - delay;
      const total = iterationCount === Infinity ? Infinity : duration * iterationCount;
      const ended = total !== Infinity && activeTime >= total;
      let cycle = ended ? Math.max(1, Math.ceil(iterationCount)) : Math.floor(activeTime / duration) + 1;
      let fraction = ended ? 1 : (activeTime % duration) / duration;
      if (settings.direction === "reverse" ||
          (settings.direction === "alternate" && cycle % 2 === 0) ||
          (settings.direction === "alternate-reverse" && cycle % 2 === 1)) {
        fraction = 1 - fraction;
      }
      return { progress: clamp(fraction * 100, 0, 100), cycle: cycle, before: false, ended: ended };
    }

    function playbackFractionForProgress(progress) {
      const direction = animationState.settings.direction;
      if (direction === "reverse" || direction === "alternate-reverse") return 1 - progress;
      return progress;
    }

    function cssEscape(value) {
      return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function highlightedCss(source) {
      return source.split("\n").map(function (line) {
        const escaped = cssEscape(line);
        if (/^\s*\/\*/.test(line)) return '<span class="animation-code-comment">' + escaped + "</span>";
        if (/^\s*(@keyframes|@media)/.test(line)) {
          const match = line.match(/^(\s*)(@[\w-]+)(.*)$/);
          return cssEscape(match[1]) + '<span class="animation-code-at">' + match[2] + "</span>" + cssEscape(match[3]);
        }
        if (/^\s*[.#][\w-]+\s*\{/.test(line)) return '<span class="animation-code-selector">' + escaped + "</span>";
        const declaration = line.match(/^(\s*)([\w-]+)(:)(.*)$/);
        if (!declaration) return escaped;
        const value = cssEscape(declaration[4])
          .replace(/\b(cubic-bezier|steps|infinite|ease-in-out|ease-in|ease-out|ease|linear|normal|reverse|alternate-reverse|alternate|forwards|backwards|both|none|running|paused)\b/g, '<span class="animation-code-value">$1</span>')
          .replace(/(#(?:[0-9a-f]{3,8})\b)/gi, '<span class="animation-code-color">$1</span>')
          .replace(/(-?\d+(?:\.\d+)?(?:ms|s|px|deg|%)?)/g, '<span class="animation-code-number">$1</span>');
        return cssEscape(declaration[1]) + '<span class="animation-code-property">' + declaration[2] + "</span>" + declaration[3] + value;
      }).join("\n");
    }

    function selectedKeyframe() {
      return animationState.keyframes.find(function (frame) { return frame.id === animationState.selectedKeyframeId; }) || animationState.keyframes[0];
    }

    function interpolateColor(first, second, amount) {
      const parse = function (color) { return color.match(/[a-f\d]{2}/gi).map(function (part) { return parseInt(part, 16); }); };
      const a = parse(first);
      const b = parse(second);
      return "#" + a.map(function (channel, index) {
        return Math.round(channel + (b[index] - channel) * amount).toString(16).padStart(2, "0");
      }).join("");
    }

    function interpolateFrame(first, second, offset, id) {
      const fraction = (offset - first.offset) / (second.offset - first.offset);
      const values = {};
      Object.keys(limits).forEach(function (key) {
        values[key] = Number(first[key]) + (Number(second[key]) - Number(first[key])) * fraction;
      });
      values.backgroundColor = interpolateColor(first.backgroundColor, second.backgroundColor, fraction);
      values.borderRadiusCustom = first.borderRadiusCustom || second.borderRadiusCustom;
      values.backgroundColorCustom = first.backgroundColorCustom || second.backgroundColorCustom;
      return makeKeyframe(offset, values, id);
    }

    function addKeyframe() {
      if (animationState.keyframes.length >= 12) {
        $("#keyframe-validation").text("A maximum of 12 keyframes is supported.");
        return;
      }
      const frames = normalizeKeyframes(animationState.keyframes);
      let gapStart = frames[0];
      let gapEnd = frames[1];
      let largestGap = gapEnd.offset - gapStart.offset;
      for (let index = 1; index < frames.length - 1; index += 1) {
        const gap = frames[index + 1].offset - frames[index].offset;
        if (gap > largestGap) {
          largestGap = gap;
          gapStart = frames[index];
          gapEnd = frames[index + 1];
        }
      }
      if (largestGap < 2) {
        $("#keyframe-validation").text("There is no room for another unique keyframe position.");
        return;
      }
      const offset = Math.round((gapStart.offset + gapEnd.offset) / 2);
      const frame = interpolateFrame(gapStart, gapEnd, offset, nextKeyframeId++);
      animationState.keyframes.push(frame);
      animationState.selectedKeyframeId = frame.id;
      $("#keyframe-validation").text("");
      markModified();
      renderAll();
      $("#selected-keyframe-offset").trigger("focus").trigger("select");
    }

    function selectKeyframe(id) {
      if (!animationState.keyframes.some(function (frame) { return frame.id === id; })) return;
      animationState.selectedKeyframeId = id;
      renderKeyframeEditor();
      renderTimeline();
    }

    function constrainOffset(frame, desired) {
      const sorted = normalizeKeyframes(animationState.keyframes);
      const index = sorted.findIndex(function (item) { return item.id === frame.id; });
      if (index <= 0 || index >= sorted.length - 1) return frame.offset;
      return clamp(Number(desired), sorted[index - 1].offset + 1, sorted[index + 1].offset - 1);
    }

    function updateKeyframeOffset(id, value) {
      const frame = animationState.keyframes.find(function (item) { return item.id === id; });
      if (!frame) return;
      const number = Number(value);
      if (!Number.isFinite(number) || number < 0 || number > 100) {
        $("#keyframe-validation").text("Keyframe position must be from 0 to 100 percent.");
        return;
      }
      if (frame.offset === 0 || frame.offset === 100) {
        $("#keyframe-validation").text("The first and last keyframes stay at 0% and 100%.");
        renderKeyframeEditor();
        return;
      }
      const sorted = normalizeKeyframes(animationState.keyframes);
      const index = sorted.findIndex(function (item) { return item.id === id; });
      if (number <= sorted[index - 1].offset || number >= sorted[index + 1].offset) {
        $("#keyframe-validation").text("Keyframe positions cannot overlap another keyframe.");
        renderKeyframeEditor();
        return;
      }
      frame.offset = Number(number.toFixed(2));
      $("#keyframe-validation").text("");
      markModified();
      renderAll();
    }

    function removeSelectedKeyframe() {
      if (animationState.keyframes.length <= 2) return;
      const frame = selectedKeyframe();
      if (!frame || frame.offset === 0 || frame.offset === 100) {
        $("#keyframe-validation").text("The 0% and 100% keyframes cannot be removed.");
        return;
      }
      animationState.keyframes = animationState.keyframes.filter(function (item) { return item.id !== frame.id; });
      animationState.selectedKeyframeId = animationState.keyframes.reduce(function (nearest, item) {
        return Math.abs(item.offset - frame.offset) < Math.abs(nearest.offset - frame.offset) ? item : nearest;
      }, animationState.keyframes[0]).id;
      $("#keyframe-validation").text("");
      markModified();
      renderAll();
    }

    function markModified() {
      animationState.modified = true;
      $("#animation-preset-status").text("Modified").prop("hidden", false);
    }

    function createPresetFrames(preset) {
      return preset.frames.map(function (frame) {
        return makeKeyframe(frame[0], frame[1]);
      });
    }

    function applyPreset(preset) {
      animationState.animationType = preset.type;
      animationState.name = makeAnimationName(preset.id);
      animationState.settings.duration = preset.duration;
      animationState.settings.delay = 0;
      animationState.settings.timingFunction = preset.easing;
      animationState.keyframes = createPresetFrames(preset);
      animationState.selectedKeyframeId = animationState.keyframes[0].id;
      animationState.modified = false;
      animationState.preview.playing = !motionPreference.matches;
      $("#animation-preset-status").prop("hidden", true);
      $("#animation-validation, #keyframe-validation").text("");
      renderAll();
    }

    function typePreset(type) {
      if (type === "custom") return null;
      if (type === "slide-in") return presets.find(function (preset) { return preset.type === type; });
      if (type === "slide-out") return { id: type, type: type, duration: 0.65, easing: "ease-in", frames: [[0, { opacity: 1, translateX: 0 }], [100, { opacity: 0, translateX: 100 }]] };
      return presets.find(function (preset) { return preset.type === type; });
    }

    function bindAnimation() {
      const element = document.getElementById("animated-element");
      if (activeAnimation) {
        const oldTime = typeof activeAnimation.currentTime === "number" ? activeAnimation.currentTime : 0;
        activeAnimation.onfinish = null;
        activeAnimation.cancel();
        activeAnimation = null;
        if (previewFrame) cancelAnimationFrame(previewFrame);
        previewFrame = null;
        const keyframes = normalizeKeyframes(animationState.keyframes).map(function (frame) {
          return {
            offset: frame.offset / 100,
            opacity: frame.opacity,
            transform: transformValue(frame),
            ...(frame.borderRadiusCustom ? { borderRadius: frame.borderRadius + "%" } : {}),
            ...(frame.backgroundColorCustom ? { backgroundColor: frame.backgroundColor } : {})
          };
        });
        activeAnimation = element.animate(keyframes, buildAnimationOptions());
        activeAnimation.playbackRate = animationState.preview.speed;
        if (animationState.preview.playing) {
          activeAnimation.currentTime = oldTime;
          activeAnimation.play();
          updatePlaybackButtons();
          runProgressTicker();
        } else {
          activeAnimation.pause();
          activeAnimation.currentTime = oldTime;
          updatePlaybackButtons();
          updateScrubberReadout(oldTime);
        }
        return;
      }
      const keyframes = normalizeKeyframes(animationState.keyframes).map(function (frame) {
        return {
          offset: frame.offset / 100,
          opacity: frame.opacity,
          transform: transformValue(frame),
          ...(frame.borderRadiusCustom ? { borderRadius: frame.borderRadius + "%" } : {}),
          ...(frame.backgroundColorCustom ? { backgroundColor: frame.backgroundColor } : {})
        };
      });
      activeAnimation = element.animate(keyframes, buildAnimationOptions());
      activeAnimation.playbackRate = animationState.preview.speed;
      if (animationState.preview.playing) {
        activeAnimation.play();
        runProgressTicker();
      } else {
        activeAnimation.pause();
        activeAnimation.currentTime = 0;
      }
      updatePlaybackButtons();
    }

    function updatePlaybackButtons() {
      const playing = animationState.preview.playing;
      $("#preview-play").attr("aria-pressed", String(playing)).toggleClass("is-active", playing);
      $("#preview-pause").attr("aria-pressed", String(!playing)).toggleClass("is-active", !playing);
      $("#animation-play-state").val(playing ? "running" : "paused");
      $("#animation-play-status").toggleClass("is-paused", !playing).html('<i aria-hidden="true"></i> ' + (playing ? "Playing" : "Paused"));
      $("#preview-motion-note").prop("hidden", !(motionPreference.matches && !playing));
    }

    function updateScrubberReadout(currentTime) {
      const timing = getPreviewProgress(Number(currentTime));
      const percent = timing.progress;
      const scrubber = $("#animation-scrubber");
      if (document.activeElement !== scrubber[0]) scrubber.val(percent);
      $("#scrubber-progress").text(formatNumber(percent, 1) + "%");
      $("#animation-playhead").css("left", percent + "%");
      const iterationCount = animationIterationCount();
      const cycleDuration = animationState.settings.duration;
      const totalDuration = animationState.settings.delay + cycleDuration * (iterationCount === Infinity ? 1 : iterationCount);
      $("#scrubber-time").text(formatNumber(Math.max(0, Number(currentTime) || 0) / 1000, 2) + "s / " +
        formatNumber(totalDuration, 2) + "s");
      const count = animationState.settings.iterationCount;
      const cycleLabel = count === "infinite" ? "infinite" : String(count);
      $("#animation-cycle-indicator").text("Cycle " + timing.cycle + (count === "infinite" ? " · infinite" : " of " + cycleLabel) + " · " + formatNumber(percent, 1) + "%");
    }

    function runProgressTicker() {
      if (previewFrame) cancelAnimationFrame(previewFrame);
      const tick = function () {
        if (!animationState.preview.playing || !activeAnimation) {
          previewFrame = null;
          return;
        }
        updateScrubberReadout(activeAnimation.currentTime);
        if (activeAnimation.playState === "finished") {
          previewFrame = null;
          $("#animation-play-status").removeClass("is-paused").html('<i aria-hidden="true"></i> Finished');
          return;
        }
        previewFrame = requestAnimationFrame(tick);
      };
      previewFrame = requestAnimationFrame(tick);
    }

    function setPreviewPlaying(playing, restart) {
      animationState.preview.playing = playing;
      if (!activeAnimation) bindAnimation();
      if (restart) activeAnimation.currentTime = 0;
      if (playing) {
        activeAnimation.playbackRate = animationState.preview.speed;
        activeAnimation.play();
        runProgressTicker();
      } else {
        activeAnimation.pause();
        if (previewFrame) cancelAnimationFrame(previewFrame);
        previewFrame = null;
        updateScrubberReadout(activeAnimation.currentTime);
      }
      updatePlaybackButtons();
      renderCode();
    }

    function resetPreview() {
      animationState.preview.shape = "rounded";
      animationState.preview.color = "#2563eb";
      animationState.preview.background = "light";
      animationState.preview.speed = 1;
      animationState.preview.playing = false;
      renderPreviewSettings();
      if (!activeAnimation) bindAnimation();
      activeAnimation.pause();
      activeAnimation.currentTime = 0;
      updatePlaybackButtons();
      updateScrubberReadout(0);
      renderCode();
    }

    function renderTimeline() {
      const frames = normalizeKeyframes(animationState.keyframes);
      const $markers = $("#keyframe-markers").empty();
      frames.forEach(function (frame, index) {
        const endpoint = index === 0 || index === frames.length - 1;
        const $marker = $("<button>", {
          class: "animation-keyframe-marker" + (frame.id === animationState.selectedKeyframeId ? " is-selected" : ""),
          type: "button",
          text: formatNumber(frame.offset, 1) + "%"
        }).attr({
          id: "animation-keyframe-marker-" + frame.id,
          role: "slider",
          "data-keyframe-id": frame.id,
          "aria-label": "Keyframe at " + frame.offset + " percent" + (endpoint ? ", fixed endpoint" : ", drag to move"),
          "aria-pressed": String(frame.id === animationState.selectedKeyframeId),
          "aria-valuenow": frame.offset,
          "aria-valuemin": index === 0 ? 0 : frames[index - 1].offset + 1,
          "aria-valuemax": index === frames.length - 1 ? 100 : frames[index + 1].offset - 1,
          "aria-disabled": String(endpoint),
          "aria-orientation": "horizontal",
          "aria-valuetext": formatNumber(frame.offset, 2) + " percent"
        }).css("left", frame.offset + "%");
        $markers.append($marker);
      });
      $("#keyframe-count").text(frames.length + " / 12 keyframes");
      $("#add-keyframe").prop("disabled", frames.length >= 12);
      const selected = selectedKeyframe();
      $("#selected-keyframe-offset").val(selected.offset).prop("disabled", selected.offset === 0 || selected.offset === 100);
      $("#selected-keyframe-label").text("· " + formatNumber(selected.offset, 1) + "%");
      $("#remove-keyframe").prop("disabled", selected.offset === 0 || selected.offset === 100 || frames.length <= 2);
    }

    function renderKeyframeEditor() {
      const frame = selectedKeyframe();
      const mappings = [
        ["opacity", "#kf-opacity", "#kf-opacity-number", "#kf-opacity-output", ""],
        ["translateX", "#kf-translate-x", "#kf-translate-x-number", "#kf-translate-x-output", "px"],
        ["translateY", "#kf-translate-y", "#kf-translate-y-number", "#kf-translate-y-output", "px"],
        ["scale", "#kf-scale", "#kf-scale-number", "#kf-scale-output", ""],
        ["rotate", "#kf-rotate", "#kf-rotate-number", "#kf-rotate-output", "°"],
        ["borderRadius", "#kf-radius", "#kf-radius-number", "#kf-radius-output", "%"]
      ];
      mappings.forEach(function (mapping) {
        $(mapping[1]).val(frame[mapping[0]]);
        $(mapping[2]).val(frame[mapping[0]]);
        $(mapping[3]).text(formatNumber(frame[mapping[0]]) + mapping[4]);
      });
      $("#kf-background-color").val(frame.backgroundColor);
      $("#selected-keyframe-label").text("· " + formatNumber(frame.offset, 1) + "%");
    }

    function renderPreviewSettings() {
      const preview = animationState.preview;
      const $stage = $("#animation-preview-stage");
      const $element = $("#animated-element");
      $stage.removeClass("animation-preview-stage--light animation-preview-stage--dark animation-preview-stage--checkerboard")
        .addClass("animation-preview-stage--" + preview.background);
      $element.removeClass("animated-element--square animated-element--circle animated-element--rounded animated-element--text")
        .addClass("animated-element--" + preview.shape);
      if (preview.shape === "text") {
        $element.html("<span>Animated Element</span>");
      } else {
        $element.html("<span>Animated<br>Element</span>");
      }
      $element.css("--animation-preview-color", preview.color);
      $("#preview-shape").val(preview.shape);
      $("#preview-color").val(preview.color);
      $("#preview-background").val(preview.background);
      $("#preview-speed").val(String(preview.speed));
      $("#preview-motion-note").prop("hidden", !(motionPreference.matches && !preview.playing));
      if (activeAnimation) activeAnimation.playbackRate = preview.speed;
    }

    function renderSettings() {
      const settings = animationState.settings;
      $("#animation-type").val(animationState.animationType);
      $("#animation-duration, #animation-duration-range").val(settings.duration);
      $("#animation-delay, #animation-delay-range").val(settings.delay);
      $("#animation-duration-output").text(formatNumber(settings.duration) + "s");
      $("#animation-delay-output").text(formatNumber(settings.delay) + "s");
      $("#animation-easing").val(settings.timingFunction);
      $("#cubic-settings").prop("hidden", settings.timingFunction !== "cubic-bezier");
      $("#steps-settings").prop("hidden", settings.timingFunction !== "steps");
      $("#bezier-x1").val(settings.bezier.x1);
      $("#bezier-y1").val(settings.bezier.y1);
      $("#bezier-x2").val(settings.bezier.x2);
      $("#bezier-y2").val(settings.bezier.y2);
      $("#animation-step-count").val(settings.stepCount);
      $("#animation-step-position").val(settings.stepPosition);
      $("#animation-iteration").val(["1", "2", "3", "5", "10", "infinite"].includes(String(settings.iterationCount)) ? String(settings.iterationCount) : "custom");
      $("#custom-iteration-control").prop("hidden", $("#animation-iteration").val() !== "custom");
      $("#animation-custom-iteration").val(settings.customIterationCount);
      $("#animation-direction").val(settings.direction);
      $("#animation-fill").val(settings.fillMode);
      renderPreviewSettings();
      updatePlaybackButtons();
    }

    function renderCode() {
      const fullCss = buildAnimationCSS();
      $("#generated-animation-css").html(highlightedCss(fullCss));
      $("#generated-animation-shorthand").text(buildAnimationShorthand());
    }

    function renderAll(recreateAnimation) {
      const validation = validateAnimationState();
      $("#animation-validation").text(validation);
      if (validation) return;
      animationState.keyframes = normalizeKeyframes(animationState.keyframes);
      renderSettings();
      renderTimeline();
      renderKeyframeEditor();
      renderCode();
      if (recreateAnimation !== false) bindAnimation();
    }

    function setSettingNumber(path, raw, min, max, input) {
      const value = Number(raw);
      if (!Number.isFinite(value) || value < min || value > max) {
        $(input).attr("aria-invalid", "true");
        $("#animation-validation").text("Enter a number between " + min + " and " + max + ".");
        return false;
      }
      $(input).removeAttr("aria-invalid");
      $("#animation-validation").text("");
      const parts = path.split(".");
      animationState.settings[parts[0]][parts[1]] = value;
      markModified();
      renderAll();
      return true;
    }

    function updateKeyframeProperty(property, raw, input) {
      const value = Number(raw);
      const bounds = limits[property];
      if (!Number.isFinite(value) || value < bounds[0] || value > bounds[1]) {
        $(input).attr("aria-invalid", "true");
        $("#keyframe-validation").text(property + " must be between " + bounds[0] + " and " + bounds[1] + ".");
        return;
      }
      $(input).removeAttr("aria-invalid");
      $("#keyframe-validation").text("");
      const frame = selectedKeyframe();
      frame[property] = value;
      if (property === "borderRadius") frame.borderRadiusCustom = true;
      markModified();
      renderAll();
    }

    function addPresetCard(preset) {
      const $button = $("<button>", { type: "button", class: "animation-preset-card" })
        .attr({ "data-preset-id": preset.id, "aria-label": "Apply " + preset.name + " animation preset" });
      const $sample = $("<span>", { class: "animation-preset-sample animation-sample--" + preset.id, "aria-hidden": "true" });
      const $details = $("<span>", { class: "animation-preset-details" })
        .append($("<strong>", { text: preset.name }), $("<small>", { text: preset.category }));
      $button.append($sample, $details);
      $button.on("click", function () { applyPreset(preset); });
      $("#animation-presets").append($button);
    }

    function filterPresets() {
      const query = currentCategoryQuery.trim().toLowerCase();
      let visibleCount = 0;
      $("#animation-presets .animation-preset-card").each(function () {
        const preset = presets.find(function (item) { return item.id === $(this).attr("data-preset-id"); }.bind(this));
        const matchesCategory = selectedCategory === "all" || preset.category === selectedCategory;
        const matchesQuery = !query || (preset.name + " " + preset.category + " " + preset.id).toLowerCase().includes(query);
        const visible = matchesCategory && matchesQuery;
        $(this).prop("hidden", !visible);
        if (visible) visibleCount += 1;
      });
      $("#animation-empty-presets").prop("hidden", visibleCount > 0);
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
        navigator.clipboard.writeText(text).then(function () { announceCopy(true, label); }).catch(fallback);
      } else fallback();
    }

    function announceCopy(success, label) {
      clearTimeout(copyTimer);
      $("#animation-copy-status").text(success ? label + " copied to clipboard." : "Could not copy. Select and copy the code manually.");
      copyTimer = setTimeout(function () { $("#animation-copy-status").text(""); }, 4000);
    }

    function resetSettings() {
      animationState.animationType = "fade-in";
      animationState.name = makeAnimationName("fade-in");
      animationState.settings = {
        duration: 1,
        delay: 0,
        timingFunction: "ease",
        bezier: { x1: 0.25, y1: 0.1, x2: 0.25, y2: 1 },
        stepCount: 4,
        stepPosition: "jump-end",
        iterationCount: "infinite",
        customIterationCount: 1,
        direction: "normal",
        fillMode: "both"
      };
      animationState.keyframes = [
        makeKeyframe(0, { opacity: 0 }),
        makeKeyframe(100, { opacity: 1 })
      ];
      animationState.selectedKeyframeId = animationState.keyframes[0].id;
      animationState.modified = false;
      animationState.preview.playing = !motionPreference.matches;
      $("#animation-preset-status").prop("hidden", true);
      $("#animation-validation, #keyframe-validation").text("");
      renderAll();
    }

    function seekToProgress(progress) {
      const duration = animationState.settings.duration * 1000;
      const delay = animationState.settings.delay * 1000;
      const visualProgress = clamp(progress / 100, 0, 1);
      const playbackFraction = playbackFractionForProgress(visualProgress);
      animationState.preview.playing = false;
      if (!activeAnimation) bindAnimation();
      activeAnimation.pause();
      const cyclePosition = playbackFraction === 1 ? 1 - 0.000001 : playbackFraction;
      activeAnimation.currentTime = delay + cyclePosition * duration;
      updatePlaybackButtons();
      updateScrubberReadout(activeAnimation.currentTime);
      renderCode();
    }

    function setPropertyFromInput(input, range, property, formatter) {
      const update = function (raw, source) {
        const min = Number($(input).attr("min"));
        const max = Number($(input).attr("max"));
        updateKeyframeProperty(property, raw, source);
        if (!$(source).is('[aria-invalid="true"]')) {
          $(input + ", " + range).val(selectedKeyframe()[property]);
          $(formatter).text(formatNumber(selectedKeyframe()[property]) + (property === "translateX" || property === "translateY" ? "px" : property === "rotate" ? "°" : property === "borderRadius" ? "%" : ""));
        }
      };
      $(range).on("input", function () { update(this.value, this); });
      $(input).on("change", function () { update(this.value, this); });
    }

    function renderInitialPresets() {
      presets.forEach(addPresetCard);
      filterPresets();
    }

    $("#animation-type").on("change", function () {
      const type = this.value;
      if (type === "custom") {
        animationState.animationType = type;
        animationState.name = makeAnimationName(type);
        markModified();
        renderAll();
        return;
      }
      const preset = typePreset(type);
      if (preset) applyPreset(preset);
    });

    $("#animation-duration-range").on("input", function () {
      animationState.settings.duration = Number(this.value);
      $("#animation-duration").val(this.value);
      $("#animation-duration-output").text(formatNumber(this.value) + "s");
      markModified();
      renderAll();
    });
    $("#animation-duration").on("change", function () {
      const value = Number(this.value);
      if (!Number.isFinite(value) || value < 0.1 || value > 10) {
        $(this).attr("aria-invalid", "true");
        $("#animation-validation").text("Duration must be between 0.1 and 10 seconds.");
        return;
      }
      $(this).removeAttr("aria-invalid");
      animationState.settings.duration = value;
      markModified();
      renderAll();
    });
    $("#animation-delay-range").on("input", function () {
      animationState.settings.delay = Number(this.value);
      $("#animation-delay").val(this.value);
      $("#animation-delay-output").text(formatNumber(this.value) + "s");
      markModified();
      renderAll();
    });
    $("#animation-delay").on("change", function () {
      const value = Number(this.value);
      if (!Number.isFinite(value) || value < 0 || value > 5) {
        $(this).attr("aria-invalid", "true");
        $("#animation-validation").text("Delay must be between 0 and 5 seconds.");
        return;
      }
      $(this).removeAttr("aria-invalid");
      animationState.settings.delay = value;
      markModified();
      renderAll();
    });
    $("#animation-easing").on("change", function () {
      animationState.settings.timingFunction = this.value;
      markModified();
      renderAll();
    });
    $("#bezier-x1, #bezier-y1, #bezier-x2, #bezier-y2").on("change", function () {
      const key = this.id.replace("bezier-", "");
      const value = Number(this.value);
      const min = key.charAt(0) === "x" ? 0 : -5;
      const max = key.charAt(0) === "x" ? 1 : 5;
      setSettingNumber("bezier." + key, value, min, max, this);
    });
    $("#animation-step-count").on("change", function () {
      const value = Number(this.value);
      if (!Number.isInteger(value) || value < 1 || value > 100) {
        $(this).attr("aria-invalid", "true");
        $("#animation-validation").text("Step count must be a whole number from 1 to 100.");
        return;
      }
      $(this).removeAttr("aria-invalid");
      animationState.settings.stepCount = value;
      markModified();
      renderAll();
    });
    $("#animation-step-position").on("change", function () {
      animationState.settings.stepPosition = this.value;
      markModified();
      renderAll();
    });
    $("#animation-iteration").on("change", function () {
      animationState.settings.iterationCount = this.value === "custom" ? $("#animation-custom-iteration").val() : this.value;
      $("#custom-iteration-control").prop("hidden", this.value !== "custom");
      markModified();
      renderAll();
    });
    $("#animation-custom-iteration").on("change", function () {
      const value = Number(this.value);
      if (!Number.isFinite(value) || value < 0 || value > 10000) {
        $(this).attr("aria-invalid", "true");
        $("#animation-validation").text("Custom iterations must be between 0 and 10000.");
        return;
      }
      $(this).removeAttr("aria-invalid");
      animationState.settings.customIterationCount = value;
      animationState.settings.iterationCount = value;
      markModified();
      renderAll();
    });
    $("#animation-direction").on("change", function () {
      animationState.settings.direction = this.value;
      markModified();
      renderAll();
    });
    $("#animation-fill").on("change", function () {
      animationState.settings.fillMode = this.value;
      markModified();
      renderAll();
    });

    $("#preview-play").on("click", function () { setPreviewPlaying(true, false); });
    $("#preview-pause").on("click", function () { setPreviewPlaying(false, false); });
    $("#preview-restart").on("click", function () { setPreviewPlaying(true, true); });
    $("#preview-reset").on("click", resetPreview);
    $("#animation-play-state").on("change", function () { setPreviewPlaying(this.value === "running", false); });
    $("#preview-speed").on("change", function () {
      animationState.preview.speed = Number(this.value);
      if (activeAnimation) activeAnimation.playbackRate = animationState.preview.speed;
      renderPreviewSettings();
    });
    $("#preview-shape").on("change", function () {
      animationState.preview.shape = this.value;
      renderPreviewSettings();
    });
    $("#preview-color").on("input change", function () {
      animationState.preview.color = this.value;
      renderPreviewSettings();
    });
    $("#preview-background").on("change", function () {
      animationState.preview.background = this.value;
      renderPreviewSettings();
    });

    $("#add-keyframe").on("click", addKeyframe);
    $("#remove-keyframe").on("click", removeSelectedKeyframe);
    $("#keyframe-markers").on("click", ".animation-keyframe-marker", function () {
      selectKeyframe(Number($(this).attr("data-keyframe-id")));
    }).on("pointerdown", ".animation-keyframe-marker", function (event) {
      if (event.button !== undefined && event.button !== 0) return;
      const id = Number($(this).attr("data-keyframe-id"));
      const frame = animationState.keyframes.find(function (item) { return item.id === id; });
      if (!frame || frame.offset === 0 || frame.offset === 100) return;
      event.preventDefault();
      keyframeDragId = id;
      selectKeyframe(id);
      $(window).on("pointermove.animationKeyframeDrag", function (moveEvent) {
        const timeline = $("#animation-timeline")[0].getBoundingClientRect();
        const source = moveEvent.originalEvent || moveEvent;
        const percent = clamp((source.clientX - timeline.left) / timeline.width * 100, 1, 99);
        const target = animationState.keyframes.find(function (item) { return item.id === keyframeDragId; });
        if (!target) return;
        target.offset = Number(constrainOffset(target, percent).toFixed(2));
        $("#keyframe-validation").text("");
        markModified();
        renderTimeline();
        renderKeyframeEditor();
        renderCode();
        bindAnimation();
      }).on("pointerup.animationKeyframeDrag pointercancel.animationKeyframeDrag", function () {
        keyframeDragId = null;
        $(window).off(".animationKeyframeDrag");
      });
    }).on("keydown", ".animation-keyframe-marker", function (event) {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const frame = animationState.keyframes.find(function (item) { return item.id === Number($(this).attr("data-keyframe-id")); }.bind(this));
      if (!frame || frame.offset === 0 || frame.offset === 100) return;
      event.preventDefault();
      const step = event.shiftKey ? 5 : 1;
      frame.offset = Number(constrainOffset(frame, frame.offset + (event.key === "ArrowRight" ? step : -step)).toFixed(2));
      markModified();
      renderAll();
      $("#animation-keyframe-marker-" + frame.id).trigger("focus");
    });

    $("#selected-keyframe-offset").on("change", function () {
      updateKeyframeOffset(animationState.selectedKeyframeId, this.value);
    });
    $("#animation-scrubber").on("input", function () {
      seekToProgress(Number(this.value));
    });
    $("#seek-start").on("click", function () { seekToProgress(0); });
    $("#seek-end").on("click", function () { seekToProgress(100); });

    setPropertyFromInput("#kf-opacity-number", "#kf-opacity", "opacity", "#kf-opacity-output");
    setPropertyFromInput("#kf-translate-x-number", "#kf-translate-x", "translateX", "#kf-translate-x-output");
    setPropertyFromInput("#kf-translate-y-number", "#kf-translate-y", "translateY", "#kf-translate-y-output");
    setPropertyFromInput("#kf-scale-number", "#kf-scale", "scale", "#kf-scale-output");
    setPropertyFromInput("#kf-rotate-number", "#kf-rotate", "rotate", "#kf-rotate-output");
    setPropertyFromInput("#kf-radius-number", "#kf-radius", "borderRadius", "#kf-radius-output");
    $("#kf-background-color").on("input change", function () {
      if (!/^#[0-9a-f]{6}$/i.test(this.value)) return;
      selectedKeyframe().backgroundColor = this.value;
      selectedKeyframe().backgroundColorCustom = true;
      markModified();
      renderAll();
    });

    $("#copy-animation-css").on("click", function () { copyText(buildAnimationCSS(), "CSS"); });
    $("#copy-keyframes-css").on("click", function () { copyText(buildKeyframesCSS(), "@keyframes"); });
    $("#copy-animation-property").on("click", function () { copyText(getAnimationDeclarations().join("\n"), "Animation properties"); });
    $("#copy-animation-shorthand").on("click", function () { copyText(buildAnimationShorthand(), "Animation shorthand"); });
    $("#reset-animation-settings, #reset-animation-code").on("click", resetSettings);

    $(".animation-filter").on("click", function () {
      selectedCategory = $(this).attr("data-category");
      $(".animation-filter").removeClass("is-active").attr("aria-pressed", "false");
      $(this).addClass("is-active").attr("aria-pressed", "true");
      filterPresets();
    });
    $("#search-animation-presets").on("input", function () {
      currentCategoryQuery = this.value;
      filterPresets();
    });

    function handleMotionPreferenceChange(event) {
      if (event.matches && animationState.preview.playing) setPreviewPlaying(false, false);
      $("#preview-motion-note").prop("hidden", !(event.matches && !animationState.preview.playing));
    }
    if (motionPreference.addEventListener) {
      motionPreference.addEventListener("change", handleMotionPreferenceChange);
    } else {
      motionPreference.addListener(handleMotionPreferenceChange);
    }

    renderInitialPresets();
    renderAll();
  });
})(jQuery);
