import { getMetadata, toClassName } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

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
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);

  block.append(footer);

  const template = toClassName(getMetadata('template'));
  if (template) {
    try {
      const { default: decorateTemplateFooter } = await import(
        `${window.hlx.codeBasePath}/scripts/template/${template}-footer.js`
      );
      decorateTemplateFooter(block);
    } catch (e) {
      // this template ships no footer script of its own
    }
  }
}
