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
  const themeSync = script?.getAttribute('data-site-a11y-theme-sync') !== 'false';
  const position = script?.getAttribute('data-site-a11y-position') || 'bottom-right';

  const FONT_SCALES = [1, 1.1, 1.25, 1.5];

  /** Sync early restore before paint (no module import). */
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const state = JSON.parse(raw);
      const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
      document.documentElement.style.setProperty('--site-a11y-font-scale', String(scale));

      const applyBody = () => {
        if (!document.body) return;
        if (state.textColor && state.textColor !== 'default') {
          document.body.dataset.siteA11yText = state.textColor;
        }
        if (state.bgColor && state.bgColor !== 'default') {
          document.body.dataset.siteA11yBg = state.bgColor;
        }
        if (state.contrast && state.contrast !== 'default') {
          document.body.dataset.siteA11yContrast = state.contrast;
        }
        if (state.linkHighlight) {
          document.body.dataset.siteA11yLinks = 'true';
        }
        if (state.theme && state.theme !== 'default') {
          document.body.dataset.theme = state.theme;
        }
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
      mod.default({ themeSync, position, storageKey });
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
