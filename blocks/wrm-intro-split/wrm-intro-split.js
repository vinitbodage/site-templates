import {
  getRows, getCells, isEmpty,
} from '../../scripts/template/wrm.js';

/**
 * 50/50 intro: headline in one cell, body copy in the other.
 * @param {Element} block the block
 */
export default function decorate(block) {
  getRows(block).forEach((row) => {
    getCells(row).forEach((cell, idx) => {
      if (isEmpty(cell)) {
        cell.remove();
        return;
      }
      cell.classList.add(idx === 0 ? 'wrm-intro-split-heading' : 'wrm-intro-split-copy');
    });
  });
}
