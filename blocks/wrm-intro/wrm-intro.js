import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wrm.js';

/**
 * Split intro section with image and copy.
 * @param {Element} block the block
 */
export default function decorate(block) {
  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) {
        cell.remove();
        return;
      }
      const isMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
      cell.classList.add(isMedia ? 'wrm-intro-media' : 'wrm-intro-copy');
    });
  });

  const heading = block.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  block.querySelectorAll('.wrm-intro-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '1200' });
  });
}
