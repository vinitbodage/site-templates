import {
  getRows, getCells, isEmpty, splitHeading,
} from '../../scripts/template/wgc.js';

function stackHeadingTail(heading) {
  const lead = heading.querySelector('.wgc-headline-lead');
  if (lead && lead.nextSibling?.nodeType === Node.TEXT_NODE) {
    const tail = document.createElement('span');
    tail.className = 'wgc-headline-tail';
    tail.textContent = lead.nextSibling.textContent.trim();
    lead.nextSibling.replaceWith(tail);
  }
}

/**
 * Amenities band with a left heading and two-column bullet list.
 * @param {Element} block the block
 */
export default function decorate(block) {
  block.classList.add('details-container');

  const container = document.createElement('div');
  container.className = 'container';

  const layout = document.createElement('div');
  layout.className = 'text-modules wgc-amenities-layout';

  const title = document.createElement('div');
  title.className = 'col-sm-5 wgc-amenities-title';

  const listWrap = document.createElement('div');
  listWrap.className = 'col-sm-7 wgc-amenities-list-wrap';

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const heading = cell.querySelector('h2, h3, h4');
      const list = cell.querySelector('ul');
      if (heading && !title.childElementCount) title.append(heading);
      if (list && !listWrap.childElementCount) {
        list.classList.add('wgc-amenities-list', 'sym-inline-list');
        listWrap.append(list);
      }
      if (!heading && !list) title.append(...cell.childNodes);
    });
  });

  const heading = title.querySelector('h2, h3, h4');
  if (heading) {
    splitHeading(heading);
    stackHeadingTail(heading);
  }

  layout.append(title, listWrap);
  container.append(layout);
  block.replaceChildren(container);
}
