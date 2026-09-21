/**
 * Suite orbit — rotating showcase of image cards around a center title.
 * First row = intro (heading + text). Following rows = image | title | optional link.
 * @param {Element} block
 */
export default function decorate(block) {
  const stage = document.createElement('div');
  stage.className = 'suite-orbit-stage';
  const intro = document.createElement('div');
  intro.className = 'suite-orbit-intro';
  const ring = document.createElement('div');
  ring.className = 'suite-orbit-ring';
  ring.setAttribute('role', 'list');

  const cards = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasMedia = cells.some((c) => c.querySelector('picture, img'));
    if (!hasMedia) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    const card = document.createElement('article');
    card.className = 'suite-orbit-card';
    card.setAttribute('role', 'listitem');

    const media = document.createElement('div');
    media.className = 'suite-orbit-card-media';
    const body = document.createElement('div');
    body.className = 'suite-orbit-card-body';

    cells.forEach((cell) => {
      const pic = cell.querySelector('picture') || cell.querySelector('img');
      if (pic && !media.childElementCount) {
        media.append(pic);
        return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('a').forEach((a) => {
      a.classList.remove('button', 'primary', 'secondary');
      a.classList.add('suite-orbit-link');
    });

    media.querySelectorAll('img').forEach((img) => {
      img.loading = 'lazy';
    });

    card.append(media, body);
    cards.push(card);
    ring.append(card);
  });

  const count = Math.max(cards.length, 1);
  cards.forEach((card, i) => {
    const angle = (360 / count) * i;
    card.style.setProperty('--orbit-angle', `${angle}deg`);
    card.style.setProperty('--i', String(i));
  });

  stage.append(intro, ring);
  block.replaceChildren(stage);
  block.closest('.section')?.classList.add('suite-orbit-container');

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    block.classList.add('is-visible', 'is-static');
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      block.classList.toggle('is-visible', entry.isIntersecting);
      block.classList.toggle('is-spinning', entry.isIntersecting);
    });
  }, { threshold: 0.2 });
  io.observe(block);

  let paused = false;
  block.addEventListener('pointerenter', () => {
    paused = true;
    block.classList.add('is-paused');
  });
  block.addEventListener('pointerleave', () => {
    paused = false;
    block.classList.remove('is-paused');
  });

  // Touch-friendly: tap a card to bring it forward (rotate ring so card is front)
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (paused) return;
      const target = -((360 / count) * i);
      ring.style.setProperty('--orbit-rotate', `${target}deg`);
      block.classList.add('is-paused');
      cards.forEach((c) => c.classList.remove('is-active'));
      card.classList.add('is-active');
    });
  });
}
