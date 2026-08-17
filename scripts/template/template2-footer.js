/**
 * "Template2" footer enhancements.
 *
 * A link that is the sole content of a paragraph is auto-decorated as a
 * button by the platform's link decoration; footer contact links should
 * always render as plain text links instead.
 * @param {Element} block the footer block element
 */
export default function decorateTemplate2Footer(block) {
  block.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary');
    const container = a.closest('.button-container');
    if (container) container.classList.remove('button-container');
  });
}
