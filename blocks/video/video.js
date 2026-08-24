/*
 * Video Block
 * Show a video referenced by a link
 * https://www.hlx.live/developer/block-collection/video
 *
 * The "slider" variant turns the block into a masthead of video banners: one
 * row per slide, each with a still image, an optional looping video behind it
 * and overlaid copy.
 */

import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const FILE_VIDEO_RE = /\.(mp4|webm)(\?.*)?$/i;

// matches the source component's dwell between slides
const SLIDE_INTERVAL = 20000;

function embedYoutube(url, autoplay, background) {
  const usp = new URLSearchParams(url.search);
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      mute: background ? '1' : '0',
      controls: background ? '0' : '1',
      disablekb: background ? '1' : '0',
      loop: background ? '1' : '0',
      playsinline: background ? '1' : '0',
    };
    suffix = `&${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  let vid = usp.get('v') ? encodeURIComponent(usp.get('v')) : '';
  const embed = url.pathname;
  if (url.origin.includes('youtu.be')) {
    [, vid] = url.pathname.split('/');
  }

  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://www.youtube.com${vid ? `/embed/${vid}?rel=0&v=${vid}${suffix}` : embed}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media; accelerometer; gyroscope; picture-in-picture" allowfullscreen="" scrolling="no" title="Content from Youtube" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function embedVimeo(url, autoplay, background) {
  const [, video] = url.pathname.split('/');
  let suffix = '';
  if (background || autoplay) {
    const suffixParams = {
      autoplay: autoplay ? '1' : '0',
      background: background ? '1' : '0',
    };
    suffix = `?${Object.entries(suffixParams).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&')}`;
  }
  const temp = document.createElement('div');
  temp.innerHTML = `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
      <iframe src="https://player.vimeo.com/video/${video}${suffix}" 
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" 
      frameborder="0" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen  
      title="Content from Vimeo" loading="lazy"></iframe>
    </div>`;
  return temp.children.item(0);
}

function getVideoElement(source, autoplay, background) {
  const video = document.createElement('video');
  video.setAttribute('controls', '');
  if (autoplay) video.setAttribute('autoplay', '');
  if (background) {
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.removeAttribute('controls');
    video.addEventListener('canplay', () => {
      video.muted = true;
      if (autoplay) video.play();
    });
  }

  const sourceEl = document.createElement('source');
  sourceEl.setAttribute('src', source);
  sourceEl.setAttribute('type', `video/${source.split('.').pop()}`);
  video.append(sourceEl);

  return video;
}

const loadVideoEmbed = (block, link, autoplay, background) => {
  if (block.dataset.embedLoaded === 'true') {
    return;
  }
  const url = new URL(link);

  const isYoutube = link.includes('youtube') || link.includes('youtu.be');
  const isVimeo = link.includes('vimeo');

  if (isYoutube) {
    const embedWrapper = embedYoutube(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else if (isVimeo) {
    const embedWrapper = embedVimeo(url, autoplay, background);
    block.append(embedWrapper);
    embedWrapper.querySelector('iframe').addEventListener('load', () => {
      block.dataset.embedLoaded = true;
    });
  } else {
    const videoEl = getVideoElement(link, autoplay, background);
    block.append(videoEl);
    videoEl.addEventListener('canplay', () => {
      block.dataset.embedLoaded = true;
    });
  }
};

/**
 * Builds the muted, looping video that sits behind a slide's still image.
 *
 * The source is deliberately left off until `startSlideVideo`, so a
 * multi-megabyte file never competes with the still image for the LCP.
 * @param {string} href the video URL
 * @returns {Element} the video element
 */
function buildSlideVideo(href) {
  const video = document.createElement('video');
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.tabIndex = -1;
  video.dataset.src = href;
  video.setAttribute('aria-hidden', 'true');
  return video;
}

/**
 * Attaches a slide video's source and starts playback.
 * @param {Element} video the video element
 */
function startSlideVideo(video) {
  if (!video.dataset.started) {
    video.dataset.started = 'true';
    const source = document.createElement('source');
    source.src = video.dataset.src;
    source.type = video.dataset.src.toLowerCase().includes('.webm') ? 'video/webm' : 'video/mp4';
    video.addEventListener('canplay', () => {
      video.dataset.ready = 'true';
    }, { once: true });
    video.append(source);
    video.load();
  }
  const playing = video.play();
  // a refused autoplay simply leaves the still image on screen
  if (playing) playing.catch(() => {});
}

/**
 * Plays the active slide's video and pauses the others.
 *
 * Does nothing until the deferred phase has flagged the block, so changing
 * slides early cannot pull a video onto the critical path.
 * @param {Element} block the block
 */
function syncSlideVideos(block) {
  if (prefersReducedMotion.matches || block.dataset.videoReady !== 'true') return;
  const active = parseInt(block.dataset.activeSlide || '0', 10);
  block.querySelectorAll('.video-slide').forEach((slide, idx) => {
    const video = slide.querySelector('video');
    if (!video) return;
    if (idx === active) startSlideVideo(video);
    else if (video.dataset.started) video.pause();
  });
}

/**
 * Defers work until the page has loaded and the main thread is idle, keeping it
 * clear of the eager phase this block decorates in.
 * @param {Function} fn the work to run
 */
function whenIdle(fn) {
  const schedule = () => {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 2000 });
    else window.setTimeout(fn, 500);
  };
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule, { once: true });
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
 * Builds one slide from an authored row.
 *
 * Authors supply a media cell (still image, optional video link) and a copy
 * cell (heading, optional paragraph and CTA), in either order.
 * @param {Element} row the authored row
 * @param {number} index the slide index
 * @returns {Element} the slide element
 */
