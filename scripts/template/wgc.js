/*
 * Shared helpers for the Wyndham Grand Clearwater ("wgc") template blocks.
 *
 * These exist so the five template blocks read the authored structure the same
 * way. Anything used by only one block stays in that block.
 */

import { createOptimizedPicture } from '../aem.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

/**
 * Returns the authored rows of a block.
 * @param {Element} block the block element
 * @returns {Element[]} the row elements
 */
export function getRows(block) {
  return [...block.querySelectorAll(':scope > div')];
}

/**
 * Returns the authored cells of a row.
 * @param {Element} row a block row
 * @returns {Element[]} the cell elements
 */
export function getCells(row) {
  return [...row.querySelectorAll(':scope > div')];
}

/**
 * True when a cell holds no meaningful authored content, so blocks can treat
 * an empty cell as "not provided" rather than rendering an empty wrapper.
 * @param {Element} cell a block cell
 * @returns {boolean} whether the cell is empty
 */
export function isEmpty(cell) {
  if (!cell) return true;
  if (cell.querySelector('picture, img, a, video, iframe')) return false;
  return !cell.textContent.trim();
}

/**
 * Converts the emphasised run at the start of a heading into a styled span so
 * the template can render the brand's two-tone headline. Authors italicise the
 * first words; without italics the heading is left untouched.
 * @param {Element} heading a heading element
 */
export function splitHeading(heading) {
  if (!heading) return;
  const em = heading.querySelector('em, i');
  if (em) {
    const lead = document.createElement('span');
    lead.className = 'wgc-headline-lead';
    lead.append(...em.childNodes);
    em.replaceWith(lead);
    return;
  }
  const span = heading.querySelector(':scope > span');
  if (span) span.classList.add('wgc-headline-lead');
}

/**
 * Marks the eyebrow line authors place above a heading.
 *
 * The two-tone headline is normally authored by italicising the opening words
 * of the heading itself, which splitHeading handles. Some bands instead want a
 * separate breadcrumb-style label, which authors write as a short paragraph
 * before the heading; that is the form marked up here.
 * @param {Element} container the column holding the copy
 * @param {Element} heading the heading the eyebrow belongs to
 * @param {string} className the class to apply to the eyebrow
 * @returns {Element|null} the eyebrow element
 */
export function markEyebrow(container, heading, className) {
  if (!heading) return null;

  const children = [...container.children];
  const eyebrow = children.slice(0, children.indexOf(heading))
    .find((el) => el.matches('p')
      && !el.querySelector('picture, img')
      && el.textContent.trim());

  if (eyebrow) eyebrow.classList.add(className);
  return eyebrow || null;
}

/**
 * Adds the brand hairline rule to a heading.
 * @param {Element} heading a heading element
 * @param {object} options rule options
 * @param {boolean} options.centered whether the rule is centred under the text
 * @param {boolean} options.light whether the rule is drawn in white
 */
export function addRule(heading, { centered = false, light = false } = {}) {
  if (!heading) return;
  heading.classList.add('wgc-rule');
  if (centered) heading.classList.add('wgc-rule-centered');
  if (light) heading.classList.add('wgc-rule-light');
}

/**
 * Wires a set of slides into a fading slider with dot navigation.
 *
 * The navigation is returned rather than inserted, so each block places the
 * controls where its own layout needs them. A single slide needs no controls,
 * so nothing is built and null comes back.
 *
 * Without previous/next buttons the returned element is itself the tab list,
 * which keeps the markup as flat as a plain dot strip needs to be.
 * @param {Element} track the element holding one child per slide
 * @param {object} options slider options
 * @param {string} options.prefix the class prefix for the generated controls
 * @param {string} options.label the accessible name of the navigation
 * @param {Function} options.slideLabel maps a slide index to its accessible name
 * @param {boolean} options.controls whether to add previous/next buttons
 * @returns {{nav: Element, goTo: Function, count: number}|null} the controls
 */
export function createSlider(track, {
  prefix,
  label = 'Slides',
  slideLabel = (index) => `Slide ${index + 1}`,
  controls = false,
} = {}) {
  const slides = [...track.children];
  if (slides.length < 2) return null;

  let active = 0;
  const dots = [];

  const goTo = (index) => {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, idx) => {
      slide.classList.toggle('is-active', idx === active);
      slide.setAttribute('aria-hidden', idx !== active);
    });
    dots.forEach((dot, idx) => {
      dot.classList.toggle('is-active', idx === active);
      dot.setAttribute('aria-selected', idx === active ? 'true' : 'false');
      dot.tabIndex = idx === active ? 0 : -1;
    });
  };

  const tabs = document.createElement('div');
  tabs.className = controls ? `${prefix}-dots` : `${prefix}-nav`;
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', label);

  slides.forEach((_, idx) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `${prefix}-dot`;
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', slideLabel(idx));
    dot.addEventListener('click', () => goTo(idx));
    tabs.append(dot);
    dots.push(dot);
  });

  // arrow keys move through the tab list, as expected of the tablist role
  tabs.addEventListener('keydown', (event) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    goTo(active + step);
    dots[active].focus();
  });

  let nav = tabs;

  if (controls) {
    nav = document.createElement('div');
    nav.className = `${prefix}-nav`;

    const buildControl = (direction) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `${prefix}-${direction}`;
      button.setAttribute('aria-label', direction === 'prev' ? 'Previous' : 'Next');
      button.addEventListener('click', () => goTo(active + (direction === 'prev' ? -1 : 1)));
      return button;
    };

    nav.append(buildControl('prev'), tabs, buildControl('next'));
  }

  goTo(0);
  return { nav, goTo, count: slides.length };
}

/**
 * Replaces an authored image with a pipeline-optimized picture.
 *
 * Cross-origin images and SVGs are left alone. The AEM image pipeline can only
 * resize assets it serves, so appending its parameters to a third-party URL
 * produces a source that advertises webp while the CDN returns the original;
 * SVGs have nothing to resize. Both still get an explicit loading hint.
 * @param {Element} img the authored image
 * @param {object} options optimization options
 * @param {boolean} options.eager whether the image loads eagerly
 * @param {string} options.width the target width in pixels
 */
export function optimizePicture(img, { eager = false, width = '750' } = {}) {
  const picture = img.closest('picture');
  if (!picture) return;

  const { origin } = new URL(img.src, window.location.href);
  const optimizable = origin === window.location.origin
    && !img.src.toLowerCase().includes('.svg');

  if (!optimizable) {
    img.setAttribute('loading', eager ? 'eager' : 'lazy');
    return;
  }

  const optimized = createOptimizedPicture(img.src, img.alt, eager, [{ width }]);
  moveInstrumentation(img, optimized.querySelector('img'));
  picture.replaceWith(optimized);
}
