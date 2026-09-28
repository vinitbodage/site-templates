/**
 * Site accessibility widget autoload entry.
 * Add to any page: <script src="/scripts/accessibility-widget/autoload.js" defer></script>
 */
(function autoload() {
  if (window.siteA11yWidgetLoaded) return;
  window.siteA11yWidgetLoaded = true;

  const script = document.currentScript;
  const src = script?.src || '';
  const base = src.replace(/\/autoload\.js(\?.*)?$/, '') || '/scripts/accessibility-widget';
  const storageKey = script?.getAttribute('data-site-a11y-storage-key') || 'site-a11y';
  const position = script?.getAttribute('data-site-a11y-position') || 'bottom-right';

  const FONT_SCALES = [1, 1.1, 1.25, 1.5];
  const LEGACY_PRESET_MAP = {
    'light-aaa': 'aa-light',
    'dark-aaa': 'aa-dark',
    'yellow-black': 'aa-yellow',
    'white-navy': 'theme-accent',
    'black-cream': 'aa-light',
    'navy-white': 'aa-gray',
    'gray-aa': 'aa-gray',
    'soft-dark-aa': 'aa-charcoal',
    'green-black': 'aa-yellow',
  };

  /** Sync early restore before paint (no module import). */
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const state = JSON.parse(raw);
      const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
      const root = document.documentElement;
      root.style.setProperty('--site-a11y-font-scale', String(scale));
      if (scale !== 1) {
        root.dataset.siteA11yFontScale = String(scale);
      }

      const applyBody = () => {
        if (!document.body) return;
        const { body } = document;

        if (scale !== 1) {
          body.dataset.siteA11yFontScale = String(scale);
        }

        let { preset } = state;
        if (preset && LEGACY_PRESET_MAP[preset]) preset = LEGACY_PRESET_MAP[preset];
        if (preset && preset !== 'default') {
          body.dataset.siteA11yPreset = preset;
        } else if (state.contrast === 'high') {
          body.dataset.siteA11yPreset = 'aa-yellow';
        }

        if (state.displayMode && state.displayMode !== 'default') {
          body.dataset.siteA11yDisplay = state.displayMode;
        } else if (state.contrast === 'invert') {
          body.dataset.siteA11yDisplay = 'invert';
        } else if (state.contrast === 'grayscale') {
          body.dataset.siteA11yDisplay = 'grayscale';
        }

        if (state.linkHighlight) body.dataset.siteA11yLinks = 'true';
        if (state.readableSpacing) body.dataset.siteA11yReadable = 'true';
        if (state.boldText) body.dataset.siteA11yBold = 'true';
        if (state.underlineLinks) body.dataset.siteA11yUnderlineLinks = 'true';
      };

      if (document.body) applyBody();
      else document.addEventListener('DOMContentLoaded', applyBody, { once: true });
    }
  } catch {
    // ignore parse / storage errors
  }

  if (!document.querySelector('link[data-site-a11y-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${base}/widget.css`;
    link.setAttribute('data-site-a11y-css', 'true');
    document.head.append(link);
  }

  const boot = () => {
    import(`${base}/widget.js`).then((mod) => {
      mod.default({ position, storageKey });
    }).catch((err) => {
      // eslint-disable-next-line no-console
      console.warn('Site accessibility widget failed to load', err);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}());
