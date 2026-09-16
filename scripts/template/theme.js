/**
 * Template5 accent color themes.
 * Persists choice and sets body[data-theme] + --theme-color for CSS.
 */

export const THEME_STORAGE_KEY = 'template5-theme';

export const THEMES = [
  { id: 'champagne', label: 'Champagne', color: '#c4a574', deep: '#a88755' },
  { id: 'slate', label: 'Slate Teal', color: '#3d4f55', deep: '#2c3a3f' },
  { id: 'forest', label: 'Forest', color: '#355e4b', deep: '#274636' },
  { id: 'midnight', label: 'Midnight', color: '#1e2a44', deep: '#141c2e' },
  { id: 'copper', label: 'Copper', color: '#b8895a', deep: '#946c42' },
];

/**
 * @returns {string} stored theme id
 */
export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'champagne';
  } catch {
    return 'champagne';
  }
}

/**
 * @param {string} themeId
 * @returns {{id: string, label: string, color: string, deep: string}}
 */
export function applyTheme(themeId) {
  const theme = THEMES.find((item) => item.id === themeId) || THEMES[0];
  document.body.dataset.theme = theme.id;
  document.body.style.setProperty('--theme-color', theme.color);
  document.body.style.setProperty('--theme-color-deep', theme.deep);
  document.body.style.setProperty('--a11y-brand-color', theme.color);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // private mode / blocked storage
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  return theme;
}
