import { createOptimizedPicture } from '../../scripts/aem.js';
import { decorateAccolades, decorateCardColumns } from '../../scripts/template/cards-wgc.js';

function decorateDefault(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });

  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));

  block.replaceChildren(ul);
}

export default function decorate(block) {
  if (document.body.classList.contains('wgc')) {
    if (block.classList.contains('accolades')) {
      decorateAccolades(block);
      return;
    }
    if (block.classList.contains('card-columns')) {
      decorateCardColumns(block);
      return;
    }
  }
  decorateDefault(block);
}
