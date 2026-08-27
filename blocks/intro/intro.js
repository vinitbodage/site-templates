import { decorateFeature } from '../../scripts/template/columns-variants.js';

/**
 * Legacy intro block — image + copy band routed to columns feature layout.
 * @param {Element} block
 */
export default function decorate(block) {
  block.classList.add('columns', 'feature');
  decorateFeature(block);
}
