/**
 * Site accessibility widget — preference storage and page application.
 * Site theme color is owned by the header theme picker (theme.js).
 * Accessibility options apply on top without changing body[data-theme].
 */

export const STORAGE_KEY = 'site-a11y';

/** WCAG 2.1 AA contrast presets — minimum 4.5:1 for normal text */
export const WCAG_PRESETS = [
  {
    id: 'aa-light',
    label: 'Black on white',
    level: 'AA',
    ratio: '21:1',
    text: '#000000',
    bg: '#ffffff',
  },
  {
    id: 'aa-dark',
    label: 'White on black',
    level: 'AA',
    ratio: '21:1',
    text: '#ffffff',
    bg: '#000000',
  },
  {
    id: 'aa-gray',
    label: 'Dark gray on white',
    level: 'AA',
    ratio: '7:1',
    text: '#595959',
    bg: '#ffffff',
  },
  {
    id: 'aa-charcoal',
    label: 'Light gray on charcoal',
    level: 'AA',
    ratio: '7.2:1',
    text: '#e8e8e8',
    bg: '#2b2b2b',
  },
  {
    id: 'aa-yellow',
    label: 'Yellow on black',
    level: 'AA',
    ratio: '19.6:1',
    text: '#ffff00',
    bg: '#000000',
  },
  {
    id: 'theme-accent',
    label: 'White on theme color',
    level: 'AA',
    ratio: '4.5:1+',
    text: '#ffffff',
    bg: 'var(--theme-color)',
    usesTheme: true,
  },
];

/** Presets shown in the widget UI (site theme is the implicit default). */
export const WCAG_PRESET_OPTIONS = WCAG_PRESETS;

export const DISPLAY_MODES = [
  { id: 'default', label: 'Normal' },
  { id: 'invert', label: 'Invert colors' },
  { id: 'grayscale', label: 'Grayscale' },
];

export const FONT_SCALES = [1, 1.1, 1.25, 1.5];

const DEFAULTS = {
  preset: 'default',
  displayMode: 'default',
  fontScaleIndex: 0,
  linkHighlight: false,
  readableSpacing: false,
  boldText: false,
  underlineLinks: false,
  readAloud: false,
};

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

/**
 * @param {Record<string, unknown>} parsed
 * @returns {typeof DEFAULTS}
 */
function migrateStored(parsed) {
  const state = { ...DEFAULTS, ...parsed };

  delete state.theme;

  if (state.preset && LEGACY_PRESET_MAP[state.preset]) {
    state.preset = LEGACY_PRESET_MAP[state.preset];
  }

  if (!parsed.preset || parsed.preset === 'default') {
    if (parsed.contrast === 'high') state.preset = 'aa-yellow';
    else if (parsed.textColor === 'white' && parsed.bgColor === 'black') state.preset = 'aa-dark';
    else if (parsed.textColor === 'black' && parsed.bgColor === 'white') state.preset = 'aa-light';
    else if (parsed.textColor === 'yellow') state.preset = 'aa-yellow';

    if (parsed.contrast === 'invert') state.displayMode = 'invert';
    if (parsed.contrast === 'grayscale') state.displayMode = 'grayscale';
  }

  return state;
}

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
    return migrateStored(JSON.parse(raw));
  } catch {
    return getDefaults();
  }
}

/**
 * @param {Partial<typeof DEFAULTS>} prefs
 * @param {string} [storageKey]
 */
export function saveStored(prefs, storageKey = STORAGE_KEY) {
  const clean = { ...prefs };
  delete clean.theme;
  try {
    localStorage.setItem(storageKey, JSON.stringify(clean));
  } catch {
    // private mode
  }
}

/**
 * @param {HTMLElement} root
 * @param {number} scale
 */
function applyFontScale(root, scale) {
  root.style.setProperty('--site-a11y-font-scale', String(scale));
  if (scale !== 1) {
    root.dataset.siteA11yFontScale = String(scale);
  } else {
    delete root.dataset.siteA11yFontScale;
  }
}

