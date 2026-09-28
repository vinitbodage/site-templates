/**
 * Read-aloud helpers using the Web Speech API.
 */

/** @type {SpeechSynthesisUtterance | null} */
let currentUtterance = null;

/**
 * @returns {boolean}
 */
export function isSpeechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/**
 * Stops any in-progress speech.
 */
export function stopSpeech() {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  currentUtterance = null;
}

/**
 * @param {string} text
 */
export function speakText(text) {
  if (!isSpeechSupported() || !text?.trim()) return;
  stopSpeech();
  currentUtterance = new SpeechSynthesisUtterance(text.trim());
  currentUtterance.rate = 1;
  window.speechSynthesis.speak(currentUtterance);
}

/**
 * @param {Element} el
 * @returns {string}
 */
function getReadableText(el) {
  if (!el || el.closest('.site-a11y-widget')) return '';
  const labelled = el.getAttribute('aria-label') || el.getAttribute('title');
  if (labelled) return labelled;
  if (el.tagName === 'IMG') return el.getAttribute('alt') || '';
  return el.textContent?.trim() || '';
}

/**
 * @param {boolean} enabled
 * @param {(active: boolean) => void} [onChange]
 * @returns {() => void} cleanup
 */
export function bindReadAloud(enabled, onChange) {
  if (!enabled || !isSpeechSupported()) {
    stopSpeech();
    return () => {};
  }

  const handler = (event) => {
    const target = event.target.closest(
      'main a, main p, main h1, main h2, main h3, main h4, main li, main button, main img, header a, footer a',
    );
    if (!target || target.closest('.site-a11y-widget')) return;
    const text = getReadableText(target);
    if (text) speakText(text);
  };

  document.addEventListener('click', handler);
  onChange?.(true);

  return () => {
    document.removeEventListener('click', handler);
    stopSpeech();
    onChange?.(false);
  };
}
