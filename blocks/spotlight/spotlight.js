/**
 * Single featured story / spotlight band.
 * Authored: optional eyebrow, heading, body, CTA, optional large numeral/stat cell.
 * @param {Element} block
 */
export default function decorate(block) {
  const frame = document.createElement('div');
  frame.className = 'spotlight-frame';
  const copy = document.createElement('div');
  copy.className = 'spotlight-copy';
  const aside = document.createElement('div');
  aside.className = 'spotlight-aside';

  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      const text = cell.textContent.trim();
      const isStat = /^\d+/.test(text) && text.length < 24 && !cell.querySelector('a, h2, h3');
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

  const eyebrow = copy.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('spotlight-eyebrow');
  }

  copy.querySelectorAll('a').forEach((a) => {
    a.classList.add('button');
    a.closest('p')?.classList.add('button-container');
  });

  if (aside.childElementCount) frame.append(copy, aside);
  else frame.append(copy);
  block.replaceChildren(frame);
}
