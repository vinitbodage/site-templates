/**
 * Horizontal experience rail — intro row, then one row per experience
 * (image cell | copy cell).
 * @param {Element} block
 */
export default function decorate(block) {
  const intro = document.createElement('div');
  intro.className = 'experience-rail-intro';
  const track = document.createElement('div');
  track.className = 'experience-rail-track';
  track.setAttribute('tabindex', '0');
  track.setAttribute('role', 'list');

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const hasMedia = cells.some((cell) => cell.querySelector('picture, img'));

    if (!hasMedia) {
      cells.forEach((cell) => intro.append(...cell.childNodes));
      return;
    }

    const card = document.createElement('article');
    card.className = 'experience-rail-card';
    card.setAttribute('role', 'listitem');

    const media = document.createElement('div');
    media.className = 'experience-rail-card-media';
    const body = document.createElement('div');
    body.className = 'experience-rail-card-body';

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

    card.append(media, body);
    track.append(card);
  });

  const shell = document.createElement('div');
  shell.className = 'experience-rail-shell';
  if (intro.childNodes.length) shell.append(intro);
  shell.append(track);
  block.replaceChildren(shell);
}
