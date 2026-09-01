/**
 * Site theme color tokens and helpers.
 *
 * The picker UI lives in the theme-picker block. These helpers persist the
 * choice and set `data-theme` on the body so CSS can restyle headings and CTAs.
 */

export const THEME_STORAGE_KEY = 'site-theme';

export const THEMES = [
  { id: 'navy', label: 'Deep Navy Blue', color: '#16273e' },
  { id: 'sage', label: 'Sage Green', color: '#6b8f71' },
  { id: 'terracotta', label: 'Warm Terracotta', color: '#c46a4a' },
];

/**
 * Returns the stored theme id, defaulting to Deep Navy Blue.
 * @returns {string} the theme id
 */
export function getStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'navy';
  } catch {
    return 'navy';
  }
}

/**
 * Applies a theme so every block can read `--theme-color`.
 * @param {string} themeId the theme id
 * @returns {{id: string, label: string, color: string}} the applied theme
 */
export function applyTheme(themeId) {
  const theme = THEMES.find((item) => item.id === themeId) || THEMES[0];
  document.body.dataset.theme = theme.id;
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme.id);
  } catch {
    // private mode / blocked storage
  }
  document.dispatchEvent(new CustomEvent('themechange', { detail: theme }));
  return theme;
}
