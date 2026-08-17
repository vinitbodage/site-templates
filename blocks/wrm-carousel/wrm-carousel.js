import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

function bindCarousel(block, track) {
  const slides = [...track.children];
  if (slides.length < 2) return;

  let active = 0;
  const goTo = (index) => {
    active = (index + slides.length) % slides.length;
    track.style.transform = `translateX(calc(-${active * 100}% - ${active * 16}px))`;
    block.querySelectorAll('.wrm-carousel-dot').forEach((dot, idx) => {
      dot.setAttribute('aria-selected', idx === active);
    });
  };

  const nav = document.createElement('div');
  nav.className = 'wrm-carousel-nav';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'wrm-carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.addEventListener('click', () => goTo(active - 1));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'wrm-carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  next.addEventListener('click', () => goTo(active + 1));

  const dots = document.createElement('div');
  dots.className = 'wrm-carousel-dots';
  dots.setAttribute('role', 'tablist');
  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'wrm-carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Slide ${idx + 1}`);
    dot.setAttribute('aria-selected', idx === 0);
    dot.addEventListener('click', () => goTo(idx));
    dots.append(dot);
  });

  nav.append(prev, dots, next);
  block.append(nav);
  goTo(0);
}

/**
 * Horizontal image carousel for the home gallery band.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const viewport = document.createElement('div');
  viewport.className = 'wrm-carousel-viewport';
  const track = document.createElement('ul');
  track.className = 'wrm-carousel-track';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      li.append(...cell.childNodes);
    });

    if (li.childElementCount) track.append(li);
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '1200' });
  });

  viewport.append(track);
  block.replaceChildren(viewport);
  bindCarousel(block, track);
}