function buildSlide(row, index) {
  const { getCells, isEmpty, optimizePicture } = getTemplateHelpers();

  const slide = document.createElement('li');
  slide.className = 'video-slide';
  slide.dataset.slideIndex = index;

  const media = document.createElement('div');
  media.className = 'video-slide-media';
  const content = document.createElement('div');
  content.className = 'video-slide-content';

  getCells(row).forEach((cell) => {
    if (isEmpty(cell)) return;

    // an authored image arrives wrapped in a picture, or bare
    const picture = cell.querySelector('picture, img');
    const videoLink = [...cell.querySelectorAll('a')].find((a) => FILE_VIDEO_RE.test(a.href));

    if (picture || videoLink) {
      if (!media.childElementCount) moveInstrumentation(cell, media);
      if (picture) media.append(picture);
      if (videoLink) {
        removeVideoLink(videoLink);
        media.append(buildSlideVideo(videoLink.href));
      }
      return;
    }

    if (!content.childElementCount) moveInstrumentation(cell, content);
    content.append(...cell.childNodes);
  });

  // only the opening slide is above the fold, so only it loads eagerly
  media.querySelectorAll('img').forEach((img) => {
    optimizePicture(img, { eager: index === 0, width: '2000' });
  });

  slide.append(...[media, content].filter((el) => el.childElementCount));
  return slide;
}

/**
 * Marks a slide active and takes the others out of the tab and reading order.
 * @param {Element} block the block
 * @param {number} index the active slide index
 */
function setActiveSlide(block, index) {
  block.dataset.activeSlide = index;

  block.querySelectorAll('.video-slide').forEach((slide, idx) => {
    slide.setAttribute('aria-hidden', idx !== index);
    slide.querySelectorAll('a').forEach((link) => {
      if (idx === index) link.removeAttribute('tabindex');
      else link.setAttribute('tabindex', '-1');
    });
  });

  block.querySelectorAll('.video-slide-dots button').forEach((dot, idx) => {
    dot.setAttribute('aria-current', idx === index);
  });

  syncSlideVideos(block);
}

/**
 * Scrolls a slide into view, wrapping at either end.
 * @param {Element} block the block
 * @param {number} index the slide to show
 */
function showSlide(block, index) {
  const slides = [...block.querySelectorAll('.video-slide')];
  const target = ((index % slides.length) + slides.length) % slides.length;
  block.querySelector('.video-slides').scrollTo({
    left: slides[target].offsetLeft,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
  });
}

/**
 * Builds the dot and arrow controls.
 * @param {number} count the number of slides
 * @returns {Element} the controls element
 */
