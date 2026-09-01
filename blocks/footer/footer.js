import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * A link that is the sole content of a paragraph is auto-decorated as a
 * button by the platform; footer contact and utility links should render
 * as plain text links instead.
 * @param {Element} root the subtree to clean
 */
function stripButtonClasses(root) {
  root.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary');
    link.closest('.button-container')?.classList.remove('button-container');
  });
}

/**
 * Splits flat footer content into columns at each h3 heading.
 * da.live often authors all panels in one section; this groups them for layout.
 * @param {Element} container the wrapper holding the flat content
 * @returns {Element|null} the column grid, or null if not splittable
 */
function buildFooterColumnGrid(container) {
  const headings = [...container.querySelectorAll(':scope > h3')];
  if (headings.length < 2) return null;

  const grid = document.createElement('div');
  grid.className = 'footer-columns';

  headings.forEach((heading, index) => {
    const column = document.createElement('div');
    column.className = 'footer-column';
    column.append(heading);

    const stopBefore = headings[index + 1];
    let sibling = column.lastElementChild.nextElementSibling;
    while (sibling && sibling !== stopBefore) {
      const next = sibling.nextElementSibling;
      column.append(sibling);
      sibling = next;
    }

    grid.append(column);
  });

  return grid;
}

/**
 * Lays out template2 footer columns side by side for common authoring patterns.
 * @param {Element} root the footer block element
 */
function layoutTemplate2Footer(root) {
  if (!document.body.classList.contains('template2')) return;

  const sections = [...root.children].filter((el) => el.classList.contains('section'));
  if (!sections.length) return;

  const [firstSection, ...restSections] = sections;
  const columnDivs = [...firstSection.children].filter((el) => el.tagName === 'DIV');

  if (columnDivs.length >= 3 && !firstSection.querySelector('.footer-columns')) {
    firstSection.classList.add('footer-columns-section');
  } else {
    const flatHost = firstSection.querySelector('.default-content-wrapper') || firstSection;
    const grid = buildFooterColumnGrid(flatHost);
    if (grid) {
      flatHost.replaceChildren(grid);
      firstSection.classList.add('footer-columns-section');
    } else if (sections.length >= 3) {
      root.classList.add('footer-multi-section');
    }
  }

  const legalSection = restSections.find((section) => !section.querySelector('h2, h3, h4, h5'));
  legalSection?.classList.add('footer-legal');
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // Append fragment sections directly on the block so template2 footer CSS can target them.
  block.textContent = '';
  if (fragment) {
    while (fragment.firstElementChild) block.append(fragment.firstElementChild);
  }

  layoutTemplate2Footer(block);
  stripButtonClasses(block);
}
