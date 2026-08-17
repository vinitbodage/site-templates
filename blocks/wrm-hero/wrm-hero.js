import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;

function buildMp4Video(href, poster) {
  const video = document.createElement('video');
  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.tabIndex = -1;
  video.setAttribute('aria-hidden', 'true');
  if (poster) video.poster = poster;

  const source = document.createElement('source');
  source.src = href;
  source.type = href.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
  video.append(source);

  video.addEventListener('canplay', () => {
    video.dataset.ready = 'true';
  }, { once: true });

  return video;
}

function buildVimeoEmbed(url) {
  const match = url.match(VIMEO_RE);
  if (!match) return null;

  const iframe = document.createElement('iframe');
  iframe.src = `https://player.vimeo.com/video/${match[1]}?background=1&autoplay=1&loop=1&muted=1`;
  iframe.setAttribute('allow', 'autoplay; fullscreen');
  iframe.setAttribute('title', 'Resort background video');
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');
  return iframe;
}

function removeLink(link) {
  const holder = link.closest('p');
  link.remove();
  if (holder && !holder.textContent.trim() && !holder.querySelector('picture, img')) {
    holder.remove();
  }
}

/**
 * Full-viewport video hero with optional bottom promo banner.
 * Row 1: video link and/or poster image. Row 2: banner logo, copy, and CTA.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'wrm-hero-media';
  const banner = document.createElement('div');
  banner.className = 'wrm-hero-banner';

  let poster = '';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const videoLink = cells.flatMap((cell) => [...cell.querySelectorAll('a')])
      .find((a) => VIDEO_RE.test(a.href) || VIMEO_RE.test(a.href));
    const picture = cells.flatMap((cell) => [...cell.querySelectorAll('picture')])[0];
    const isBanner = cells.length >= 2 && cells.some((cell) => cell.querySelector('h1, h2, h3, h4, p'))
      && cells.some((cell) => cell.querySelector('picture, img') || cell.querySelector('a.button, a.primary'));

    if (isBanner) {
      if (!banner.childElementCount) moveInstrumentation(row, banner);
      cells.forEach((cell, idx) => {
        const part = document.createElement('div');
        part.className = `wrm-hero-banner-part wrm-hero-banner-part-${idx + 1}`;
        part.append(...cell.childNodes);
        banner.append(part);
      });
      return;
    }

    if (!media.childElementCount) moveInstrumentation(row, media);

    if (picture) {
      poster = picture.querySelector('img')?.src || '';
      media.append(picture);
    }

    if (videoLink) {
      const { href } = videoLink;
      removeLink(videoLink);
      if (VIMEO_RE.test(href)) {
        const iframe = buildVimeoEmbed(href);
        if (iframe) media.append(iframe);
      } else {
        media.append(buildMp4Video(href, poster));
      }
    }
  });

  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { eager: true, width: '2000' });
  });

  banner.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '400' });
  });

  block.replaceChildren(...[media, banner].filter((el) => el.childElementCount));
}
