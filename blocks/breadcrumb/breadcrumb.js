import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Turns a lone link back into plain breadcrumb text. Platform decoration
 * promotes a paragraph that holds only a link into a button.
 * @param {Element} root the subtree to clean
 */
function stripButtons(root) {
  root.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary');
    link.closest('.button-container')?.classList.remove('button-container');
  });
}

/**
 * Collects authored crumbs from either one cell per row or a single list.
 * @param {Element} block the breadcrumb block
 * @returns {Element[]} the crumb cells
 */
function getCrumbs(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();
  const crumbs = [];

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const items = [...cell.querySelectorAll(':scope > ul > li, :scope > ol > li')];
      if (items.length) crumbs.push(...items);
      else crumbs.push(cell);
    });
  });

  return crumbs;
}

/**
 * decorate the block
 *
 * Authors supply one crumb per cell (or a single list). Linked crumbs are
 * ancestors; the last crumb is the current page and is not linked.
 * @param {Element} block the block
 */
export default function decorate(block) {
  stripButtons(block);

  const nav = document.createElement('nav');
  nav.className = 'breadcrumb-nav';
  nav.setAttribute('aria-label', 'Breadcrumb');

  const ol = document.createElement('ol');
  const crumbs = getCrumbs(block);

  crumbs.forEach((crumb, index) => {
    const li = document.createElement('li');
    moveInstrumentation(crumb, li);
    const isLast = index === crumbs.length - 1;
    const link = crumb.querySelector('a');

    if (isLast) {
      li.setAttribute('aria-current', 'page');
      li.textContent = (link || crumb).textContent.trim();
    } else if (link) {
      li.append(link);
    } else {
      li.textContent = crumb.textContent.trim();
    }

    ol.append(li);
  });

  nav.append(ol);
  block.replaceChildren(nav);
}
