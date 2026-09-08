/**
 * Site accessibility widget — preference storage and page application.
 * Original implementation; template-agnostic (works on any page).
 */

export const STORAGE_KEY = 'site-a11y';

export const THEMES = [
  { id: 'teal', label: 'Coastal Teal', color: '#3d717f' },
  { id: 'navy', label: 'Deep Navy Blue', color: '#16273e' },
  { id: 'sage', label: 'Sage Green', color: '#6b8f71' },
  { id: 'terracotta', label: 'Warm Terracotta', color: '#c46a4a' },
];

export const TEXT_COLORS = [
  { id: 'default', label: 'Default' },
  { id: 'black', label: 'Black', value: '#000000' },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'yellow', label: 'Yellow', value: '#ffff00' },
];

export const BG_COLORS = [
  { id: 'default', label: 'Default' },
  { id: 'white', label: 'White', value: '#ffffff' },
  { id: 'black', label: 'Black', value: '#000000' },
  { id: 'cream', label: 'Cream', value: '#f4f1ea' },
];

export const CONTRAST_MODES = [
  { id: 'default', label: 'Default' },
  { id: 'high', label: 'High contrast' },
  { id: 'invert', label: 'Invert colors' },
  { id: 'grayscale', label: 'Grayscale' },
];

export const FONT_SCALES = [1, 1.1, 1.25, 1.5];

const DEFAULTS = {
  theme: 'default',
  textColor: 'default',
  bgColor: 'default',
  contrast: 'default',
  fontScaleIndex: 0,
  linkHighlight: false,
  readAloud: false,
};

/**
 * @returns {typeof DEFAULTS}
 */
export function getDefaults() {
  return { ...DEFAULTS };
}

/**
 * @param {string} [storageKey]
 * @returns {typeof DEFAULTS}
 */
export function getStored(storageKey = STORAGE_KEY) {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return getDefaults();
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return getDefaults();
  }
}

/**
 * @param {Partial<typeof DEFAULTS>} prefs
 * @param {string} [storageKey]
 */
export function saveStored(prefs, storageKey = STORAGE_KEY) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  } catch {
    // private mode
  }
}

/**
 * Applies accessibility preferences to the document.
 * @param {Partial<typeof DEFAULTS>} prefs
 * @param {{ themeSync?: boolean, storageKey?: string }} [options]
 * @returns {typeof DEFAULTS}
 */
export function applyAccessibility(prefs, options = {}) {
  const { themeSync = true, storageKey = STORAGE_KEY } = options;
  const state = { ...getDefaults(), ...prefs };
  const { body } = document;
  const root = document.documentElement;

  if (!body) return state;

  const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
  root.style.setProperty('--site-a11y-font-scale', String(scale));

  body.dataset.siteA11yText = state.textColor === 'default' ? '' : state.textColor;
  body.dataset.siteA11yBg = state.bgColor === 'default' ? '' : state.bgColor;
  body.dataset.siteA11yContrast = state.contrast === 'default' ? '' : state.contrast;
  body.dataset.siteA11yLinks = state.linkHighlight ? 'true' : '';

  if (themeSync && state.theme && state.theme !== 'default') {
    body.dataset.theme = state.theme;
    try {
      localStorage.setItem('site-theme', state.theme);
    } catch {
      // ignore
    }
    const themeMeta = THEMES.find((t) => t.id === state.theme);
    if (themeMeta) {
      document.dispatchEvent(new CustomEvent('themechange', { detail: themeMeta }));
    }
  } else if (state.theme && state.theme !== 'default') {
    const themeMeta = THEMES.find((t) => t.id === state.theme);
    if (themeMeta) {
      root.style.setProperty('--site-a11y-accent', themeMeta.color);
    }
  } else {
    root.style.removeProperty('--site-a11y-accent');
  }

  saveStored(state, storageKey);
  document.dispatchEvent(new CustomEvent('sitea11ychange', { detail: state }));
  return state;
}

/**
 * Restores default accessibility settings.
 * @param {{ storageKey?: string }} [options]
 * @returns {typeof DEFAULTS}
 */
export function resetAccessibility(options = {}) {
  const { storageKey = STORAGE_KEY } = options;
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // ignore
  }

  const { body } = document;
  const root = document.documentElement;
  if (body) {
    delete body.dataset.siteA11yText;
    delete body.dataset.siteA11yBg;
    delete body.dataset.siteA11yContrast;
    delete body.dataset.siteA11yLinks;
  }
  root.style.removeProperty('--site-a11y-font-scale');
  root.style.removeProperty('--site-a11y-accent');

  const defaults = getDefaults();
  document.dispatchEvent(new CustomEvent('sitea11ychange', { detail: defaults }));
  return defaults;
}

/**
 * Sync apply from localStorage — safe to call before DOM ready (body attrs deferred).
 * @param {string} [storageKey]
 */
export function applyStoredEarly(storageKey = STORAGE_KEY) {
  const state = getStored(storageKey);
  const root = document.documentElement;
  const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
  root.style.setProperty('--site-a11y-font-scale', String(scale));

  const applyBody = () => {
    if (!document.body) return;
    document.body.dataset.siteA11yText = state.textColor === 'default' ? '' : state.textColor;
    document.body.dataset.siteA11yBg = state.bgColor === 'default' ? '' : state.bgColor;
    document.body.dataset.siteA11yContrast = state.contrast === 'default' ? '' : state.contrast;
    document.body.dataset.siteA11yLinks = state.linkHighlight ? 'true' : '';
    if (state.theme && state.theme !== 'default') {
      document.body.dataset.theme = state.theme;
      const themeMeta = THEMES.find((t) => t.id === state.theme);
      if (themeMeta) {
        root.style.setProperty('--site-a11y-accent', themeMeta.color);
      }
    }
  };

  if (document.body) applyBody();
  else document.addEventListener('DOMContentLoaded', applyBody, { once: true });
}
