import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Newsroom article list — one authored row per post.
 * Copy cell: meta paragraph (type · date), linked title, optional excerpt.
 * Optional media cell with a thumbnail image.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const {
    getRows, getCells, isEmpty, optimizePicture,
  } = getTemplateHelpers();
  const ul = document.createElement('ul');
  ul.className = 'news-list-items';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    li.className = 'news-item';
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
      if (isMedia) {
        cell.classList.add('news-item-media');
      } else {
        cell.classList.add('news-item-body');
        const meta = cell.querySelector(':scope > p:first-of-type');
        if (meta && !meta.querySelector('a.button, a.primary, a.secondary')) {
          meta.classList.add('news-item-meta');
        }
      }
      li.append(cell);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.news-item-media img').forEach((img) => {
    optimizePicture(img, { width: '320' });
  });

  block.replaceChildren(ul);
}
