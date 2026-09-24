/**
 * Spotlight Grid — responsive media grid for images and/or video tiles.
 *
 * Block classes (UE Style): cols-2 | cols-3 | cols-4 | cols-5 (default cols-3)
 * Optional first row without media = intro.
 * Each item row: media (picture/img and/or .mp4 link) | optional title/caption.
 * @param {Element} block
 */
export default function decorate(block) {
  const isVideoUrl = (href = '') => /\.(mp4|webm|mov)(\?|$)/i.test(href);

  const hasCols = ['cols-2', 'cols-3', 'cols-4', 'cols-5']
    .some((name) => block.classList.contains(name));
  if (!hasCols) block.classList.add('cols-3');

  const intro = document.createElement('div');
  intro.className = 'spotlight-grid-intro';

  const grid = document.createElement('div');
  grid.className = 'spotlight-grid-track';
  grid.setAttribute('role', 'list');

  let itemIndex = 0;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const mediaCell = cells.find((cell) => cell.querySelector('picture, img')
      || [...cell.querySelectorAll('a[href]')].some((a) => isVideoUrl(a.href)));

    if (!mediaCell) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    itemIndex += 1;
    const item = document.createElement('article');
    item.className = 'spotlight-grid-item';
    item.setAttribute('role', 'listitem');
    item.style.setProperty('--i', String(itemIndex - 1));

    const media = document.createElement('div');
    media.className = 'spotlight-grid-media';

    const poster = mediaCell.querySelector('picture, img');
    if (poster) media.append(poster);

    const videoLink = [...mediaCell.querySelectorAll('a[href]')].find((a) => isVideoUrl(a.href));
    if (videoLink) {
      const video = document.createElement('video');
      video.className = 'spotlight-grid-video';
      video.src = videoLink.href;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.setAttribute('playsinline', '');
      video.preload = 'metadata';
      if (!poster) video.style.opacity = '1';
      media.append(video);

      const parent = videoLink.parentElement;
      videoLink.remove();
      if (parent?.matches('p') && !parent.textContent.trim()) parent.remove();

      const play = document.createElement('button');
      play.type = 'button';
      play.className = 'spotlight-grid-play';
      play.setAttribute('aria-label', 'Play video');
      play.innerHTML = '<span aria-hidden="true"></span>';
      play.addEventListener('click', async () => {
        if (video.paused) {
          await video.play().catch(() => {});
          item.classList.add('is-playing');
          play.setAttribute('aria-label', 'Pause video');
        } else {
          video.pause();
          item.classList.remove('is-playing');
          play.setAttribute('aria-label', 'Play video');
        }
      });
      media.append(play);

      item.addEventListener('mouseenter', () => {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        video.play().catch(() => {});
        item.classList.add('is-playing');
      });
      item.addEventListener('mouseleave', () => {
        video.pause();
        item.classList.remove('is-playing');
        play.setAttribute('aria-label', 'Play video');
      });
    }

    media.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
    });

    const body = document.createElement('div');
    body.className = 'spotlight-grid-body';

    cells.forEach((cell) => {
      if (cell === mediaCell) {
        cell.querySelectorAll('h1, h2, h3, h4, p, ul, ol').forEach((node) => {
          if (node.querySelector('picture, img') && !node.textContent.trim()) return;
          if (node.matches('p') && !node.textContent.trim()) return;
          body.append(node);
        });
        return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('a').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      a.classList.add('spotlight-grid-link');
      a.closest('.button-container')?.classList.remove('button-container');
    });

    item.append(media);
    if (body.childNodes.length) item.append(body);
    grid.append(item);
  });

  const eyebrow = intro.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('spotlight-grid-eyebrow');
  }

  if (intro.childNodes.length) block.replaceChildren(intro, grid);
  else block.replaceChildren(grid);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.12 });
  io.observe(block);
}
