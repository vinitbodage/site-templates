# Site Accessibility Widget

Original, self-hosted accessibility overlay for any page or template. Inspired by common accessibility-widget UX (similar install model to third-party overlays) — **no third-party code is included**.

## Install

Add one script tag before `</head>` or at the end of `<body>`:

```html
<script src="/scripts/accessibility-widget/autoload.js" defer></script>
```

This repo includes it globally in [`head.html`](../../head.html) so all pages that use the shared head get the widget automatically.

### External / other templates

```html
<script src="https://your-domain.com/scripts/accessibility-widget/autoload.js" defer></script>
```

Works on **template1**, **template2**, drafts, and plain HTML pages — no AEM block or template CSS required.

## Theme color vs accessibility

**Site theme color is controlled by the header theme picker** ([`scripts/template/theme.js`](../template/theme.js)). The accessibility widget does **not** change `body[data-theme]` or override the theme.

1. Choose a theme color from the header picker first.
2. Open the accessibility widget to apply WCAG AA options (contrast presets, text size, readability) **on top** of that theme.

With no contrast preset selected, the page keeps your header theme unchanged. **White on theme color** uses the current `--theme-color` as the background and updates when the header theme changes.

## Optional configuration

```html
<script
  src="/scripts/accessibility-widget/autoload.js"
  defer
  data-site-a11y-position="bottom-right"
  data-site-a11y-storage-key="site-a11y"
></script>
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-site-a11y-position` | `bottom-right` | FAB position (`bottom-left` also supported) |
| `data-site-a11y-storage-key` | `site-a11y` | localStorage key for preferences |

## Features

### WCAG 2.1 AA contrast presets

Verified foreground/background pairs (minimum 4.5:1 for normal text):

| Preset | Ratio | Level |
|--------|-------|-------|
| Black on white | 21:1 | AA |
| White on black | 21:1 | AA |
| Dark gray on white | 7:1 | AA |
| Light gray on charcoal | 7.2:1 | AA |
| Yellow on black | 19.6:1 | AA |
| White on theme color | 4.5:1+ | AA |

Meets WCAG 2.1 [Success Criterion 1.4.3 (AA)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) for normal text. Active presets also underline links per [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html).

### Additional tools

- Display modes: invert, grayscale
- **Clear filter** — removes contrast preset and display filters; keeps text size and readability settings
- Text size 100% – 150%
- Readability: increased spacing (1.4.12), bold text, underline links, link highlight
- Read aloud (Web Speech API)
- Reset all accessibility settings (site theme is preserved)

Preferences are stored in `localStorage` and restored on load (sync early apply in `autoload.js` reduces flash).

## Files

| File | Role |
|------|------|
| `autoload.js` | Entry script — early restore, inject CSS, load widget |
| `widget.js` | FAB + panel UI |
| `state.js` | Persistence and `body[data-site-a11y-*]` application |
| `tts.js` | Read-aloud via `speechSynthesis` |
| `widget.css` | Widget chrome + page effect styles |
| `icons.js` | Inline SVG icons |

## Preview

```bash
npm run dev:template1
```

Open a page that includes the shared head (the widget loads automatically).

## Notes

- Read aloud uses the browser **Web Speech API**; it does not replace NVDA, VoiceOver, or JAWS.
- Page filters (invert/grayscale) apply to `main`, `header`, and `footer` only — the widget panel is isolated.
- This is an original implementation using standard browser APIs (CSS, localStorage, speech synthesis).
