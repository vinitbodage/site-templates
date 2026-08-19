import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/wgc.js';

function stackHeadingTail(heading) {
  const lead = heading.querySelector('.wgc-headline-lead');
  if (!lead || lead.nextSibling?.classList?.contains('wgc-headline-tail')) return;

  if (lead.nextSibling?.nodeType === Node.TEXT_NODE) {
    const tail = document.createElement('span');
    tail.className = 'wgc-headline-tail';
    tail.textContent = lead.nextSibling.textContent.trim();
    lead.nextSibling.replaceWith(tail);
    return;
  }

  if (lead.nextSibling) {
    const tail = document.createElement('span');
    tail.className = 'wgc-headline-tail';
    while (lead.nextSibling) {
      tail.append(lead.nextSibling);
    }
    heading.append(tail);
  }
}

/**
 * Authors often split the eyebrow and title across rows or heading levels.
 * Merge the first eyebrow into the primary heading as a styled lead line.
 * @param {Element} copy the copy column
 * @returns {Element|null} the primary heading
 */
function resolveIntroHeading(copy) {
  const headings = [...copy.querySelectorAll('h1, h2, h3, h4')];

  if (headings.length >= 2) {
    const eyebrow = headings[0];
    const heading = headings.slice(1).reduce((best, candidate) => {
      const bestLevel = parseInt(best.tagName[1], 10);
      const candidateLevel = parseInt(candidate.tagName[1], 10);
      return candidateLevel < bestLevel ? candidate : best;
    });

    const lead = document.createElement('span');
    lead.className = 'wgc-headline-lead';
    lead.textContent = eyebrow.textContent.trim();
    heading.prepend(lead);
    eyebrow.remove();
    return heading;
  }

  const heading = headings[0];
  if (!heading) return null;

  let prev = heading.previousElementSibling;
  while (prev) {
    const next = prev.previousElementSibling;
    if (prev.matches('p') || prev.querySelector('ul, ol, picture, img, a')) break;

    const text = prev.textContent.trim();
    if (text && !prev.querySelector('h1, h2, h3, h4')) {
      const lead = document.createElement('span');
      lead.className = 'wgc-headline-lead';
      lead.textContent = text;
      heading.prepend(lead);
      prev.remove();
      break;
    }

    prev = next;
  }

  return heading;
}

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
  badge.className = 'intro-container-badge';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const isBadge = cells.some((cell) => cell.classList.contains('badge')
      || cell.querySelector('.intro-container-badge, .wgc-intro-container-badge'));

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

  const heading = resolveIntroHeading(copy);
  if (heading) {
    splitHeading(heading);
    stackHeadingTail(heading);
    heading.classList.add('heading-border-bottom', 'heading-border-bottom-centered');
  }

  container.append(copy);
  block.replaceChildren(container, badge);
}
