import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const DOCUMENT_RE = /\.(pdf|docx?|xlsx?|pptx?)(\?.*)?$/i;
const TOUR_RE = /(virtual[-\s]?tour|matterport|panoram|\b360\b)/i;

/**
 * True when a link leaves the site, so it can be opened in a new tab and
 * flagged as such rather than silently taking the planner off the page.
 * @param {Element} link the resource link
 * @returns {boolean} whether the link points at another origin
 */
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
  link.classList.add('wgc-planning-tools-link');

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
export default function decorate(block) {
  const layout = document.createElement('div');
  layout.className = 'wgc-planning-tools-layout';

  const title = document.createElement('div');
  title.className = 'wgc-planning-tools-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'wgc-planning-tools-list-wrap';

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
    list.classList.add('wgc-planning-tools-list');
    list.querySelectorAll(':scope > li').forEach(decorateItem);
  }

  splitHeading(title.querySelector('h2, h3, h4'));

  layout.append(...[title, listWrap].filter((el) => el.childElementCount));
  block.replaceChildren(layout);
}
