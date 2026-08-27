import {
  splitHeading, addRule, getRows, getCells, isEmpty,
} from '../../scripts/template/shared.js';
import { decorateColumnVariants } from '../../scripts/template/columns-variants.js';
import decorateAccordion from '../accordion/accordion.js';

/**
 * @param {Element} row
 * @returns {boolean}
 */
function isMediaAccordionRow(row) {
  const cells = getCells(row);
  if (cells.length >= 3) return true;
  return cells.length >= 2 && cells[0].querySelector('picture, img');
}

/**
 * Authors sometimes place the section title outside the columns block (e.g. Top
 * Reasons). Pull a preceding h2 into the block so accordion can style it.
 * @param {Element} block
 */
function promoteAccordionHeading(block) {
  const parent = block.parentElement;
  if (!parent || block.querySelector('h1, h2, h3, h4')) return;

  const heading = parent.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4');
  if (!heading) return;

  const row = document.createElement('div');
  const cell = document.createElement('div');
  cell.append(heading);
  row.append(cell);
  block.prepend(row);
}

/**
 * Media accordion rows authored inside a generic columns block (legacy pages).
 * @param {Element} block
 * @returns {boolean}
 */
function shouldUseMediaAccordion(block) {
  if (!document.body.classList.contains('template1')) return false;

  const rows = getRows(block).filter((row) => !getCells(row).every(isEmpty));
  const mediaRows = rows.filter(isMediaAccordionRow);
  return mediaRows.length >= 2;
}

export default function decorate(block) {
  if (shouldUseMediaAccordion(block)) {
    promoteAccordionHeading(block);
    block.classList.add('accordion', 'media');
    decorateAccordion(block);
    return;
  }

  if (decorateColumnVariants(block)) {
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (document.body.classList.contains('template1')) {
    block.querySelectorAll('h1, h2, h3').forEach((heading) => {
      splitHeading(heading);
      addRule(heading);
    });
  }
}
