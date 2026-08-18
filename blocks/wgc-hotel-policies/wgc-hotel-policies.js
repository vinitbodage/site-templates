import {
  getRows, getCells, isEmpty,
} from '../../scripts/template/wgc.js';

/**
 * decorate the block
 *
 * Each authored row is one hotel policy: a title cell (h2) and a body cell
 * (paragraphs and lists). Blocks stay authorable while matching the reference
 * hotel-info layout.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const policies = document.createElement('div');
  policies.className = 'wgc-hotel-policies-list';

  getRows(block).forEach((row) => {
    const cells = getCells(row);
    if (cells.length < 2 || isEmpty(cells[0])) return;

    const article = document.createElement('article');
    article.className = 'wgc-hotel-policy';

    const titleCell = cells[0];
    const bodyCell = cells[1];

    const heading = titleCell.querySelector('h2, h3, h4') || titleCell;
    if (heading.tagName.match(/^H[2-4]$/)) {
      heading.classList.add('wgc-hotel-policy-title');
    }
    article.append(titleCell);

    if (bodyCell && !isEmpty(bodyCell)) {
      bodyCell.classList.add('wgc-hotel-policy-body');
      article.append(bodyCell);
    }

    policies.append(article);
    row.remove();
  });

  block.append(policies);
}
