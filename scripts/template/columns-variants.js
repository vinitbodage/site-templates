import {
  getRows, getCells, isEmpty, splitHeading, addRule, markEyebrow, optimizePicture,
} from './shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const CONTACT_RE = /^(tel|mailto):/i;
const DOCUMENT_RE = /\.(pdf|docx?|xlsx?|pptx?)(\?.*)?$/i;
const TOUR_RE = /(virtual[-\s]?tour|matterport|panoram|\b360\b)/i;

function stackHeadingTail(heading) {
  const lead = heading.querySelector('.headline-lead');
  if (!lead || lead.nextSibling?.classList?.contains('headline-tail')) return;

  if (lead.nextSibling?.nodeType === Node.TEXT_NODE) {
    const tail = document.createElement('span');
    tail.className = 'headline-tail';
    tail.textContent = lead.nextSibling.textContent.trim();
    lead.nextSibling.replaceWith(tail);
    return;
  }

  if (lead.nextSibling) {
    const tail = document.createElement('span');
    tail.className = 'headline-tail';
    while (lead.nextSibling) {
      tail.append(lead.nextSibling);
    }
    heading.append(tail);
  }
}

function markContactLinks(copy, className = 'intro-contact') {
  copy.querySelectorAll('a[href^="tel:"], a[href^="mailto:"]').forEach((link) => {
    link.classList.add(className);
    link.classList.remove('button', 'primary', 'secondary');
    const container = link.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });
}

function markCta(copy) {
  const buttons = [...copy.querySelectorAll('a.button')]
    .filter((link) => !CONTACT_RE.test(link.getAttribute('href') || ''));
  const cta = buttons[buttons.length - 1];
  if (cta) cta.classList.add('primary');
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
    lead.className = 'headline-lead';
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
      lead.className = 'headline-lead';
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
export function decorateIntro(block) {
  block.classList.add('intro-container');

  const container = document.createElement('div');
  container.className = 'container block';

  const copy = document.createElement('div');
  copy.className = 'col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 text-center intro-copy';

  const badge = document.createElement('div');
  badge.className = 'intro-container-badge';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const isBadge = cells.some((cell) => cell.classList.contains('badge')
      || cell.querySelector('.intro-container-badge, .intro-badge'));

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

/**
 * Centered intro band with eyebrow, contact links, and CTA.
 * @param {Element} block the block
 */
export function decorateMeetingsIntro(block) {
  const copy = document.createElement('div');
  copy.className = 'intro-copy';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      if (!copy.childElementCount) moveInstrumentation(cell, copy);
      copy.append(...cell.childNodes);
    });
  });

  const heading = copy.querySelector('h1, h2, h3, h4');
  markEyebrow(copy, heading, 'intro-eyebrow');
  if (heading) {
    splitHeading(heading);
    if (!block.classList.contains('no-rule')) addRule(heading, { centered: true });
  }

  markContactLinks(copy);
  markCta(copy);

  block.replaceChildren(copy);
}

/**
 * Amenities band with a left heading and two-column bullet list.
 * @param {Element} block the block
 */
export function decorateAmenities(block) {
  block.classList.add('details-container');

  const container = document.createElement('div');
  container.className = 'container';

  const layout = document.createElement('div');
  layout.className = 'text-modules split-list-layout';

  const title = document.createElement('div');
  title.className = 'col-sm-5 split-list-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'col-sm-7 split-list-list-wrap';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const heading = cell.querySelector('h2, h3, h4');
      const list = cell.querySelector('ul');
      if (heading && !title.childElementCount) title.append(heading);
      if (list && !listWrap.childElementCount) {
        list.classList.add('split-list-items', 'sym-inline-list');
        listWrap.append(list);
      }
      if (!heading && !list) title.append(...cell.childNodes);
    });
  });

  const heading = title.querySelector('h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    stackHeadingTail(heading);
  }

  layout.append(title, listWrap);
  container.append(layout);
  block.replaceChildren(container);
}

export function decorateMeetingAmenities(block) {
  const layout = document.createElement('div');
  layout.className = 'split-list-layout';

  const title = document.createElement('div');
  title.className = 'split-list-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'split-list-items-wrap';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const list = cell.querySelector(':scope > ul, :scope > ol');
      if (list && !listWrap.childElementCount) {
        moveInstrumentation(cell, listWrap);
        list.classList.add('split-list-items');
        listWrap.append(list);
      }

      // whatever the cell still holds is heading or intro copy
      if (isEmpty(cell)) return;
      if (!title.childElementCount) moveInstrumentation(cell, title);
      title.append(...cell.childNodes);
    });
  });

  splitHeading(title.querySelector('h2, h3, h4'));

  layout.append(...[title, listWrap].filter((el) => el.childElementCount));
  block.replaceChildren(layout);
}

/**
 * Image + copy feature band.
 * @param {Element} block the block
 */
