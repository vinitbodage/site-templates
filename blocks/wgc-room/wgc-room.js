import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const EXPAND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.4 21.4" aria-hidden="true"><path d="M20.79,0H.61A.61.61,0,0,0,0,.61V15.89a.61.61,0,0,0,1.21,0V1.21h19v19H5.51a.61.61,0,1,0,0,1.21H20.79a.61.61,0,0,0,.61-.61V.61A.61.61,0,0,0,20.79,0Z"/><path d="M2.59,18.75a.63.63,0,0,0,.43.17.65.65,0,0,0,.43-.17L15.15,7v6.25a.61.61,0,1,0,1.21,0V5.58a.54.54,0,0,0,0-.22h0A.63.63,0,0,0,16,5h0a.59.59,0,0,0-.22,0H8A.61.61,0,0,0,8,6.18h6.25L2.59,17.89A.6.6,0,0,0,2.59,18.75Z"/></svg>';

function bindSlider(media, track) {
  const slides = [...track.children];
  if (slides.length < 2) return;

  let active = 0;
  const dots = [];

  const goTo = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === active);
      slide.setAttribute('aria-hidden', idx !== active);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === active);
      dot.setAttribute('aria-selected', idx === active ? 'true' : 'false');
    });
  };

  const nav = document.createElement('div');
  nav.className = 'wgc-room-slider-nav';
  nav.setAttribute('role', 'tablist');
  nav.setAttribute('aria-label', 'Room images');

  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'wgc-room-slider-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Image ${idx + 1}`);
    dot.addEventListener('click', () => goTo(idx));
    nav.append(dot);
    dots.push(dot);
  });

  media.append(nav);
  goTo(0);
}

let activeLightbox = null;
let savedScrollY = 0;

function lockPageScroll() {
  savedScrollY = window.scrollY;
  document.body.classList.add('wgc-room-lightbox-open');
  document.body.style.top = `-${savedScrollY}px`;
}

function unlockPageScroll() {
  document.body.classList.remove('wgc-room-lightbox-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

function closeLightbox(overlay, onKeyDown) {
  overlay.remove();
  activeLightbox = null;
  unlockPageScroll();
  document.removeEventListener('keydown', onKeyDown);
}

function openImageLightbox(img) {
  if (activeLightbox) return;

  lockPageScroll();

  const overlay = document.createElement('div');
  overlay.className = 'wgc-room-lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', img.alt || 'Room image');

  const panel = document.createElement('div');
  panel.className = 'wgc-room-lightbox-panel';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'wgc-room-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');

  const lightboxImg = document.createElement('img');
  lightboxImg.src = img.currentSrc || img.src;
  lightboxImg.alt = img.alt || '';

  panel.append(closeBtn, lightboxImg);
  overlay.append(panel);
  document.body.append(overlay);
  activeLightbox = overlay;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox(overlay, onKeyDown);
  };

  closeBtn.addEventListener('click', () => closeLightbox(overlay, onKeyDown));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox(overlay, onKeyDown);
  });
  document.addEventListener('keydown', onKeyDown);
  closeBtn.focus();
}

function bindLightbox(track) {
  track.querySelectorAll('.wgc-room-slide-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const img = trigger.querySelector('img');
      if (img) openImageLightbox(img);
    });
  });
}

function wrapSlideMedia(slide) {
  const img = slide.querySelector('img');
  if (!img) return;

  let trigger = slide.querySelector('.wgc-room-slide-trigger');
  const legacyLink = slide.querySelector('a');

  if (legacyLink && !trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'wgc-room-slide-trigger';
    trigger.setAttribute('aria-label', img.alt || 'View image');
    trigger.append(...legacyLink.childNodes);
    legacyLink.replaceWith(trigger);
  }

  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'wgc-room-slide-trigger';
    trigger.setAttribute('aria-label', img.alt || 'View image');
    const picture = slide.querySelector('picture') || img;
    trigger.append(picture);
    slide.append(trigger);
  }

  if (!trigger.querySelector('.wgc-room-expand')) {
    const expand = document.createElement('span');
    expand.className = 'wgc-room-expand';
    expand.setAttribute('aria-hidden', 'true');
    expand.innerHTML = EXPAND_ICON;
    trigger.append(expand);
  }
}

