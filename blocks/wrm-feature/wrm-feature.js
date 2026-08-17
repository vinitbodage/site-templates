import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Split feature section: copy panel + image gallery.
 * Row 1: copy cell (heading, body, CTA). Remaining rows: one image each.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const panel = document.createElement('div');
  panel.className = 'wrm-feature-copy';
  const gallery = document.createElement('ul');
  gallery.className = 'wrm-feature-gallery';

  getRows(block).forEach((row) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const imageCell = cells.find((cell) => cell.querySelector('picture, img') && !cell.querySelector('h1, h2, h3, h4'));
    const copyCell = cells.find((cell) => cell !== imageCell && cell.querySelector('h1, h2, h3, h4, p'));

    if (copyCell && !panel.childElementCount) {
      moveInstrumentation(row, panel);
      panel.append(...copyCell.childNodes);
      return;
    }

    if (imageCell) {
      const li = document.createElement('li');
      moveInstrumentation(row, li);
      li.append(...imageCell.childNodes);
      if (li.childElementCount) gallery.append(li);
    }
  });

  const heading = panel.querySelector('h1, h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  gallery.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  const inner = document.createElement('div');
  inner.className = 'wrm-feature-inner';
  inner.append(panel);
  if (gallery.childElementCount) inner.append(gallery);

  block.replaceChildren(inner);
}
