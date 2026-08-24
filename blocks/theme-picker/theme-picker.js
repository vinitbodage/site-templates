import { applyTheme, getStoredTheme, THEMES } from '../../scripts/template/theme.js';

const ICON_PATH = '/icons/palette.svg';

/**
 * Loads the palette SVG from the icons folder and inlines it so CSS color
 * can restyle the artwork. Falls back to an img if the request fails.
 * @param {Element} holder the icon span
 */
async function decoratePaletteIcon(holder) {
  const src = `${window.hlx.codeBasePath}${ICON_PATH}`;
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('icon missing');
    holder.innerHTML = await response.text();
    const svg = holder.querySelector('svg');
    if (svg) {
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
    }
  } catch {
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    holder.replaceChildren(img);
  }
}

/**
 * Shows the active theme color on the toggle icon.
 * @param {Element} toggle the picker button
 * @param {{id: string, label: string, color: string}} theme the active theme
 */
function syncToggleTheme(toggle, theme) {
  toggle.dataset.theme = theme.id;
  toggle.style.setProperty('--picker-theme-color', theme.color);
  toggle.setAttribute('aria-label', `Theme: ${theme.label}. Choose theme color`);

  const indicator = toggle.querySelector('.theme-picker-active');
  if (indicator) {
    indicator.style.backgroundColor = theme.color;
  }
}

/**
 * decorate the block
 *
 * Renders a palette icon that opens a dropdown of theme colors. The chosen
 * color is applied site-wide via `data-theme` on the body.
 * @param {Element} block the block
 */
export default async function decorate(block) {
  const current = getStoredTheme();
  const activeTheme = applyTheme(current);

  const menuId = `theme-picker-menu-${Math.random().toString(36).slice(2, 8)}`;

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'theme-picker-toggle';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-controls', menuId);

  const icon = document.createElement('span');
  icon.className = 'icon icon-palette';
  toggle.append(icon);

  const indicator = document.createElement('span');
  indicator.className = 'theme-picker-active';
  indicator.setAttribute('aria-hidden', 'true');
  toggle.append(indicator);

  const menu = document.createElement('ul');
  menu.id = menuId;
  menu.className = 'theme-picker-menu';
  menu.setAttribute('role', 'listbox');
  menu.hidden = true;

  const closeMenu = () => {
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    menu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  };

  const updateSelection = (themeId) => {
    menu.querySelectorAll('[role="option"]').forEach((opt) => {
      opt.setAttribute('aria-selected', opt.dataset.theme === themeId ? 'true' : 'false');
    });
  };

  THEMES.forEach((theme) => {
    const item = document.createElement('li');
    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'theme-picker-option';
    option.dataset.theme = theme.id;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', theme.id === current ? 'true' : 'false');

    const swatch = document.createElement('span');
    swatch.className = 'theme-picker-swatch';
    swatch.style.backgroundColor = theme.color;
    swatch.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'theme-picker-label';
    label.textContent = theme.label;

    option.append(swatch, label);
    option.addEventListener('click', () => {
      const applied = applyTheme(theme.id);
      syncToggleTheme(toggle, applied);
      updateSelection(theme.id);
      closeMenu();
    });

    item.append(option);
    menu.append(item);
  });

  toggle.addEventListener('click', (event) => {
    event.stopPropagation();
    if (menu.hidden) openMenu();
    else closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (!block.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  document.addEventListener('themechange', (event) => {
    syncToggleTheme(toggle, event.detail);
    updateSelection(event.detail.id);
  });

  block.replaceChildren(toggle, menu);
  await decoratePaletteIcon(icon);
  syncToggleTheme(toggle, activeTheme);
}
