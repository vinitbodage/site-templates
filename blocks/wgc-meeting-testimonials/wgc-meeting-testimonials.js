import {
  getRows, getCells, isEmpty, createSlider,
} from '../../scripts/template/wgc.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Splits a testimonial's cells into its three parts.
 *
 * The column count is what tells them apart, because it is the one signal an
 * author controls directly: three columns read as headline, quote and
 * attribution, two drop the headline, and one is the quote on its own.
 * @param {Element[]} cells the non-empty cells of a row
 * @returns {{headline: Element, quote: Element[], attribution: Element}} the parts
 */
function splitCells(cells) {
  if (cells.length >= 3) {
    return {
      headline: cells[0],
      quote: cells.slice(1, -1),
      attribution: cells[cells.length - 1],
    };
  }
  if (cells.length === 2) {
    return { headline: null, quote: [cells[0]], attribution: cells[1] };
  }
  return { headline: null, quote: cells, attribution: null };
}

/**
 * Moves a cell's content into a part of the quote, dropping the part when the
 * author left that cell out.
 * @param {string} tag the element to create
 * @param {string} className the class for the part
 * @param {Element[]} cells the cells feeding the part
 * @returns {Element|null} the part
 */
function buildPart(tag, className, cells) {
  const source = cells.filter((cell) => cell && !isEmpty(cell));
  if (!source.length) return null;

  const part = document.createElement(tag);
  part.className = className;
  source.forEach((cell) => part.append(...cell.childNodes));
  return part;
}

/**
 * Turns the emphasised run of an attribution into a citation, which is how the
 * company name is marked up across the site's quotes.
 * @param {Element} attribution the attribution element
 */
function markCitation(attribution) {
  if (!attribution) return;
  attribution.querySelectorAll('em, i').forEach((em) => {
    const cite = document.createElement('cite');
    cite.append(...em.childNodes);
    em.replaceWith(cite);
  });
}

/**
 * Builds one testimonial from an authored row.
 * @param {Element} row the authored row
 * @returns {Element|null} the slide
 */
function buildSlide(row) {
  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  if (!cells.length) return null;

  const { headline, quote, attribution } = splitCells(cells);

  const headlineEl = buildPart('div', 'wgc-meeting-testimonial-headline', [headline]);
  const quoteEl = buildPart('div', 'wgc-meeting-testimonial-quote', quote);
  const attributionEl = buildPart('footer', 'wgc-meeting-testimonial-attribution', [attribution]);
  markCitation(attributionEl);

  const blockquote = document.createElement('blockquote');
  blockquote.append(...[headlineEl, quoteEl, attributionEl].filter((el) => el));
  if (!blockquote.childElementCount) return null;

  // an author who wrote the headline as a heading gets it styled in place
  const authoredHeading = quoteEl?.querySelector('h2, h3, h4, h5, h6');
  if (!headlineEl && authoredHeading) {
    authoredHeading.classList.add('wgc-meeting-testimonial-headline');
  }

  const slide = document.createElement('li');
  slide.className = 'wgc-meeting-testimonial';
  moveInstrumentation(row, slide);
  slide.append(blockquote);
  return slide;
}

/**
 * decorate the block
 *
 * One authored row per testimonial. The default carousel shows one at a time
 * with dot and previous/next controls; the stacked and grid variants show them
 * all at once and need no controls.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const isCarousel = !block.classList.contains('stacked')
    && !block.classList.contains('grid');

  const viewport = document.createElement('div');
  viewport.className = 'wgc-meeting-testimonials-viewport';

  const track = document.createElement('ul');
  track.className = 'wgc-meeting-testimonials-track';

  getRows(block).forEach((row) => {
    const slide = buildSlide(row);
    if (slide) track.append(slide);
  });

  viewport.append(track);
  block.replaceChildren(viewport);

  if (!isCarousel) return;

  viewport.setAttribute('aria-live', 'polite');

  const slider = createSlider(track, {
    prefix: 'wgc-meeting-testimonials',
    label: 'Testimonials',
    slideLabel: (index) => `Testimonial ${index + 1}`,
    controls: true,
  });

  if (slider) {
    block.append(slider.nav);
  } else {
    // a lone testimonial gets no controls, so it has to be shown outright
    track.firstElementChild?.classList.add('is-active');
  }
}
