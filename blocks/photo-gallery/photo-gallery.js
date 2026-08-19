import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

function toCategorySlug(label) {
  return label.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function isVideoUrl(url) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url) || /youtube|youtu\.be|vimeo/i.test(url);
}

function classifyRow(row) {
  if (row.classList.contains('photo-gallery-filter')) return 'filter';
  if (row.classList.contains('photo-gallery-video')) return 'video';
  if (row.classList.contains('photo-gallery-image')) return 'image';

  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  if (!cells.length) return 'skip';

  const hasImage = cells.some((cell) => cell.querySelector('picture, img'));
  const videoLink = cells.flatMap((cell) => [...cell.querySelectorAll('a')]).find((a) => isVideoUrl(a.href));

  if (hasImage && videoLink) return 'video';
  if (hasImage) return 'image';
  if (cells.length === 1 && cells[0].textContent.trim()) return 'filter';
  return 'skip';
}

function readCategory(cells) {
  const categoryCell = cells[1];
  if (!categoryCell || isEmpty(categoryCell)) return '';

  const link = categoryCell.querySelector('a[href]');
  const text = categoryCell.textContent.trim();
  if (link && text === link.textContent.trim()) return '';
  return text;
}

function readFullImageLink(cells, img) {
  const link = cells[1]?.querySelector('a[href]:not([href*="youtube"]):not([href*="youtu.be"]):not([href*="vimeo"])');
  if (link && !isVideoUrl(link.href)) return link.href;
  const wrapped = img?.closest('a[href]');
  if (wrapped && !isVideoUrl(wrapped.href)) return wrapped.href;
  return img?.src || '';
}

function readVideoLink(cells) {
  return cells.flatMap((cell) => [...cell.querySelectorAll('a')]).find((a) => isVideoUrl(a.href))?.href || '';
}

let activeLightbox = null;
let savedScrollY = 0;
let videoCounter = 0;

function lockPageScroll() {
  savedScrollY = window.scrollY;
  document.body.classList.add('photo-gallery-lightbox-open');
  document.body.style.top = `-${savedScrollY}px`;
}

function unlockPageScroll() {
  document.body.classList.remove('photo-gallery-lightbox-open');
  document.body.style.top = '';
  window.scrollTo(0, savedScrollY);
}

function closeLightbox(overlay, onKeyDown) {
  overlay.remove();
  activeLightbox = null;
  unlockPageScroll();
  document.removeEventListener('keydown', onKeyDown);
}

function openImageLightbox(src, alt) {
  if (activeLightbox || !src) return;

  lockPageScroll();

  const overlay = document.createElement('div');
  overlay.className = 'photo-gallery-lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', alt || 'Gallery image');

  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'photo-gallery-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');

  overlay.append(closeBtn, img);
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

function openVideoLightbox(videoEl, label) {
  if (activeLightbox || !videoEl) return;

  lockPageScroll();

  const overlay = document.createElement('div');
  overlay.className = 'photo-gallery-lightbox-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', label || 'Gallery video');

  const panel = document.createElement('div');
  panel.className = 'photo-gallery-lightbox-video';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'photo-gallery-lightbox-close';
  closeBtn.setAttribute('aria-label', 'Close');

  const video = videoEl.cloneNode(true);
  video.removeAttribute('hidden');
  video.style.display = 'block';

  panel.append(video);
  overlay.append(closeBtn, panel);
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
  video.play?.().catch(() => {});
  closeBtn.focus();
}

function buildFilterPanel(filters) {
  const item = document.createElement('div');
  item.className = 'photo-gallery-item photo-gallery-item-filter';

  const inner = document.createElement('div');
  inner.className = 'photo-gallery-filter-inner';

  const content = document.createElement('div');
  content.className = 'photo-gallery-filter-content';

  const list = document.createElement('ul');
  list.className = 'photo-gallery-filter-list';
  list.id = 'photo-gallery-filter-options';

  const allItem = document.createElement('li');
  allItem.className = 'active';
  const allLink = document.createElement('a');
  allLink.href = '#';
  allLink.className = 'all';
  allLink.dataset.filter = '*';
  allLink.textContent = 'All';
  allItem.append(allLink);
  list.append(allItem);

  filters.forEach(({ label, slug }) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.href = '#';
    link.dataset.filter = slug;
    link.textContent = label;
    li.append(link);
    list.append(li);
  });

  content.append(list);
  inner.append(content);
  item.append(inner);
  return { item, list };
}

function syncFilterHeight(filterItem, grid) {
  const firstMedia = grid.querySelector('.photo-gallery-item-media:not(.is-hidden)');
  const inner = filterItem.querySelector('.photo-gallery-filter-inner');
  if (!firstMedia || !inner) return;

  const sync = () => {
    const link = firstMedia.querySelector('a');
    const height = link?.offsetHeight;
    if (height) inner.style.height = `${height}px`;
  };

  sync();
  if ('ResizeObserver' in window) {
    const observer = new ResizeObserver(sync);
    observer.observe(firstMedia);
  } else {
    window.addEventListener('resize', sync, { passive: true });
  }
}

