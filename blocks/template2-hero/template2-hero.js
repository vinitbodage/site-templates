import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/template2.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * Authors supply one media cell (image) and one copy cell (heading, optional
 * paragraph and CTA links), in either order. Add "compact" to the block name
 * for the shorter page-header treatment used on inner pages.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'template2-hero-media';
  const content = document.createElement('div');
  content.className = 'template2-hero-content';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const picture = cell.querySelector('picture');
      if (picture) {
        if (!media.childElementCount) moveInstrumentation(cell, media);
        media.append(picture);
        return;
      }

      if (!content.childElementCount) moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    });
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    splitHeading(heading);
    addRule(heading, { centered: true, light: true });
  }

  // the hero image is above the fold, so it loads eagerly as the LCP candidate
  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { eager: true, width: '2000' });
  });

  block.replaceChildren(...[media, content].filter((el) => el.childElementCount));
}
