import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
import { decorateMosaic } from '../../scripts/template/mosaic-decorate.js';

/**
 * Award / partner logo strip — matches hotel-info images-footer layout.
 * @param {Element} block
 */
function decorateBadges(block) {
  block.classList.add('images-footer');

  const wrap = document.createElement('div');
  wrap.className = 'images-footer-block';
  wrap.setAttribute('role', 'list');

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const item = document.createElement('div');
      item.className = 'images-footer-item';
      item.setAttribute('role', 'listitem');
      moveInstrumentation(cell, item);
      item.append(...cell.childNodes);
      wrap.append(item);
    });
  });

  wrap.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '400' });
  });

  wrap.querySelectorAll('a').forEach((link) => {
    const img = link.querySelector('img');
    if (img?.alt && !link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', img.alt);
    }
  });

  block.replaceChildren(wrap);
}

function decorateGallery(block) {
  const ul = document.createElement('ul');
  ul.className = 'gallery-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      li.append(...cell.childNodes);
    });

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  ul.querySelectorAll('a').forEach((link) => {
    const img = link.querySelector('img');
    if (img && img.alt && !link.getAttribute('aria-label')) {
      link.setAttribute('aria-label', img.alt);
    }
  });

  block.replaceChildren(ul);
}

export default function decorate(block) {
  if (block.classList.contains('badges')) {
    decorateBadges(block);
    return;
  }

  if (document.body.classList.contains('template1') && !block.classList.contains('mosaic')) {
    const rows = getRows(block).filter((row) => !getCells(row).every(isEmpty));
    if (rows.length >= 3) {
      block.classList.add('mosaic');
    }
  }

  if (block.classList.contains('mosaic')) {
    decorateMosaic(block);
    return;
  }
  decorateGallery(block);
}
