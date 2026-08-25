import { splitHeading, addRule } from '../../scripts/template/shared.js';
import { decorateColumnVariants } from '../../scripts/template/columns-variants.js';

export default function decorate(block) {
  if (decorateColumnVariants(block)) {
    return;
  }

  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }
    });
  });

  if (document.body.classList.contains('template1')) {
    block.querySelectorAll('h1, h2, h3').forEach((heading) => {
      splitHeading(heading);
      addRule(heading);
    });
  }
}
