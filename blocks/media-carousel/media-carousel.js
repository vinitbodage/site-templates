/**
 * Media Carousel — subpage-friendly slider for images or video slides.
 *
 * Optional first row without media = intro (eyebrow, heading, copy).
 * Each slide row: media cell (picture/img and/or .mp4 link) | optional caption.
 * @param {Element} block
 */
export default function decorate(block) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isVideoUrl = (href = '') => /\.(mp4|webm|mov)(\?|$)/i.test(href);

  const intro = document.createElement('div');
  intro.className = 'media-carousel-intro';
  const slides = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const mediaCell = cells.find((cell) => cell.querySelector('picture, img')
      || [...cell.querySelectorAll('a[href]')].some((a) => isVideoUrl(a.href)));

    if (!mediaCell) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    const slide = {
      poster: mediaCell.querySelector('picture, img'),
      videoUrl: '',
      captionNodes: [],
    };

    const videoLink = [...mediaCell.querySelectorAll('a[href]')].find((a) => isVideoUrl(a.href));
    if (videoLink) {
      slide.videoUrl = videoLink.href;
      const parent = videoLink.parentElement;
      videoLink.remove();
      if (parent?.matches('p') && !parent.textContent.trim()) parent.remove();
    }

    cells.forEach((cell) => {
      if (cell === mediaCell) {
        cell.querySelectorAll('h1, h2, h3, h4, p, ul, ol').forEach((node) => {
          if (node.querySelector('picture, img') && !node.textContent.trim()) return;
          if (node.matches('p') && !node.textContent.trim()) return;
          slide.captionNodes.push(node);
        });
        return;
      }
      slide.captionNodes.push(...cell.childNodes);
    });

    slides.push(slide);
  });

  if (!slides.length) return;

  const shell = document.createElement('div');
  shell.className = 'media-carousel-shell';

  const viewport = document.createElement('div');
  viewport.className = 'media-carousel-viewport';
  viewport.setAttribute('role', 'region');
  viewport.setAttribute('aria-roledescription', 'carousel');
  viewport.setAttribute('aria-label', 'Media carousel');

  const track = document.createElement('div');
  track.className = 'media-carousel-track';

  const live = document.createElement('p');
  live.className = 'media-carousel-live';
  live.setAttribute('aria-live', 'polite');

  slides.forEach((slide, index) => {
    const article = document.createElement('article');
    article.className = 'media-carousel-slide';
    article.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    article.dataset.index = String(index);

    const media = document.createElement('div');
    media.className = 'media-carousel-media';

    if (slide.poster) media.append(slide.poster);
    if (slide.videoUrl) {
      const video = document.createElement('video');
      video.className = 'media-carousel-video';
      video.src = slide.videoUrl;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'metadata';
      if (!slide.poster) video.style.opacity = '1';
      media.append(video);

      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'media-carousel-play';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = '<span aria-hidden="true"></span>';
      play.addEventListener('click', async () => {
        if (video.paused) {
          await video.play().catch(() => {});
          media.classList.add('is-playing');
          play.setAttribute('aria-label', 'Pause video');
        } else {
          video.pause();
          media.classList.remove('is-playing');
          play.setAttribute('aria-label', 'Play video');
        }
      });
      media.append(play);
    }

    media.querySelectorAll('img').forEach((img) => {
      img.loading = index === 0 ? 'eager' : 'lazy';
    });

    article.append(media);

    if (slide.captionNodes.length) {
      const caption = document.createElement('div');
      caption.className = 'media-carousel-caption';
      caption.append(...slide.captionNodes);
      article.append(caption);
    }

    track.append(article);
  });

  const controls = document.createElement('div');
  controls.className = 'media-carousel-controls';

  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'media-carousel-btn media-carousel-prev';
  prev.setAttribute('aria-label', 'Previous slide');
  prev.textContent = '←';

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'media-carousel-btn media-carousel-next';
  next.setAttribute('aria-label', 'Next slide');
  next.textContent = '→';

  const dots = document.createElement('div');
  dots.className = 'media-carousel-dots';
  dots.setAttribute('role', 'tablist');
  dots.setAttribute('aria-label', 'Slides');

  const dotButtons = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'media-carousel-dot';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', `Go to slide ${index + 1}`);
    dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    dots.append(dot);
    return dot;
  });

  controls.append(prev, dots, next);
  viewport.append(track, live);
  shell.append(viewport, controls);

  if (intro.childNodes.length) {
    const eyebrow = intro.querySelector('p em, p i');
    if (eyebrow && eyebrow.parentElement?.children.length === 1) {
      eyebrow.parentElement.classList.add('media-carousel-eyebrow');
    }
    block.replaceChildren(intro, shell);
  } else {
    block.replaceChildren(shell);
  }

  let active = 0;
  let timer = null;
  let pointerX = null;
  const DURATION = 6500;

  const pauseVideos = () => {
    block.querySelectorAll('video').forEach((video) => {
      video.pause();
      video.closest('.media-carousel-media')?.classList.remove('is-playing');
    });
  };

  // % transforms are relative to the track itself — use viewport pixels instead
  const syncTrack = () => {
    const width = viewport.clientWidth || 0;
    track.style.transform = `translate3d(-${active * width}px, 0, 0)`;
  };

  const goTo = (index) => {
    active = ((index % slides.length) + slides.length) % slides.length;
    syncTrack();
    [...track.children].forEach((slide, i) => {
      slide.setAttribute('aria-hidden', i === active ? 'false' : 'true');
      slide.classList.toggle('is-active', i === active);
    });
    dotButtons.forEach((dot, i) => {
      dot.setAttribute('aria-selected', i === active ? 'true' : 'false');
      dot.classList.toggle('is-active', i === active);
    });
    live.textContent = `Slide ${active + 1} of ${slides.length}`;
    pauseVideos();
  };

  const stopAuto = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const startAuto = () => {
    stopAuto();
    if (reduceMotion || slides.length < 2) return;
    timer = window.setInterval(() => goTo(active + 1), DURATION);
  };

  prev.addEventListener('click', () => {
    goTo(active - 1);
    startAuto();
  });
  next.addEventListener('click', () => {
    goTo(active + 1);
    startAuto();
  });
  dotButtons.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goTo(index);
      startAuto();
    });
  });

  viewport.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(active - 1);
      startAuto();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(active + 1);
      startAuto();
    }
  });
  viewport.tabIndex = 0;

  viewport.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('button, a')) return;
    pointerX = event.clientX;
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointerup', (event) => {
    if (pointerX === null) return;
    const delta = event.clientX - pointerX;
    pointerX = null;
    if (Math.abs(delta) < 48) return;
    goTo(active + (delta < 0 ? 1 : -1));
    startAuto();
  });
  viewport.addEventListener('pointercancel', () => {
    pointerX = null;
  });

  shell.addEventListener('mouseenter', stopAuto);
  shell.addEventListener('mouseleave', startAuto);
  shell.addEventListener('focusin', stopAuto);
  shell.addEventListener('focusout', (event) => {
    if (!shell.contains(event.relatedTarget)) startAuto();
  });

  window.addEventListener('resize', syncTrack);
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(syncTrack).observe(viewport);
  }

  goTo(0);
  startAuto();
}
