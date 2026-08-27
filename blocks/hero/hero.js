import {
  getRows, getCells, isEmpty, splitHeading, addRule, markEyebrow, optimizePicture,
} from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
import { markCta, stackHeadingTail } from '../../scripts/template/columns-variants.js';

const VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;

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
    video.play().catch(() => {});
  }, { once: true });

  return video;
}

function removeVideoLink(link) {
  const holder = link.closest('p');
  link.remove();
  if (holder && !holder.textContent.trim() && !holder.querySelector('picture, img')) {
    holder.remove();
  }
}

/**
 * @param {Element} block
 */
export default function decorate(block) {
  const media = document.createElement('div');
  media.className = 'hero-media';
  const content = document.createElement('div');
  content.className = 'hero-content';

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
  markEyebrow(content, heading, 'hero-eyebrow');
  if (heading) {
    splitHeading(heading);
    stackHeadingTail(heading);
    addRule(heading, { centered: !block.classList.contains('left'), light: true });
  }
  markCta(content);

  media.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { eager: true, width: '2000' });
  });

  if (media.childElementCount || content.childElementCount) {
    block.replaceChildren(...[media, content].filter((el) => el.childElementCount));
  }

  if (document.body.classList.contains('template1')) {
    block.closest('main > .section')?.classList.add('hero-container');
  }
}
