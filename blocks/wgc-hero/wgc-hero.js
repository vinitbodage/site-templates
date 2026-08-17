import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;

/**
 * Builds the muted, looping background video.
 *
 * The still image stays the LCP element and the video is only revealed once it
 * can actually play, so an authored video never delays first paint.
 * @param {string} href the video URL
 * @param {string} poster the still image URL
 * @returns {Element} the video element
 */
function buildVideo(href, poster) {
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

/**
 * Removes an authored video link, and its paragraph when that leaves it empty.
 * @param {Element} link the video link
 */
function removeVideoLink(link) {
  const holder = link.closest('p');
  link.remove();
  if (holder && !holder.textContent.trim() && !holder.querySelector('picture, img')) {
    holder.remove();
  }
}

/**
 * decorate the block
 * @param {Element} block the block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'wgc-hero-media';
  const content = document.createElement('div');
  content.className = 'wgc-hero-content';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const picture = cell.querySelector('picture');
      const videoLink = [...cell.querySelectorAll('a')].find((a) => VIDEO_RE.test(a.href));

      if (picture || videoLink) {
        if (!media.childElementCount) moveInstrumentation(cell, media);
        if (picture) media.append(picture);
        if (videoLink) {
          const poster = picture ? picture.querySelector('img').src : '';
          removeVideoLink(videoLink);
          media.append(buildVideo(videoLink.href, poster));
        }
        return;
      }

      if (!content.childElementCount) moveInstrumentation(cell, content);
      content.append(...cell.childNodes);
    });
  });

  const heading = content.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    splitHeading(heading);
    addRule(heading, { centered: !block.classList.contains('left'), light: true });
  }

  // the hero image is above the fold, so it loads eagerly as the LCP candidate
  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { eager: true, width: '2000' });
  });

  block.replaceChildren(...[media, content].filter((el) => el.childElementCount));
}
