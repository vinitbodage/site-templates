import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Marks the link matching the current page as active.
 * @param {Element} root the decorated subtree
 */
function markActiveLinks(root) {
  root.querySelectorAll('a[href]').forEach((link) => {
    try {
      const href = new URL(link.href, window.location.href);
      const current = new URL(window.location.href);
      const linkParams = href.searchParams.toString();
      const currentParams = current.searchParams.toString();
      const samePath = href.pathname === current.pathname;
      const sameQuery = linkParams === currentParams;
      const isAllLink = !linkParams && !currentParams;

      if (samePath && (sameQuery || (isAllLink && link.textContent.trim().toLowerCase().startsWith('all')))) {
        link.classList.add('is-active');
        link.setAttribute('aria-current', 'page');
      }
    } catch {
      // ignore malformed authored links
    }
  });
}

/**
 * Default filter list — label + inline link options.
 * @param {Element} block the block
 */
function decorateDefault(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();
  const bar = document.createElement('div');
  bar.className = 'news-filters-bar';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    if (!cells.length) return;

    const group = document.createElement('div');
    group.className = 'news-filters-group';
    moveInstrumentation(row, group);

    if (cells.length === 1) {
      cells[0].classList.add('news-filters-options');
      group.append(cells[0]);
    } else {
      cells[0].classList.add('news-filters-label');
      cells[1].classList.add('news-filters-options');
      group.append(cells[0], cells[1]);
    }

    bar.append(group);
  });

  markActiveLinks(bar);
  block.replaceChildren(bar);
}

/**
 * Builds a dropdown filter from label and option cells.
 * @param {Element} labelCell the summary label cell
 * @param {Element} optionsCell the panel links cell
 * @returns {Element} the dropdown element
 */
function buildDropdown(labelCell, optionsCell) {
  const dropdown = document.createElement('details');
  dropdown.className = 'news-filters-dropdown';

  const summary = document.createElement('summary');
  summary.className = 'news-filters-dropdown-label';
  summary.innerHTML = labelCell.innerHTML;

  const panel = document.createElement('div');
  panel.className = 'news-filters-dropdown-panel';
  [...optionsCell.childNodes].forEach((node) => panel.append(node));

  dropdown.append(summary, panel);
  return dropdown;
}

/**
 * Builds the search control from an authored input cell.
 * @param {Element} cell the search cell
 * @returns {Element} the search form
 */
function buildSearch(cell) {
  const form = document.createElement('form');
  form.className = 'news-filters-search';
  form.setAttribute('role', 'search');

  const input = cell.querySelector('input');
  if (input) {
    const icon = document.createElement('span');
    icon.className = 'news-filters-search-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M16.9,15.5c2.4-3.2,2.2-7.7-0.7-10.6c-3.1-3.1-8.1-3.1-11.3,0c-3.1,3.2-3.1,8.3,0,11.4 c2.9,2.9,7.5,3.1,10.6,0.6c0,0.1,0,0.1,0,0.1l4.2,4.2c0.5,0.4,1.1,0.4,1.5,0c0.4-0.4,0.4-1,0-1.4L16.9,15.5 C16.9,15.5,16.9,15.5,16.9,15.5L16.9,15.5z M14.8,6.3c2.3,2.3,2.3,6.1,0,8.5c-2.3,2.3-6.1,2.3-8.5,0C4,12.5,4,8.7,6.3,6.3 C8.7,4,12.5,4,14.8,6.3z"/></svg>';

    form.addEventListener('submit', (event) => {
      event.preventDefault();
    });

    form.append(icon, input);
    return form;
  }

  form.innerHTML = cell.innerHTML;
  return form;
}

/**
 * Toolbar header — title, dropdown filters, and search on one row.
 * @param {Element} block the block
 */
function decorateToolbar(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();
  const toolbar = document.createElement('div');
  toolbar.className = 'news-filters-toolbar';
  const controls = document.createElement('div');
  controls.className = 'news-filters-controls';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    if (!cells.length) return;

    if (cells.length === 1) {
      const heading = cells[0].querySelector('h1, h2, h3');
      if (heading) {
        heading.classList.add('news-filters-title');
        toolbar.append(heading);
        return;
      }
      if (cells[0].querySelector('input')) {
        controls.append(buildSearch(cells[0]));
      }
      return;
    }

    controls.append(buildDropdown(cells[0], cells[1]));
  });

  toolbar.append(controls);
  markActiveLinks(toolbar);

  toolbar.querySelectorAll('.news-filters-dropdown').forEach((dropdown) => {
    dropdown.addEventListener('toggle', () => {
      if (!dropdown.open) return;
      toolbar.querySelectorAll('.news-filters-dropdown[open]').forEach((open) => {
        if (open !== dropdown) open.open = false;
      });
    });
  });

  const divider = document.createElement('hr');
  divider.className = 'news-filters-divider';
  block.replaceChildren(toolbar, divider);
}

/**
 * Filter bar for the Axalta newsroom.
 * Classes: toolbar (header row), types (news-type links).
 * @param {Element} block the block
 */
export default function decorate(block) {
  if (block.classList.contains('toolbar')) {
    decorateToolbar(block);
    return;
  }

  decorateDefault(block);
}
