import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/template2.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per service: an image cell and a copy cell (heading,
 * description, optional link). Rendered as a responsive card grid.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'template2-services-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    li.className = 'template2-services-card';
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isMedia ? 'template2-services-media' : 'template2-services-copy');
      li.append(cell);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.template2-services-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '600' });
  });

  block.replaceChildren(ul);
}
