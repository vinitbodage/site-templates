import {
  getRows, getCells, isEmpty,
} from '../../scripts/template/wrm.js';

/**
 * Centred section heading with optional intro copy and CTA.
 * @param {Element} block the block
 */
export default function decorate(block) {
  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) {
        cell.remove();
        return;
      }
      cell.classList.add('wrm-section-header-inner');
    });
  });
}
