/*
 * Helpers shared across every template's blocks.
 *
 * Kept free of any brand-specific class names so new templates can reuse them
 * without pulling in another template's visual language.
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
  if (cell.querySelector('picture, img, a, video, iframe, input, select, textarea, button')) {
    return false;
  }
  return !cell.textContent.trim();
}

/**
 * Replaces an authored image with a pipeline-optimized picture.
 *
 * Cross-origin images and SVGs are left alone. The AEM image pipeline can only
 * resize assets it serves, so appending its parameters to a third-party URL
 * produces a source that advertises webp while the CDN returns the original;
 * SVGs have nothing to resize. Both still get an explicit loading hint.
 *
 * An eager image is the page's LCP candidate, so it also gets
 * `fetchpriority="high"` to pull it ahead of the lazy images and stylesheets
 * competing for the same connection.
 * @param {Element} img the authored image
 * @param {object} options optimization options
 * @param {boolean} options.eager whether the image loads eagerly
 * @param {string} options.width the target width in pixels
 */
export function optimizePicture(img, { eager = false, width = '750' } = {}) {
  const applyLoadingHints = (target) => {
    target.setAttribute('loading', eager ? 'eager' : 'lazy');
    target.setAttribute('decoding', eager ? 'sync' : 'async');
    if (eager) target.setAttribute('fetchpriority', 'high');
  };

  const picture = img.closest('picture');
  const { origin } = new URL(img.src, window.location.href);
  const optimizable = picture
    && origin === window.location.origin
    && !img.src.toLowerCase().includes('.svg');

  // a bare <img>, an off-origin image or an SVG keeps its own element
  if (!optimizable) {
    applyLoadingHints(img);
    return;
  }

  const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  const optimizedImg = optimized.querySelector('img');
  applyLoadingHints(optimizedImg);
  moveInstrumentation(img, optimizedImg);
  picture.replaceWith(optimized);
}

/**
 * Builds heading helpers (two-tone headline splitting + hairline rule).
 * Theme look is applied in CSS via `body.template2`.
 * @returns {{splitHeading: Function, addRule: Function}} the heading helpers
 */
export function createHeadingHelpers() {
  /**
   * Converts the emphasised run at the start of a heading into a styled span
   * so the template can render a two-tone headline. Authors italicise the
   * first words; without italics the heading is left untouched.
   * @param {Element} heading a heading element
   */
  function splitHeading(heading) {
    const em = heading && heading.querySelector('em, i');
    if (!em) return;
    const lead = document.createElement('span');
    lead.className = 'headline-lead';
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
  function addRule(heading, { centered = false, light = false } = {}) {
    if (!heading) return;
    heading.classList.add('headline-rule');
    if (centered) heading.classList.add('headline-rule-centered');
    if (light) heading.classList.add('headline-rule-light');
  }

  return { splitHeading, addRule };
}

/**
 * Returns the shared row/cell helpers plus heading helpers.
 * Theme look is applied in CSS via `body.template2`.
 * @returns {object} row/cell helpers plus heading helpers
 */
export function getTemplateHelpers() {
  return {
    getRows,
    getCells,
    isEmpty,
    optimizePicture,
    ...createHeadingHelpers(),
  };
}
