import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * A link that is the sole content of a paragraph is auto-decorated as a
 * button by the platform; footer contact and utility links should render
 * as plain text links instead.
 * @param {Element} root the subtree to clean
 */
function stripButtonClasses(root) {
  root.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary');
    link.closest('.button-container')?.classList.remove('button-container');
  });
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  // decorate footer DOM
  block.textContent = '';
  const footer = document.createElement('div');
  if (fragment) {
    while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  }

  block.append(footer);
  stripButtonClasses(block);
}