function bindFilters(list, mediaItems, filterItem, grid) {
  list.querySelectorAll('a[data-filter]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const { filter } = link.dataset;

      list.querySelectorAll('li').forEach((li) => {
        li.classList.toggle('active', li.contains(link));
      });

      mediaItems.forEach((item) => {
        const { category } = item.dataset;
        const show = filter === '*' || !category || category === filter;
        item.classList.toggle('is-hidden', !show);
        item.setAttribute('aria-hidden', show ? 'false' : 'true');
      });

      syncFilterHeight(filterItem, grid);
    });
  });
}

function getImageCell(cells) {
  return cells.find((cell) => cell.querySelector('picture, img'));
}

function wrapImageMedia(item, href, alt) {
  const img = item.querySelector('picture > img, img');
  if (!img) return;

  optimizePicture(img, { width: '480' });

  const figure = document.createElement('figure');
  const picture = img.closest('picture');
  figure.append(picture || img);

  const link = document.createElement('a');
  link.href = href || img.currentSrc || img.src;
  link.setAttribute('aria-label', alt || 'Gallery image');
  link.append(figure);

  link.addEventListener('click', (e) => {
    e.preventDefault();
    openImageLightbox(link.href, alt);
  });

  item.replaceChildren(link);
}

function wrapVideoMedia(item, cells, container) {
  const img = item.querySelector('picture > img, img');
  const videoUrl = readVideoLink(cells);
  if (!img) return;

  optimizePicture(img, { width: '480' });

  videoCounter += 1;
  const videoId = `photo-gallery-video-${videoCounter}`;

  const figure = document.createElement('figure');
  const picture = img.closest('picture');
  figure.append(picture || img);

  const link = document.createElement('a');
  link.href = `#${videoId}`;
  link.className = 'photo-gallery-video-link';
  link.setAttribute('aria-label', img.alt || 'Play gallery video');
  link.append(figure);

  const hidden = document.createElement('div');
  hidden.id = videoId;
  hidden.hidden = true;

  const video = document.createElement('video');
  video.controls = true;
  video.setAttribute('controls', '');

  const source = document.createElement('source');
  source.src = videoUrl;
  source.type = `video/${videoUrl.split('.').pop().split('?')[0]}`;
  video.append(source);
  video.append('Sorry, your browser doesn\'t support embedded videos.');
  hidden.append(video);

  link.addEventListener('click', (e) => {
    e.preventDefault();
    if (videoUrl) openVideoLightbox(video, img.alt);
  });

  item.replaceChildren(link);
  container.append(hidden);
}

/**
 * Photo gallery page block matching wyndhamgrandclearwater.com/photo-gallery.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const filters = [];
  const mediaItems = [];

  const wrapper = document.createElement('div');
  wrapper.className = 'photo-gallery-wrapper';

  getRows(block).forEach((row) => {
    const type = classifyRow(row);
    const cells = getCells(row).filter((cell) => !isEmpty(cell));

    if (type === 'filter') {
      const label = cells[0]?.textContent.trim();
      const slug = toCategorySlug(label);
      if (label && slug) filters.push({ label, slug });
      row.remove();
      return;
    }

    if (type === 'skip') {
      row.remove();
      return;
    }

    const item = document.createElement('div');
    moveInstrumentation(row, item);
    item.classList.add('photo-gallery-item', 'photo-gallery-item-media');

    const category = readCategory(cells);
    const slug = toCategorySlug(category);
    if (slug) item.dataset.category = slug;

    const imageCell = getImageCell(cells);
    if (imageCell) item.append(...imageCell.childNodes);

    if (type === 'video') {
      item.classList.add('photo-gallery-item-video');
      wrapVideoMedia(item, cells, wrapper);
    } else {
      const img = item.querySelector('picture > img, img');
      const fullImage = readFullImageLink(cells, img);
      wrapImageMedia(item, fullImage, img?.alt);
    }

    if (item.childElementCount) mediaItems.push(item);
    row.remove();
  });

  const { item: filterItem, list: filterList } = buildFilterPanel(filters);

  const grid = document.createElement('div');
  grid.className = 'photo-gallery-grid';
  grid.append(filterItem, ...mediaItems);
  wrapper.append(grid);

  const heading = document.createElement('h1');
  heading.className = 'photo-gallery-heading';
  heading.textContent = block.dataset.pageTitle
    || 'Pictures Of Clearwater Florida | Photo Gallery | Wyndham Grand';

  block.replaceChildren(heading, wrapper);
  bindFilters(filterList, mediaItems, filterItem, grid);
  syncFilterHeight(filterItem, grid);
}