/**
 * @param {typeof DEFAULTS} state
 * @param {HTMLElement} body
 */
function applyBodyDatasets(state, body) {
  body.dataset.siteA11yPreset = state.preset && state.preset !== 'default' ? state.preset : '';
  body.dataset.siteA11yDisplay = state.displayMode && state.displayMode !== 'default' ? state.displayMode : '';
  body.dataset.siteA11yLinks = state.linkHighlight ? 'true' : '';
  body.dataset.siteA11yReadable = state.readableSpacing ? 'true' : '';
  body.dataset.siteA11yBold = state.boldText ? 'true' : '';
  body.dataset.siteA11yUnderlineLinks = state.underlineLinks ? 'true' : '';

  const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
  if (scale !== 1) {
    body.dataset.siteA11yFontScale = String(scale);
  } else {
    delete body.dataset.siteA11yFontScale;
  }

  delete body.dataset.siteA11yText;
  delete body.dataset.siteA11yBg;
  delete body.dataset.siteA11yContrast;
}

/**
 * Applies accessibility preferences on top of the active site theme.
 * Does not modify body[data-theme] — that remains the header theme picker's job.
 * @param {Partial<typeof DEFAULTS>} prefs
 * @param {{ storageKey?: string }} [options]
 * @returns {typeof DEFAULTS}
 */
export function applyAccessibility(prefs, options = {}) {
  const { storageKey = STORAGE_KEY } = options;
  const state = { ...getDefaults(), ...prefs };
  const { body } = document;
  const root = document.documentElement;

  if (!body) return state;

  const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
  applyFontScale(root, scale);
  applyBodyDatasets(state, body);

  saveStored(state, storageKey);
  document.dispatchEvent(new CustomEvent('sitea11ychange', { detail: state }));
  return state;
}

/**
 * Clears visual filters (contrast preset + display mode) while keeping other preferences.
 * Site theme from the header is preserved.
 * @param {Partial<typeof DEFAULTS>} currentState
 * @param {{ storageKey?: string }} [options]
 * @returns {typeof DEFAULTS}
 */
export function clearFilters(currentState, options = {}) {
  return applyAccessibility(
    {
      ...getDefaults(),
      ...currentState,
      preset: 'default',
      displayMode: 'default',
    },
    options,
  );
}

/**
 * @param {Partial<typeof DEFAULTS>} state
 * @returns {boolean}
 */
export function hasActiveFilters(state) {
  return (state.preset && state.preset !== 'default')
    || (state.displayMode && state.displayMode !== 'default');
}

/**
 * Resets accessibility settings only — site theme from the header is preserved.
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
    delete body.dataset.siteA11yPreset;
    delete body.dataset.siteA11yDisplay;
    delete body.dataset.siteA11yLinks;
    delete body.dataset.siteA11yReadable;
    delete body.dataset.siteA11yBold;
    delete body.dataset.siteA11yUnderlineLinks;
    delete body.dataset.siteA11yFontScale;
    delete body.dataset.siteA11yText;
    delete body.dataset.siteA11yBg;
    delete body.dataset.siteA11yContrast;
  }
  delete root.dataset.siteA11yFontScale;
  root.style.removeProperty('--site-a11y-font-scale');

  const defaults = getDefaults();
  document.dispatchEvent(new CustomEvent('sitea11ychange', { detail: defaults }));
  return defaults;
}

/**
 * @param {string} [storageKey]
 */
export function applyStoredEarly(storageKey = STORAGE_KEY) {
  const state = getStored(storageKey);
  const root = document.documentElement;
  const scale = FONT_SCALES[state.fontScaleIndex] ?? 1;
  applyFontScale(root, scale);

  const applyBody = () => {
    if (!document.body) return;
    applyBodyDatasets(state, document.body);
  };

  if (document.body) applyBody();
  else document.addEventListener('DOMContentLoaded', applyBody, { once: true });
}
