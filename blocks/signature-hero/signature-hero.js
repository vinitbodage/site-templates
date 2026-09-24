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
    const parent = a.parentElement;
    if (parent && (parent.tagName === 'P' || parent.tagName === 'DIV')) {
      parent.classList.add('button-container');
    } else {
      const wrap = document.createElement('p');
      wrap.className = 'button-container';
      a.replaceWith(wrap);
      wrap.append(a);
    }
  });

  media.querySelectorAll('img').forEach((img) => {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  });

  const veil = document.createElement('div');
  veil.className = 'signature-hero-veil';
  veil.setAttribute('aria-hidden', 'true');

  const sweep = document.createElement('div');
  sweep.className = 'signature-hero-sweep';
  sweep.setAttribute('aria-hidden', 'true');

  const rule = document.createElement('span');
  rule.className = 'signature-hero-rule';
  rule.setAttribute('aria-hidden', 'true');

  const heading = content.querySelector('h1, h2');
  if (heading) heading.after(rule);
  else content.prepend(rule);

  media.append(veil, sweep);
  block.replaceChildren(...[media, content].filter((el) => el.childNodes.length));
  block.closest('.section')?.classList.add('full-bleed', 'signature-hero-container');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(() => {
    block.classList.add('is-ready');
    if (!reduceMotion) block.classList.add('is-animated');
  });

  if (!reduceMotion) {
    const onScroll = () => {
      const rect = block.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, -rect.top / Math.max(rect.height, 1)));
      block.style.setProperty('--hero-parallax', `${progress * 12}%`);
      block.style.setProperty('--hero-fade', String(1 - progress * 0.55));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}
