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
function hostParts(hostname) {
  const host = hostname.split('.')[0];
  const parts = host.split('--');
  if (parts.length < 3) return null;
  return {
    ref: parts[0],
    repo: parts.slice(1, -1).join('--'),
    owner: parts[parts.length - 1],
  };
}

function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function buildAdminFormUrl(formHref) {
  const url = resolveHref(formHref);
  const fromLink = url && !isLocalHost(url.hostname) ? hostParts(url.hostname) : null;
  const parts = fromLink || hostParts(window.location.hostname);
  if (!parts || !url?.pathname) return null;
  const sheetPath = url.pathname.endsWith('.json') ? url.pathname : `${url.pathname}.json`;
  // Incoming writes go to the content site (main), not the code-branch preview host.
  return `https://admin.hlx.page/form/${parts.owner}/${parts.repo}/main${sheetPath}`;
}

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
    const adminUrl = buildAdminFormUrl(formHref);
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

function incomingPayload(payload) {
  const data = { ...payload };
  Object.keys(payload).forEach((key) => {
    data[key.toLowerCase()] = payload[key];
  });
  return data;
}

function submitTargets(action) {
  const withJson = action.endsWith('.json') ? action : `${action}.json`;
  return [...new Set([
    withJson,
    withJson.replace('admin.hlx.page', 'admin.aem.page'),
    action,
  ])];
}

async function postFormData(action, payload) {
  const body = JSON.stringify({ data: incomingPayload(payload) });
  let lastResponse = null;
  const attempts = [
    { headers: { 'Content-Type': 'application/json' } },
    { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } },
  ];

  const targets = submitTargets(action);
  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < targets.length; i += 1) {
    for (let j = 0; j < attempts.length; j += 1) {
      try {
        const response = await fetch(targets[i], {
          method: 'POST',
          body,
          headers: attempts[j].headers,
        });
        lastResponse = response;
        if (response.ok) return response;
      } catch (e) {
        lastResponse = lastResponse || { ok: false, status: 0, statusText: e.message };
      }
    }
  }
  /* eslint-enable no-await-in-loop */
  return lastResponse || { ok: false, status: 0, statusText: 'No response' };
}

async function handleSubmit(form) {
  if (form.getAttribute('data-submitting') === 'true') return;

  const submit = form.querySelector('button[type="submit"]');
  try {
    form.setAttribute('data-submitting', 'true');
    if (submit) submit.disabled = true;
    setFormMessage(form, '', '');

    const payload = generatePayload(form);
    const response = await postFormData(form.dataset.action, payload);
    if (response.ok) {
      if (form.dataset.confirmation) {
        window.location.href = form.dataset.confirmation;
        return;
      }
      form.reset();
      setFormMessage(form, 'success', 'Thank you. Your response was saved to the spreadsheet.');
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
