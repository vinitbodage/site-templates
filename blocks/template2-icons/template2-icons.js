import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/template2.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per benefit: an icon cell and a label cell. The label may
 * contain a link, which makes the whole benefit clickable.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'template2-icons-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isIcon = cell.querySelector('picture, img, .icon');
      cell.classList.add(isIcon ? 'template2-icons-icon' : 'template2-icons-label');
      li.append(cell);
    });

    // A label cell holding only a link is turned into a button by the platform's
    // link decoration; this strip presents those links as plain labels instead.
    li.querySelectorAll('.template2-icons-label a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      const container = a.closest('.button-container');
      if (container) container.classList.remove('button-container');
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.template2-icons-icon picture > img').forEach((img) => {
    optimizePicture(img, { width: '200' });
  });

  block.replaceChildren(ul);
}
