import createField from './form-fields.js';

const DEFINITION_SHEETS = ['shared-aem', 'helix-default'];
const SKIP_SHEETS = new Set(['incoming', 'slack', ':names', ':type', ':version', ':sheetname']);

/** Shown when the da.live sheet omits these rows (localhost uses the fuller git sheet). */
const FALLBACK_FIELDS = [
  {
    Type: 'text',
    Name: 'lastName',
    Label: 'Last name',
    Placeholder: 'Doe',
    Mandatory: 'x',
    after: 'firstName',
  },
  {
    Type: 'tel',
    Name: 'phone',
    Label: 'Phone',
    Placeholder: '+1 555 0100',
    Mandatory: '',
    after: 'email',
  },
];

/**
 * Reads field rows from a DA / EDS spreadsheet JSON.
 * Supports a single sheet (`data`) or a multi-sheet workbook whose definition
 * lives in `shared-aem` or `helix-default`.
 * @param {object} json spreadsheet JSON
 * @returns {object[]} field definitions
 */
function getFormRows(json) {
  if (Array.isArray(json?.data)) return withFallbackFields(json.data);

  const names = Array.isArray(json?.[':names']) ? json[':names'] : Object.keys(json || {});
  const definitionName = names.find((name) => DEFINITION_SHEETS.includes(name))
    || names.find((name) => !SKIP_SHEETS.has(name) && Array.isArray(json[name]?.data));

  const rows = definitionName && Array.isArray(json[definitionName]?.data)
    ? json[definitionName].data
    : [];
  return withFallbackFields(rows);
}

function fieldName(row) {
  return `${row?.Name || row?.name || ''}`.toLowerCase();
}

function withFallbackFields(rows) {
  const result = [...rows];
  const names = new Set(result.map((row) => fieldName(row)));
  FALLBACK_FIELDS.forEach((field) => {
    if (names.has(field.Name.toLowerCase())) return;
    const { after, ...fd } = field;
    const index = result.findIndex((row) => fieldName(row) === after.toLowerCase());
    result.splice(index >= 0 ? index + 1 : Math.max(result.length - 1, 0), 0, fd);
    names.add(field.Name.toLowerCase());
  });
  return result;
}

/**
 * Builds the EDS form admin URL that appends a row to the spreadsheet's
 * `incoming` sheet (the sheet authors edit as Excel in da.live).
 * @param {string} formPath spreadsheet pathname, with or without `.json`
 * @returns {string|null}
 */
function jsonUrlFromAnchor(anchor) {
  const text = anchor.textContent.trim();
  if (/^https?:\/\//i.test(text) && text.includes('.json')) return text;
  return anchor.href;
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
    .map((anchor) => jsonUrlFromAnchor(anchor))
    .filter(Boolean);
  const formHref = hrefs.find(isJsonHref);
  if (!formHref) return null;

  const explicitSubmit = hrefs.find((href) => href !== formHref);
  const formUrl = resolveHref(formHref);
  const submitUrl = resolveHref(explicitSubmit || formHref);
  const sameSheet = !explicitSubmit
    || (formUrl && submitUrl && formUrl.pathname === submitUrl.pathname);

  if (sameSheet) {
    // da.live sheets cannot be written by the retired Helix /form API (404).
    return { formHref, submitHref: '' };
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
  form.dataset.sheet = pathname;

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

function siteContext() {
  const parts = window.location.hostname.split('.')[0].split('--');
  if (parts.length >= 3) {
    return { org: parts[parts.length - 1], site: parts.slice(1, -1).join('--') };
  }
  return { org: 'vinitbodage', site: 'site-templates' };
}

function appendIncoming(sheet, payload) {
  const next = JSON.parse(JSON.stringify(sheet || {}));
  if (!next[':names']) next[':names'] = ['shared-aem', 'incoming'];
  if (!next[':names'].includes('incoming')) next[':names'].push('incoming');
  next[':type'] = 'multi-sheet';
  if (!next.incoming) next.incoming = { total: 0, offset: 0, limit: 0, data: [] };

  const headers = new Set();
  (next.incoming.data || []).forEach((row) => Object.keys(row).forEach((key) => headers.add(key)));
  Object.keys(payload).forEach((key) => headers.add(key));

  const row = {};
  headers.forEach((key) => {
    const match = Object.keys(payload).find((name) => name.toLowerCase() === key.toLowerCase());
    row[key] = match ? payload[match] : '';
  });

  const data = (next.incoming.data || [])
    .filter((entry) => Object.values(entry).some((value) => `${value}`.trim()));
  data.push(row);
  next.incoming.data = data;
  next.incoming.total = data.length;
  next.incoming.limit = data.length;
  next.incoming.offset = 0;
  return next;
}

async function getDaWriteToken() {
  try {
    const resp = await fetch('/forms/da-submit.json');
    if (!resp.ok) return '';
    const json = await resp.json();
    const rows = json.data || json['helix-default']?.data || [];
    const row = rows.find((entry) => entry.token || entry.Token || entry.value);
    return `${row?.token || row?.Token || row?.value || json.token || ''}`.trim();
  } catch (e) {
    return '';
  }
}

async function previewDaSheet(org, site, pathname) {
  const path = pathname.replace(/\.json$/, '');
  try {
    await fetch(`https://admin.hlx.page/preview/${org}/${site}/main${path}`, { method: 'POST' });
  } catch (e) {
    // Preview can fail without Sidekick auth; the da.live sheet is still updated.
  }
}

async function submitToDaLive(pathname, payload) {
  const { org, site } = siteContext();
  const sheetResp = await fetch(pathname);
  if (!sheetResp.ok) {
    throw new Error(`Unable to load sheet: ${sheetResp.status}`);
  }
  const sheet = appendIncoming(await sheetResp.json(), payload);
  const token = await getDaWriteToken();
  const body = new FormData();
  body.append('data', new Blob([JSON.stringify(sheet)], { type: 'application/json' }));
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://admin.da.live/source/${org}/${site}${pathname}`, {
    method: 'POST',
    headers,
    body,
  });
  if (response.ok) {
    await previewDaSheet(org, site, pathname);
  }
  return response;
}

async function postFormData(action, payload) {
  const body = JSON.stringify({ data: payload });
  return fetch(action, {
    method: 'POST',
    body,
    headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
  });
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    if (submit) submit.disabled = true;
    setFormMessage(form, '', '');

    const payload = generatePayload(form);
    const response = form.dataset.action
      ? await postFormData(form.dataset.action, payload)
      : await submitToDaLive(form.dataset.sheet, payload);
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
        return;
      }
      form.reset();
      setFormMessage(form, 'success', 'Thank you. Your response was saved to the da.live spreadsheet.');
    } else if (response.status === 401) {
      setFormMessage(
        form,
        'error',
        'da.live needs a write token. Open /forms/da-submit in da.live, paste an IMS token in the token column, then Preview that sheet.',
      );
    } else {
      throw new Error(`${response.status} ${response.statusText}`);
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
