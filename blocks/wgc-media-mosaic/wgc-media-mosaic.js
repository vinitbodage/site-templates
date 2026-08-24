import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Accessible name for a video tile. Uses authored link text when it is not
 * just the file URL.
 * @param {Element} link the authored video link
 * @returns {string} the label
 */
function videoLabel(link) {
  const text = link.textContent.trim();
  if (text && text !== link.href && !VIDEO_RE.test(text)) return text;
  return 'Video';
}

/**
 * Builds the muted looping tile video. Autoplay is skipped when the visitor
 * prefers reduced motion.
 * @param {string} href the video URL
 * @returns {Element} the video element
 */
function buildTileVideo(href) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('loop', '');

  const source = document.createElement('source');
  source.src = href;
  source.type = href.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);

  if (!prefersReducedMotion.matches) {
    video.autoplay = true;
    video.setAttribute('autoplay', '');
    video.addEventListener('canplay', () => {
      video.muted = true;
      video.play().catch(() => {});
    }, { once: true });
  }

  return video;
}

/**
 * Builds the lightbox video: muted, with controls, autoplaying when opened.
 * @param {string} src the video URL
 * @returns {Element} the video element
 */
function buildLightboxVideo(src) {
  const video = document.createElement('video');
  video.src = src;
  video.controls = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.autoplay = !prefersReducedMotion.matches;
  return video;
}

/**
 * Creates the gallery dialog and returns a function that opens a given item.
 * @param {Element} block the mosaic block
 * @param {{ type: string, src: string, alt: string }[]} items gallery items
 * @returns {(index: number) => void} open handler
 */
function attachLightbox(block, items) {
  const dialog = document.createElement('dialog');
  dialog.className = 'wgc-media-mosaic-dialog';
  dialog.setAttribute('aria-label', 'Media gallery');

  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'wgc-media-mosaic-close';
  close.setAttribute('aria-label', 'Close');
  close.innerHTML = '<span aria-hidden="true"></span>';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'wgc-media-mosaic-prev';
  prev.setAttribute('aria-label', 'Previous media');

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'wgc-media-mosaic-next';
  next.setAttribute('aria-label', 'Next media');

  const stage = document.createElement('div');
  stage.className = 'wgc-media-mosaic-stage';

  const frame = document.createElement('div');
  frame.className = 'wgc-media-mosaic-frame';
  frame.append(prev, stage, next);

  dialog.append(close, frame);
  block.append(dialog);

  let index = 0;

  const pauseGridVideos = (pause) => {
    block.querySelectorAll('.wgc-media-mosaic-tile video').forEach((video) => {
      if (pause) video.pause();
      else if (!prefersReducedMotion.matches) video.play().catch(() => {});
    });
  };

  const show = (nextIndex) => {
    index = (nextIndex + items.length) % items.length;
    const item = items[index];
    stage.replaceChildren();

    if (item.type === 'video') {
      stage.append(buildLightboxVideo(item.src));
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.alt || '';
      stage.append(img);
    }
  };

  const open = (startIndex) => {
    show(startIndex);
    pauseGridVideos(true);
    dialog.showModal();
    close.focus();
  };

  close.addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));

  dialog.addEventListener('click', (event) => {
    const box = dialog.getBoundingClientRect();
    const { clientX, clientY } = event;
    if (clientX < box.left || clientX > box.right || clientY < box.top || clientY > box.bottom) {
      dialog.close();
    }
  });

  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      show(index - 1);
    }
  });

  dialog.addEventListener('close', () => {
    stage.replaceChildren();
    pauseGridVideos(false);
  });

  return open;
}

/**
 * Wraps tile media in an overlay button that opens the lightbox.
 * @param {Element} media the video or picture
 * @param {string} label the accessible name
 * @param {() => void} onOpen click handler
 * @returns {Element} the tile wrapper
 */
function wrapTile(media, label, onOpen) {
  const tile = document.createElement('div');
  tile.className = 'wgc-media-mosaic-tile';
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'wgc-media-mosaic-open';
  button.setAttribute('aria-label', `Open ${label}`);
  button.addEventListener('click', onOpen);
  tile.append(media, button);
  return tile;
}

/**
 * decorate the block
 *
 * Four authored rows: an mp4/webm link, then three images. The first tile is
 * the tall left video; the rest fill the right-hand mosaic. Every tile opens
 * a lightbox that pages through the set.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'wgc-media-mosaic-list';

  const items = [];

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const link = [...cell.querySelectorAll('a')].find((a) => VIDEO_RE.test(a.href));
      const picture = cell.querySelector('picture');

      if (link) {
        items.push({
          type: 'video',
          src: link.href,
          alt: videoLabel(link),
          row,
        });
        return;
      }

      if (picture) {
        const img = picture.querySelector('img');
        items.push({
          type: 'image',
          src: img?.src || '',
          alt: img?.alt || '',
          picture,
          row,
        });
      }
    });
  });

  if (!items.length) {
    block.querySelectorAll(':scope > div').forEach((row) => row.remove());
    return;
  }

  const open = attachLightbox(block, items);

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'wgc-media-mosaic-item';
    moveInstrumentation(item.row, li);

    if (item.type === 'video') {
      li.append(wrapTile(buildTileVideo(item.src), item.alt, () => open(i)));
    } else {
      li.append(wrapTile(item.picture, item.alt || 'image', () => open(i)));
    }

    list.append(li);
  });

  list.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '1200' });
  });

  block.querySelectorAll(':scope > div').forEach((row) => row.remove());
  block.prepend(list);
}
