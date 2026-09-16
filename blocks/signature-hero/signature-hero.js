/**
 * Cinematic full-bleed hero for template5.
 * Authored rows: media | brand + headline + support + CTA
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'signature-hero-media';
  const content = document.createElement('div');
  content.className = 'signature-hero-content';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if (picture || img) {
        if (picture) media.append(picture);
        else if (img) media.append(img);
        return;
      }
      content.append(...cell.childNodes);
    });
  });

  const brand = content.querySelector('p strong, p b');
  if (brand && brand.parentElement?.childNodes.length <= 3) {
    const brandEl = document.createElement('p');
    brandEl.className = 'signature-hero-brand';
    brandEl.textContent = brand.textContent.trim();
    brand.closest('p')?.replaceWith(brandEl);
  } else {
    const firstP = content.querySelector('p');
    if (firstP && !content.querySelector('h1, h2')?.previousElementSibling) {
      firstP.classList.add('signature-hero-brand');
    }
  }

  content.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    a.closest('p')?.classList.add('button-container');
  });

  media.querySelectorAll('img').forEach((img) => {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  });

  block.replaceChildren(...[media, content].filter((el) => el.childNodes.length));
  block.closest('.section')?.classList.add('full-bleed', 'signature-hero-container');

  requestAnimationFrame(() => {
    block.classList.add('is-ready');
  });
}
