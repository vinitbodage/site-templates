/**
 * "Template2" hotel-business header enhancements.
 *
 * Applied on top of the standard header block when the page uses the
 * template2 theme. The header is a solid navy bar at all scroll positions;
 * scrolling only adds a drop shadow for depth, and the reserve link is
 * promoted to a distinct pill button instead of the default boilerplate one.
 */

/**
 * Adds a drop shadow once the visitor scrolls away from the top.
 * @param {Element} header the page header element
 */
function bindScrollState(header) {
  const onScroll = () => {
    header.classList.toggle('template2-header-scrolled', window.scrollY > 8);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/**
 * Promotes the reserve/book link in the tools area to a branded pill button.
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

  const bookLink = tools.querySelector('a');
  if (!bookLink) return;

  bookLink.classList.add('template2-book-now');
  const bookWrap = bookLink.closest('p') || bookLink.parentElement;
  if (bookWrap) bookWrap.classList.add('template2-book-wrap');
}

/**
 * decorate the template2 header
 * @param {Element} block the header block element
 */
export default function decorateTemplate2Header(block) {
  const header = block.closest('header');
  if (!header) return;

  header.classList.add('template2-header');
  const nav = block.querySelector('nav');
  if (!nav) return;

  normalizeTools(nav);
  bindScrollState(header);
}
