import { getTemplateHelpers } from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * One authored row per pillar (Rooms, Dining, Spa). Each row has an image cell
 * and a copy cell. When copy appears before the image in the authored order the
 * pillar is laid out copy-first, matching the centre column on the source site.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const {
    getRows, getCells, isEmpty, splitHeading, optimizePicture,
  } = getTemplateHelpers();

  const ul = document.createElement('ul');
  ul.className = 'home-room-dine-spa-list';

  getRows(block).forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);

    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const imageCell = cells.find((cell) => cell.querySelector('picture, img'));
    const copyCell = cells.find((cell) => cell !== imageCell);

    if (imageCell) {
      imageCell.classList.add('home-room-dine-spa-media');
      li.append(imageCell);
    }
    if (copyCell) {
      copyCell.classList.add('home-room-dine-spa-copy');
      li.append(copyCell);
    }

    if (imageCell && copyCell && cells.indexOf(copyCell) < cells.indexOf(imageCell)) {
      li.classList.add('copy-first');
    }

    const heading = li.querySelector('h2, h3');
    if (heading) splitHeading(heading);

    if (li.childElementCount) ul.append(li);
  });

  ul.querySelectorAll('.home-room-dine-spa-media picture > img').forEach((img) => {
    optimizePicture(img, { width: '600' });
  });

  block.replaceChildren(ul);
}
