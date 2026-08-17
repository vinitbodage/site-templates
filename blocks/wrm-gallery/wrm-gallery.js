import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Staggered image mosaic gallery. One row per image.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'wrm-gallery-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      li.append(...cell.childNodes);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  ul.querySelectorAll('a').forEach((link) => {
    const img = link.querySelector('img');
    if (img && img.alt && !link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', img.alt);
    }
  });

  block.replaceChildren(ul);
}
