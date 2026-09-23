/**
 * Asymmetric editorial image + copy band.
 * Authored as one row with two cells (media | copy) or media-first stacked rows.
 * Variant class `flip` swaps visual order on desktop.
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'editorial-split-media';
  const copy = document.createElement('div');
  copy.className = 'editorial-split-copy';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture, img');
      if (picture) {
        media.append(...cell.childNodes);
      } else if (cell.textContent.trim() || cell.querySelector('a')) {
        copy.append(...cell.childNodes);
      }
    });
  });

  const eyebrow = copy.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('editorial-split-eyebrow');
  }

  const heading = copy.querySelector('h2, h3');
  if (heading) {
    const rule = document.createElement('span');
    rule.className = 'editorial-split-rule';
    rule.setAttribute('aria-hidden', 'true');
    heading.after(rule);
  }

  const index = document.createElement('span');
  index.className = 'editorial-split-index';
  index.setAttribute('aria-hidden', 'true');
  index.textContent = '01';
  copy.prepend(index);

  const frame = document.createElement('div');
  frame.className = 'editorial-split-frame';
  frame.setAttribute('aria-hidden', 'true');
  media.append(frame);

  copy.querySelectorAll('a').forEach((a) => {
    if (!a.classList.contains('button')) a.classList.add('button', 'secondary');
    a.closest('p')?.classList.add('button-container');
  });

  media.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
  });

  block.replaceChildren(media, copy);
  block.closest('.section')?.classList.add('editorial-split-container');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(block);
}
