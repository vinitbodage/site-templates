/**
 * Wyndham Grand Clearwater header enhancements.
 *
 * Applied on top of the standard header block when the page uses the wgc
 * template. Adds scroll-state styling and normalises the tools area so Book
 * Now renders as a full-height teal bar instead of a boilerplate pill button.
 */

import { decorateBlock, loadBlock } from '../aem.js';

const BOOK_URL = 'https://be-p2.synxis.com/?chain=5136&hotel=80554&src=SBE&theme=WY80554&config=WY80554';

/**
 * Adds a solid background once the visitor scrolls past the hero.
 * @param {Element} header the page header element
 */
function bindScrollState(header) {
  const onScroll = () => {
    header.classList.toggle('wgc-header-scrolled', window.scrollY > 48);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Strips boilerplate button classes from the tools area and marks Book Now.
 * @param {Element} nav the decorated nav element
 */
function normalizeTools(nav) {
  const tools = nav.querySelector('.nav-tools');
  if (!tools) return;

  tools.querySelectorAll('a.button').forEach((link) => {
    link.classList.remove('button', 'primary', 'secondary');
    const container = link.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });

  let bookLink = tools.querySelector('a[href*="synxis"], .wgc-book-now');
  if (!bookLink) {
    const wrap = document.createElement('p');
    wrap.className = 'wgc-book-wrap';
    bookLink = document.createElement('a');
    bookLink.href = BOOK_URL;
    bookLink.textContent = 'Book Now';
    bookLink.setAttribute('target', '_blank');
    bookLink.setAttribute('rel', 'noopener noreferrer');
    wrap.append(bookLink);
    tools.append(wrap);
  }

  bookLink.classList.add('wgc-book-now');
  const bookWrap = bookLink.closest('p') || bookLink.parentElement;
  if (bookWrap) bookWrap.classList.add('wgc-book-wrap');
}

/**
 * Builds and loads the theme-option block next to Book Now.
 * @param {Element} nav the decorated nav element
 */
async function injectThemeOption(nav) {
  const tools = nav.querySelector('.nav-tools');
  if (!tools || tools.querySelector('.theme-option')) return;

  const bookWrap = tools.querySelector('.wgc-book-wrap');
  const wrap = document.createElement('p');
  wrap.className = 'theme-option-wrap';
  const themeBlock = document.createElement('div');
  themeBlock.className = 'theme-option';
  wrap.append(themeBlock);

  if (bookWrap) {
    tools.insertBefore(wrap, bookWrap);
  } else {
    tools.append(wrap);
  }

  decorateBlock(themeBlock);
  await loadBlock(themeBlock);
}

/**
 * decorate the WGC header
 * @param {Element} block the header block element
 */
export default async function decorateWgcHeader(block) {
  const header = block.closest('header');
  if (!header) return;

  header.classList.add('wgc-header');
  const nav = block.querySelector('nav');
  if (!nav) return;

  normalizeTools(nav);
  await injectThemeOption(nav);
  bindScrollState(header);
}
