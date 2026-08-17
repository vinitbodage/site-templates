import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Room cards grid used below the suites media slider.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'wrm-cards-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
    const copyCell = cells.find((cell) => cell !== imageCell);

    const cardLink = copyCell?.querySelector('a[href]') || imageCell?.querySelector('a[href]');
    const link = document.createElement('a');
    link.className = 'wrm-cards-link';
    if (cardLink) {
      link.href = cardLink.href;
      if (cardLink.target) link.target = cardLink.target;
    } else {
      link.href = '#';
    }

    if (imageCell) {
      const media = document.createElement('div');
      media.className = 'wrm-cards-media';
      media.append(...imageCell.childNodes);
      link.append(media);
    }

    if (copyCell) {
      const copy = document.createElement('div');
      copy.className = 'wrm-cards-copy';
      copy.append(...copyCell.childNodes);

      copy.querySelectorAll('a.button, a.primary, p > a').forEach((a) => {
        const action = document.createElement('span');
        action.className = 'wrm-cards-action';
        action.textContent = a.textContent.trim();
        const container = a.closest('.button-container') || a.closest('p');
        if (container?.tagName === 'P' && container.children.length === 1) {
          container.replaceWith(action);
        } else {
          a.replaceWith(action);
        }
      });

      link.append(copy);
    }

    li.append(link);
    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.wrm-cards-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  block.replaceChildren(ul);
}
