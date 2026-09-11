import { decorateIntro } from '../../scripts/template/columns-variants.js';

/**
 * Centered intro band — matches the reference intro-container layout
 * (hotel-info and similar interior pages).
 * @param {Element} block
 */
export default function decorate(block) {
  block.classList.add('columns', 'intro');
  decorateIntro(block);
}
