import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Adds sym-inline-list styling to authored bullet lists.
 * @param {Element} root
 */
function normalizeLists(root) {
  root.querySelectorAll('ul, ol').forEach((list) => {
    list.classList.add('sym-inline-list');
  });
}

/**
 * Applies heading treatment to item titles.
 * @param {Element} item
 */
function normalizeHeading(item) {
  const heading = item.querySelector('h2, h3, h4');
  if (heading) splitHeading(heading);
}

/**
 * Hotel policies band — stacked title + copy + bullets (default-container).
 * @param {Element} block
 */
export default function decorate(block) {
  block.classList.add('default-container');

  const container = document.createElement('div');
  container.className = 'container';

  const inner = document.createElement('div');
  inner.className = 'amenities-inner';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    if (!cells.length) return;

    const item = document.createElement('div');
    item.className = 'amenities-item';
    moveInstrumentation(row, item);

    const titleCell = cells.find((cell) => cell.querySelector('h2, h3, h4'));
    const bodyCells = titleCell ? cells.filter((cell) => cell !== titleCell) : cells;

    if (titleCell && bodyCells.length) {
      const title = document.createElement('div');
      title.className = 'amenities-item-title';
      title.append(...titleCell.childNodes);
      item.append(title);

      const body = document.createElement('div');
      body.className = 'amenities-item-body';
      bodyCells.forEach((cell) => body.append(...cell.childNodes));
      item.append(body);
    } else {
      cells.forEach((cell) => item.append(...cell.childNodes));
    }

    normalizeLists(item);
    normalizeHeading(item);
    inner.append(item);
  });

  container.append(inner);
  block.replaceChildren(container);

  const section = block.closest('.section');
  if (section) {
    section.classList.add('default-container');
    if (section.previousElementSibling?.classList.contains('intro-container')) {
      section.classList.add('default-container-after-intro');
    }
  }
}
