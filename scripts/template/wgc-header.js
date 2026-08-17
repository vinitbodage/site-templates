/**
 * Wyndham Grand Clearwater header enhancements.
 *
 * Applied on top of the standard header block when the page uses the wgc
 * template. Adds scroll-state styling and promotes the Book Now action.
 */

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
 * Ensures a Book Now call to action is present in the tools area.
 * @param {Element} nav the decorated nav element
 */
function ensureBookNow(nav) {
  const tools = nav.querySelector('.nav-tools');
  if (!tools) return;

  const existing = tools.querySelector('a[href*="synxis"], .wgc-book-now');
  if (existing) {
    existing.classList.add('wgc-book-now', 'button', 'primary');
    const container = existing.closest('.button-container') || existing.parentElement;
    if (container) container.classList.add('wgc-book-wrap');
    return;
  }

  const wrap = document.createElement('p');
  wrap.className = 'button-container wgc-book-wrap';
  const link = document.createElement('a');
  link.href = BOOK_URL;
  link.textContent = 'Book Now';
  link.className = 'button primary wgc-book-now';
  link.setAttribute('target', '_blank');
  link.setAttribute('rel', 'noopener noreferrer');
  wrap.append(link);
  tools.append(wrap);
}

/**
 * decorate the WGC header
 * @param {Element} block the header block element
 */
export default function decorateWgcHeader(block) {
  const header = block.closest('header');
  if (!header) return;

  header.classList.add('wgc-header');
  const nav = block.querySelector('nav');
  if (!nav) return;

  ensureBookNow(nav);
  bindScrollState(header);
}
