import { readBlockConfig } from '../../scripts/aem.js';

/**
 * Spacer — authorable vertical padding (top or bottom).
 *
 * Table authoring (da.live):
 * | Size | 64 |
 * | Side | top |
 *
 * Side: top | bottom
 * Size: pixels (e.g. 48, 64px)
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  const plain = block.textContent.replace(/\s+/g, ' ').trim();

  let sizeRaw = String(config.size || config.padding || config.height || '').trim();
  if (!sizeRaw) {
    const match = plain.match(/(\d+)\s*px?/i);
    if (match) sizeRaw = match[1];
  }

  const px = Math.max(0, parseInt(sizeRaw.replace(/[^\d]/g, ''), 10) || 0);

  let side = String(config.side || config.position || '').trim().toLowerCase();
  if (!side) {
    if (block.classList.contains('bottom') || /\bbottom\b/i.test(plain)) side = 'bottom';
    else side = 'top';
  }
  if (side !== 'bottom') side = 'top';

  block.replaceChildren();
  block.classList.add('spacer', `spacer-${side}`);
  block.style.paddingTop = '';
  block.style.paddingBottom = '';
  block.style.height = '0';
  block.setAttribute('aria-hidden', 'true');

  if (side === 'bottom') block.style.paddingBottom = `${px}px`;
  else block.style.paddingTop = `${px}px`;

  block.closest('.section')?.classList.add('spacer-container');
}
