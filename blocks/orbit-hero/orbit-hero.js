/**
 * Orbit Hero — cube-face stage (Intel-style).
 * Panels share one position; the next face rotates up into view on
 * wheel/drag/tabs/autoplay like a turning cube.
 *
 * Authored: one row per slide
 * - Cell A: image
 * - Cell B (optional short): tab label
 * - Cell C: eyebrow, heading, support, CTA
 * @param {Element} block
 */
export default function decorate(block) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    let mediaNode = null;
    let tabLabel = '';
    const copyNodes = [];

    cells.forEach((cell) => {
      const picture = cell.querySelector('picture');
      const img = cell.querySelector('img');
      const text = cell.textContent.trim();
      const hasMedia = Boolean(picture || img);
      const isTab = !hasMedia
        && text
        && text.length < 28
        && !cell.querySelector('h1, h2, h3, a, ul, ol')
        && cell.querySelectorAll('p').length <= 1;

      if (hasMedia && !mediaNode) {
        mediaNode = picture || img;
        cell.querySelectorAll('h1, h2, h3, h4, p, ul, ol').forEach((node) => {
          if (node.querySelector('picture, img') && !node.textContent.trim()) return;
          copyNodes.push(node);
        });
        return;
      }

      if (isTab && !tabLabel) {
        tabLabel = text;
        return;
      }

      copyNodes.push(...cell.childNodes);
    });

    if (!mediaNode && !copyNodes.length) return;
    slides.push({ media: mediaNode, tab: tabLabel, copy: copyNodes });
  });

  if (!slides.length) return;

  const stage = document.createElement('div');
  stage.className = 'orbit-hero-stage';
  stage.setAttribute('role', 'region');
  stage.setAttribute('aria-roledescription', 'carousel');
  stage.setAttribute('aria-label', 'Featured stories');

  const scene = document.createElement('div');
  scene.className = 'orbit-hero-scene';

  const cube = document.createElement('div');
  cube.className = 'orbit-hero-cube';

  const controls = document.createElement('div');
  controls.className = 'orbit-hero-controls';

  const tabs = document.createElement('div');
  tabs.className = 'orbit-hero-tabs';
  tabs.setAttribute('role', 'tablist');
  tabs.setAttribute('aria-label', 'Featured stories');

  const playBtn = document.createElement('button');
  playBtn.type = 'button';
  playBtn.className = 'orbit-hero-playback';
  playBtn.setAttribute('aria-label', 'Pause autoplay');
  playBtn.innerHTML = '<span class="orbit-hero-playback-icon" aria-hidden="true"></span>';

  const faces = [];
  const tabButtons = [];

  slides.forEach((slide, index) => {
    const face = document.createElement('article');
    face.className = 'orbit-hero-face';
    face.id = `orbit-hero-panel-${index}`;
    face.setAttribute('role', 'tabpanel');
    face.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
    face.setAttribute('aria-labelledby', `orbit-hero-tab-${index}`);

    const copy = document.createElement('div');
    copy.className = 'orbit-hero-copy';
    copy.append(...slide.copy);

    const eyebrow = copy.querySelector('p em, p i, p strong, p b');
    if (eyebrow && eyebrow.parentElement?.children.length === 1) {
      eyebrow.parentElement.classList.add('orbit-hero-eyebrow');
    }

    [...copy.children].forEach((child, childIndex) => {
      child.classList.add('orbit-hero-line');
      child.style.setProperty('--line', String(childIndex));
    });

    copy.querySelectorAll('a').forEach((a) => {
      a.classList.add('orbit-hero-cta');
      a.classList.remove('button', 'primary', 'secondary');
      a.closest('.button-container')?.classList.remove('button-container');
      if (!a.querySelector('.orbit-hero-cta-arrow')) {
        const arrow = document.createElement('span');
        arrow.className = 'orbit-hero-cta-arrow';
        arrow.setAttribute('aria-hidden', 'true');
        arrow.textContent = '→';
        a.append(arrow);
      }
    });

    const mediaWrap = document.createElement('div');
    mediaWrap.className = 'orbit-hero-media-wrap';

    const glow = document.createElement('div');
    glow.className = 'orbit-hero-glow';
    glow.setAttribute('aria-hidden', 'true');

    const shadow = document.createElement('div');
    shadow.className = 'orbit-hero-cube-shadow';
    shadow.setAttribute('aria-hidden', 'true');

    const media = document.createElement('div');
    media.className = 'orbit-hero-media';
    if (slide.media) media.append(slide.media);
    media.querySelectorAll('img').forEach((image) => {
      image.loading = index === 0 ? 'eager' : 'lazy';
      if (index === 0) image.fetchPriority = 'high';
    });

    mediaWrap.append(glow, shadow, media);

    const inner = document.createElement('div');
    inner.className = 'orbit-hero-face-inner';
    inner.append(copy, mediaWrap);
    face.append(inner);
    cube.append(face);
    faces.push(face);

    if (!slide.tab) {
      const heading = copy.querySelector('h1, h2, h3');
      slide.tab = heading?.textContent.trim().split(/\s+/).slice(0, 3).join(' ')
        || `Story ${index + 1}`;
    }

    const tab = document.createElement('button');
    tab.type = 'button';
    tab.className = 'orbit-hero-tab';
    tab.id = `orbit-hero-tab-${index}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', face.id);
    tab.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
    tab.tabIndex = index === 0 ? 0 : -1;

    const label = document.createElement('span');
    label.className = 'orbit-hero-tab-label';
    label.textContent = slide.tab;

    const bar = document.createElement('span');
    bar.className = 'orbit-hero-tab-bar';
    bar.setAttribute('aria-hidden', 'true');
    const fill = document.createElement('span');
    fill.className = 'orbit-hero-tab-fill';
    bar.append(fill);

    tab.append(label, bar);
    tabs.append(tab);
    tabButtons.push({ tab, fill });
  });

  scene.append(cube);
  controls.append(tabs, playBtn);
  stage.append(scene, controls);
  block.replaceChildren(stage);
  block.closest('.section')?.classList.add('full-bleed', 'orbit-hero-container');

  let active = 0;
  let busy = false;
  let raf = null;
  let startedAt = 0;
  let elapsedBeforePause = 0;
  const DURATION = 6500;
  const FLIP_MS = reduceMotion ? 0 : 900;
  let paused = reduceMotion || slides.length < 2;
  let userPaused = false;

  const api = {};

  api.clearRaf = () => {
    if (raf) {
      window.cancelAnimationFrame(raf);
      raf = null;
    }
  };

  api.setPlaybackUi = () => {
    playBtn.classList.toggle('is-paused', paused);
    playBtn.setAttribute('aria-label', paused ? 'Play autoplay' : 'Pause autoplay');
  };

  api.syncTabs = () => {
    tabButtons.forEach(({ tab, fill }, index) => {
      const on = index === active;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (fill && !on) fill.style.transform = 'scaleX(0)';
    });
  };

  api.resetFaces = () => {
    faces.forEach((face, index) => {
      const on = index === active;
      face.className = `orbit-hero-face${on ? ' is-active' : ''}`;
      face.setAttribute('aria-hidden', on ? 'false' : 'true');
      face.style.transition = 'none';
      face.style.transform = on
        ? 'rotateX(0deg)'
        : 'rotateX(90deg)';
      face.style.opacity = on ? '1' : '0';
      face.style.pointerEvents = on ? 'auto' : 'none';
      face.hidden = !on;
    });
    // force reflow so the next transition starts clean
    // eslint-disable-next-line no-unused-expressions
    cube.offsetHeight;
    faces.forEach((face) => {
      face.style.transition = '';
    });
  };

  api.startProgress = () => {
    api.clearRaf();
    if (paused || reduceMotion || slides.length < 2) return;
    startedAt = performance.now() - elapsedBeforePause;
    const { fill } = tabButtons[active];

    const tick = (now) => {
      const elapsed = now - startedAt;
      const ratio = Math.min(1, elapsed / DURATION);
      if (fill) fill.style.transform = `scaleX(${ratio})`;
      if (ratio < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        elapsedBeforePause = 0;
        api.goTo(active + 1, { dir: 1 });
      }
    };
    raf = window.requestAnimationFrame(tick);
  };

  api.pause = ({ user = false } = {}) => {
    if (user) userPaused = true;
    if (!paused && startedAt) {
      elapsedBeforePause = Math.min(DURATION, performance.now() - startedAt);
    }
    paused = true;
    api.clearRaf();
    api.setPlaybackUi();
  };

  api.play = ({ user = false } = {}) => {
    if (reduceMotion || slides.length < 2) return;
    if (user) userPaused = false;
    paused = false;
    api.setPlaybackUi();
    api.startProgress();
  };

  api.goTo = (next, { dir } = {}) => {
    const target = ((next % slides.length) + slides.length) % slides.length;
    if (target === active || busy) return;

    let direction = dir;
    if (direction == null) {
      const wrappingForward = active === slides.length - 1 && target === 0;
      direction = target > active || wrappingForward ? 1 : -1;
    }
    const prev = active;
    active = target;
    busy = true;
    elapsedBeforePause = 0;
    api.syncTabs();

    const currentFace = faces[prev];
    const nextFace = faces[active];

    if (reduceMotion) {
      api.resetFaces();
      busy = false;
      if (!paused) api.startProgress();
      return;
    }

    // Prepare next face just out of view (below for forward / above for back)
    nextFace.hidden = false;
    nextFace.style.transition = 'none';
    nextFace.style.pointerEvents = 'none';
    nextFace.style.opacity = '1';
    nextFace.style.transform = direction > 0
      ? 'rotateX(90deg)'
      : 'rotateX(-90deg)';
    nextFace.classList.add('is-entering');
    currentFace.classList.add('is-leaving');
    currentFace.setAttribute('aria-hidden', 'true');
    nextFace.setAttribute('aria-hidden', 'false');

    // eslint-disable-next-line no-unused-expressions
    cube.offsetHeight;

    currentFace.style.transition = '';
    nextFace.style.transition = '';
    block.dataset.direction = direction > 0 ? 'forward' : 'backward';

    requestAnimationFrame(() => {
      currentFace.style.transform = direction > 0
        ? 'rotateX(-90deg)'
        : 'rotateX(90deg)';
      currentFace.style.opacity = '0';
      nextFace.style.transform = 'rotateX(0deg)';
      nextFace.style.opacity = '1';
      nextFace.classList.add('is-active');
      currentFace.classList.remove('is-active');
    });

    window.setTimeout(() => {
      currentFace.classList.remove('is-leaving');
      nextFace.classList.remove('is-entering');
      currentFace.hidden = true;
      currentFace.style.opacity = '0';
      currentFace.style.transform = 'rotateX(90deg)';
      nextFace.style.pointerEvents = 'auto';
      busy = false;
      if (!paused) api.startProgress();
    }, FLIP_MS);
  };

  tabButtons.forEach(({ tab }, index) => {
    tab.addEventListener('click', () => {
      let dir = -1;
      if (index >= active) dir = 1;
      api.goTo(index, { dir });
    });
    tab.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault();
        api.goTo(active + 1, { dir: 1 });
        tabButtons[active].tab.focus();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault();
        api.goTo(active - 1, { dir: -1 });
        tabButtons[active].tab.focus();
      }
    });
  });

  playBtn.addEventListener('click', () => {
    if (paused) api.play({ user: true });
    else api.pause({ user: true });
  });

  // Wheel / trackpad over stage flips the cube (accumulate small deltas)
  let wheelLock = false;
  let wheelAccum = 0;
  const WHEEL_THRESHOLD = 40;

  const onWheel = (event) => {
    if (slides.length < 2) return;
    // Don't steal wheel from tab/playback controls
    if (event.target.closest('.orbit-hero-controls')) return;
    event.preventDefault();
    if (busy || wheelLock) return;

    wheelAccum += event.deltaY;
    if (Math.abs(wheelAccum) < WHEEL_THRESHOLD) return;

    const dir = wheelAccum > 0 ? 1 : -1;
    wheelAccum = 0;
    wheelLock = true;
    api.goTo(active + dir, { dir });
    window.setTimeout(() => {
      wheelLock = false;
    }, FLIP_MS + 120);
  };

  stage.addEventListener('wheel', onWheel, { passive: false });

  // Pointer drag vertically = cube turn
  let pointerY = null;
  let pointerDragging = false;
  stage.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    if (event.target.closest('.orbit-hero-controls')) return;
    if (event.target.closest('a, button')) return;
    pointerY = event.clientY;
    pointerDragging = false;
    stage.setPointerCapture(event.pointerId);
  });
  stage.addEventListener('pointermove', (event) => {
    if (pointerY === null) return;
    if (Math.abs(event.clientY - pointerY) > 12) pointerDragging = true;
  });
  stage.addEventListener('pointerup', (event) => {
    if (pointerY === null) return;
    const delta = event.clientY - pointerY;
    pointerY = null;
    if (!pointerDragging || Math.abs(delta) < 40 || busy) return;
    api.goTo(active + (delta < 0 ? 1 : -1), { dir: delta < 0 ? 1 : -1 });
  });
  stage.addEventListener('pointercancel', () => {
    pointerY = null;
    pointerDragging = false;
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) api.pause();
    else if (!userPaused && !reduceMotion) api.play();
  });

  api.setPlaybackUi();
  api.resetFaces();
  api.syncTabs();
  if (!paused) api.startProgress();
  requestAnimationFrame(() => {
    block.classList.add('is-ready');
    if (!reduceMotion) block.classList.add('is-animated');
  });
}
