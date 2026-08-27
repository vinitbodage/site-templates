import { getTemplateHelpers } from '../../scripts/template/shared.js';

/**
 * decorate the block
 *
 * Authors place a heading in the first cell. The red rule under the title is
 * drawn in CSS so the authored text stays a plain heading.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();
  const heading = block.querySelector('h1, h2, h3, h4, h5, h6');

  if (!heading) {
    const firstCell = getCells(getRows(block)[0] || block).find((cell) => !isEmpty(cell));
    if (firstCell) {
      const fallback = document.createElement('h2');
      fallback.textContent = firstCell.textContent.trim();
      block.replaceChildren(fallback);
      return;
    }
  }

  if (heading) block.replaceChildren(heading);
}
