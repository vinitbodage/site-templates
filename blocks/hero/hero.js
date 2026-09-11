export default function decorate(block) {
  const cell = block.querySelector(':scope > div > div');
  if (!cell) return;

  const media = document.createElement('div');
  media.className = 'hero-media';
  const content = document.createElement('div');
  content.className = 'hero-content';

  [...cell.children].forEach((child) => {
    if (child.querySelector('picture, img') && !child.querySelector('h1, h2, h3, a.button')) {
      media.append(child);
      return;
    }
    const picture = child.matches('picture, img') ? child : null;
    if (picture) {
      media.append(picture);
      return;
    }
    content.append(child);
  });

  const img = media.querySelector('img');
  if (img) {
    img.loading = 'eager';
    img.fetchPriority = 'high';
  }

  const nodes = [media, content].filter((el) => el.childElementCount);
  if (nodes.length) block.replaceChildren(...nodes);
}
