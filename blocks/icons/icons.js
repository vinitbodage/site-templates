import { loadCSS } from '../../scripts/aem.js';
import { decorateIconRow } from '../../scripts/template/cards-variants.js';

/**
 * Legacy icons block — benefit strip routed to cards icon-row layout.
 * @param {Element} block
 */
export default async function decorate(block) {
  block.classList.add('cards', 'icon-row');
  await loadCSS(`${window.hlx.codeBasePath}/blocks/cards/cards.css`);
  decorateIconRow(block);
}
