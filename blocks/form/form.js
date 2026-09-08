import createField from './form-fields.js';

const DEFINITION_SHEETS = ['shared-aem', 'helix-default'];
const SKIP_SHEETS = new Set(['incoming', 'slack', ':names', ':type', ':version', ':sheetname']);

/**
 * Reads field rows from a DA / EDS spreadsheet JSON.
 * Supports a single sheet (`data`) or a multi-sheet workbook whose definition
 * lives in `shared-aem` or `helix-default`.
 * @param {object} json spreadsheet JSON
 * @returns {object[]} field definitions
 */
function getFormRows(json) {
  if (Array.isArray(json?.data)) return json.data;

  const names = Array.isArray(json?.[':names']) ? json[':names'] : Object.keys(json || {});
  const definitionName = names.find((name) => DEFINITION_SHEETS.includes(name))
    || names.find((name) => !SKIP_SHEETS.has(name) && Array.isArray(json[name]?.data));

  return definitionName && Array.isArray(json[definitionName]?.data)
    ? json[definitionName].data
    : [];
}

/**
 * Builds the EDS form admin URL that appends a row to the spreadsheet's
 * `incoming` sheet (the sheet authors edit as Excel in da.live).
 * @param {string} formPath spreadsheet pathname, with or without `.json`
 * @returns {string|null}
 */
function buildAdminFormUrl(formPath) {
  const host = window.location.hostname.split('.')[0];
  const parts = host.split('--');
  if (parts.length < 3) return null;

  const ref = parts[0];
  const owner = parts[parts.length - 1];
  const repo = parts.slice(1, -1).join('--');
  const sheetPath = formPath.replace(/\.json$/, '');
  return `https://admin.hlx.page/form/${owner}/${repo}/${ref}${sheetPath}`;
}

function resolveHref(href) {
  try {
    return new URL(href, window.location.href);
  } catch (e) {
    return null;
  }
}

function isJsonHref(href) {
  const url = resolveHref(href);
  return Boolean(url?.pathname?.endsWith('.json'));
}

/**
 * First `.json` link is the field definition sheet. A second distinct link is
 * an explicit submit endpoint. When both point at the same sheet, submissions
 * are sent through the EDS form API so they land in `incoming`.
 * @param {Element} block form block
 * @returns {{ formHref: string, submitHref: string }|null}
 */
function resolveFormLinks(block) {
  const hrefs = [...block.querySelectorAll('a')]
    .map((anchor) => anchor.href)
    .filter(Boolean);
  const formHref = hrefs.find(isJsonHref);
  if (!formHref) return null;

  const explicitSubmit = hrefs.find((href) => href !== formHref);
  const formUrl = resolveHref(formHref);
  const submitUrl = resolveHref(explicitSubmit || formHref);
  const sameSheet = !explicitSubmit
    || (formUrl && submitUrl && formUrl.pathname === submitUrl.pathname);

  if (sameSheet) {
    const adminUrl = formUrl ? buildAdminFormUrl(formUrl.pathname) : null;
    return { formHref, submitHref: adminUrl || formHref };
  }

  return { formHref, submitHref: explicitSubmit };
}

async function createForm(formHref, submitHref) {
  const { pathname } = new URL(formHref, window.location.href);
  const resp = await fetch(pathname);
  if (!resp.ok) {
    throw new Error(`Unable to load form definition: ${resp.status}`);
  }
  const json = await resp.json();
  const rows = getFormRows(json);

  const form = document.createElement('form');
  form.dataset.action = submitHref;

  const fields = await Promise.all(rows.map((fd) => createField(fd, form)));
  fields.forEach((field) => {
    if (field) {
      form.append(field);
    }
  });

  // group fields into fieldsets
  const fieldsets = form.querySelectorAll('fieldset');
  fieldsets.forEach((fieldset) => {
    form.querySelectorAll(`[data-fieldset="${fieldset.name}"]`).forEach((field) => {
      fieldset.append(field);
    });
  });

  const message = document.createElement('div');
  message.className = 'form-message';
  message.setAttribute('aria-live', 'polite');
  message.hidden = true;
  form.append(message);

  return form;
}

function generatePayload(form) {
  const payload = {};

  [...form.elements].forEach((field) => {
    if (field.name && field.type !== 'submit' && !field.disabled) {
      if (field.type === 'radio') {
        if (field.checked) payload[field.name] = field.value;
      } else if (field.type === 'checkbox') {
        if (field.checked) payload[field.name] = payload[field.name] ? `${payload[field.name]},${field.value}` : field.value;
      } else {
        payload[field.name] = field.value;
      }
    }
  });
  return payload;
}

function setFormMessage(form, type, text) {
  const message = form.querySelector('.form-message');
  if (!message) return;
  message.hidden = !text;
  message.className = `form-message${type ? ` ${type}` : ''}`;
  message.textContent = text || '';
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    if (submit) submit.disabled = true;
    setFormMessage(form, '', '');

    const payload = generatePayload(form);
    const response = await fetch(form.dataset.action, {
      method: 'POST',
      body: JSON.stringify({ data: payload }),
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
        return;
      }
      form.reset();
      setFormMessage(form, 'success', 'Thank you. Your response was saved to the spreadsheet.');
    } else {
      const error = await response.text();
      throw new Error(error);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    setFormMessage(form, 'error', 'Something went wrong. Please try again.');
  } finally {
    form.setAttribute('data-submitting', 'false');
    if (submit) submit.disabled = false;
  }
}

export default async function decorate(block) {
  const links = resolveFormLinks(block);
  if (!links) return;

  try {
    const form = await createForm(links.formHref, links.submitHref);
    block.replaceChildren(form);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const valid = form.checkValidity();
      if (valid) {
        handleSubmit(form);
      } else {
        const firstInvalidEl = form.querySelector(':invalid:not(fieldset)');
        if (firstInvalidEl) {
          firstInvalidEl.focus();
          firstInvalidEl.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}
