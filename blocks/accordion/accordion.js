/*
 * Accordion Block
 * https://www.hlx.live/developer/block-collection/accordion
 *
 * Supports standard two-column rows (summary + body) and media rows where
 * the first cell is an image, the second is the title, and an optional third
 * cell is the body (Wyndham Grand Clearwater pattern).
 */

import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

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
 * @returns {Element}
 */
function decorateMediaItem(row) {
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
  }
  summary.append(title);

  if (bodyCell) {
    bodyCell.className = 'accordion-item-body';
    details.append(summary, bodyCell);
  } else {
    details.append(summary);
  }

  return details;
}

/**
 * True when the row uses the media accordion pattern.
 * @param {Element} row
 * @returns {boolean}
 */
function isMediaRow(row) {
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

  rows.forEach((row) => {
    const item = isMediaRow(row) ? decorateMediaItem(row) : decorateStandardItem(row);
    row.replaceWith(item);
  });

  if (document.body.classList.contains('wgc')) {
    block.querySelectorAll('details.accordion-item').forEach((details) => {
      details.addEventListener('toggle', () => {
        if (!details.open) return;
        block.querySelectorAll('details.accordion-item[open]').forEach((other) => {
          if (other !== details) other.open = false;
        });
      });
    });

    block.querySelectorAll('.accordion-item-media picture > img').forEach((img) => {
      optimizePicture(img, { width: '800' });
    });
  }
}
