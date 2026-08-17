/*
 * Shared helpers for the Wyndham Grand Rio Mar ("wrm") template blocks.
 */

import { createOptimizedPicture } from '../aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

export { moveInstrumentation };

/**
 * Returns the authored rows of a block.
 * @param {Element} block the block element
 * @returns {Element[]} the row elements
 */
export function getRows(block) {
  return [...block.querySelectorAll(':scope > div')];
}

/**
 * Returns the authored cells of a row.
 * @param {Element} row a block row
 * @returns {Element[]} the cell elements
 */
export function getCells(row) {
  return [...row.querySelectorAll(':scope > div')];
}

/**
 * True when a cell holds no meaningful authored content.
 * @param {Element} cell a block cell
 * @returns {boolean} whether the cell is empty
 */
export function isEmpty(cell) {
  if (!cell) return true;
  if (cell.querySelector('picture, img, a, video, iframe')) return false;
  return !cell.textContent.trim();
}

/**
 * Converts the emphasised run at the start of a heading into a styled span.
 * @param {Element} heading a heading element
 */
export function splitHeading(heading) {
  const em = heading && heading.querySelector('em, i');
  if (!em) return;
  const lead = document.createElement('span');
  lead.className = 'wrm-headline-lead';
  lead.append(...em.childNodes);
  em.replaceWith(lead);
}

/**
 * Adds the brand hairline rule to a heading.
 * @param {Element} heading a heading element
 * @param {object} options rule options
 * @param {boolean} options.centered whether the rule is centred under the text
 * @param {boolean} options.light whether the rule is drawn in white
 */
export function addRule(heading, { centered = false, light = false } = {}) {
  if (!heading) return;
  heading.classList.add('wrm-rule');
  if (centered) heading.classList.add('wrm-rule-centered');
  if (light) heading.classList.add('wrm-rule-light');
}

/**
 * Replaces an authored image with a pipeline-optimized picture.
 * @param {Element} img the authored image
 * @param {object} options optimization options
 * @param {boolean} options.eager whether the image loads eagerly
 * @param {string} options.width the target width in pixels
 */
export function optimizePicture(img, { eager = false, width = '750' } = {}) {
  const picture = img.closest('picture');
  if (!picture) return;

  const { origin } = new URL(img.src, window.location.href);
  const optimizable = origin === window.location.origin
    && !img.src.toLowerCase().includes('.svg');

  if (!optimizable) {
    img.setAttribute('loading', eager ? 'eager' : 'lazy');
    return;
  }

  const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
}
