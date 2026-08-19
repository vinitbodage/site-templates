import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Promotes the closing call to action to the filled primary treatment. The
 * platform has already turned a standalone link into a plain button, so the
 * band only has to pick which one leads.
 * @param {Element} copy the copy column
 */
function markCta(copy) {
  const buttons = [...copy.querySelectorAll('a.button')];
  const cta = buttons[buttons.length - 1];
  if (cta) cta.classList.add('primary');
}

/**
 * decorate the block
 *
 * One authored row holding an image and a copy column. The columns are told
 * apart by what they hold rather than by their position, so an author can put
 * the copy first in the document; the image-right variant is the explicit way
 * to flip the pair.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const layout = document.createElement('div');
  layout.className = 'wgc-meeting-feature-layout';

  const media = document.createElement('div');
  media.className = 'wgc-meeting-feature-media';

  const copy = document.createElement('div');
  copy.className = 'wgc-meeting-feature-copy';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const isMedia = cell.querySelector('picture, img') && !cell.textContent.trim();
      const target = isMedia ? media : copy;
      if (!target.childElementCount) moveInstrumentation(cell, target);
      target.append(...cell.childNodes);
    });
  });

  const heading = copy.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  markCta(copy);

  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  layout.append(...[media, copy].filter((el) => el.childElementCount));
  block.replaceChildren(layout);
}
