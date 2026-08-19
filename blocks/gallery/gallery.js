import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per image, laid out as a staggered mosaic. An author can
 * wrap the image in a link to open the full-size asset; when they do, the
 * image's alt text is reused as the link's accessible name.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const {
    getRows, getCells, isEmpty, optimizePicture,
  } = getTemplateHelpers();
  const ul = document.createElement('ul');
  ul.className = 'gallery-list';

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
