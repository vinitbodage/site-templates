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

  copy.querySelectorAll('a').forEach((a) => {
    if (!a.classList.contains('button')) a.classList.add('button', 'secondary');
    a.closest('p')?.classList.add('button-container');
  });

  media.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
  });

  block.replaceChildren(media, copy);
  block.closest('.section')?.classList.add('editorial-split-container');
}
