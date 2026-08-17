/**
 * Wyndham Grand Rio Mar header enhancements.
 */

const BOOK_URL = 'https://be.synxis.com/?Hotel=80555&Chain=5136';

/**
 * Adds a solid background once the visitor scrolls past the hero.
 * @param {Element} header the page header element
 */
function bindScrollState(header) {
  const onScroll = () => {
    header.classList.toggle('wrm-header-scrolled', window.scrollY > 48);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Ensures a Reservations call to action is present in the tools area.
 * @param {Element} nav the decorated nav element
 */
function ensureBookNow(nav) {
  const tools = nav.querySelector('.nav-tools');
  if (!tools) return;

  const existing = tools.querySelector('a[href*="synxis"], .wrm-book-now');
  if (existing) {
    existing.classList.add('wrm-book-now', 'button', 'primary');
    const container = existing.closest('.button-container') || existing.parentElement;
    if (container) container.classList.add('wrm-book-wrap');
    return;
  }

  const wrap = document.createElement('p');
  wrap.className = 'button-container wrm-book-wrap';
  const link = document.createElement('a');
  link.href = BOOK_URL;
  link.textContent = 'Reservations';
  link.className = 'button primary wrm-book-now';
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  wrap.append(link);
  tools.append(wrap);
}

/**
 * decorate the WRM header
 * @param {Element} block the header block element
 */
export default function decorateWrmHeader(block) {
  const header = block.closest('header');
  if (!header) return;

  header.classList.add('wrm-header');
  const nav = block.querySelector('nav');
  if (!nav) return;

  ensureBookNow(nav);
  bindScrollState(header);
}