function isCopyCell(cell) {
  if (isEmpty(cell)) return false;
  if (cell.querySelector('h1, h2, h3, h4, h5, h6')) return true;
  return cell.textContent.trim().length > 0 && !cell.querySelector('picture, img');
}

function isImageCell(cell) {
  return !isEmpty(cell) && cell.querySelector('picture, img');
}

function markBookLinks(container) {
  container.querySelectorAll('a[href*="synxis"]').forEach((link) => {
    link.classList.add('button', 'primary');
    const parent = link.closest('p, li');
    if (parent) parent.classList.add('button-container');
  });
}

function addRevealClasses(block, media, copy) {
  const fromRight = block.classList.contains('image-right');
  media.classList.add('wgc-room-panel', 'hide-object', fromRight ? 'fade-in-right' : 'fade-in-left');
  copy.classList.add('wgc-room-panel', 'hide-object', fromRight ? 'fade-in-left' : 'fade-in-right');
}

function revealPanel(panel) {
  panel.classList.remove('hide-object');
  panel.classList.add('show-object');
}

function revealPanels(media, copy) {
  // two frames so the hidden state paints before the transition runs
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      revealPanel(media);
      window.setTimeout(() => revealPanel(copy), 140);
    });
  });
}

/**
 * Scroll reveal matching the reference hide-object → show-object pattern.
 * @param {Element} block the block
 * @param {Element} media the media panel
 * @param {Element} copy the copy panel
 */
function bindReveal(block, media, copy) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    revealPanel(media);
    revealPanel(copy);
    return;
  }

  let revealed = false;
  const viewportHeight = () => window.innerHeight;
  let scrollHandler;

  function reveal() {
    if (revealed) return;
    revealed = true;
    revealPanels(media, copy);
    window.removeEventListener('scroll', scrollHandler, { passive: true });
    window.removeEventListener('resize', scrollHandler, { passive: true });
  }

  scrollHandler = () => {
    const rect = block.getBoundingClientRect();
    // same trigger as the reference site: panel enters from the bottom edge
    if (rect.top <= viewportHeight()) {
      reveal();
    }
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
  window.addEventListener('resize', scrollHandler, { passive: true });

  // wait for hidden styles to paint, then check initial position
  requestAnimationFrame(() => {
    requestAnimationFrame(scrollHandler);
  });
}

/**
 * Full-width room band with a fading image slider and booking copy.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const layout = document.createElement('div');
  layout.className = 'wgc-room-layout';

  const media = document.createElement('div');
  media.className = 'wgc-room-media';

  const viewport = document.createElement('div');
  viewport.className = 'wgc-room-slider-viewport';

  const track = document.createElement('ul');
  track.className = 'wgc-room-slider-track';

  const copy = document.createElement('div');
  copy.className = 'wgc-room-copy';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const copyCell = cells.find(isCopyCell);
    const imageCells = cells.filter(isImageCell);

    if (copyCell) {
      if (!copy.childElementCount) moveInstrumentation(copyCell, copy);
      copy.append(...copyCell.childNodes);
    }

    if (imageCells.length) {
      if (cells.length === 2 && copyCell && imageCells.length === 1) {
        const li = document.createElement('li');
        li.append(...imageCells[0].childNodes);
        track.append(li);
        return;
      }

      imageCells.forEach((cell) => {
        const li = document.createElement('li');
        li.append(...cell.childNodes);
        if (li.childElementCount) track.append(li);
      });
    }
  });

  track.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '615' });
  });

  track.querySelectorAll('li').forEach(wrapSlideMedia);
  bindLightbox(track);

  viewport.append(track);
  media.append(viewport);

  const heading = copy.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  markBookLinks(copy);
  addRevealClasses(block, media, copy);
  layout.append(media, copy);
  block.replaceChildren(layout);
  bindSlider(media, track);
  bindReveal(block, media, copy);
}
