import {
  getRows, getCells, isEmpty, splitHeading, addRule, createSlider, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const EXPAND_ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21.4 21.4" aria-hidden="true"><path d="M20.79,0H.61A.61.61,0,0,0,0,.61V15.89a.61.61,0,0,0,1.21,0V1.21h19v19H5.51a.61.61,0,1,0,0,1.21H20.79a.61.61,0,0,0,.61-.61V.61A.61.61,0,0,0,20.79,0Z"/><path d="M2.59,18.75a.63.63,0,0,0,.43.17.65.65,0,0,0,.43-.17L15.15,7v6.25a.61.61,0,1,0,1.21,0V5.58a.54.54,0,0,0,0-.22h0A.63.63,0,0,0,16,5h0a.59.59,0,0,0-.22,0H8A.61.61,0,0,0,8,6.18h6.25L2.59,17.89A.6.6,0,0,0,2.59,18.75Z"/></svg>';

const LIGHTBOX_PREV_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="12" viewBox="0 0 40 12" aria-hidden="true"><path d="M0 6 9 0v12L0 6Z" fill="currentColor"/><rect x="9" y="5.5" width="31" height="1" fill="currentColor"/></svg>';
const LIGHTBOX_NEXT_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="12" viewBox="0 0 40 12" aria-hidden="true"><rect x="0" y="5.5" width="31" height="1" fill="currentColor"/><path d="M40 6 31 0v12l9-6Z" fill="currentColor"/></svg>';

function buildLightboxNav(label, className, icon) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `room-lightbox-nav ${className}`;
  button.setAttribute('aria-label', label);
  button.innerHTML = `<span class="room-lightbox-nav-icon">${icon}</span><span class="room-lightbox-nav-label">${label}</span>`;
  return button;
}

function stackHeadingTail(heading) {
  const lead = heading.querySelector('.wgc-headline-lead');
  if (!lead || lead.nextSibling?.classList?.contains('wgc-headline-tail')) return;

  if (lead.nextSibling?.nodeType === Node.TEXT_NODE) {
    const tail = document.createElement('span');
    tail.className = 'wgc-headline-tail';
    tail.textContent = lead.nextSibling.textContent.trim();
    lead.nextSibling.replaceWith(tail);
    return;
  }

  if (lead.nextSibling) {
    const tail = document.createElement('span');
    tail.className = 'wgc-headline-tail';
    while (lead.nextSibling) {
      tail.append(lead.nextSibling);
    }
    heading.append(tail);
  }
}

function bindSlider(media, track) {
  const slider = createSlider(track, {
    prefix: 'room-slider',
    label: 'Room images',
    slideLabel: (index) => `Image ${index + 1}`,
  });
  if (slider) media.append(slider.nav);
}

let activeLightbox = null;
let savedScrollY = 0;

function lockPageScroll() {
  savedScrollY = window.scrollY;
  document.body.classList.add('room-lightbox-open');
  document.body.style.top = `-${savedScrollY}px`;
}

