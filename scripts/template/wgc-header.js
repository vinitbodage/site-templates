/**
 * Wyndham Grand Clearwater header enhancements.
 *
 * Applied on top of the standard header block when the page uses the wgc
 * template. Adds scroll-state styling and normalises the tools area so Book
 * Now renders as a full-height teal bar instead of a boilerplate pill button.
 */

import { buildBlock, decorateBlock, loadBlock } from '../aem.js';

const BOOK_URL = 'https://be-p2.synxis.com/?chain=5136&hotel=80554&src=SBE&theme=WY80554&config=WY80554';

/**
 * Removes legacy theme-option blocks from the nav tools area.
 * @param {Element} nav the decorated nav element
 */
function stripThemeOption(nav) {
  nav.querySelectorAll('.theme-option, .theme-option-wrap').forEach((el) => {
    el.remove();
  });
}

/**
 * Ensures the book CTA wrapper is a div — block-level picker markup is invalid
 * inside a paragraph and the browser will reparent it, breaking alignment.
 * @param {Element} bookLink the book now anchor
 * @returns {Element|null}
 */
function ensureBookWrap(bookLink) {
  if (!bookLink) return null;

  let wrap = bookLink.closest('.wgc-book-wrap');
  if (wrap && wrap.tagName !== 'P') {
    return wrap;
  }

  const paragraph = wrap?.tagName === 'P' ? wrap : bookLink.closest('p');
  const div = document.createElement('div');
  div.className = 'wgc-book-wrap';

  if (paragraph) {
    paragraph.replaceWith(div);
    div.append(bookLink);
    return div;
  }

  if (bookLink.parentElement?.classList.contains('wgc-book-wrap')) {
    return bookLink.parentElement;
  }

  bookLink.replaceWith(div);
  div.append(bookLink);
  return div;
}

/**
 * Inserts the theme picker immediately beside Book Now inside the book wrap.
 * @param {Element} bookWrap
 * @param {Element} bookLink
 * @param {Element} pickerWrap
 */
function attachPickerToBook(bookWrap, bookLink, pickerWrap) {
  if (!bookWrap || !bookLink || !pickerWrap) return;
  pickerWrap.remove();
  bookLink.before(pickerWrap);
  if (!bookWrap.contains(pickerWrap)) {
    bookWrap.insertBefore(pickerWrap, bookLink);
  }
}

/**
 * Groups phone, book now, and theme picker on one horizontal row.
 * @param {Element} nav the decorated nav element
 */
function normalizeToolsRow(nav) {
  const tools = nav.querySelector('.nav-tools');
  if (!tools) return;

  let row = tools.querySelector('.wgc-tools-row');
  if (!row) {
    row = document.createElement('div');
    row.className = 'wgc-tools-row';
    tools.append(row);
  }

  const phoneLink = tools.querySelector('a[href^="tel:"]');
  const phoneEl = phoneLink?.closest('p, .wgc-phone');
  if (phoneEl && !row.contains(phoneEl)) {
    phoneEl.classList.add('wgc-phone');
    row.append(phoneEl);
  }

  const bookWrap = tools.querySelector('.wgc-book-wrap');
  if (bookWrap && !row.contains(bookWrap)) {
    row.append(bookWrap);
  }

  const bookLink = bookWrap?.querySelector('.wgc-book-now, a[href*="synxis"], a[href="#book"]');
  tools.querySelectorAll('.theme-picker-wrapper').forEach((pickerWrap) => {
    if (bookWrap && bookLink) {
      attachPickerToBook(bookWrap, bookLink, pickerWrap);
    }
  });
}

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

  let bookLink = tools.querySelector('a[href*="synxis"], .wgc-book-now, a[href="#book"]');
  if (!bookLink) {
    const wrap = document.createElement('div');
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
  ensureBookWrap(bookLink);
  normalizeToolsRow(nav);
}

/**
 * Mounts the theme picker beside Book Now in the header tools.
 * @param {Element} nav the decorated nav element
 */
async function mountThemePicker(nav) {
  if (nav.querySelector('.theme-picker')) return;

  stripThemeOption(nav);

  const tools = nav.querySelector('.nav-tools');
  if (!tools) return;

  const pickerWrap = document.createElement('div');
  pickerWrap.className = 'theme-picker-wrapper';
  const picker = buildBlock('theme-picker', '');
  pickerWrap.append(picker);

  let bookLink = tools.querySelector('a[href*="synxis"], .wgc-book-now, a[href="#book"]');
  const bookWrap = ensureBookWrap(bookLink);
  bookLink = bookWrap?.querySelector('.wgc-book-now, a[href*="synxis"], a[href="#book"]');
  if (bookWrap && bookLink) {
    attachPickerToBook(bookWrap, bookLink, pickerWrap);
  } else {
    (tools.querySelector('.wgc-tools-row') || tools).append(pickerWrap);
  }

  decorateBlock(picker);
  await loadBlock(picker);
  normalizeToolsRow(nav);
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

  stripThemeOption(nav);
  normalizeTools(nav);
  await mountThemePicker(nav);
  normalizeToolsRow(nav);
  bindScrollState(header);
}
