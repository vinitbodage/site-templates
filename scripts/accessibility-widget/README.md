# Site Accessibility Widget

Original, self-hosted accessibility overlay for any page or template. Inspired by common accessibility-widget UX (similar install model to third-party overlays) — **no third-party code is included**.

## Install

Add one script tag before `</head>` or at the end of `<body>`:

```html
<script src="/scripts/accessibility-widget/autoload.js" defer></script>
```

This repo includes it globally in [`head.html`](../head.html) so all pages that use the shared head get the widget automatically.

### External / other templates

```html
<script src="https://your-domain.com/scripts/accessibility-widget/autoload.js" defer></script>
```

Works on **template1**, **template2**, drafts, and plain HTML pages — no AEM block or template CSS required.

## Optional configuration

```html
<script
  src="/scripts/accessibility-widget/autoload.js"
  defer
  data-site-a11y-theme-sync="true"
  data-site-a11y-position="bottom-right"
  data-site-a11y-storage-key="site-a11y"
></script>
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-site-a11y-theme-sync` | `true` | Sync theme swatches with `body[data-theme]` / header theme picker |
| `data-site-a11y-position` | `bottom-right` | FAB position (`bottom-left` also supported) |
| `data-site-a11y-storage-key` | `site-a11y` | localStorage key for preferences |

## Features

- Theme / accent color (teal, navy, sage, terracotta)
- Text color presets (default, black, white, yellow)
- Background color presets (default, white, black, cream)
- Contrast modes (default, high, invert, grayscale)
- Text size (100% – 150%)
- Highlight links
- Read aloud (Web Speech API — click content to hear it)
- Reset all settings

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

Open: http://localhost:3000/template1/a11y-widget-draft.html

## Theme picker sync

When the host page uses [`scripts/template/theme.js`](../template/theme.js), choosing a theme in either the header picker or the accessibility widget keeps both in sync via the `themechange` event.

## Notes

- Read aloud uses the browser **Web Speech API**; it does not replace NVDA, VoiceOver, or JAWS.
- Page filters (invert/grayscale) apply to `main`, `header`, and `footer` only — the widget panel is isolated.
- This is an original implementation using standard browser APIs (CSS, localStorage, speech synthesis).