export function decorateFeature(block) {
  const layout = document.createElement('div');
  layout.className = 'feature-layout';

  const media = document.createElement('div');
  media.className = 'feature-media';

  const copy = document.createElement('div');
  copy.className = 'feature-copy';

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

function isExternal(link) {
  try {
    return new URL(link.href, window.location.href).origin !== window.location.origin;
  } catch (e) {
    return false;
  }
}

/**
 * Classifies a planner resource from its target so the list can show the right
 * affordance without the author having to pick an icon.
 * @param {Element} link the resource link
 * @returns {string} the resource type
 */
function resolveToolType(link) {
  const href = link.getAttribute('href') || '';
  if (DOCUMENT_RE.test(href)) return 'document';
  if (TOUR_RE.test(href) || TOUR_RE.test(link.textContent)) return 'tour';
  return isExternal(link) ? 'external' : 'internal';
}

/**
 * Turns an authored list item into a resource link.
 * @param {Element} item the list item
 */
function decorateItem(item) {
  const link = item.querySelector('a');
  if (!link) return;

  // this list draws its own affordances, so the platform's button styling goes
  link.classList.remove('button', 'primary', 'secondary');
  link.classList.add('planning-tools-link');

  const type = resolveToolType(link);
  item.dataset.toolType = type;

  if (type === 'document' || type === 'external' || type === 'tour') {
    link.target = '_blank';
    link.rel = 'noopener';
  }
}

/**
 * Builds the list when an author writes each resource on its own line instead
 * of as a bullet list. The platform has already wrapped those links in their
 * own paragraph, which is what makes them recognisable here.
 * @param {Element} title the heading column
 * @returns {Element|null} the generated list
 */
function buildListFromLines(title) {
  const links = [...title.querySelectorAll('p > a')]
    .filter((link) => link.parentElement.childNodes.length === 1);
  if (!links.length) return null;

  const list = document.createElement('ul');
  links.forEach((link) => {
    const holder = link.closest('p');
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
    if (holder && isEmpty(holder)) holder.remove();
  });

  return list;
}

/**
 * decorate the block
 *
 * A heading beside the planner resources: virtual tours, fact sheets, banquet
 * menus and capacity charts. Authors write the resources as a bullet list of
 * links, or as one link per line, and each one picks up an icon and new-tab
 * handling from where it points.
 * @param {Element} block the block
 */
export function decoratePlanningTools(block) {
  const layout = document.createElement('div');
  layout.className = 'planning-tools-layout';

  const title = document.createElement('div');
  title.className = 'planning-tools-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'planning-tools-list-wrap';

  let list = null;

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const authored = cell.querySelector(':scope > ul, :scope > ol');
      if (authored && !list) {
        moveInstrumentation(cell, listWrap);
        list = authored;
        listWrap.append(list);
      }

      // whatever the cell still holds is heading or intro copy
      if (isEmpty(cell)) return;
      if (!title.childElementCount) moveInstrumentation(cell, title);
      title.append(...cell.childNodes);
    });
  });

  if (!list) {
    list = buildListFromLines(title);
    if (list) listWrap.append(list);
  }

  if (list) {
    list.classList.add('planning-tools-list');
    list.querySelectorAll(':scope > li').forEach(decorateItem);
  }

  splitHeading(title.querySelector('h2, h3, h4'));

  layout.append(...[title, listWrap].filter((el) => el.childElementCount));
  block.replaceChildren(layout);
}

/**
 * Closing CTA band with optional background image.
 * @param {Element} block the block
 */
export function decorateCtaBand(block) {
  const media = document.createElement('div');
  media.className = 'cta-band-media';

  const copy = document.createElement('div');
  copy.className = 'cta-band-copy';

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
  markEyebrow(copy, heading, 'cta-band-eyebrow');
  if (heading) {
    splitHeading(heading);
    addRule(heading, {
      centered: !block.classList.contains('split'),
      light: block.classList.contains('dark') || block.classList.contains('image'),
    });
  }

  markContactLinks(copy, 'cta-band-contact');
  markCta(copy);

  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '2000' });
  });

  const layout = document.createElement('div');
  layout.className = 'cta-band-layout';
  layout.append(copy);

  block.replaceChildren(...[media, layout].filter((el) => el.childElementCount));
}

/**
 * Routes column variants to the correct decorator.
 * @param {Element} block
 */
export function decorateColumnVariants(block) {
  if (block.classList.contains('cta-band')) {
    decorateCtaBand(block);
    return true;
  }
  if (block.classList.contains('planning-tools')) {
    decoratePlanningTools(block);
    return true;
  }
  if (block.classList.contains('feature')) {
    decorateFeature(block);
    return true;
  }
  if (block.classList.contains('checklist') || block.classList.contains('meeting-amenities')) {
    decorateMeetingAmenities(block);
    return true;
  }
  if (block.classList.contains('split-list')) {
    decorateAmenities(block);
    return true;
  }
  if (block.classList.contains('intro-contact') || block.classList.contains('meetings-intro')) {
    decorateMeetingsIntro(block);
    return true;
  }
  if (block.classList.contains('intro')) {
    decorateIntro(block);
    return true;
  }
  return false;
}
