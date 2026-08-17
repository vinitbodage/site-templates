import {
  getRows, getCells, isEmpty, splitHeading, addRule,
} from '../../scripts/template/wrm.js';

/**
 * Email newsletter signup section.
 * Single row: heading, description, and form link or embed.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const inner = document.createElement('div');
  inner.className = 'wrm-newsletter-inner';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      inner.append(...cell.childNodes);
    });
  });

  const heading = inner.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading, { centered: true, light: true });
  }

  const form = inner.querySelector('form');
  if (form) {
    form.classList.add('wrm-newsletter-form');
    const input = form.querySelector('input[type="email"], input[name="email"]');
    if (input && !input.placeholder) input.placeholder = 'Email';
    const submit = form.querySelector('button, input[type="submit"]');
    if (submit && !submit.textContent.trim()) submit.textContent = 'Subscribe';
  }

  block.replaceChildren(inner);
}
