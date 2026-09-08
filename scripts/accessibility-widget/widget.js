/**
 * Site accessibility widget UI.
 * @param {object} config
 * @param {boolean} [config.themeSync]
 * @param {string} [config.position]
 * @param {string} [config.storageKey]
 */
import {
  applyAccessibility,
  resetAccessibility,
  getStored,
  THEMES,
  TEXT_COLORS,
  BG_COLORS,
  CONTRAST_MODES,
  FONT_SCALES,
} from './state.js';
import { bindReadAloud, isSpeechSupported, stopSpeech } from './tts.js';
import { ACCESSIBILITY_ICON, CLOSE_ICON } from './icons.js';

/**
 * @param {object} config
 */
export default function initWidget(config = {}) {
  if (document.querySelector('.site-a11y-widget')) return;

  const themeSync = config.themeSync !== false;
  const position = config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
  const storageKey = config.storageKey || 'site-a11y';
  const options = { themeSync, storageKey };

  let state = getStored(storageKey);
  applyAccessibility(state, options);

  /** @type {(() => void) | null} */
  let readAloudCleanup = null;

  const root = document.createElement('div');
  root.className = `site-a11y-widget site-a11y-widget--${position}`;

  const live = document.createElement('div');
  live.className = 'site-a11y-live';
  live.setAttribute('aria-live', 'polite');
  live.setAttribute('aria-atomic', 'true');

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'site-a11y-widget-toggle';
  toggle.setAttribute('aria-label', 'Open accessibility options');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.innerHTML = ACCESSIBILITY_ICON;

  const panelId = `site-a11y-panel-${Math.random().toString(36).slice(2, 8)}`;
  toggle.setAttribute('aria-controls', panelId);

  const panel = document.createElement('div');
  panel.id = panelId;
  panel.className = 'site-a11y-widget-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', 'Accessibility options');
  panel.hidden = true;

  const header = document.createElement('div');
  header.className = 'site-a11y-widget-header';
  header.innerHTML = '<h2>Accessibility</h2>';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'site-a11y-widget-close';
  closeBtn.setAttribute('aria-label', 'Close accessibility options');
  closeBtn.innerHTML = CLOSE_ICON;
  header.append(closeBtn);

  const body = document.createElement('div');
  body.className = 'site-a11y-widget-body';

  const announce = (msg) => {
    live.textContent = msg;
  };

  const createSection = (title) => {
    const section = document.createElement('div');
    section.className = 'site-a11y-widget-section';
    const h3 = document.createElement('h3');
    h3.textContent = title;
    section.append(h3);
    return section;
  };

  const themeSection = createSection('Theme color');
  const themeOptions = document.createElement('div');
  themeOptions.className = 'site-a11y-widget-options';
  themeSection.append(themeOptions);

  const defaultThemeBtn = document.createElement('button');
  defaultThemeBtn.type = 'button';
  defaultThemeBtn.className = 'site-a11y-widget-option';
  defaultThemeBtn.dataset.theme = 'default';
  defaultThemeBtn.innerHTML = '<span class="site-a11y-widget-swatch site-a11y-widget-swatch--default" aria-hidden="true"></span> Default';
  themeOptions.append(defaultThemeBtn);

  THEMES.forEach((theme) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.theme = theme.id;
    btn.innerHTML = `<span class="site-a11y-widget-swatch" style="background-color:${theme.color}" aria-hidden="true"></span> ${theme.label}`;
    themeOptions.append(btn);
  });

  const textSection = createSection('Text color');
  const textOptions = document.createElement('div');
  textOptions.className = 'site-a11y-widget-options';
  textSection.append(textOptions);

  TEXT_COLORS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.textColor = item.id;
    if (item.value) {
      btn.innerHTML = `<span class="site-a11y-widget-swatch" style="background-color:${item.value}" aria-hidden="true"></span> ${item.label}`;
    } else {
      btn.textContent = item.label;
    }
    textOptions.append(btn);
  });

  const bgSection = createSection('Background color');
  const bgOptions = document.createElement('div');
  bgOptions.className = 'site-a11y-widget-options';
  bgSection.append(bgOptions);

  BG_COLORS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.bgColor = item.id;
    if (item.value) {
      btn.innerHTML = `<span class="site-a11y-widget-swatch" style="background-color:${item.value}" aria-hidden="true"></span> ${item.label}`;
    } else {
      btn.textContent = item.label;
    }
    bgOptions.append(btn);
  });

  const contrastSection = createSection('Contrast');
  const contrastOptions = document.createElement('div');
  contrastOptions.className = 'site-a11y-widget-options';
  contrastSection.append(contrastOptions);

  CONTRAST_MODES.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.contrast = item.id;
    btn.textContent = item.label;
    contrastOptions.append(btn);
  });

  const sizeSection = createSection('Text size');
  const sizeRow = document.createElement('div');
  sizeRow.className = 'site-a11y-widget-row';
  const stepper = document.createElement('div');
  stepper.className = 'site-a11y-widget-stepper';
  const decBtn = document.createElement('button');
  decBtn.type = 'button';
  decBtn.setAttribute('aria-label', 'Decrease text size');
  decBtn.textContent = '−';
  const sizeLabel = document.createElement('span');
  sizeLabel.setAttribute('aria-live', 'polite');
  const incBtn = document.createElement('button');
  incBtn.type = 'button';
  incBtn.setAttribute('aria-label', 'Increase text size');
  incBtn.textContent = '+';
  stepper.append(decBtn, sizeLabel, incBtn);
  sizeRow.append(stepper);
  sizeSection.append(sizeRow);

  const linkSection = createSection('Navigation');
  const linkRow = document.createElement('div');
  linkRow.className = 'site-a11y-widget-toggle-row';
  linkRow.innerHTML = '<span>Highlight links</span>';
  const linkToggle = document.createElement('button');
  linkToggle.type = 'button';
  linkToggle.className = 'site-a11y-widget-switch';
  linkToggle.setAttribute('aria-label', 'Highlight links');
  linkToggle.setAttribute('aria-pressed', 'false');
  linkRow.append(linkToggle);
  linkSection.append(linkRow);

  const readSection = createSection('Read aloud');
  const readRow = document.createElement('div');
  readRow.className = 'site-a11y-widget-toggle-row';
  const readLabel = document.createElement('span');
  readLabel.textContent = isSpeechSupported() ? 'Click content to read' : 'Not supported in this browser';
  const readToggle = document.createElement('button');
  readToggle.type = 'button';
  readToggle.className = 'site-a11y-widget-switch';
  readToggle.setAttribute('aria-label', 'Read aloud');
  readToggle.setAttribute('aria-pressed', 'false');
  readToggle.disabled = !isSpeechSupported();
  readRow.append(readLabel, readToggle);
  readSection.append(readRow);

  const stopBtn = document.createElement('button');
  stopBtn.type = 'button';
  stopBtn.className = 'site-a11y-widget-stop';
  stopBtn.textContent = 'Stop reading';
  stopBtn.hidden = true;
  stopBtn.addEventListener('click', () => {
    stopSpeech();
    announce('Reading stopped');
  });
  readSection.append(stopBtn);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'site-a11y-widget-reset';
  resetBtn.textContent = 'Reset all settings';

  body.append(
    themeSection,
    textSection,
    bgSection,
    contrastSection,
    sizeSection,
    linkSection,
    readSection,
    resetBtn,
  );

  panel.append(header, body);
  root.append(live, toggle, panel);
  document.body.append(root);

  /** @type {() => void} */
  let renderAll = () => {};

  const syncReadAloud = () => {
    readAloudCleanup?.();
    readAloudCleanup = bindReadAloud(state.readAloud, () => {});
    stopBtn.hidden = !state.readAloud;
  };

  const update = (partial, message) => {
    state = applyAccessibility({ ...state, ...partial }, options);
    renderAll();
    syncReadAloud();
    if (message) announce(message);
  };

  renderAll = () => {
    themeOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      const active = btn.dataset.theme === (state.theme || 'default');
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    textOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.textColor === state.textColor ? 'true' : 'false');
    });
    bgOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.bgColor === state.bgColor ? 'true' : 'false');
    });
    contrastOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.contrast === state.contrast ? 'true' : 'false');
    });
    sizeLabel.textContent = `${Math.round((FONT_SCALES[state.fontScaleIndex] ?? 1) * 100)}%`;
    decBtn.disabled = state.fontScaleIndex <= 0;
    incBtn.disabled = state.fontScaleIndex >= FONT_SCALES.length - 1;
    linkToggle.setAttribute('aria-pressed', state.linkHighlight ? 'true' : 'false');
    readToggle.setAttribute('aria-pressed', state.readAloud ? 'true' : 'false');
    stopBtn.hidden = !state.readAloud;
  };

  const openPanel = () => {
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    closeBtn.focus();
  };

  const closePanel = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
  };

  toggle.addEventListener('click', () => {
    if (panel.hidden) openPanel();
    else closePanel();
  });

  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('click', (event) => {
    if (!panel.hidden && !root.contains(event.target)) closePanel();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) closePanel();
  });

  document.addEventListener('themechange', (event) => {
    const themeId = event.detail?.id;
    if (themeId && themeId !== state.theme) {
      state = applyAccessibility({ ...state, theme: themeId }, { ...options, themeSync: false });
      renderAll();
    }
  });

  defaultThemeBtn.addEventListener('click', () => update({ theme: 'default' }, 'Theme reset to default'));
  themeOptions.querySelectorAll('.site-a11y-widget-option[data-theme]').forEach((btn) => {
    if (btn.dataset.theme === 'default') return;
    btn.addEventListener('click', () => {
      update({ theme: btn.dataset.theme }, `Theme set to ${btn.textContent.trim()}`);
    });
  });
  textOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
    btn.addEventListener('click', () => update({ textColor: btn.dataset.textColor }, `Text color: ${btn.textContent.trim()}`));
  });
  bgOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
    btn.addEventListener('click', () => update({ bgColor: btn.dataset.bgColor }, `Background: ${btn.textContent.trim()}`));
  });
  contrastOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
    btn.addEventListener('click', () => update({ contrast: btn.dataset.contrast }, `Contrast: ${btn.textContent.trim()}`));
  });
  decBtn.addEventListener('click', () => {
    const next = Math.max(0, state.fontScaleIndex - 1);
    update({ fontScaleIndex: next }, `Text size ${Math.round(FONT_SCALES[next] * 100)}%`);
  });
  incBtn.addEventListener('click', () => {
    const next = Math.min(FONT_SCALES.length - 1, state.fontScaleIndex + 1);
    update({ fontScaleIndex: next }, `Text size ${Math.round(FONT_SCALES[next] * 100)}%`);
  });
  linkToggle.addEventListener('click', () => {
    const next = !state.linkHighlight;
    update({ linkHighlight: next }, next ? 'Link highlight on' : 'Link highlight off');
  });
  readToggle.addEventListener('click', () => {
    const next = !state.readAloud;
    update(
      { readAloud: next },
      next ? 'Read aloud on. Click page content to hear it.' : 'Read aloud off',
    );
  });
  resetBtn.addEventListener('click', () => {
    readAloudCleanup?.();
    readAloudCleanup = null;
    state = resetAccessibility({ storageKey });
    renderAll();
    syncReadAloud();
    announce('All accessibility settings reset');
  });

  renderAll();
  syncReadAloud();
}
