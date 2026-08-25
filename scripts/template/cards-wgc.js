import {
  getRows, getCells, isEmpty, optimizePicture,
} from './wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * One authored row per award logo, laid out as a centered strip.
 * @param {Element} block
 */
export function decorateAccolades(block) {
  const ul = document.createElement('ul');
  ul.className = 'accolades-list';
  ul.setAttribute('aria-label', 'Awards and accolades');

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      li.append(...cell.childNodes);
    });

    if (li.querySelector('picture, img')) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '300' });
  });

  ul.querySelectorAll('a').forEach((link) => {
    const img = link.querySelector('img');
    if (img && img.alt && !link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', img.alt);
    }
  });

  block.replaceChildren(ul);
}

/**
 * One authored row per image + body column grid.
 * @param {Element} block
 */
export function decorateCardColumns(block) {
  const ul = document.createElement('ul');
  ul.className = 'card-columns-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isImage = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isImage ? 'card-columns-image' : 'card-columns-body');
      li.append(cell);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.dataset.count = ul.childElementCount;

  ul.querySelectorAll('.card-columns-image picture > img').forEach((img) => {
    optimizePicture(img, { width: '750' });
  });

  block.replaceChildren(ul);
}
