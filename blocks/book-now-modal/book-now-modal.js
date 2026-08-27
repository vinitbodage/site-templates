import { loadCSS } from '../../scripts/aem.js';
import {
  setBookingBaseUrl, buildBookingUrl,
} from '../../scripts/template/booking.js';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const DEFAULT_LABELS = {
  title: 'Select Your Date',
  close: 'Close',
  checkIn: 'Checkin',
  checkOut: 'Checkout',
  adults: 'Adults',
  kids: 'Kids',
  rooms: 'Rooms',
  promo: 'Promo Code',
  submit: 'Reserve',
  footerNote: `
    <a href="/best-rate-guarantee">Best Rate Guarantee</a>
    <span aria-hidden="true">|</span>
    Reservations: <a href="tel:7272819500">727-281-9500</a>
    <span aria-hidden="true">|</span>
    <a href="https://www.wyndhamhotels.com/wyndham-rewards">Book with Wyndham Rewards Points</a>
  `.trim(),
};

/** @type {typeof DEFAULT_LABELS} */
let modalLabels = { ...DEFAULT_LABELS };

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * @param {Element} block
 * @param {number} index zero-based row index
 * @returns {Element|null}
 */
function getRowCell(block, index) {
  const row = block.children[index];
  return row?.querySelector(':scope > div') || null;
}

/**
 * @param {Element} block
 * @param {number} index
 * @param {string} fallback
 * @returns {string}
 */
function readRowText(block, index, fallback) {
  const cell = getRowCell(block, index);
  const text = cell?.textContent?.trim();
  return text || fallback;
}

/**
 * @param {Element} block
 * @param {number} index
 * @param {string} fallback
 * @returns {string}
 */
function readRowHtml(block, index, fallback) {
  const cell = getRowCell(block, index);
  const html = cell?.innerHTML?.trim();
  return html || fallback;
}

/**
 * Reads authorable labels from the hidden config block.
 * @param {Element} block
 * @returns {typeof DEFAULT_LABELS}
 */
function parseLabels(block) {
  return {
    title: readRowText(block, 1, DEFAULT_LABELS.title),
    close: readRowText(block, 2, DEFAULT_LABELS.close),
    checkIn: readRowText(block, 3, DEFAULT_LABELS.checkIn),
    checkOut: readRowText(block, 4, DEFAULT_LABELS.checkOut),
    adults: readRowText(block, 5, DEFAULT_LABELS.adults),
    kids: readRowText(block, 6, DEFAULT_LABELS.kids),
    rooms: readRowText(block, 7, DEFAULT_LABELS.rooms),
    promo: readRowText(block, 8, DEFAULT_LABELS.promo),
    submit: readRowText(block, 9, DEFAULT_LABELS.submit),
    footerNote: readRowHtml(block, 10, DEFAULT_LABELS.footerNote),
  };
}

let dialogEl = null;
let lastTrigger = null;
let focusTrapHandler = null;

const BOOK_NOW_HASH = '#book-now-modal';

