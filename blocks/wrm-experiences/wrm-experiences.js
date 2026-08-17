import {
  getRows, getCells, isEmpty, splitHeading, optimizePicture,
} from '../../scripts/template/wrm.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';
import { toClassName } from '../../scripts/aem.js';

/**
 * Tabbed experiences section with image + copy per tab.
 * One row per tab: label cell + content cell (image + heading + copy + CTA).
 * @param {Element} block the block
 */
export default function decorate(block) {
  const tablist = document.createElement('div');
  tablist.className = 'wrm-exp-tabs';
  tablist.setAttribute('role', 'tablist');

  const panels = document.createElement('div');
  panels.className = 'wrm-exp-panels';

  getRows(block).forEach((row, idx) => {
    const cells = getCells(row).filter((cell) => !isEmpty(cell));
    const labelCell = cells[0];
    const contentCell = cells[1] || cells[0];

    const label = labelCell.textContent.trim();
    const id = toClassName(label) || `tab-${idx}`;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'wrm-exp-tab';
    button.id = `wrm-exp-tab-${id}`;
    button.textContent = label;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', `wrm-exp-panel-${id}`);
    button.setAttribute('aria-selected', idx === 0);

    const panel = document.createElement('div');
    panel.className = 'wrm-exp-panel';
    panel.id = `wrm-exp-panel-${id}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', button.id);
    panel.setAttribute('aria-hidden', idx !== 0);
    moveInstrumentation(row, panel);

    if (contentCell !== labelCell) {
      panel.append(...contentCell.childNodes);
    }

    const heading = panel.querySelector('h2, h3, h4');
    if (heading) splitHeading(heading);

    button.addEventListener('click', () => {
      tablist.querySelectorAll('.wrm-exp-tab').forEach((btn) => {
        btn.setAttribute('aria-selected', false);
      });
      panels.querySelectorAll('.wrm-exp-panel').forEach((p) => {
        p.setAttribute('aria-hidden', true);
      });
      button.setAttribute('aria-selected', true);
      panel.setAttribute('aria-hidden', false);
    });

    tablist.append(button);
    panels.append(panel);
  });

  panels.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '900' });
  });

  panels.querySelectorAll('.wrm-exp-panel').forEach((panel) => {
    const picture = panel.querySelector('picture, img');
    if (picture) {
      const media = document.createElement('div');
      media.className = 'wrm-exp-media';
      picture.closest('p')?.replaceWith(picture);
      media.append(picture);
      panel.prepend(media);
    }
    const copy = document.createElement('div');
    copy.className = 'wrm-exp-copy';
    [...panel.childNodes].forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('wrm-exp-media')) {
        copy.append(node);
      }
    });
    if (copy.childElementCount) panel.append(copy);
  });

  block.replaceChildren(tablist, panels);
}
