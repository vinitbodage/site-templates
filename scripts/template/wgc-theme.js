/**
 * Site-wide typography theme resolution and application.
 *
 * Precedence: visitor localStorage override → page metadata → homepage default
 * → master page metadata fetched from the nearest section index or /.
 */

import { getMetadata, loadCSS, toClassName } from '../aem.js';

const STORAGE_KEY = 'wgc-theme-option';
const MASTER_CACHE_PREFIX = 'wgc-master-theme-option:';

export const THEMES = [
  { id: 'riomar', label: 'Rio Mar', swatch: '#2d5a4a' },
  { id: 'clearwater', label: 'Grand Clearwater', swatch: '#3d717f' },
  { id: 'ramada', label: 'Ramada Jaipur', swatch: '#c41230' },
];

const THEME_IDS = new Set(THEMES.map((t) => t.id));
const loadedThemes = new Set();

/**
 * @param {string} id theme identifier
 * @returns {boolean}
 */
function isValidThemeId(id) {
  return Boolean(id && THEME_IDS.has(id));
}

/**
 * @returns {boolean}
 */
function isHomePage() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  return path === '/' || path.endsWith('/index') || path.endsWith('/index.html');
}

/**
 * @returns {string} stored visitor theme id or empty string
 */
export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValidThemeId(stored) ? stored : '';
  } catch (e) {
    return '';
  }
}

/**
 * @param {string} id theme identifier or empty to clear
 */
export function setStoredTheme(id) {
  try {
    if (isValidThemeId(id)) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    // storage unavailable
  }
}

/**
 * @returns {string} theme-option metadata on the current page
 */
function getPageThemeOption() {
  const value = toClassName(getMetadata('theme-option'));
  return isValidThemeId(value) ? value : '';
}

/**
 * Master paths to try when inheriting a theme (nearest section index, then site root).
 * @returns {string[]}
 */
function getMasterFetchPaths() {
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return [];
  const parts = path.split('/').filter(Boolean);
  const paths = [];
  if (parts.length > 1) {
    paths.push(`/${parts[0]}/`);
  }
  if (!paths.includes('/')) {
    paths.push('/');
  }
  return paths;
}

/**
 * @param {string} path URL path to fetch
 * @returns {Promise<string>} theme id from that page or empty string
 */
async function fetchThemeOptionFromPath(path) {
  const resp = await fetch(path);
  if (!resp.ok) return '';
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const value = toClassName(getMetadata('theme-option', doc));
  return isValidThemeId(value) ? value : '';
}

/**
 * @returns {Promise<string>} theme-option from the master page
 */
async function fetchMasterThemeOption() {
  const masterPaths = getMasterFetchPaths();
  if (!masterPaths.length) return '';

  const cacheKey = `${MASTER_CACHE_PREFIX}${masterPaths[0]}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached !== null) {
      return isValidThemeId(cached) ? cached : '';
    }
  } catch (e) {
    // continue to network fetch
  }

  try {
    let themeId = '';
    for (let i = 0; i < masterPaths.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      themeId = await fetchThemeOptionFromPath(masterPaths[i]);
      if (themeId) break;
    }
    try {
      sessionStorage.setItem(cacheKey, themeId);
    } catch (e) {
      // ignore cache write failure
    }
    return themeId;
  } catch (e) {
    return '';
  }
}

/**
 * Resolves which theme should be active for the current page.
 * @returns {Promise<string>} theme id or empty string for base styles
 */
export async function resolveThemeId() {
  const stored = getStoredTheme();
  if (stored) return stored;

  const pageTheme = getPageThemeOption();
  if (pageTheme) return pageTheme;

  if (isHomePage()) return '';

  return fetchMasterThemeOption();
}

/**
 * @returns {string} currently applied theme id from body classes
 */
export function getActiveThemeId() {
  const match = [...document.body.classList].find((c) => c.startsWith('theme-'));
  if (!match) return '';
  const id = match.slice(6);
  return isValidThemeId(id) ? id : '';
}

function clearThemeClasses() {
  [...document.body.classList]
    .filter((c) => c.startsWith('theme-'))
    .forEach((c) => document.body.classList.remove(c));
}

/**
 * @param {string} id theme identifier
 * @returns {Promise<void>}
 */
export async function loadThemeStyles(id) {
  if (!isValidThemeId(id) || loadedThemes.has(id)) return;
  loadedThemes.add(id);
  try {
    await loadCSS(`${window.hlx.codeBasePath}/styles/template/theme-${id}.css`);
  } catch (e) {
    loadedThemes.delete(id);
  }
}

/**
 * Applies a typography theme to the page.
 * @param {string} id theme identifier or empty for base styles
 * @param {{ persist?: boolean }} options persist visitor choice in localStorage
 * @returns {Promise<string>} applied theme id
 */
export async function applyTheme(id, { persist = false } = {}) {
  clearThemeClasses();
  const themeId = isValidThemeId(id) ? id : '';
  if (themeId) {
    document.body.classList.add(`theme-${themeId}`);
    await loadThemeStyles(themeId);
  }
  if (persist) {
    setStoredTheme(themeId);
  }
  document.dispatchEvent(new CustomEvent('theme-change', { detail: { themeId } }));
  return themeId;
}

/**
 * Resolves and applies the theme during eager page load.
 * @returns {Promise<string>} applied theme id
 */
export async function initThemeOption() {
  const themeId = await resolveThemeId();
  return applyTheme(themeId);
}
