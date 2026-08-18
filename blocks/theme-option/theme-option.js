import {
  THEMES,
  getActiveThemeId,
  applyTheme,
} from '../../scripts/template/wgc-theme.js';

const PALETTE_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <path d="M12 3a9 9 0 1 0 .4 17.95 3.2 3.2 0 0 0 .1-6.4 2.4 2.4 0 0 1-2.5-2.4A9 9 0 0 0 12 3z"/>
  <circle cx="7.6" cy="10.2" r="1.05" fill="currentColor" stroke="none"/>
  <circle cx="9.6" cy="6.9" r="1.05" fill="currentColor" stroke="none"/>
  <circle cx="14.4" cy="6.9" r="1.05" fill="currentColor" stroke="none"/>
  <circle cx="16.4" cy="10.2" r="1.05" fill="currentColor" stroke="none"/>
</svg>`;

function getTheme(id) {
  return THEMES.find((theme) => theme.id === id);
}

/**
 * @param {Element} block
 * @param {boolean} open
 */
function setOpen(block, open) {
  const toggle = block.querySelector('.theme-option-toggle');
  const menu = block.querySelector('.theme-option-menu');
  if (!toggle || !menu) return;
  toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  menu.hidden = !open;
  block.classList.toggle('is-open', open);
}

/**
 * @param {Element} block
 * @param {string} activeId
 */
function syncActive(block, activeId) {
  const theme = getTheme(activeId);
  const toggle = block.querySelector('.theme-option-toggle');
  const currentDot = block.querySelector('.theme-option-current-dot');
  if (toggle && currentDot) {
    if (theme) {
      currentDot.style.backgroundColor = theme.swatch;
      currentDot.hidden = false;
      toggle.setAttribute('aria-label', `Theme: ${theme.label}`);
    } else {
      currentDot.removeAttribute('style');
      currentDot.hidden = true;
      toggle.setAttribute('aria-label', 'Choose theme');
    }
  }

  block.querySelectorAll('[data-theme-id]').forEach((option) => {
    const isActive = option.dataset.themeId === activeId;
    option.setAttribute('aria-selected', isActive ? 'true' : 'false');
    option.classList.toggle('is-active', isActive);
  });
}

/**
 * decorate the theme-option block
 * @param {Element} block the block element
 */
export default function decorate(block) {
  block.classList.add('theme-option-inner');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'theme-option-toggle';
  toggle.setAttribute('aria-haspopup', 'listbox');
  toggle.setAttribute('aria-expanded', 'false');
  const menuId = `theme-option-menu-${Math.random().toString(36).slice(2, 8)}`;
  toggle.setAttribute('aria-controls', menuId);
  toggle.setAttribute('aria-label', 'Choose theme');
  toggle.innerHTML = `${PALETTE_ICON}<span class="theme-option-current-dot" hidden></span>`;

  const menu = document.createElement('ul');
  menu.id = menuId;
  menu.className = 'theme-option-menu';
  menu.setAttribute('role', 'listbox');
  menu.setAttribute('aria-label', 'Typography theme');
  menu.hidden = true;

  THEMES.forEach(({ id, label, swatch }) => {
    const item = document.createElement('li');
    item.setAttribute('role', 'presentation');

    const option = document.createElement('button');
    option.type = 'button';
    option.className = 'theme-option-item';
    option.dataset.themeId = id;
    option.setAttribute('role', 'option');
    option.setAttribute('aria-selected', 'false');

    const dot = document.createElement('span');
    dot.className = 'theme-option-dot';
    dot.style.backgroundColor = swatch;
    dot.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'theme-option-name';
    name.textContent = label;

    const code = document.createElement('span');
    code.className = 'theme-option-code';
    code.textContent = swatch.toUpperCase();

    option.append(dot, name, code);
    option.addEventListener('click', async () => {
      await applyTheme(id, { persist: true });
      syncActive(block, id);
      setOpen(block, false);
      toggle.focus();
    });

    item.append(option);
    menu.append(item);
  });

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(block, !block.classList.contains('is-open'));
  });

  const onDocumentClick = (e) => {
    if (!block.contains(e.target)) setOpen(block, false);
  };
  const onKeydown = (e) => {
    if (e.key === 'Escape') {
      setOpen(block, false);
      toggle.focus();
    }
  };
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeydown);

  block.replaceChildren(toggle, menu);
  syncActive(block, getActiveThemeId());

  document.addEventListener('theme-change', (e) => {
    syncActive(block, e.detail.themeId || '');
  });
}
