import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Card-grid columns used by branded templates: one authored row per column,
 * with an image cell and a body cell.
 * @param {Element} block the block
 */
function decorateCardColumns(block) {
  const {
    getRows, getCells, isEmpty, optimizePicture,
  } = getTemplateHelpers();
  const ul = document.createElement('ul');
  ul.className = 'columns-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isImage = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isImage ? 'columns-image' : 'columns-body');
      li.append(cell);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.dataset.count = ul.childElementCount;

  ul.querySelectorAll('.columns-image picture > img').forEach((img) => {
    optimizePicture(img, { width: '750' });
  });

  block.replaceChildren(ul);
}

/**
 * True when every authored row is an image cell plus a copy cell — the
 * card-grid model used on branded template pages.
 * @param {Element} block the block
 * @returns {boolean} whether the block is a card grid
 */
function isCardGrid(block) {
  const rows = [...block.querySelectorAll(':scope > div')];
  if (!rows.length) return false;
  return rows.every((row) => {
    const cells = [...row.querySelectorAll(':scope > div')];
    const hasImage = cells.some((cell) => cell.querySelector('picture, img'));
    const hasCopy = cells.some((cell) => cell.textContent.trim());
    return cells.length >= 2 && hasImage && hasCopy;
  });
}

/**
 * decorate the block
 * @param {Element} block the block
 */
export default function decorate(block) {
  if (isCardGrid(block)) {
    decorateCardColumns(block);
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          // picture is only content in column
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });
}
