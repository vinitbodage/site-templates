/**
 * Scroll-driven parallax media + copy reveal.
 * Rows: media | copy  (optional second media row for layered depth)
 * @param {Element} block
 */
export default function decorate(block) {
  const layers = document.createElement('div');
  layers.className = 'parallax-reveal-layers';
  const copy = document.createElement('div');
  copy.className = 'parallax-reveal-copy';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture, img');
      if (picture) {
        const layer = document.createElement('div');
        layer.className = 'parallax-reveal-layer';
        const pic = cell.querySelector('picture') || cell.querySelector('img');
        layer.append(pic);
        layers.append(layer);
        return;
      }
      copy.append(...cell.childNodes);
    });
  });

  const eyebrow = copy.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('parallax-reveal-eyebrow');
  }

  copy.querySelectorAll('a').forEach((a) => {
    a.classList.add('button', 'secondary');
    a.closest('p')?.classList.add('button-container');
  });

  layers.querySelectorAll('img').forEach((img) => {
    img.loading = 'lazy';
  });

  // Depth factors for up to 3 layers
  [...layers.children].forEach((layer, i) => {
    layer.style.setProperty('--parallax-depth', String(0.12 + i * 0.1));
  });

  block.replaceChildren(layers, copy);
  block.closest('.section')?.classList.add('parallax-reveal-container');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    block.classList.add('is-visible');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.22 });
  io.observe(block);

  const onScroll = () => {
    const rect = block.getBoundingClientRect();
    const view = window.innerHeight || 1;
    const progress = (view - rect.top) / (view + rect.height);
    const clamped = Math.min(1, Math.max(0, progress));
    block.style.setProperty('--parallax-progress', clamped.toFixed(4));
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}
