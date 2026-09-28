/**
 * Site accessibility widget UI — WCAG 2.1 AA contrast presets and readability tools.
 */
import {
  applyAccessibility,
  resetAccessibility,
  clearFilters,
  hasActiveFilters,
  getStored,
  WCAG_PRESET_OPTIONS,
  DISPLAY_MODES,
  FONT_SCALES,
} from './state.js';
import { bindReadAloud, isSpeechSupported, stopSpeech } from './tts.js';
import { ACCESSIBILITY_ICON, CLOSE_ICON } from './icons.js';

/**
 * @param {object} config
 * @param {string} [config.position]
 * @param {string} [config.storageKey]
 */
export default function initWidget(config = {}) {
  if (document.querySelector('.site-a11y-widget')) return;

  const position = config.position === 'bottom-left' ? 'bottom-left' : 'bottom-right';
  const storageKey = config.storageKey || 'site-a11y';
  const options = { storageKey };

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

  const intro = document.createElement('p');
  intro.className = 'site-a11y-widget-intro';
  intro.textContent = 'Choose WCAG AA contrast and readability options below. Theme color is set with the header picker.';

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

  const presetSection = createSection('WCAG AA contrast');
  const presetOptions = document.createElement('div');
  presetOptions.className = 'site-a11y-widget-options';
  presetSection.append(presetOptions);

  WCAG_PRESET_OPTIONS.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.preset = item.id;

    const swatch = document.createElement('span');
    swatch.className = 'site-a11y-widget-swatch';
    swatch.setAttribute('aria-hidden', 'true');

    if (item.usesTheme) {
      swatch.innerHTML = '<span class="site-a11y-widget-swatch-pair"><span style="background:var(--theme-color,#3d717f)"></span><span style="background:#fff"></span></span>';
    } else {
      swatch.innerHTML = `<span class="site-a11y-widget-swatch-pair"><span style="background:${item.bg}"></span><span style="background:${item.text}"></span></span>`;
    }

    const label = document.createElement('span');
    label.className = 'site-a11y-widget-option-label';
    label.textContent = item.label;

    btn.append(swatch, label);

    if (item.level) {
      const badge = document.createElement('span');
      badge.className = `site-a11y-widget-badge site-a11y-widget-badge--${item.level.toLowerCase()}`;
      badge.textContent = item.level;
      btn.append(badge);
    }

    if (item.ratio) {
      const ratio = document.createElement('span');
      ratio.className = 'site-a11y-widget-ratio';
      ratio.textContent = item.ratio;
      btn.append(ratio);
    }

    presetOptions.append(btn);
  });

  const displaySection = createSection('Display mode');
  const displayOptions = document.createElement('div');
  displayOptions.className = 'site-a11y-widget-options site-a11y-widget-options--row';
  displaySection.append(displayOptions);

  DISPLAY_MODES.forEach((item) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'site-a11y-widget-option';
    btn.dataset.displayMode = item.id;
    btn.textContent = item.label;
    displayOptions.append(btn);
  });

  const clearFilterBtn = document.createElement('button');
  clearFilterBtn.type = 'button';
  clearFilterBtn.className = 'site-a11y-widget-clear-filter';
  clearFilterBtn.textContent = 'Clear filter';
  clearFilterBtn.setAttribute('aria-label', 'Clear contrast and display filters');
  displaySection.append(clearFilterBtn);

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

  const readSection = createSection('Readability');
  const readableRow = document.createElement('div');
  readableRow.className = 'site-a11y-widget-toggle-row';
  readableRow.innerHTML = '<span>Increased text spacing</span>';
  const readableToggle = document.createElement('button');
  readableToggle.type = 'button';
  readableToggle.className = 'site-a11y-widget-switch';
  readableToggle.setAttribute('aria-label', 'Increased text spacing');
  readableToggle.setAttribute('aria-pressed', 'false');
  readableRow.append(readableToggle);

  const boldRow = document.createElement('div');
  boldRow.className = 'site-a11y-widget-toggle-row';
  boldRow.innerHTML = '<span>Bold text</span>';
  const boldToggle = document.createElement('button');
  boldToggle.type = 'button';
  boldToggle.className = 'site-a11y-widget-switch';
  boldToggle.setAttribute('aria-label', 'Bold text');
  boldToggle.setAttribute('aria-pressed', 'false');
  boldRow.append(boldToggle);

  const underlineRow = document.createElement('div');
  underlineRow.className = 'site-a11y-widget-toggle-row';
  underlineRow.innerHTML = '<span>Underline all links</span>';
  const underlineToggle = document.createElement('button');
  underlineToggle.type = 'button';
  underlineToggle.className = 'site-a11y-widget-switch';
  underlineToggle.setAttribute('aria-label', 'Underline all links');
  underlineToggle.setAttribute('aria-pressed', 'false');
  underlineRow.append(underlineToggle);

  const linkRow = document.createElement('div');
  linkRow.className = 'site-a11y-widget-toggle-row';
  linkRow.innerHTML = '<span>Highlight links</span>';
  const linkToggle = document.createElement('button');
  linkToggle.type = 'button';
  linkToggle.className = 'site-a11y-widget-switch';
  linkToggle.setAttribute('aria-label', 'Highlight links');
  linkToggle.setAttribute('aria-pressed', 'false');
  linkRow.append(linkToggle);

  readSection.append(readableRow, boldRow, underlineRow, linkRow);

  const ttsSection = createSection('Read aloud');
  const ttsRow = document.createElement('div');
  ttsRow.className = 'site-a11y-widget-toggle-row';
  const ttsLabel = document.createElement('span');
  ttsLabel.textContent = isSpeechSupported() ? 'Click content to read' : 'Not supported in this browser';
  const readToggle = document.createElement('button');
  readToggle.type = 'button';
  readToggle.className = 'site-a11y-widget-switch';
  readToggle.setAttribute('aria-label', 'Read aloud');
  readToggle.setAttribute('aria-pressed', 'false');
  readToggle.disabled = !isSpeechSupported();
  ttsRow.append(ttsLabel, readToggle);
  ttsSection.append(ttsRow);

  const stopBtn = document.createElement('button');
  stopBtn.type = 'button';
  stopBtn.className = 'site-a11y-widget-stop';
  stopBtn.textContent = 'Stop reading';
  stopBtn.hidden = true;
  stopBtn.addEventListener('click', () => {
    stopSpeech();
    announce('Reading stopped');
  });
  ttsSection.append(stopBtn);

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.className = 'site-a11y-widget-reset';
  resetBtn.textContent = 'Reset all settings';

  body.append(
    presetSection,
    displaySection,
    sizeSection,
    readSection,
    ttsSection,
    resetBtn,
  );

  panel.append(header, intro, body);
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
    presetOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      const active = state.preset && state.preset !== 'default' && btn.dataset.preset === state.preset;
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    displayOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.dataset.displayMode === (state.displayMode || 'default') ? 'true' : 'false');
    });
    sizeLabel.textContent = `${Math.round((FONT_SCALES[state.fontScaleIndex] ?? 1) * 100)}%`;
    decBtn.disabled = state.fontScaleIndex <= 0;
    incBtn.disabled = state.fontScaleIndex >= FONT_SCALES.length - 1;
    readableToggle.setAttribute('aria-pressed', state.readableSpacing ? 'true' : 'false');
    boldToggle.setAttribute('aria-pressed', state.boldText ? 'true' : 'false');
    underlineToggle.setAttribute('aria-pressed', state.underlineLinks ? 'true' : 'false');
    linkToggle.setAttribute('aria-pressed', state.linkHighlight ? 'true' : 'false');
    readToggle.setAttribute('aria-pressed', state.readAloud ? 'true' : 'false');
    stopBtn.hidden = !state.readAloud;
    clearFilterBtn.disabled = !hasActiveFilters(state);
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

  document.addEventListener('themechange', () => {
    if (state.preset === 'theme-accent') {
      applyAccessibility(state, options);
      announce('Theme color updated for contrast preset');
    }
  });

  presetOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isActive = state.preset === btn.dataset.preset;
      const nextPreset = isActive ? 'default' : btn.dataset.preset;
      const preset = WCAG_PRESET_OPTIONS.find((p) => p.id === btn.dataset.preset);
      const label = preset?.label || 'Contrast';
      const level = preset?.level ? `, ${preset.level}` : '';
      update(
        { preset: nextPreset },
        isActive ? 'Contrast cleared' : `Contrast: ${label}${level}`,
      );
    });
  });

  displayOptions.querySelectorAll('.site-a11y-widget-option').forEach((btn) => {
    btn.addEventListener('click', () => {
      update({ displayMode: btn.dataset.displayMode }, `Display: ${btn.textContent.trim()}`);
    });
  });

  clearFilterBtn.addEventListener('click', () => {
    state = clearFilters(state, options);
    renderAll();
    announce('Filters cleared');
  });

  decBtn.addEventListener('click', () => {
    const next = Math.max(0, state.fontScaleIndex - 1);
    update({ fontScaleIndex: next }, `Text size ${Math.round(FONT_SCALES[next] * 100)}%`);
  });
  incBtn.addEventListener('click', () => {
    const next = Math.min(FONT_SCALES.length - 1, state.fontScaleIndex + 1);
    update({ fontScaleIndex: next }, `Text size ${Math.round(FONT_SCALES[next] * 100)}%`);
  });

  readableToggle.addEventListener('click', () => {
    const next = !state.readableSpacing;
    update({ readableSpacing: next }, next ? 'Text spacing increased' : 'Text spacing reset');
  });
  boldToggle.addEventListener('click', () => {
    const next = !state.boldText;
    update({ boldText: next }, next ? 'Bold text on' : 'Bold text off');
  });
  underlineToggle.addEventListener('click', () => {
    const next = !state.underlineLinks;
    update({ underlineLinks: next }, next ? 'Links underlined' : 'Link underlines off');
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
