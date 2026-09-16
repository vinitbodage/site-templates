/**
 * Elegant infinite marquee of phrases.
 * Authored as multiple rows/cells of short text phrases.
 * @param {Element} block
 */
export default function decorate(block) {
  const phrases = [...block.querySelectorAll(':scope > div > div, :scope > div')]
    .map((el) => el.textContent.trim())
    .filter(Boolean);

  const unique = [...new Set(phrases)];
  if (!unique.length) return;

  const viewport = document.createElement('div');
  viewport.className = 'marquee-strip-viewport';
  viewport.setAttribute('aria-hidden', 'true');

  const track = document.createElement('div');
  track.className = 'marquee-strip-track';

  const makeGroup = () => {
    const group = document.createElement('div');
    group.className = 'marquee-strip-group';
    unique.forEach((text) => {
      const item = document.createElement('span');
      item.className = 'marquee-strip-item';
      item.textContent = text;
      group.append(item);
    });
    return group;
  };

  track.append(makeGroup(), makeGroup());
  viewport.append(track);

  const sr = document.createElement('p');
  sr.className = 'marquee-strip-sr';
  sr.textContent = unique.join(' · ');

  block.replaceChildren(sr, viewport);
  block.closest('.section')?.classList.add('marquee-strip-container');
}
