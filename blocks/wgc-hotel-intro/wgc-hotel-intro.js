import { splitHeading, addRule } from '../../scripts/template/wgc.js';

/**
 * decorate the block
 *
 * Page-level intro for hotel information: centred headline, lead copy, and an
 * optional Book Now CTA.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const inner = document.createElement('div');
  inner.className = 'wgc-hotel-intro-inner';

  const heading = block.querySelector('h1, h2');
  if (heading) {
    splitHeading(heading);
    addRule(heading, { centered: true });
  }

  [...block.childNodes].forEach((node) => inner.append(node));

  block.querySelectorAll('a').forEach((link) => {
    if (link.textContent.trim().toLowerCase() === 'book now' || link.hasAttribute('data-book-now')) {
      link.classList.add('button', 'primary');
      const parent = link.closest('p, li');
      if (parent) parent.classList.add('button-container');
    }
  });

  block.replaceChildren(inner);
}
