# Unitwise — CSS Developer Tools

A responsive collection of CSS developer tools built with HTML5, CSS3, JavaScript (ES6+), and jQuery 3.7.1.

## Run locally

Serve the project directory over HTTP (for example, with VS Code Live Server) and open `index.html`, `clamp.html`, `grid.html`, `flexbox.html`, `box-shadow.html`, `gradient.html`, `color-converter.html`, `media-query.html`, `clip-path.html`, or `animation.html`. Component loading uses jQuery `.load()` and therefore does not work when pages are opened directly with `file://`. An internet connection is needed to load jQuery from the official jQuery CDN. Clipboard writing is supported in secure browser contexts such as HTTPS or localhost.

## Project structure

```text
index.html
clamp.html
grid.html
flexbox.html
box-shadow.html
gradient.html
color-converter.html
media-query.html
clip-path.html
animation.html
components/
  header.html              Shared navigation and brand
  footer.html              Shared footer and page links
assets/
  css/
    normalize.css          Normalize.css v8.0.1 browser defaults
    reset.css              Shared box sizing and baseline reset
    commons.css            Design tokens, shared components, header, footer, and FAQ
    style.css              PX ↔ REM / EM converter page
    clamp.css              CSS clamp() generator page
    grid.css               CSS Grid generator page
    flexbox.css            CSS Flexbox generator page
    box-shadow.css         CSS box-shadow generator page
    gradient.css           CSS gradient generator page
    color-converter.css    HEX / RGB / HSL converter page
    media-query.css        CSS media query generator page
    clip-path.css          CSS clip-path editor page
    animation.css          CSS animation editor page
    responsive.css         Shared tablet and mobile layouts
  js/
    common.js              Shared component loading, navigation, FAQ accordion
    converter.js           PX ↔ REM / EM calculation and UI
    clamp.js               Pure clamp calculation and generator UI
    grid.js                Grid state, presets, preview, and generated code
    flexbox.js             Flexbox state, presets, preview, and generated code
    box-shadow.js          Shadow layers, presets, preview, and generated code
    gradient.js            Gradient types, color stops, presets, and generated code
    color-converter.js     HEX / RGB / HSL conversion, shades, preview, and contrast checks
    media-query.js         Media query conditions, responsive preview, and CSS generation
    clip-path.js           Visual shape editor, presets, history, preview, and CSS generation
    animation.js           Animation settings, WAAPI preview, keyframe timeline, presets, and CSS generation
  images/                  Shared image assets
README.md
```

## Shared page components

Each page includes `#header` and `#footer` mount elements. `common.js` loads the matching files from `components/`, applies the active menu from the page's `data-page`, and attaches keyboard-accessible navigation and FAQ behavior after loading. Keep links relative to the project root when adding pages.

## Tools

- **PX ↔ REM / EM Converter** — Real-time conversions use separate configurable root and parent font sizes, validate invalid inputs, round results to four decimal places, and update a quick-reference table. Swap, copy, and reset actions are included.
- **CSS Clamp Generator** — Generates a responsive `clamp()` declaration for seven CSS properties, supports a root font size, validates viewport and size ranges, and provides a simulation slider, live property preview, and SVG scale chart. Copy and reset actions are included.
- **CSS Grid Generator** — Configures tracks, gaps, alignment, and item placement; renders editable grid items; applies six layout presets; and generates copyable CSS and HTML.
- **CSS Flexbox Generator** — Configures flex container and item properties, renders an interactive preview, applies eight layout presets, and generates copyable CSS and HTML.
- **CSS Box Shadow Generator** — Builds and reorders up to eight independent shadow layers, previews inset/outset effects, applies eight presets, and generates copyable shadow CSS.
- **CSS Gradient Generator** — Creates linear, radial, and conic gradients, edits and reorders color stops, applies ten presets, and generates copyable CSS.
- **HEX / RGB / HSL Converter** — Converts alpha-aware color formats, generates HSL shades, previews colors in multiple modes, and checks WCAG contrast.
- **CSS Media Query Generator** — Builds media queries from viewport and environment conditions, simulates viewport sizes and capabilities, and generates editable CSS.
- **CSS Clip-path Generator** — Edits polygon points visually, configures circle/ellipse/inset shapes, applies 16 presets, and generates copyable clip-path CSS with undo/redo.
- **CSS Animation Generator** — Configures animation timing, shape previews, and 2–12 editable keyframes; includes timeline scrubbing, 15 searchable presets, playback controls, and copyable CSS.
- All tools use the shared responsive header, footer, and FAQ accordion.

## Adding another tool page

Reuse the header/footer mounts and styles in `assets/css/commons.css`. Set a `data-page` value on the body, add a page-specific stylesheet after `commons.css` and before `responsive.css`, and load page-specific JavaScript after `common.js`. Add matching navigation links to `components/header.html` and `components/footer.html` only when their destination exists.
