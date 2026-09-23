/**
 * Horizontal experience rail — cinematic premium gallery of experiences.
 * Intro row, then one row per experience (image cell | copy cell).
 * @param {Element} block
 */
export default function decorate(block) {
  const intro = document.createElement('div');
  intro.className = 'experience-rail-intro';
  const track = document.createElement('div');
  track.className = 'experience-rail-track';
  track.setAttribute('tabindex', '0');
  track.setAttribute('role', 'list');
  track.setAttribute('aria-label', 'Experiences');

  let cardIndex = 0;

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasMedia = cells.some((cell) => cell.querySelector('picture, img'));

    if (!hasMedia) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    cardIndex += 1;
    const card = document.createElement('article');
    card.className = 'experience-rail-card';
    card.setAttribute('role', 'listitem');
    card.style.setProperty('--i', String(cardIndex - 1));

    const media = document.createElement('div');
    media.className = 'experience-rail-card-media';
    const body = document.createElement('div');
    body.className = 'experience-rail-card-body';
    const veil = document.createElement('div');
    veil.className = 'experience-rail-card-veil';
    veil.setAttribute('aria-hidden', 'true');

    const badge = document.createElement('span');
    badge.className = 'experience-rail-card-index';
    badge.setAttribute('aria-hidden', 'true');
    badge.textContent = String(cardIndex).padStart(2, '0');

    cells.forEach((cell) => {
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      if ((picture || img) && !media.childElementCount) {
        media.append(picture || img);
        cell.querySelectorAll('h1, h2, h3, h4, h5, h6, p, ul, ol').forEach((node) => {
          if (node.querySelector('picture, img') && !node.textContent.trim()) return;
          body.append(node);
        });
        return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('a').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      a.classList.add('experience-rail-link');
      a.closest('.button-container')?.classList.remove('button-container');
    });

    media.querySelectorAll('img').forEach((image) => {
      image.loading = 'lazy';
      if (!image.getAttribute('width')) image.setAttribute('width', '1200');
      if (!image.getAttribute('height')) image.setAttribute('height', '900');
    });

    media.append(veil, badge);
    card.append(media, body);
    track.append(card);
  });

  const eyebrow = intro.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('experience-rail-eyebrow');
  }

  const heading = intro.querySelector('h2, h3');
  if (heading) {
    const rule = document.createElement('span');
    rule.className = 'experience-rail-rule';
    rule.setAttribute('aria-hidden', 'true');
    heading.after(rule);
  }

  const meta = document.createElement('div');
  meta.className = 'experience-rail-meta';
  const count = document.createElement('span');
  count.className = 'experience-rail-count';
  count.textContent = `${String(cardIndex).padStart(2, '0')} curated`;
  const hint = document.createElement('p');
  hint.className = 'experience-rail-hint';
  hint.textContent = 'Drag to explore';
  meta.append(count, hint);

  const shell = document.createElement('div');
  shell.className = 'experience-rail-shell';
  const head = document.createElement('div');
  head.className = 'experience-rail-head';
  if (intro.childNodes.length) head.append(intro);
  head.append(meta);
  shell.append(head, track);
  block.replaceChildren(shell);
  block.closest('.section')?.classList.add('experience-rail-container');

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