function unlockPageScroll() {
  document.body.classList.remove('room-lightbox-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

function closeLightbox(overlay, onKeyDown) {
  overlay.remove();
  activeLightbox = null;
  unlockPageScroll();
  document.removeEventListener('keydown', onKeyDown);
}

function collectSlideImages(track) {
  return [...track.children].map((slide) => {
    const img = slide.querySelector('img');
    if (!img) return null;
    return {
      src: img.dataset.fullSrc || img.currentSrc || img.src,
      alt: img.alt || '',
    };
  }).filter(Boolean);
}

function openImageLightbox(images, startIndex = 0) {
  if (activeLightbox || !images.length) return;

  lockPageScroll();

  let current = Math.max(0, Math.min(startIndex, images.length - 1));

  const overlay = document.createElement('div');
  overlay.className = 'room-lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const panel = document.createElement('div');
  panel.className = 'room-lightbox-panel';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'room-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');

  const viewport = document.createElement('div');
  viewport.className = 'room-lightbox-viewport';

  const lightboxImg = document.createElement('img');
  lightboxImg.className = 'room-lightbox-image';

  const prevBtn = buildLightboxNav('Previous', 'room-lightbox-prev', LIGHTBOX_PREV_ICON);
  const nextBtn = buildLightboxNav('Next', 'room-lightbox-next', LIGHTBOX_NEXT_ICON);

  const showImage = (index) => {
    current = (index + images.length) % images.length;
    const item = images[current];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    overlay.setAttribute('aria-label', item.alt || 'Room image');
    const multi = images.length > 1;
    prevBtn.hidden = !multi;
    nextBtn.hidden = !multi;
  };

  viewport.append(prevBtn, lightboxImg, nextBtn);
  panel.append(closeBtn, viewport);
  overlay.append(panel);
  document.body.append(overlay);
  activeLightbox = overlay;
  showImage(current);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeLightbox(overlay, onKeyDown);
    if (e.key === 'ArrowLeft') showImage(current - 1);
    if (e.key === 'ArrowRight') showImage(current + 1);
  };

  closeBtn.addEventListener('click', () => closeLightbox(overlay, onKeyDown));
  prevBtn.addEventListener('click', () => showImage(current - 1));
  nextBtn.addEventListener('click', () => showImage(current + 1));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeLightbox(overlay, onKeyDown);
  });
  document.addEventListener('keydown', onKeyDown);
  closeBtn.focus();
}

function bindLightbox(track) {
  const images = collectSlideImages(track);

  track.querySelectorAll('.room-slide-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const slide = trigger.closest('li');
      if (!slide) return;
      const index = [...track.children].indexOf(slide);
      if (index >= 0) openImageLightbox(images, index);
    });
  });
}

function wrapSlideMedia(slide) {
  const img = slide.querySelector('img');
  if (!img) return;

  let trigger = slide.querySelector('.room-slide-trigger');
  const legacyLink = slide.querySelector('a');

  if (legacyLink && !trigger) {
    if (legacyLink.href) img.dataset.fullSrc = legacyLink.href;
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'room-slide-trigger';
    trigger.setAttribute('aria-label', img.alt || 'View image');
    trigger.append(...legacyLink.childNodes);
    legacyLink.replaceWith(trigger);
  }

  if (!trigger) {
    trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'room-slide-trigger';
    trigger.setAttribute('aria-label', img.alt || 'View image');
    const picture = slide.querySelector('picture') || img;
    trigger.append(picture);
    slide.append(trigger);
  }

  if (!trigger.querySelector('.room-expand')) {
    const expand = document.createElement('span');
    expand.className = 'room-expand';
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

/**
 * Image-right can be set explicitly (UE block option or block name variant) or
 * inferred when authors place the copy column before the image column in da.live.
 * @param {Element} block the block
 * @returns {boolean} whether the media panel should render on the right
 */
function resolveImageRight(block) {
  if (block.classList.contains('image-right')) return true;

  return getRows(block).some((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const copyCell = cells.find(isCopyCell);
    const imageCell = cells.find(isImageCell);
    return copyCell && imageCell && cells.length >= 2
      && cells.indexOf(copyCell) < cells.indexOf(imageCell);
  });
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
  media.classList.add('room-panel', 'hide-object', fromRight ? 'fade-in-right' : 'fade-in-left');
  copy.classList.add('room-panel', 'hide-object', fromRight ? 'fade-in-left' : 'fade-in-right');
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
  if (resolveImageRight(block)) {
    block.classList.add('image-right');
  }

  const layout = document.createElement('div');
  layout.className = 'room-layout';

  const media = document.createElement('div');
  media.className = 'room-media';

  const viewport = document.createElement('div');
  viewport.className = 'room-slider-viewport';

  const track = document.createElement('ul');
  track.className = 'room-slider-track';

  const copy = document.createElement('div');
  copy.className = 'room-copy';

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
    optimizePicture(img, { width: '570' });
  });

  track.querySelectorAll('li').forEach(wrapSlideMedia);
  bindLightbox(track);

  viewport.append(track);
  media.append(viewport);

  const heading = copy.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    stackHeadingTail(heading);
    addRule(heading);
  }

  markBookLinks(copy);
  addRevealClasses(block, media, copy);
  layout.append(media, copy);
  block.replaceChildren(layout);
  bindSlider(media, track);
  bindReveal(block, media, copy);
}
