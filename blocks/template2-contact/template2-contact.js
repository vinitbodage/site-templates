import {
  getRows, getCells, isEmpty, splitHeading, addRule, optimizePicture,
} from '../../scripts/template/template2.js';
import { moveInstrumentation } from '../../ue/scripts/ue-utils.js';

const MAP_RE = /maps\./i;

/**
 * Builds the static contact form. The page has no backend to submit to, so
 * the submit handler just confirms receipt to the visitor.
 * @returns {Element} the form element
 */
function buildForm() {
  const form = document.createElement('form');
  form.className = 'template2-contact-form';
  form.setAttribute('novalidate', '');
  form.innerHTML = `
    <div class="template2-contact-field">
      <label for="template2-contact-name">Full Name</label>
      <input id="template2-contact-name" name="name" type="text" autocomplete="name" required>
    </div>
    <div class="template2-contact-field">
      <label for="template2-contact-email">Email</label>
      <input id="template2-contact-email" name="email" type="email" autocomplete="email" required>
    </div>
    <div class="template2-contact-field">
      <label for="template2-contact-phone">Phone</label>
      <input id="template2-contact-phone" name="phone" type="tel" autocomplete="tel">
    </div>
    <div class="template2-contact-field template2-contact-field-wide">
      <label for="template2-contact-message">Message</label>
      <textarea id="template2-contact-message" name="message" rows="5" required></textarea>
    </div>
    <button type="submit" class="template2-contact-submit">Send Message</button>
  `;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // eslint-disable-next-line no-alert
    window.alert('Thanks for reaching out! This demo form is not connected to email yet.');
    form.reset();
  });
  return form;
}

/**
 * Turns an authored map link or image into an embedded map panel.
 * @param {Element} cell the authored cell holding the map link or image
 * @returns {Element|null} the map panel, or null when the cell has nothing usable
 */
function buildMapEmbed(cell) {
  const link = [...cell.querySelectorAll('a')].find((a) => MAP_RE.test(a.href));
  const picture = cell.querySelector('picture');
  const wrap = document.createElement('div');
  wrap.className = 'template2-contact-map';
  moveInstrumentation(cell, wrap);

  if (link) {
    const iframe = document.createElement('iframe');
    iframe.src = link.href;
    iframe.loading = 'lazy';
    iframe.title = link.textContent.trim() || 'Location map';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    wrap.append(iframe);
  } else if (picture) {
    wrap.append(picture);
  }

  return wrap.childElementCount ? wrap : null;
}

/**
 * decorate the block
 *
 * Authors supply a details cell (heading, address, phone, email, hours) and
 * an optional map cell holding either a Google Maps link or a static image.
 * A contact form is added automatically; it has no backend yet.
 * @param {Element} block the block
 */
export default function decorate(block) {
  const details = document.createElement('div');
  details.className = 'template2-contact-details';
  let mapEl = null;

  getRows(block).forEach((row) => {
    getCells(row).forEach((cell) => {
      if (isEmpty(cell)) return;
      const isMapCell = MAP_RE.test([...cell.querySelectorAll('a')].map((a) => a.href).join(' '))
        || (cell.querySelector('picture') && !cell.textContent.trim());

      if (isMapCell) {
        mapEl = buildMapEmbed(cell);
        return;
      }

      if (!details.childElementCount) moveInstrumentation(cell, details);
      details.append(...cell.childNodes);
    });
  });

  const heading = details.querySelector('h1, h2, h3');
  if (heading) {
    splitHeading(heading);
    addRule(heading);
  }

  const info = document.createElement('div');
  info.className = 'template2-contact-info';
  info.append(details, buildForm());

  const layout = document.createElement('div');
  layout.className = 'template2-contact-layout';
  layout.append(info);
  if (mapEl) layout.append(mapEl);

  block.replaceChildren(layout);

  block.querySelectorAll('picture > img').forEach((img) => {
    optimizePicture(img, { width: '800' });
  });
}
