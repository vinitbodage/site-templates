/**
 * Premium Membership — card with subscribe toggle and animated benefits popup.
 *
 * Row 1: card copy (eyebrow, heading, body, price)
 * Following rows: one benefit per row (shown in the popup)
 * @param {Element} block
 */
export default function decorate(block) {
  const STORAGE_KEY = 'maison-solenne-premium';
  const rows = [...block.children];
  if (!rows.length) return;

  const cardRow = rows[0];
  const benefitRows = rows.slice(1);

  const card = document.createElement('article');
  card.className = 'premium-membership-card';

  const copy = document.createElement('div');
  copy.className = 'premium-membership-copy';
  [...cardRow.children].forEach((cell) => copy.append(...cell.childNodes));

  const eyebrow = copy.querySelector('p em, p i');
  if (eyebrow && eyebrow.parentElement?.children.length === 1) {
    eyebrow.parentElement.classList.add('premium-membership-eyebrow');
  }

  // Treat last short price-like paragraph as price
  const paragraphs = [...copy.querySelectorAll('p')].filter(
    (p) => !p.classList.contains('premium-membership-eyebrow'),
  );
  const priceCandidate = paragraphs.reverse().find((p) => /€|\$|£|\/\s*(year|yr|month|mo)/i.test(p.textContent)
    || /^[\d.,]+\s*\/ /.test(p.textContent.trim()));
  if (priceCandidate) priceCandidate.classList.add('premium-membership-price');

  const toggleWrap = document.createElement('div');
  toggleWrap.className = 'premium-membership-toggle-wrap';

  const label = document.createElement('span');
  label.className = 'premium-membership-toggle-label';
  label.id = 'premium-membership-label';
  label.textContent = 'Subscribe to premium';

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'premium-membership-toggle';
  toggle.setAttribute('role', 'switch');
  toggle.setAttribute('aria-checked', 'false');
  toggle.setAttribute('aria-labelledby', 'premium-membership-label');
  toggle.innerHTML = '<span class="premium-membership-toggle-thumb" aria-hidden="true"></span>';

  toggleWrap.append(label, toggle);
  card.append(copy, toggleWrap);

  const benefits = benefitRows
    .map((row) => row.textContent.trim())
    .filter(Boolean);

  const overlay = document.createElement('div');
  overlay.className = 'premium-membership-overlay';
  overlay.hidden = true;
  overlay.setAttribute('aria-hidden', 'true');

  const popup = document.createElement('div');
  popup.className = 'premium-membership-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-modal', 'true');
  popup.setAttribute('aria-labelledby', 'premium-membership-popup-title');
  popup.tabIndex = -1;

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'premium-membership-close';
  closeBtn.setAttribute('aria-label', 'Close membership details');
  closeBtn.innerHTML = '<span aria-hidden="true">×</span>';

  const popupTitle = document.createElement('h3');
  popupTitle.id = 'premium-membership-popup-title';
  popupTitle.textContent = 'Solenne Circle privileges';

  const popupLead = document.createElement('p');
  popupLead.className = 'premium-membership-popup-lead';
  popupLead.textContent = 'A quieter arrival, considered access, and details held for members.';

  const list = document.createElement('ul');
  list.className = 'premium-membership-benefits';
  (benefits.length ? benefits : [
    'Priority suite holds before public release',
    'Complimentary courtyard breakfast each morning',
    'Late checkout until 2pm when available',
    'Private rooftop hour once per stay',
    'Concierge notes remembered across visits',
  ]).forEach((text, index) => {
    const li = document.createElement('li');
    li.style.setProperty('--i', String(index));
    li.innerHTML = `<span class="premium-membership-benefit-mark" aria-hidden="true"></span><span>${text}</span>`;
    list.append(li);
  });

  const confirm = document.createElement('p');
  confirm.className = 'premium-membership-confirm';
  confirm.textContent = 'Membership preference saved on this device.';

  popup.append(closeBtn, popupTitle, popupLead, list, confirm);
  overlay.append(popup);

  block.replaceChildren(card, overlay);
  block.closest('.section')?.classList.add('premium-membership-container');

  let lastFocus = null;

  const openDialog = () => {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    overlay.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      popup.classList.add('is-open');
      closeBtn.focus();
    });
    document.body.classList.add('premium-membership-lock');
  };

  const closeDialog = () => {
    overlay.classList.remove('is-open');
    popup.classList.remove('is-open');
    document.body.classList.remove('premium-membership-lock');
    window.setTimeout(() => {
      if (!overlay.classList.contains('is-open')) {
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
      }
    }, 380);
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  };

  const setSubscribed = (on, { openPopup = true } = {}) => {
    toggle.setAttribute('aria-checked', on ? 'true' : 'false');
    card.classList.toggle('is-subscribed', on);
    label.textContent = on ? 'Premium membership on' : 'Subscribe to premium';
    try {
      localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
    } catch {
      // private mode
    }
    if (on && openPopup) openDialog();
    else if (!on) closeDialog();
  };

  toggle.addEventListener('click', () => {
    const next = toggle.getAttribute('aria-checked') !== 'true';
    setSubscribed(next);
  });

  // Whole row acts as control (label is not a <label for>)
  label.addEventListener('click', () => {
    toggle.click();
  });

  closeBtn.addEventListener('click', () => {
    // Closing via X cancels the subscription
    setSubscribed(false);
  });
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) {
      setSubscribed(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && overlay.classList.contains('is-open')) {
      setSubscribed(false);
    }
  });

  let stored = false;
  try {
    stored = localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    stored = false;
  }
  if (stored) setSubscribed(true, { openPopup: false });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        block.classList.add('is-visible');
        io.disconnect();
      }
    });
  }, { threshold: 0.2 });
  io.observe(block);
}