function buildSlideControls(count) {
  const controls = document.createElement('nav');
  controls.className = 'video-slider-controls';
  controls.setAttribute('aria-label', 'Slide controls');
  controls.innerHTML = `
    <button type="button" class="video-slide-prev" aria-label="Previous slide"></button>
    <ol class="video-slide-dots"></ol>
    <button type="button" class="video-slide-next" aria-label="Next slide"></button>`;

  const dots = controls.querySelector('.video-slide-dots');
  for (let i = 0; i < count; i += 1) {
    const dot = document.createElement('li');
    dot.innerHTML = `<button type="button" aria-label="Show slide ${i + 1} of ${count}"></button>`;
    dots.append(dot);
  }

  return controls;
}

/**
 * Wires the controls, tracks the active slide and rotates while on screen.
 * @param {Element} block the block
 */
function bindSlider(block) {
  block.querySelector('.video-slide-prev').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) - 1);
  });
  block.querySelector('.video-slide-next').addEventListener('click', () => {
    showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
  });
  block.querySelectorAll('.video-slide-dots button').forEach((dot, idx) => {
    dot.addEventListener('click', () => showSlide(block, idx));
  });

  const slideObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setActiveSlide(block, parseInt(entry.target.dataset.slideIndex, 10));
      }
    });
  }, { root: block.querySelector('.video-slides'), threshold: 0.6 });
  block.querySelectorAll('.video-slide').forEach((slide) => slideObserver.observe(slide));

  if (prefersReducedMotion.matches) return;

  let timer = null;
  const stop = () => {
    window.clearInterval(timer);
    timer = null;
  };
  const start = () => {
    if (!timer) {
      timer = window.setInterval(() => {
        showSlide(block, parseInt(block.dataset.activeSlide, 10) + 1);
      }, SLIDE_INTERVAL);
    }
  };

  // rotation pauses on hover, on keyboard focus and while off screen
  block.addEventListener('pointerenter', stop);
  block.addEventListener('pointerleave', start);
  block.addEventListener('focusin', stop);
  block.addEventListener('focusout', start);

  const blockObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
  }, { threshold: 0.4 });
  blockObserver.observe(block);
}

/**
 * Decorates the slider variant: a masthead of video banners with overlaid copy.
 * @param {Element} block the block
 */
function decorateSlider(block) {
  const { getRows } = getTemplateHelpers();
  const rows = getRows(block);

  const slides = document.createElement('ul');
  slides.className = 'video-slides';
  rows.forEach((row, idx) => {
    slides.append(buildSlide(row, idx));
    row.remove();
  });

  block.append(slides);

  if (rows.length > 1) {
    block.setAttribute('role', 'region');
    block.setAttribute('aria-roledescription', 'carousel');
    block.append(buildSlideControls(rows.length));
    bindSlider(block);
  }

  setActiveSlide(block, 0);
  whenIdle(() => {
    block.dataset.videoReady = 'true';
    syncSlideVideos(block);
  });
}

export default async function decorate(block) {
  if (block.classList.contains('slider')) {
    decorateSlider(block);
    return;
  }

  const placeholder = block.querySelector('picture');
  const link = block.querySelector('a').href;
  block.textContent = '';
  block.dataset.embedLoaded = false;

  const autoplay = block.classList.contains('autoplay');
  if (placeholder) {
    block.classList.add('placeholder');
    const wrapper = document.createElement('div');
    wrapper.className = 'video-placeholder';
    wrapper.append(placeholder);

    if (!autoplay) {
      wrapper.insertAdjacentHTML(
        'beforeend',
        '<div class="video-placeholder-play"><button type="button" title="Play"></button></div>',
      );
      wrapper.addEventListener('click', () => {
        wrapper.remove();
        loadVideoEmbed(block, link, true, false);
      });
    }
    block.append(wrapper);
  }

  if (!placeholder || autoplay) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect();
        const playOnLoad = autoplay && !prefersReducedMotion.matches;
        loadVideoEmbed(block, link, playOnLoad, autoplay);
      }
    });
    observer.observe(block);
  }
}
