import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * decorate the block
 *
 * A heading column beside the amenities list. Authors write the heading and the
 * list either as two rows or as two columns of one row, and either way the list
 * is the cell holding a bullet list, so the order in the document does not
 * change the result.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const layout = document.createElement('div');
  layout.className = 'wgc-meeting-amenities-layout';

  const title = document.createElement('div');
  title.className = 'wgc-meeting-amenities-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'wgc-meeting-amenities-list-wrap';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;

      const list = cell.querySelector(':scope > ul, :scope > ol');
      if (list && !listWrap.childElementCount) {
        moveInstrumentation(cell, listWrap);
        list.classList.add('wgc-meeting-amenities-list');
        listWrap.append(list);
      }

      // whatever the cell still holds is heading or intro copy
      if (isEmpty(cell)) return;
      if (!title.childElementCount) moveInstrumentation(cell, title);
      title.append(...cell.childNodes);
    });
  });

  splitHeading(title.querySelector('h2, h3, h4'));

  layout.append(...[title, listWrap].filter((el) => el.childElementCount));
  block.replaceChildren(layout);
}
