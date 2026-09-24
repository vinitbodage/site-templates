/**
 * Timeline flow — vertical journey with animated spine and staggered steps.
 * First row optional intro. Following rows: title | body | optional image/meta.
 * @param {Element} block
 */
export default function decorate(block) {
  const intro = document.createElement('div');
  intro.className = 'timeline-flow-intro';
  const list = document.createElement('ol');
  list.className = 'timeline-flow-list';

  [...block.children].forEach((row, index) => {
    const cells = [...row.children].filter((c) => c.textContent.trim() || c.querySelector('picture, img'));
    const hasMedia = cells.some((c) => c.querySelector('picture, img'));
    const looksLikeIntro = index === 0 && !hasMedia && cells.length <= 1;

    if (looksLikeIntro) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    const item = document.createElement('li');
    item.className = 'timeline-flow-item';
    item.style.setProperty('--i', String(list.children.length));

    const marker = document.createElement('span');
    marker.className = 'timeline-flow-marker';
    marker.setAttribute('aria-hidden', 'true');

    const body = document.createElement('div');
    body.className = 'timeline-flow-body';

    cells.forEach((cell) => {
      const pic = cell.querySelector('picture') || cell.querySelector('img');
      if (pic) {
        const media = document.createElement('div');
        media.className = 'timeline-flow-media';
        media.append(pic);
        body.append(media);
        return;
      }
      body.append(...cell.childNodes);
    });

    body.querySelectorAll('a').forEach((a) => {
      if (!a.classList.contains('button')) a.classList.add('button', 'secondary');
    });

    item.append(marker, body);
    list.append(item);
  });

  const spine = document.createElement('div');
  spine.className = 'timeline-flow-spine';
  spine.setAttribute('aria-hidden', 'true');

  const listWrap = document.createElement('div');
  listWrap.className = 'timeline-flow-list-wrap';
  listWrap.append(spine, list);

  const shell = document.createElement('div');
  shell.className = 'timeline-flow-shell';
  if (intro.childNodes.length) shell.append(intro);
  shell.append(listWrap);
  block.replaceChildren(shell);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = [...list.children];

  if (reduce) {
    block.classList.add('is-visible');
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (entry.target === block) {
          block.classList.add('is-visible');
        }
      }
    });
  }, { threshold: 0.25 });

  io.observe(block);
  items.forEach((item) => io.observe(item));
}
