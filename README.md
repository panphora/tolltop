# tolltop ▸

[![npm](https://img.shields.io/npm/v/tolltop)](https://www.npmjs.com/package/tolltop)

Tiny, dependency-free tooltips with smart edge-aware positioning. One attribute to add a
tooltip, one call to configure them all. No build step, no framework, works in all modern
browsers. About 3 KB gzipped.

**[Live demo →](https://tolltop.panphora.com)**

## Features

- One attribute: add `data-tooltip="..."` to any element.
- One config call: `tolltop({...})` themes and tunes every tooltip on the page at once.
- Smart positioning: shows above by default, flips below when there is no room, shifts
  sideways to stay on screen, and wraps long text instead of overflowing.
- An arrow that always points at the trigger, even after the box shifts to avoid an edge.
- Shows on hover and on keyboard focus; hides on `Esc`, blur, or pointer-out.
- Works on dynamically added elements with zero re-init (events are delegated).
- Container-aware: hides itself when the trigger scrolls out of a scroll or overflow
  container, or leaves the viewport.
- Accessible: `role="tooltip"` and `aria-describedby` are wired up automatically.
- One adaptive file: drop in a single `<script>` and it injects its own CSS, or link the
  CSS yourself to theme it and the script skips its built-in copy.
- Safe to load more than once: a double-initialization guard makes re-including the script
  a no-op.
- No dependencies, no build, ~3 KB gzipped.

## Quick start

Add one script tag, then mark any element. That is the whole setup.

```html
<script src="https://cdn.jsdelivr.net/npm/tolltop/tolltop.js"></script>

<button data-tooltip="Save your work">Save</button>
```

Tooltips appear on hover and on keyboard focus, and hide on `Esc`. The script injects its
own styles, so nothing else is required.

## Install

### CDN, one file (simplest)

The script injects its own CSS:

```html
<script src="https://cdn.jsdelivr.net/npm/tolltop/tolltop.js"></script>
```

### CDN, with the CSS file (themeable)

Link the stylesheet before the script. The script detects it and skips its built-in copy,
so you can edit the CSS directly:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tolltop/tolltop.css">
<script src="https://cdn.jsdelivr.net/npm/tolltop/tolltop.js"></script>
```

Pin a version with `tolltop@3.0.3` in either URL. Also on unpkg:
`https://unpkg.com/tolltop/tolltop.js`.

### npm (bundlers)

```bash
npm install tolltop
```

```js
import 'tolltop';
// optional, only if you want to theme via CSS:
import 'tolltop/tolltop.css';
```

## Usage

Mark any element with `data-tooltip`. The attribute value is the text. This is the only
per-element attribute; everything else is global.

```html
<button data-tooltip="Save your work">Save</button>
<span data-tooltip="Works on inline elements too">hover me</span>
<a href="#" data-tooltip="And on links" tabindex="0">focus me</a>
```

- Shows on hover and on keyboard focus.
- Hides on pointer-out, blur, and the `Esc` key.
- New elements work immediately, with no init call, because events are delegated from the
  document.

## Configuration

Style and behavior are global. Call `tolltop()` once with any subset of options. It merges
into the current config and applies immediately, repositioning a tooltip that is already
open.

```js
tolltop({
  bg: '#18181b',      // any CSS color
  color: '#e4e4e7',   // any CSS color
  radius: 6,          // number = px, or any CSS length string ('10px', '0.5rem')
  fontSize: 12,       // number = px, or any CSS length string
  padding: '6px 9px', // any CSS padding shorthand
  maxWidth: 240,      // px; capped to the viewport so long text wraps
  placement: 'auto',  // 'auto' | 'top' | 'bottom'
  gap: 10,            // px between the trigger and the tooltip
  edge: 24,           // px minimum gap from each viewport side
});
```

| Option       | Type                      | Example           | Default   |
| ------------ | ------------------------- | ----------------- | --------- |
| `bg`         | CSS color                 | `'#1e3a5f'`       | `#18181b` |
| `color`      | CSS color                 | `'#fff'`          | `#e4e4e7` |
| `radius`     | number (px) or CSS length | `10` or `'10px'`  | `6`       |
| `fontSize`   | number (px) or CSS length | `14` or `'.9rem'` | `12`      |
| `padding`    | CSS padding shorthand     | `'8px 12px'`      | `6px 9px` |
| `maxWidth`   | number (px)               | `320`             | `240`     |
| `placement`  | `'auto' \| 'top' \| 'bottom'` | `'top'`       | `'auto'`  |
| `gap`        | number (px)               | `12`              | `10`      |
| `edge`       | number (px)               | `16`              | `24`      |

Call `tolltop()` with no arguments to read back the current config (it returns a copy):

```js
const current = tolltop();
// { bg: null, color: null, radius: null, fontSize: null, padding: null,
//   maxWidth: 240, placement: 'auto', gap: 10, edge: 24 }
// Style options read back as null until you set them; the visible defaults
// (#18181b, etc.) come from the CSS, not the config object.

tolltop({ placement: 'bottom' }); // change just one thing
```

## Positioning

The logic is deliberately simple and predictable:

- Shows **above** the trigger by default.
- **Flips below** when there is not room above. Setting `placement` forces a side, but it
  still flips if the forced side will not fit.
- **Centers horizontally** on the trigger, then **shifts** left or right just enough to stay
  on screen, keeping `edge` px of room on each side. The vertical scrollbar is excluded from
  the math.
- **Wraps** long text: `maxWidth` is capped to the available width (`viewport - 2 × edge`)
  so the box never runs off screen.
- The **arrow** stays centered on the trigger and points toward it, even after the box has
  shifted.
- **Repositions** on scroll (capture phase, so nested scroll containers are tracked) and
  resize.
- **Hides itself** when the trigger is removed from the DOM, scrolled out of the viewport, or
  clipped out of a scroll or overflow container (it tracks the trigger through nested
  scrollers).

## Theming with CSS

If you link `tolltop.css`, you can theme via CSS custom properties instead of, or alongside,
the JS config. The tooltip element has class `.tolltop`:

| Variable         | Default   |
| ---------------- | --------- |
| `--tt-bg`        | `#18181b` |
| `--tt-color`     | `#e4e4e7` |
| `--tt-radius`    | `6px`     |
| `--tt-font-size` | `12px`    |
| `--tt-padding`   | `6px 9px` |
| `--tt-arrow`     | `6px`     |

```css
.tolltop {
  --tt-bg: #1e3a5f;
  --tt-color: #fff;
  --tt-radius: 10px;
}
```

Values you set through `tolltop({...})` are applied as inline styles and win over the
stylesheet. Options you never pass stay on the CSS defaults. The script computes
`--tt-arrow-x` itself to keep the arrow on the trigger; do not set it.

## Accessibility

- The tooltip element has `role="tooltip"`.
- On show, the trigger gets `aria-describedby` pointing at the tooltip (merged with any
  existing value), and it is restored on hide.
- Keyboard focus shows the tooltip, and `Esc` dismisses it.

## How the single file works

`tolltop.js` is self-contained. On first use it checks whether `.tolltop` is already styled:

- If `tolltop.css` is **not** on the page, it injects its built-in copy of the styles.
- If you **did** link `tolltop.css`, it detects that and skips injection, so your stylesheet
  and your edits win.

That is why one `<script>` tag is enough, and why linking the CSS is purely optional and
only for theming.

Under the hood there is a single shared element appended to `<body>` with `position: fixed`,
a maximal `z-index`, and `pointer-events: none`, so it sits above everything and never blocks
clicks or hover on the page.

## Browser support

All modern browsers. No polyfills, no transpilation needed.

## Files

| File          | Purpose                                              |
| ------------- | ---------------------------------------------------- |
| `tolltop.js`  | The whole library. Injects its CSS if none is linked.|
| `tolltop.css` | Optional. Link it only to theme via CSS.             |

## License

MIT
