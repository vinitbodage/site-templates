import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Turns a lone link back into a plain nav label. Platform decoration promotes
 * a paragraph that holds only a link into a button.
 * @param {Element} root the subtree to clean
 */
function stripButtons(root) {
  root.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary');
    link.closest('.button-container')?.classList.remove('button-container');
  });
}

/**
 * Path and hash of an href, so in-page hash links do not all match the page.
 * @param {string} href a URL or path
 * @returns {{path: string, hash: string}} the comparable parts
 */
function toParts(href) {
  try {
    const url = new URL(href, window.location.href);
    return {
      path: url.pathname.replace(/\.html$/i, '').replace(/\/$/, '') || '/',
      hash: url.hash,
    };
  } catch {
    return { path: '', hash: '' };
  }
}

/**
 * decorate the block
 *
 * Each row is a section: the first cell is the parent label (optional link),
 * the second cell is the nested list. The group that matches the current page
 * opens and the matching link is marked current.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const { getRows, getCells, isEmpty } = getTemplateHelpers();
  stripButtons(block);

  const nav = document.createElement('nav');
  nav.className = 'side-nav-menu';
  nav.setAttribute('aria-label', 'Section');

  const current = toParts(window.location.href);

  getRows(block).forEach((row) => {
    const [labelCell, childrenCell] = getCells(row);
    if (isEmpty(labelCell)) return;

    const details = document.createElement('details');
    details.className = 'side-nav-item';
    moveInstrumentation(row, details);

    const summary = document.createElement('summary');
    summary.className = 'side-nav-label';
    summary.append(...labelCell.childNodes);
    stripButtons(summary);

    const body = document.createElement('div');
    body.className = 'side-nav-children';
    if (childrenCell && !isEmpty(childrenCell)) {
      body.append(...childrenCell.childNodes);
      stripButtons(body);
    }

    details.append(summary, body);

    const links = [...details.querySelectorAll('a')].map((link) => ({
      link,
      ...toParts(link.href),
    }));
    const onThisPage = links.filter(({ path }) => path === current.path);
    if (onThisPage.length) {
      details.open = true;
      details.classList.add('is-current');
      const match = current.hash
        ? onThisPage.find(({ hash }) => hash === current.hash)
        : onThisPage.find(({ hash }) => !hash) || onThisPage[0];
      match?.link.setAttribute('aria-current', 'page');
    }

    nav.append(details);
  });

  block.replaceChildren(nav);
}
