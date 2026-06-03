# tolltop

Tiny, dependency-free tooltips with smart edge-aware positioning. One attribute to add a
tooltip, one call to configure them all, no build step, and it works in every browser
released since mid-2023 (Chrome/Edge 114+, Firefox 114+, Safari 16.5+).

## Install

```bash
npm install tolltop
```

## Usage

```html
<script src="https://cdn.jsdelivr.net/npm/tolltop/tolltop.js"></script>

<!-- mark any element with the attribute -->
<button data-tooltip="Save your work">Save</button>
```

Tooltips show on hover and on keyboard focus, and hide on `Esc`. The script injects its own
styles, so loading `tolltop.css` is optional. Link it (before the script) only if you want
to edit the CSS directly:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tolltop/tolltop.css">
<script src="https://cdn.jsdelivr.net/npm/tolltop/tolltop.js"></script>
```

## Configuration

Style and behavior are global. Call `tolltop()` once with any subset of options (it merges
into the current config and applies immediately):

```js
tolltop({
  bg: '#18181b',
  color: '#e4e4e7',
  radius: 6,          // number = px, or any CSS length string
  fontSize: 12,       // same
  padding: '6px 9px',
  maxWidth: 240,      // px
  placement: 'auto',  // 'auto' | 'top' | 'bottom'
  gap: 8,             // px between the trigger and the tooltip
  edge: 24,           // px min gap from each viewport side
});
```

| Option       | Example          | Default    |
| ------------ | ---------------- | ---------- |
| `bg`         | `'#1e3a5f'`      | `#18181b`  |
| `color`      | `'#fff'`         | `#e4e4e7`  |
| `radius`     | `10` or `'10px'` | `6`        |
| `fontSize`   | `14` or `'.9rem'`| `12`       |
| `padding`    | `'8px 12px'`     | `6px 9px`  |
| `maxWidth`   | `320`            | `240`      |
| `placement`  | `'top'`          | `'auto'`   |
| `gap`        | `10`             | `8`        |
| `edge`       | `16`             | `24`       |

Calling `tolltop()` with no arguments returns the current config. The only per-element
attribute is `data-tooltip="text"`, which marks an element and supplies its text.

## Positioning

- Shows above the trigger by default.
- Flips below if there isn't room above. Set `placement` to force a side (it still flips if
  the forced side won't fit).
- Centers horizontally on the trigger, then shifts left or right just enough to stay on
  screen, leaving `edge` px of room on each side (the vertical scrollbar is excluded).
- Long text is capped at the available width and wraps instead of running off screen.
- The arrow stays centered on the trigger even after the box shifts, and points toward it.

## License

MIT
