import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per column: an image cell and a body cell holding the
 * heading, copy, and an optional call to action. The number of columns follows
 * the number of authored rows, so the same block serves two, three, or four up.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'wgc-columns-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isImage = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isImage ? 'wgc-columns-image' : 'wgc-columns-body');
      li.append(cell);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.dataset.count = ul.childElementCount;

  ul.querySelectorAll('.wgc-columns-image picture > img').forEach((img) => {
    optimizePicture(img, { width: '750' });
  });

  block.replaceChildren(ul);
}
