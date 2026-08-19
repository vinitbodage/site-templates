import {
  getRows, getCells, isEmpty, splitHeading, addRule, markEyebrow,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const CONTACT_RE = /^(tel|mailto):/i;

/**
 * Marks phone and email links so they read as inline contact details rather
 * than as another call to action competing with the primary button.
 * @param {Element} copy the copy column
 */
function markContactLinks(copy) {
  copy.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
    link.classList.add('wgc-meetings-intro-contact');
    link.classList.remove('button', 'primary', 'secondary');
    const container = link.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });
}

/**
 * Promotes the closing call to action to the filled primary treatment.
 *
 * The platform turns any standalone link into a plain button before blocks run,
 * so the band only has to pick which one leads. Contact links are skipped since
 * markContactLinks has already demoted them.
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
 * Centered intro band: an optional eyebrow, the page heading with the brand
 * hairline rule, body copy carrying inline contact details, and a closing call
 * to action. Every row is optional, so authors can drop the ones they omit.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const copy = document.createElement('div');
  copy.className = 'wgc-meetings-intro-copy';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      if (!copy.childElementCount) moveInstrumentation(cell, copy);
      copy.append(...cell.childNodes);
    });
  });

  const heading = copy.querySelector('h1, h2, h3, h4');
  markEyebrow(copy, heading, 'wgc-meetings-intro-eyebrow');
  if (heading) {
    splitHeading(heading);
    if (!block.classList.contains('no-rule')) addRule(heading, { centered: true });
  }

  markContactLinks(copy);
  markCta(copy);

  block.replaceChildren(copy);
}
