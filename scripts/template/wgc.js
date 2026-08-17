/*
 * Shared helpers for the Wyndham Grand Clearwater ("wgc") template blocks.
 *
 * These exist so the five template blocks read the authored structure the same
 * way. Anything used by only one block stays in that block.
 */

import { createOptimizedPicture } from '../aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

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
 * True when a cell holds no meaningful authored content, so blocks can treat
 * an empty cell as "not provided" rather than rendering an empty wrapper.
 * @param {Element} cell a block cell
 * @returns {boolean} whether the cell is empty
 */
export function isEmpty(cell) {
  if (!cell) return true;
  if (cell.querySelector('picture, img, a, video, iframe')) return false;
  return !cell.textContent.trim();
}

/**
 * Converts the emphasised run at the start of a heading into a styled span so
 * the template can render the brand's two-tone headline. Authors italicise the
 * first words; without italics the heading is left untouched.
 * @param {Element} heading a heading element
 */
export function splitHeading(heading) {
  const em = heading && heading.querySelector('em, i');
  if (!em) return;
  const lead = document.createElement('span');
  lead.className = 'wgc-headline-lead';
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
  heading.classList.add('wgc-rule');
  if (centered) heading.classList.add('wgc-rule-centered');
  if (light) heading.classList.add('wgc-rule-light');
}

/**
 * Replaces an authored image with a pipeline-optimized picture.
 *
 * Cross-origin images and SVGs are left alone. The AEM image pipeline can only
 * resize assets it serves, so appending its parameters to a third-party URL
 * produces a source that advertises webp while the CDN returns the original;
 * SVGs have nothing to resize. Both still get an explicit loading hint.
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
