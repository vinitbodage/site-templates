import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/wgc.js';

/**
 * Centered intro band matching the reference intro-container layout.
 * @param {Element} block the block
 */
export default function decorate(block) {
  block.classList.add('intro-container');

  const container = document.createElement('div');
  container.className = 'container block';

  const copy = document.createElement('div');
  copy.className = 'col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 text-center wgc-intro-container-copy';

  const badge = document.createElement('div');
  badge.className = 'intro-container__bagde';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const isBadge = cells.some((cell) => cell.classList.contains('badge')
      || cell.querySelector('.intro-container__bagde, .wgc-intro-container-badge'));

    if (isBadge) {
      cells.forEach((cell) => {
        if (!isEmpty(cell)) badge.append(...cell.childNodes);
      });
      return;
    }

    cells.forEach((cell) => {
      if (!isEmpty(cell)) copy.append(...cell.childNodes);
    });
  });

  const heading = copy.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    heading.classList.add('heading-border-bottom', 'heading-border-bottom_centered');
    // stack the title tail beneath the lead span when authors use plain text
    const lead = heading.querySelector('.wgc-headline-lead');
    if (lead && lead.nextSibling?.nodeType === Node.TEXT_NODE) {
      const tail = document.createElement('span');
      tail.className = 'wgc-headline-tail';
      tail.textContent = lead.nextSibling.textContent.trim();
      lead.nextSibling.replaceWith(tail);
    }
  }

  container.append(copy);
  block.replaceChildren(container, badge);
}
