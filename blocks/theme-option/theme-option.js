import {
  THEMES,
  getActiveThemeId,
  applyTheme,
} from '../../scripts/template/wgc-theme.js';

/**
 * Updates pressed state on all swatch buttons inside a block.
 * @param {Element} block the theme-option block
 * @param {string} activeId currently applied theme id
 */
function syncPressedState(block, activeId) {
  block.querySelectorAll('[data-theme-id]').forEach((btn) => {
    const isActive = btn.dataset.themeId === activeId;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.classList.toggle('is-active', isActive);
  });
}

/**
 * decorate the theme-option block
 * @param {Element} block the block element
 */
export default function decorate(block) {
  block.classList.add('theme-option-inner');
  block.setAttribute('role', 'group');
  block.setAttribute('aria-label', 'Typography theme');

  const list = document.createElement('div');
  list.className = 'theme-option-list';

  THEMES.forEach(({ id, label, swatch }) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-option-swatch';
    btn.dataset.themeId = id;
    btn.setAttribute('aria-label', label);
    btn.title = label;

    const dot = document.createElement('span');
    dot.className = 'theme-option-dot';
    dot.style.backgroundColor = swatch;
    dot.setAttribute('aria-hidden', 'true');

    const text = document.createElement('span');
    text.className = 'theme-option-label';
    text.textContent = label;

    btn.append(dot, text);
    btn.addEventListener('click', async () => {
      const current = getActiveThemeId();
      const next = current === id ? '' : id;
      await applyTheme(next, { persist: true });
      syncPressedState(block, next);
    });
    list.append(btn);
  });

  block.replaceChildren(list);
  syncPressedState(block, getActiveThemeId());

  document.addEventListener('theme-change', (e) => {
    syncPressedState(block, e.detail.themeId || '');
  });
}
