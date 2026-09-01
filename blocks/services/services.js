import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per service: an image cell and a copy cell (heading,
 * description, optional link). Rendered as a responsive card grid.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const {
    getRows, getCells, isEmpty, optimizePicture,
  } = getTemplateHelpers();
  const ul = document.createElement('ul');
  ul.className = 'services-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    li.className = 'services-card';
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isMedia ? 'services-media' : 'services-copy');
      li.append(cell);
    });

    li.querySelectorAll('.services-copy a.button').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      a.closest('.button-container')?.classList.remove('button-container');
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.services-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '600' });
  });

  block.replaceChildren(ul);
}
