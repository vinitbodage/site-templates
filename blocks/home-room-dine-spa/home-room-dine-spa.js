import {
  getRows, getCells, isEmpty, optimizePicture,
} from '../../scripts/template/shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Stay / Dine / Spa band — three pillars in one row (columns-3-cols layout).
 * @param {Element} block
 */
export default function decorate(block) {
  block.classList.add('columns', 'columns-3-cols');

  const pillars = getRows(block).map((row) => {
    const pillar = document.createElement('div');
    moveInstrumentation(row, pillar);
    getCells(row).filter((cell) => !isEmpty(cell)).forEach((cell) => {
      pillar.append(...cell.childNodes);
    });
    return pillar;
  }).filter((pillar) => pillar.childElementCount);

  const row = document.createElement('div');
  row.append(...pillars);
  block.replaceChildren(row);

  block.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });
}
