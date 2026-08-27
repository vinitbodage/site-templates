import { decorateIconRow } from '../../scripts/template/cards-variants.js';

/**
 * Legacy icons block — benefit strip routed to cards icon-row layout.
 * @param {Element} block
 */
export default function decorate(block) {
  block.classList.add('cards', 'icon-row');
  decorateIconRow(block);
}
