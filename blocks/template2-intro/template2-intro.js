import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/template2.js';

/**
 * decorate the block
 *
 * Authors supply one media cell and one copy cell, in either order. Add
 * "image-right" to the block name to flip the layout. The cells are
 * classified in place rather than rebuilt, so authoring instrumentation and
 * the platform's link decoration both survive untouched.
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
      cell.classList.add(isMedia ? 'template2-intro-media' : 'template2-intro-copy');
    });
  });

  const heading = block.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  block.querySelectorAll('.template2-intro-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '1200' });
  });
}
