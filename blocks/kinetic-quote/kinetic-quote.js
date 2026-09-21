/**
 * Kinetic quote — word-stagger reveal with drifting accent mark.
 * Authored: quotation | optional attribution
 * @param {Element} block
 */
export default function decorate(block) {
  const cells = [...block.querySelectorAll(':scope > div > div')];
  const quoteText = (cells[0]?.textContent || '').trim();
  const attribution = cells[1]?.textContent?.trim() || '';

  const frame = document.createElement('div');
  frame.className = 'kinetic-quote-frame';

  const mark = document.createElement('span');
  mark.className = 'kinetic-quote-mark';
  mark.setAttribute('aria-hidden', 'true');
  mark.textContent = '“';

  const quote = document.createElement('blockquote');
  quote.className = 'kinetic-quote-text';

  const words = quoteText.split(/\s+/).filter(Boolean);
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'kinetic-quote-word';
    span.style.setProperty('--i', String(i));
    span.textContent = word;
    quote.append(span);
    if (i < words.length - 1) quote.append(document.createTextNode(' '));
  });

  frame.append(mark, quote);

  if (attribution) {
    const cite = document.createElement('p');
    cite.className = 'kinetic-quote-attr';
    cite.textContent = attribution;
    frame.append(cite);
  }

  block.replaceChildren(frame);

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.35 });
  io.observe(block);

  if (reduce) block.classList.add('is-visible');

  if (!reduce) {
    const onMove = (e) => {
      const rect = block.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      block.style.setProperty('--kx', x.toFixed(3));
      block.style.setProperty('--ky', y.toFixed(3));
    };
    block.addEventListener('pointermove', onMove);
  }
}
