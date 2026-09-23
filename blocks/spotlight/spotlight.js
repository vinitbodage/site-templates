/**
 * Cinematic spotlight — full-bleed media with interactive video, pointer beam,
 * and floating story panel.
 *
 * Authored cells (any order in one or more rows):
 * - Media: picture/img and optional video link (.mp4 / youtube / vimeo)
 * - Copy: eyebrow, heading, body, CTA
 * - Stat: short numeral cell (e.g. "18 suites")
 * @param {Element} block
 */
export default function decorate(block) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const stage = document.createElement('div');
  stage.className = 'spotlight-stage';

  const media = document.createElement('div');
  media.className = 'spotlight-media';

  const veil = document.createElement('div');
  veil.className = 'spotlight-veil';
  veil.setAttribute('aria-hidden', 'true');

  const beam = document.createElement('div');
  beam.className = 'spotlight-beam';
  beam.setAttribute('aria-hidden', 'true');

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
      const isStat = /^\d+/.test(text) && text.length < 28 && !cell.querySelector('a, h2, h3, picture, img');

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

  const panel = document.createElement('div');
  panel.className = 'spotlight-panel';
  panel.append(copy);
  if (aside.childElementCount) panel.append(aside);

  const tag = document.createElement('p');
  tag.className = 'spotlight-tag';
  tag.textContent = 'In the spotlight';

  stage.append(media, veil, beam, tag, panel);

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
      stage.classList.toggle('is-playing', playing);
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

    stage.append(playBtn, scrub);

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

  block.replaceChildren(stage);
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

  if (!reduceMotion) {
    const onMove = (event) => {
      const rect = stage.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      stage.style.setProperty('--spot-x', `${x}%`);
      stage.style.setProperty('--spot-y', `${y}%`);
      const shiftX = ((x / 100) - 0.5) * -18;
      const shiftY = ((y / 100) - 0.5) * -12;
      media.style.transform = `translate3d(${shiftX}px, ${shiftY}px, 0) scale(1.08)`;
    };
    stage.addEventListener('pointermove', onMove);
    stage.addEventListener('pointerleave', () => {
      stage.style.setProperty('--spot-x', '68%');
      stage.style.setProperty('--spot-y', '35%');
      media.style.transform = 'translate3d(0, 0, 0) scale(1.05)';
    });
  }
}