/** Removes the book-now hash from the URL without adding a history entry. */
function clearBookNowHash() {
  if (window.location.hash !== BOOK_NOW_HASH) return;
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** Syncs the book-now hash into the URL without adding a history entry. */
function setBookNowHash() {
  if (window.location.hash === BOOK_NOW_HASH) return;
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}${BOOK_NOW_HASH}`,
  );
}

/**
 * @param {string} isoDate YYYY-MM-DD
 * @returns {string}
 */
function formatDisplayDate(isoDate) {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/**
 * @param {HTMLInputElement} input
 * @param {Element} display
 */
function syncDateDisplay(input, display) {
  display.textContent = formatDisplayDate(input.value);
}

/**
 * Opens the native date picker when the row is clicked.
 * @param {Element} row
 * @param {HTMLInputElement} input
 * @param {Element} display
 */
function bindDateRow(row, input, display) {
  const openPicker = () => {
    if (typeof input.showPicker === 'function') {
      try {
        input.showPicker();
        return;
      } catch {
        // showPicker can throw if not triggered by user gesture in some browsers
      }
    }
    input.focus();
    input.click();
  };

  row.addEventListener('click', (e) => {
    e.preventDefault();
    openPicker();
  });

  row.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  });

  input.addEventListener('change', () => syncDateDisplay(input, display));
  input.addEventListener('input', () => syncDateDisplay(input, display));
}

/**
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 * @param {string} message
 */
function showFieldError(field, message) {
  const wrapper = field.closest('.field-wrapper, .book-now-date-row, .book-now-occupancy-field');
  if (!wrapper) return;
  let error = wrapper.querySelector('.field-error');
  if (!error) {
    error = document.createElement('span');
    error.className = 'field-error';
    error.id = `${field.id}-error`;
    wrapper.append(error);
  }
  error.textContent = message;
  field.setAttribute('aria-invalid', 'true');
  field.setAttribute('aria-describedby', error.id);
}

/**
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 */
function clearFieldError(field) {
  const wrapper = field.closest('.field-wrapper, .book-now-date-row, .book-now-occupancy-field');
  wrapper?.querySelector('.field-error')?.remove();
  field.removeAttribute('aria-invalid');
  field.removeAttribute('aria-describedby');
}

/**
 * @param {HTMLFormElement} form
 * @returns {boolean}
 */
function validateForm(form) {
  let valid = true;
  const checkIn = form.querySelector('#book-check-in');
  const checkOut = form.querySelector('#book-check-out');

  form.querySelectorAll('input, select, textarea').forEach((field) => {
    clearFieldError(field);
  });

  form.querySelectorAll('[required]').forEach((field) => {
    if (!field.value.trim()) {
      showFieldError(field, `${field.labels?.[0]?.textContent.replace('*', '').trim() || 'This field'} is required.`);
      valid = false;
    }
  });

  if (checkIn?.value && checkOut?.value && checkOut.value <= checkIn.value) {
    showFieldError(checkOut, `${modalLabels.checkOut} must be after ${modalLabels.checkIn.toLowerCase()}.`);
    valid = false;
  }

  if (checkIn?.value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(`${checkIn.value}T00:00:00`) < today) {
      showFieldError(checkIn, `${modalLabels.checkIn} cannot be in the past.`);
      valid = false;
    }
  }

  return valid;
}

/**
 * @param {HTMLFormElement} form
 */
function handleSubmit(form) {
  if (!validateForm(form)) {
    const firstInvalid = form.querySelector('[aria-invalid="true"]');
    firstInvalid?.focus();
    return;
  }

  const data = {
    checkIn: form.checkIn.value,
    checkOut: form.checkOut.value,
    adults: form.adults.value,
    children: form.children.value || '0',
    rooms: form.rooms.value,
    promoCode: form.promoCode?.value?.trim() || '',
  };

  window.location.href = buildBookingUrl(data);
}

/**
 * Traps keyboard focus inside the open dialog.
 * @param {HTMLDialogElement} dialog
 */
function bindFocusTrap(dialog) {
  focusTrapHandler = (e) => {
    if (e.key !== 'Tab' || !dialog.open) return;
    const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null,
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  dialog.addEventListener('keydown', focusTrapHandler);
}

/**
 * @param {HTMLDialogElement} dialog
 */
function unbindFocusTrap(dialog) {
  if (focusTrapHandler) {
    dialog.removeEventListener('keydown', focusTrapHandler);
    focusTrapHandler = null;
  }
}

/**
 * Builds the booking dialog DOM once.
 * @param {typeof DEFAULT_LABELS} labels
 * @returns {HTMLDialogElement}
 */
function buildDialog(labels) {
  const dialog = document.createElement('dialog');
  dialog.className = 'book-now-dialog';
  dialog.setAttribute('role', 'dialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'book-now-title');

  const today = new Date();
  const checkout = new Date(today);
  checkout.setDate(checkout.getDate() + 3);
  const toIso = (d) => d.toISOString().slice(0, 10);

  dialog.innerHTML = `
    <div class="book-now-scene">
      <div class="book-now-backdrop" aria-hidden="true"></div>
      <button type="button" class="book-now-close" aria-label="${escapeHtml(labels.close)} booking form">
        <span aria-hidden="true">${escapeHtml(labels.close)}</span>
        <span class="book-now-close-x" aria-hidden="true">X</span>
      </button>
      <div class="book-now-content">
        <h2 id="book-now-title">${escapeHtml(labels.title)}</h2>
        <form class="book-now-form" novalidate>
          <div class="book-now-dates">
            <div class="book-now-date-row" role="button" tabindex="0" aria-label="Select ${escapeHtml(labels.checkIn.toLowerCase())} date">
              <label for="book-check-in">${escapeHtml(labels.checkIn)}</label>
              <span class="book-now-date-display" id="book-check-in-display" aria-hidden="true"></span>
              <input type="date" id="book-check-in" name="checkIn" class="book-now-date-input" value="${toIso(today)}" required aria-label="${escapeHtml(labels.checkIn)} date" tabindex="-1">
            </div>
            <div class="book-now-date-row" role="button" tabindex="0" aria-label="Select ${escapeHtml(labels.checkOut.toLowerCase())} date">
              <label for="book-check-out">${escapeHtml(labels.checkOut)}</label>
              <span class="book-now-date-display" id="book-check-out-display" aria-hidden="true"></span>
              <input type="date" id="book-check-out" name="checkOut" class="book-now-date-input" value="${toIso(checkout)}" required aria-label="${escapeHtml(labels.checkOut)} date" tabindex="-1">
            </div>
          </div>
          <div class="book-now-occupancy">
            <div class="book-now-occupancy-field">
              <label for="book-adults">${escapeHtml(labels.adults)}</label>
              <select id="book-adults" name="adults" required aria-label="Number of ${escapeHtml(labels.adults.toLowerCase())}"></select>
            </div>
            <div class="book-now-occupancy-field">
              <label for="book-children">${escapeHtml(labels.kids)}</label>
              <select id="book-children" name="children" aria-label="Number of ${escapeHtml(labels.kids.toLowerCase())}"></select>
            </div>
            <div class="book-now-occupancy-field">
              <label for="book-rooms">${escapeHtml(labels.rooms)}</label>
              <select id="book-rooms" name="rooms" required aria-label="Number of ${escapeHtml(labels.rooms.toLowerCase())}"></select>
            </div>
            <div class="book-now-occupancy-field book-now-promo-field">
              <label for="book-promo">${escapeHtml(labels.promo)}</label>
              <input type="text" id="book-promo" name="promoCode" autocomplete="off" aria-label="${escapeHtml(labels.promo)}">
            </div>
          </div>
          <div class="book-now-actions">
            <button type="submit" class="book-now-submit">${escapeHtml(labels.submit)}</button>
          </div>
          <p class="book-now-footer-note"></p>
        </form>
      </div>
    </div>
  `;

  dialog.querySelector('.book-now-footer-note').innerHTML = labels.footerNote;

  const adults = dialog.querySelector('#book-adults');
  const children = dialog.querySelector('#book-children');
  const rooms = dialog.querySelector('#book-rooms');
  const checkIn = dialog.querySelector('#book-check-in');
  const checkOut = dialog.querySelector('#book-check-out');
  const checkInDisplay = dialog.querySelector('#book-check-in-display');
  const checkOutDisplay = dialog.querySelector('#book-check-out-display');

  for (let i = 1; i <= 12; i += 1) {
    adults.add(new Option(String(i), String(i), false, i === 2));
    rooms.add(new Option(String(i), String(i), false, i === 1));
  }
  children.add(new Option('0', '0', true, true));
  for (let i = 1; i <= 12; i += 1) children.add(new Option(String(i), String(i)));

  syncDateDisplay(checkIn, checkInDisplay);
  syncDateDisplay(checkOut, checkOutDisplay);
  bindDateRow(checkIn.closest('.book-now-date-row'), checkIn, checkInDisplay);
  bindDateRow(checkOut.closest('.book-now-date-row'), checkOut, checkOutDisplay);

  const form = dialog.querySelector('form');
  const close = () => dialog.close();

  dialog.querySelector('.book-now-close').addEventListener('click', close);

  dialog.addEventListener('close', () => {
    document.body.classList.remove('book-now-open');
    unbindFocusTrap(dialog);
    clearBookNowHash();
    if (lastTrigger) {
      lastTrigger.focus();
      lastTrigger = null;
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(form);
  });

  form.querySelectorAll('input, select, textarea').forEach((field) => {
    field.addEventListener('input', () => clearFieldError(field));
  });

  return dialog;
}

/**
 * Opens the accessible booking modal.
 * @param {Element} [trigger] element that opened the modal (for focus restore)
 */
export async function openBookNowModal(trigger) {
  await loadCSS(`${window.hlx.codeBasePath}/blocks/book-now-modal/book-now-modal.css`);

  if (!dialogEl) {
    dialogEl = buildDialog(modalLabels);
    document.body.append(dialogEl);
  }

  lastTrigger = trigger || document.activeElement;
  dialogEl.showModal();
  document.body.classList.add('book-now-open');
  bindFocusTrap(dialogEl);
  setBookNowHash();

  const firstField = dialogEl.querySelector('.book-now-date-row');
  firstField?.focus();
}

const BOOK_NOW_TRIGGER = '.book-now, [data-book-now], .book-now-modal';

let triggersBound = false;

/**
 * @param {Element} trigger
 * @returns {boolean}
 */
function shouldOpenBookNowModal(trigger) {
  if (trigger.hasAttribute('data-book-now')) return true;
  if (trigger.classList.contains('book-now')) return true;
  const href = trigger.getAttribute('href') || '';
  const hash = trigger.hash || (href.startsWith('#') ? href : '');
  return hash === BOOK_NOW_HASH;
}

/**
 * Wires Book Now triggers on the page via event delegation.
 * @param {Document|Element} root
 */
export function bindBookNowTriggers(root = document) {
  if (triggersBound) return;
  triggersBound = true;

  root.addEventListener('click', (e) => {
    const trigger = e.target.closest(BOOK_NOW_TRIGGER);
    if (!trigger || !shouldOpenBookNowModal(trigger)) return;
    e.preventDefault();
    openBookNowModal(trigger);
  });

  const openFromHash = () => {
    if (window.location.hash === BOOK_NOW_HASH && !dialogEl?.open) {
      openBookNowModal();
    }
  };
  openFromHash();
  window.addEventListener('hashchange', openFromHash);
}

/**
 * decorate the block — stores booking URL config and hides the block shell.
 * @param {Element} block
 */
export default function decorate(block) {
  modalLabels = parseLabels(block);

  const configLink = block.querySelector('a[href*="synxis"], a[href*="book"]');
  if (configLink) setBookingBaseUrl(configLink.href);

  block.classList.add('book-now-modal-config');
  block.setAttribute('aria-hidden', 'true');
  block.hidden = true;
}