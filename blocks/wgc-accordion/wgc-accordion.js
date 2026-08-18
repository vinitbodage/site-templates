import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * True when a row is the optional block heading rather than an accordion
 * item. Prefers the authored component id (present whenever the row came
 * from a "WGC Accordion Heading" resource) so an item that has no image yet
 * is never mistaken for the heading; the image check is only a fallback for
 * markup without that instrumentation (e.g. hand-authored test content).
 * @param {Element} row an authored row
 * @returns {boolean} whether the row is the heading
 */
function isHeadingRow(row) {
  const component = row.getAttribute('data-aue-component');
  if (component) return component === 'wgc-accordion-heading';
  return !row.querySelector('picture, img');
}

/**
 * Unwraps a lone paragraph so heading/title text is not nested in a `<p>`.
 * @param {Element} el the element that may contain a single paragraph
 */
function unwrapParagraph(el) {
  const p = el.childElementCount === 1 ? el.querySelector(':scope > p') : null;
  if (p) el.replaceChildren(...p.childNodes);
}

/**
 * Builds the centred eyebrow + heading from the first non-image row.
 * @param {Element} row the authored heading row
 * @returns {Element} the heading wrapper
 */
function decorateHeading(row) {
  const header = document.createElement('div');
  header.className = 'wgc-accordion-header';
  moveInstrumentation(row, header);

  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  const eyebrowCell = cells.length > 1 ? cells[0] : null;
  const headingCell = cells.length > 1 ? cells[1] : cells[0];

  if (eyebrowCell) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'wgc-accordion-eyebrow';
    moveInstrumentation(eyebrowCell, eyebrow);
    eyebrow.append(...eyebrowCell.childNodes);
    unwrapParagraph(eyebrow);
    header.append(eyebrow);
  }

  if (headingCell) {
    const heading = document.createElement('h2');
    moveInstrumentation(headingCell, heading);
    heading.append(...headingCell.childNodes);
    unwrapParagraph(heading);
    header.append(heading);
  }

  return header;
}

/**
 * Builds one exclusive `<details>` item from an authored row.
 * @param {Element} row the authored item row
 * @param {Element} block the accordion block
 * @returns {Element} the details element
 */
function decorateItem(row, block) {
  const details = document.createElement('details');
  details.className = 'wgc-accordion-item';
  moveInstrumentation(row, details);

  const cells = getCells(row);
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const textCells = cells.filter((cell) => cell !== imageCell && !isEmpty(cell));
  const titleCell = textCells[0];
  const bodyCell = textCells[1] || cells.find((cell) => cell !== imageCell && cell !== titleCell);

  const summary = document.createElement('summary');
  summary.className = 'wgc-accordion-trigger';

  if (imageCell && !isEmpty(imageCell)) {
    imageCell.className = 'wgc-accordion-media';
    summary.append(imageCell);
  }

  const title = document.createElement('div');
  title.className = 'wgc-accordion-title';
  if (titleCell) {
    moveInstrumentation(titleCell, title);
    title.append(...titleCell.childNodes);
  }
  summary.append(title);
  details.append(summary);

  if (bodyCell) {
    bodyCell.className = 'wgc-accordion-body';
    details.append(bodyCell);
  }

  details.addEventListener('toggle', () => {
    if (!details.open) return;
    block.querySelectorAll('details.wgc-accordion-item[open]').forEach((other) => {
      if (other !== details) other.open = false;
    });
  });

  return details;
}

/**
 * decorate the block
 *
 * An optional "WGC Accordion Heading" row is the eyebrow and heading (always
 * shown at the top). Each remaining row is one item: image, title, and the
 * rich-text body revealed when that item is opened. Only one item can be
 * open at a time.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const rows = getRows(block).filter((row) => !getCells(row).every(isEmpty));
  const headingRow = rows.find(isHeadingRow);
  const itemRows = rows.filter((row) => row !== headingRow);

  if (headingRow) {
    const header = decorateHeading(headingRow);
    if (header.childElementCount) headingRow.replaceWith(header);
    else headingRow.remove();
  }

  itemRows.forEach((row) => {
    row.replaceWith(decorateItem(row, block));
  });

  if (headingRow) {
    const header = block.querySelector('.wgc-accordion-header');
    if (header) block.prepend(header);
  }

  block.querySelectorAll('.wgc-accordion-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '800' });
  });
}
