/**
 * Wyndham Grand Clearwater header enhancements.
 *
 * Applied on top of the standard header block when the page uses the wgc
 * template. Adds scroll-state styling and normalises the tools area so Book
 * Now opens the booking modal instead of navigating away.
 */

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

  let bookLink = tools.querySelector('a[href*="synxis"], .wgc-book-now, [data-book-now]');
  if (!bookLink) {
    const wrap = document.createElement('p');
    wrap.className = 'wgc-book-wrap';
    bookLink = document.createElement('a');
    bookLink.href = '#';
    bookLink.textContent = 'Book Now';
    wrap.append(bookLink);
    tools.append(wrap);
  }

  bookLink.href = '#';
  bookLink.removeAttribute('target');
  bookLink.removeAttribute('rel');
  bookLink.classList.add('wgc-book-now');
  bookLink.dataset.bookNow = '';
  const bookWrap = bookLink.closest('p') || bookLink.parentElement;
  if (bookWrap) bookWrap.classList.add('wgc-book-wrap');
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

  normalizeTools(nav);
  bindScrollState(header);
}
