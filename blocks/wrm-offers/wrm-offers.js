import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

function bindOffers(block, track) {
  const slides = [...track.children];
  if (slides.length < 2) return;

  let active = 0;
  const slideWidth = () => slides[0].offsetWidth + 24;

  const goTo = (index) => {
    active = Math.max(0, Math.min(index, slides.length - 1));
    track.scrollTo({ left: active * slideWidth(), behavior: 'smooth' });
  };

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'wrm-offers-prev';
  prev.setAttribute('aria-label', 'Previous offer');
  prev.addEventListener('click', () => goTo(active - 1));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'wrm-offers-next';
  next.setAttribute('aria-label', 'Next offer');
  next.addEventListener('click', () => goTo(active + 1));

  block.append(prev, next);
}

/**
 * Horizontal offers carousel matching the reference promotions band.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const track = document.createElement('div');
  track.className = 'wrm-offers-track';
  const ul = document.createElement('ul');
  ul.className = 'wrm-offers-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
    const copyCell = cells.find((cell) => cell !== imageCell);

    const link = document.createElement('a');
    link.className = 'wrm-offers-link';
    const cardLink = copyCell?.querySelector('a[href]') || imageCell?.querySelector('a[href]');
    if (cardLink) {
      link.href = cardLink.href;
      if (cardLink.target) link.target = cardLink.target;
    } else {
      link.href = '#';
    }

    if (imageCell) {
      const media = document.createElement('div');
      media.className = 'wrm-offers-media';
      media.append(...imageCell.childNodes);
      link.append(media);
    }

    if (copyCell) {
      const copy = document.createElement('div');
      copy.className = 'wrm-offers-copy';
      copy.append(...copyCell.childNodes);
      copy.querySelectorAll('a').forEach((a) => {
        if (a.textContent.trim().toUpperCase() === 'RESERVE NOW' || a.classList.contains('button')) {
          const action = document.createElement('span');
          action.className = 'wrm-offers-action';
          action.textContent = a.textContent.trim();
          a.replaceWith(action);
        }
      });
      link.append(copy);
    }

    li.append(link);
    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.wrm-offers-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '800' });
  });

  track.append(ul);
  block.replaceChildren(track);
  bindOffers(block, ul);
}
