/**
 * Spotlight — editorial feature with media + story copy.
 * Optional video link on the media cell; optional short stat cell.
 *
 * Authored cells (any order in one or more rows):
 * - Media: picture/img and optional video link (.mp4)
 * - Copy: eyebrow, heading, body, CTA
 * - Stat: short numeral cell (e.g. "18 suites")
 * @param {Element} block
 */
export default function decorate(block) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const layout = document.createElement('div');
  layout.className = 'spotlight-layout';

  const mediaFrame = document.createElement('div');
  mediaFrame.className = 'spotlight-media-frame';

  const media = document.createElement('div');
  media.className = 'spotlight-media';

  const copy = document.createElement('div');
  copy.className = 'spotlight-copy';

  const aside = document.createElement('div');
  aside.className = 'spotlight-aside';

  let poster = null;
  let videoUrl = '';

  const isVideoUrl = (href = '') => /\.(mp4|webm|mov)(\?|$)/i.test(href)
    || /youtube\.com|youtu\.be|vimeo\.com/i.test(href);

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      const videoLink = [...cell.querySelectorAll('a[href]')].find((a) => isVideoUrl(a.href));
      const text = cell.textContent.trim();
      const isStat = /^\d+/.test(text)
        && text.length < 28
        && !cell.querySelector('a, h2, h3, picture, img');

      if ((picture || img || videoLink) && !poster && !videoUrl) {
        if (picture || img) poster = picture || img;
        if (videoLink) {
          videoUrl = videoLink.href;
          const linkParent = videoLink.parentElement;
          videoLink.remove();
          if (linkParent?.matches('p') && !linkParent.textContent.trim()) linkParent.remove();
        }
        return;
      }

      if (isStat && !aside.childElementCount) {
        const stat = document.createElement('p');
        stat.className = 'spotlight-stat';
        const [value, ...rest] = text.split(/\s+/);
        stat.innerHTML = `<span>${value}</span>${rest.length ? ` ${rest.join(' ')}` : ''}`;
        aside.append(stat);
        const note = cell.querySelector('p:nth-child(2), em');
        if (note) {
          const caption = document.createElement('p');
          caption.className = 'spotlight-stat-caption';
          caption.textContent = note.textContent.trim();
          aside.append(caption);
        }
        return;
      }

      copy.append(...cell.childNodes);
    });
  });

  if (poster) {
    const wrap = document.createElement('div');
    wrap.className = 'spotlight-poster';
    wrap.append(poster);
    media.append(wrap);
    media.querySelectorAll('img').forEach((image) => {
      image.loading = 'eager';
      image.fetchPriority = 'high';
    });
  }

  let video = null;
  if (videoUrl && /\.(mp4|webm|mov)(\?|$)/i.test(videoUrl)) {
    video = document.createElement('video');
    video.className = 'spotlight-video';
    video.src = videoUrl;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'metadata';
    if (!poster) video.style.opacity = '1';
    media.append(video);
  }

  const eyebrow = copy.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('spotlight-eyebrow');
  }

  const heading = copy.querySelector('h2, h3');
  if (heading) {
    const rule = document.createElement('span');
    rule.className = 'spotlight-rule';
    rule.setAttribute('aria-hidden', 'true');
    heading.after(rule);
  }

  copy.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    a.closest('p')?.classList.add('button-container');
  });

  mediaFrame.append(media);

  if (video) {
    const scrub = document.createElement('div');
    scrub.className = 'spotlight-scrub';
    scrub.setAttribute('aria-hidden', 'true');
    const scrubFill = document.createElement('span');
    scrub.append(scrubFill);

    const playBtn = document.createElement('button');
    playBtn.type = 'button';
    playBtn.className = 'spotlight-play';
    playBtn.setAttribute('aria-label', 'Play spotlight video');
    playBtn.innerHTML = '<span class="spotlight-play-icon" aria-hidden="true"></span><span class="spotlight-play-label">Play film</span>';

    const setPlaying = (playing) => {
      mediaFrame.classList.toggle('is-playing', playing);
      playBtn.setAttribute('aria-label', playing ? 'Pause spotlight video' : 'Play spotlight video');
      playBtn.querySelector('.spotlight-play-label').textContent = playing ? 'Pause film' : 'Play film';
    };

    playBtn.addEventListener('click', async () => {
      if (video.paused) {
        try {
          await video.play();
          setPlaying(true);
        } catch {
          setPlaying(false);
        }
      } else {
        video.pause();
        setPlaying(false);
      }
    });

    video.addEventListener('timeupdate', () => {
      if (!video.duration) return;
      scrubFill.style.width = `${(video.currentTime / video.duration) * 100}%`;
    });

    mediaFrame.append(playBtn, scrub);

    if (!reduceMotion) {
      const autoPlayIo = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            video.play().then(() => setPlaying(true)).catch(() => {});
          } else {
            video.pause();
            setPlaying(false);
          }
        });
      }, { threshold: 0.45 });
      autoPlayIo.observe(block);
    }
  }

  const content = document.createElement('div');
  content.className = 'spotlight-content';
  content.append(copy);
  if (aside.childElementCount) content.append(aside);

  layout.append(mediaFrame, content);
  block.replaceChildren(layout);
  block.closest('.section')?.classList.add('spotlight-container');

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(block);
}
