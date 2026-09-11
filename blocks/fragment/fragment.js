/*
 * Fragment Block
 * Include content on a page as a fragment.
 * https://www.aem.live/developer/block-collection/fragment
 */

import {
  decorateMain,
} from '../../scripts/scripts.js';

import {
  loadSections,
} from '../../scripts/aem.js';

/**
 * Removes legacy theme-option blocks from fetched fragments so only the
 * theme-picker block is used in the header.
 * @param {Element} root the fragment root
 */
function stripThemeOption(root) {
  if (!root) return;
  root.querySelectorAll(':scope > div').forEach((section) => {
    const blockName = section.querySelector(':scope > div > div')?.textContent?.trim().toLowerCase();
    if (blockName === 'theme-option' || blockName === 'book-now-modal') section.remove();
  });
  root.querySelectorAll('.theme-option, .theme-option-wrap, .book-now-modal').forEach((el) => {
    el.remove();
  });
}

/**
 * Loads a fragment.
 * @param {string} path The path to the fragment
 * @returns {HTMLElement} The root element of the fragment
 */
export async function loadFragment(path) {
  if (path) { //  && path.startsWith('/')
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();

      // reset base path for media to fragment base
      const resetAttributeBase = (tag, attr) => {
        main.querySelectorAll(`${tag}[${attr}^="./media_"]`).forEach((elem) => {
          elem[attr] = new URL(elem.getAttribute(attr), new URL(path, window.location)).href;
        });
      };
      resetAttributeBase('img', 'src');
      resetAttributeBase('source', 'srcset');

      stripThemeOption(main);
      decorateMain(main);
      stripThemeOption(main);
      await loadSections(main);
      return main;
    }
  }
  return null;
}

export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
      block.closest('.fragment').replaceWith(...fragment.childNodes);
    }
  }
}
