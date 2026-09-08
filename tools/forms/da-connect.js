// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const SUBMIT_PATH = '/forms/da-submit.json';

function setStatus(text) {
  const el = document.getElementById('status');
  if (el) el.textContent = text;
}

(async function init() {
  const { context, token } = await DA_SDK;
  const { org, repo } = context;
  const sheet = {
    ':type': 'sheet',
    ':sheetname': 'helix-default',
    total: 1,
    offset: 0,
    limit: 1,
    data: [{ token }],
  };
  const body = new FormData();
  body.append('data', new Blob([JSON.stringify(sheet)], { type: 'application/json' }));
  const resp = await fetch(`https://admin.da.live/source/${org}/${repo}${SUBMIT_PATH}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
  if (!resp.ok) {
    setStatus(`Could not save token (${resp.status}).`);
    return;
  }
  setStatus('Token saved to /forms/da-submit. Preview that sheet, then submit the contact form.');
}());
