import {
  getRows, getCells, isEmpty, splitHeading, addRule, markEyebrow, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const CONTACT_RE = /^(tel|mailto):/i;

/**
 * Marks phone and email links so they read as contact details beside the
 * button rather than as a second call to action competing with it.
 * @param {Element} copy the copy column
 */
function markContactLinks(copy) {
  copy.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
    link.classList.add('wgc-request-proposal-contact');
    link.classList.remove('button', 'primary', 'secondary');
    const container = link.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });
}

/**
 * Promotes the closing call to action to the filled primary treatment.
 * @param {Element} copy the copy column
 */
function markCta(copy) {
  const buttons = [...copy.querySelectorAll('a.button')]
    .filter((link) => !CONTACT_RE.test(link.getAttribute('href') || ''));
  const cta = buttons[buttons.length - 1];
  if (cta) cta.classList.add('primary');
}

/**
 * decorate the block
 *
 * The closing band that asks the planner to get in touch: a heading, a line of
 * copy carrying the phone number, and the proposal button. An image row turns
 * the band into a photographic panel, which the image variant then styles for
 * light text.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'wgc-request-proposal-media';

  const copy = document.createElement('div');
  copy.className = 'wgc-request-proposal-copy';

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
  markEyebrow(copy, heading, 'wgc-request-proposal-eyebrow');
  if (heading) {
    splitHeading(heading);
    addRule(heading, {
      centered: !block.classList.contains('split'),
      light: block.classList.contains('dark') || block.classList.contains('image'),
    });
  }

  markContactLinks(copy);
  markCta(copy);

  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '2000' });
  });

  const layout = document.createElement('div');
  layout.className = 'wgc-request-proposal-layout';
  layout.append(copy);

  block.replaceChildren(...[media, layout].filter((el) => el.childElementCount));
}
