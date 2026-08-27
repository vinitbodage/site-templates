import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Newsroom sidebar — one authored row per panel (About, Contacts, Follow us).
 * @param {Element} block the block
 */
export default function decorate(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();

  getRows(block).forEach((row) => {
    const panel = document.createElement('section');
    panel.className = 'news-sidebar-panel';
    moveInstrumentation(row, panel);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      if (cell.querySelector('h2, h3, h4, h5')) {
        cell.classList.add('news-sidebar-heading');
      } else {
        cell.classList.add('news-sidebar-body');
      }
      panel.append(cell);
    });

    if (panel.childElementCount) row.replaceWith(panel);
  });
}
