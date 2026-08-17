import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

function bindSlider(block, track) {
  const slides = [...track.children];
  if (slides.length < 2) return;

  let active = 0;
  const goTo = (index) => {
    active = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${active * 100}%)`;
  };

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'wrm-media-slider-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.addEventListener('click', () => goTo(active - 1));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'wrm-media-slider-next';
  next.setAttribute('aria-label', 'Next slide');
  next.addEventListener('click', () => goTo(active + 1));

  const nav = document.createElement('div');
  nav.className = 'wrm-media-slider-nav';
  nav.append(prev, next);
  block.append(nav);
  goTo(0);
}

/**
 * Full-width image slider used above room cards and feature sections.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const viewport = document.createElement('div');
  viewport.className = 'wrm-media-slider-viewport';
  const track = document.createElement('ul');
  track.className = 'wrm-media-slider-track';

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
    optimizePicture(img, { width: '2000' });
  });

  viewport.append(track);
  block.replaceChildren(viewport);
  bindSlider(block, track);
}
