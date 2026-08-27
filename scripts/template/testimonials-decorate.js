/* eslint-disable import/prefer-default-export */
import {
  getRows, getCells, isEmpty, createSlider,
} from './shared.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Keeps a section title beside the carousel and styles it as the band heading.
 * @param {Element} block the carousel block
 * @returns {Element|null} the heading wrapper
 */
function extractSectionHeading(block) {
  const section = block.closest('.section');
  if (!section) return null;

  const heading = [...section.querySelectorAll('h1, h2, h3, h4')]
    .find((el) => !block.contains(el));
  if (!heading) return null;

  const header = document.createElement('div');
  header.className = 'testimonials-header';
  header.append(heading);

  const wrapper = heading.closest('.default-content-wrapper');
  if (wrapper?.childElementCount === 1) {
    wrapper.replaceWith(header);
  } else {
    heading.remove();
  }

  return header;
}

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
 * Parses a single content cell that holds headline, quote, and attribution.
 * @param {Element} cell the authored copy cell
 * @returns {{headline: Element|null, quote: Element[], attribution: Element|null}}
 */
function splitContentCell(cell) {
  const heading = cell.querySelector('h2, h3, h4, h5, h6');
  const paragraphs = [...cell.querySelectorAll(':scope > p')];
  const quoteParagraphs = paragraphs.filter((p) => {
    const text = p.textContent.trim();
    return text.startsWith('"') || text.startsWith('\u201c') || text.startsWith('“');
  });
  const quote = quoteParagraphs.length ? quoteParagraphs : paragraphs.slice(0, -1);
  const attributionParagraphs = paragraphs.filter((p) => !quote.includes(p));
  const attribution = attributionParagraphs.length === 1
    ? attributionParagraphs[0]
    : attributionParagraphs.find((p) => /^[-—@]/.test(p.textContent.trim())) || null;

  return {
    headline: heading,
    quote: quote.length ? quote.map((p) => p.cloneNode(true)) : [],
    attribution: attribution ? attribution.cloneNode(true) : null,
  };
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
 * Builds a part from cloned nodes rather than live cells.
 * @param {string} tag the element to create
 * @param {string} className the class for the part
 * @param {Element[]} nodes the nodes feeding the part
 * @returns {Element|null} the part
 */
function buildPartFromNodes(tag, className, nodes) {
  const source = nodes.filter((node) => node && (node.textContent?.trim() || node.querySelector('picture, img')));
  if (!source.length) return null;

  const part = document.createElement(tag);
  part.className = className;
  source.forEach((node) => part.append(node));
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

  const imageCell = cells.find((cell) => cell.querySelector('picture, img')
    && !cell.querySelector('h1, h2, h3, h4, h5, h6, p'));
  const contentCells = cells.filter((cell) => cell !== imageCell);

  let headlineEl;
  let quoteEl;
  let attributionEl;

  if (imageCell && contentCells.length === 1) {
    const { headline, quote, attribution } = splitContentCell(contentCells[0]);
    headlineEl = buildPartFromNodes('div', 'testimonial-headline', headline ? [headline] : []);
    quoteEl = buildPartFromNodes('div', 'testimonial-quote', quote);
    attributionEl = buildPartFromNodes('footer', 'testimonial-attribution', attribution ? [attribution] : []);
  } else {
    const { headline, quote, attribution } = splitCells(contentCells.length ? contentCells : cells);
    headlineEl = buildPart('div', 'testimonial-headline', [headline]);
    quoteEl = buildPart('div', 'testimonial-quote', quote);
    attributionEl = buildPart('footer', 'testimonial-attribution', [attribution]);
  }

  markCitation(attributionEl);

  const blockquote = document.createElement('blockquote');
  blockquote.append(...[headlineEl, quoteEl, attributionEl].filter((el) => el));
  if (!blockquote.childElementCount) return null;

  const authoredHeading = quoteEl?.querySelector('h2, h3, h4, h5, h6');
  if (!headlineEl && authoredHeading) {
    authoredHeading.classList.add('testimonial-headline');
  }

  const slide = document.createElement('li');
  slide.className = 'testimonial';
  moveInstrumentation(row, slide);
  slide.append(blockquote);
  return slide;
}

/**
 * True when a row reads like a guest quote rather than a generic carousel slide.
 * @param {Element} row the authored row
 * @returns {boolean}
 */
export function isTestimonialRow(row) {
  const cells = getCells(row).filter((cell) => !isEmpty(cell));
  if (!cells.length) return false;

  const text = cells.map((cell) => cell.textContent).join(' ');
  if (/[\u201c"\u201d"]/.test(text) || text.includes('@')) return true;

  return cells.some((cell) => cell.querySelector('h3, h4, h5')
    && cell.querySelector('p'));
}

/**
 * decorate the block
 *
 * One authored row per testimonial. The default carousel shows one at a time
 * with dot and previous/next controls; the stacked and grid variants show them
 * all at once and need no controls.
 * @param {Element} block the block
 */
export function decorateTestimonials(block) {
  const header = extractSectionHeading(block);

  const isCarousel = !block.classList.contains('stacked')
    && !block.classList.contains('grid');

  const viewport = document.createElement('div');
  viewport.className = 'testimonials-viewport';

  const track = document.createElement('ul');
  track.className = 'testimonials-track';

  getRows(block).forEach((row) => {
    const slide = buildSlide(row);
    if (slide) track.append(slide);
  });

  viewport.append(track);
  block.replaceChildren(...[header, viewport].filter(Boolean));

  if (!isCarousel) return;

  viewport.setAttribute('aria-live', 'polite');

  const slider = createSlider(track, {
    prefix: 'testimonials',
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
