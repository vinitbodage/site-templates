/*
 * Accordion Block
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * Supports standard two-column rows (summary + body) and media rows where
 * the first cell is an image, the second is the title, and an optional third
 * cell is the body.
 */

import {
  getRows, getCells, isEmpty, optimizePicture, splitHeading,
} from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * @param {Element} el
 */
function unwrapParagraph(el) {
  const p = el.childElementCount === 1 ? el.querySelector(':scope > p') : null;
  if (p) el.replaceChildren(...p.childNodes);
}

/**
 * @param {Element} row
 * @returns {boolean}
 */
function isHeadingRow(row) {
  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  if (!cells.length) return false;
  if (cells.some((cell) => cell.querySelector('picture, img'))) return false;
  return cells.some((cell) => cell.querySelector('h1, h2, h3, h4'));
}

/**
 * @param {Element} row
 * @returns {Element}
 */
function decorateHeading(row) {
  const header = document.createElement('div');
  header.className = 'accordion-header';
  moveInstrumentation(row, header);

  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  const eyebrowCell = cells.length > 1 ? cells[0] : null;
  const headingCell = cells.length > 1 ? cells[1] : cells[0];

  if (eyebrowCell && !eyebrowCell.querySelector('h1, h2, h3, h4')) {
    const eyebrow = document.createElement('p');
    eyebrow.className = 'accordion-eyebrow';
    moveInstrumentation(eyebrowCell, eyebrow);
    eyebrow.append(...eyebrowCell.childNodes);
    unwrapParagraph(eyebrow);
    header.append(eyebrow);
  }

  if (headingCell) {
    const heading = headingCell.querySelector('h1, h2, h3, h4')
      || document.createElement('h2');
    if (!headingCell.querySelector('h1, h2, h3, h4')) {
      moveInstrumentation(headingCell, heading);
      heading.append(...headingCell.childNodes);
    } else {
      moveInstrumentation(headingCell, heading);
    }
    unwrapParagraph(heading);
    header.append(heading);
  }

  return header;
}

/**
 * Builds a standard two-column accordion item.
 * @param {Element} row authored row
 * @returns {Element}
 */
function decorateStandardItem(row) {
  const label = row.children[0];
  const summary = document.createElement('summary');
  summary.className = 'accordion-item-label';
  summary.append(...label.childNodes);

  const body = row.children[1];
  body.className = 'accordion-item-body';

  const details = document.createElement('details');
  details.className = 'accordion-item';
  details.append(summary, body);
  return details;
}

/**
 * Builds a media accordion item (image + title in summary, body below).
 * @param {Element} row authored row
 * @param {Element} block
 * @returns {Element}
 */
function decorateMediaItem(row, block) {
  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
  const textCells = cells.filter((cell) => cell !== imageCell);
  const titleCell = textCells[0];
  const bodyCell = textCells[1];

  const details = document.createElement('details');
  details.className = 'accordion-item';
  moveInstrumentation(row, details);

  const summary = document.createElement('summary');
  summary.className = 'accordion-item-label accordion-item-summary';

  if (imageCell) {
    imageCell.className = 'accordion-item-media';
    summary.append(imageCell);
  }

  const title = document.createElement('div');
  title.className = 'accordion-item-title';
  if (titleCell) {
    moveInstrumentation(titleCell, title);
    title.append(...titleCell.childNodes);
    title.querySelectorAll('h1, h2, h3, h4').forEach((heading) => splitHeading(heading));
  }
  summary.append(title);

  if (bodyCell) {
    bodyCell.className = 'accordion-item-body';
    details.append(summary, bodyCell);
  } else {
    details.append(summary);
  }

  details.addEventListener('toggle', () => {
    if (!details.open) return;
    block.querySelectorAll('details.accordion-item[open]').forEach((other) => {
      if (other !== details) other.open = false;
    });
  });

  return details;
}

/**
 * True when the row uses the media accordion pattern.
 * @param {Element} row
 * @returns {boolean}
 */
function isMediaRow(row) {
  if (isHeadingRow(row)) return false;
  const cells = getCells(row);
  if (cells.length >= 3) return true;
  return cells.length >= 2 && cells[0].querySelector('picture, img');
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const rows = getRows(block).filter((row) => !getCells(row).every(isEmpty));
  const hasMedia = rows.some(isMediaRow);
  if (hasMedia) block.classList.add('media');

  const headingRow = hasMedia ? rows.find(isHeadingRow) : null;
  const itemRows = headingRow ? rows.filter((row) => row !== headingRow) : rows;

  if (headingRow) {
    const header = decorateHeading(headingRow);
    if (header.childElementCount) {
      headingRow.replaceWith(header);
      block.prepend(header);
    } else {
      headingRow.remove();
    }
  }

  itemRows.forEach((row) => {
    const item = isMediaRow(row)
      ? decorateMediaItem(row, block)
      : decorateStandardItem(row);
    row.replaceWith(item);
  });

  if (hasMedia) {
    block.querySelectorAll('.accordion-item-media picture > img').forEach((img) => {
      optimizePicture(img, { width: '800' });
    });
  }
}
