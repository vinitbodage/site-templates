import {
  getRows, getCells, isEmpty, optimizePicture,
} from './shared.js';
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

/**
 * Benefit strip: icon above centered label.
 * @param {Element} block
 */
export function decorateIconRow(block) {
  const ul = document.createElement('ul');

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isIcon = cell.querySelector('picture, img, .icon');
      cell.classList.add(isIcon ? 'cards-card-image' : 'cards-card-body');
      li.append(cell);
    });

    li.querySelectorAll('.cards-card-body a.button').forEach((link) => {
      link.classList.remove('button', 'primary', 'secondary');
      const container = link.closest('.button-container');
      if (container) container.classList.remove('button-container');
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.cards-card-image picture > img').forEach((img) => {
    optimizePicture(img, { width: '200' });
  });

  ul.querySelectorAll('.cards-card-body').forEach((body) => {
    if (body.querySelector('p, h2, h3, h4')) return;
    const text = body.textContent.trim();
    if (!text) return;
    body.textContent = '';
    const p = document.createElement('p');
    p.textContent = text;
    body.append(p);
  });

  block.classList.add('icon-row');
  block.replaceChildren(ul);
}

/**
 * True when every row is a small icon cell plus a short label cell.
 * @param {Element} block
 * @returns {boolean}
 */
export function isIconRowPattern(block) {
  const rows = getRows(block);
  if (!rows.length) return false;
  return rows.every((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    if (cells.length !== 2) return false;
    const iconCell = cells.find((cell) => cell.querySelector('picture, img, .icon'));
    const labelCell = cells.find((cell) => cell !== iconCell);
    return iconCell && labelCell && labelCell.textContent.trim().length > 0;
  });
}
