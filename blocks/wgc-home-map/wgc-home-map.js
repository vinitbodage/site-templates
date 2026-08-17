import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * Authors supply a copy cell (heading, inset image, body, CTA) and an optional
 * map-pin image. A background image URL can be set through the block variant
 * class `bg-custom` plus a data attribute, or the default Florida map is used.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const panel = document.createElement('div');
  panel.className = 'wgc-map-panel';
  const pin = document.createElement('div');
  pin.className = 'wgc-map-pin';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const isPin = cell.querySelector('picture, img')
        && !cell.querySelector('h1, h2, h3, h4, p')
        && cell.textContent.trim().length < 40;

      if (isPin && !pin.childElementCount) {
        moveInstrumentation(cell, pin);
        pin.append(...cell.childNodes);
      } else if (!panel.childElementCount) {
        moveInstrumentation(cell, panel);
        panel.append(...cell.childNodes);
      }
    });
  });

  const heading = panel.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading, { light: true });
  }

  panel.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '500' });
  });

  pin.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '120' });
  });

  const inner = document.createElement('div');
  inner.className = 'wgc-map-inner';
  inner.append(panel);
  if (pin.childElementCount) inner.append(pin);

  block.replaceChildren(inner);
}
