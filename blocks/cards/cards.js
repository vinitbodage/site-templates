import { getTemplateHelpers } from '../../scripts/template/shared.js';

export default function decorate(block) {
  const { optimizePicture } = getTemplateHelpers();

  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      // an authored image arrives wrapped in a picture, or bare
      if (div.children.length === 1 && div.querySelector('picture, img')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });

  // cards sit below the fold, so their images stay lazy
  ul.querySelectorAll('.cards-card-image img').forEach((img) => {
    optimizePicture(img, { width: '750' });
  });

  block.replaceChildren(ul);
}
