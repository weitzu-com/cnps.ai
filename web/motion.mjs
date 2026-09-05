/*
 * Progressive enhancement: content is visible before, during, and after setup.
 * Optional hooks: data-reveal="fade|rise", data-parallax on an image or wrapper,
 * data-tilt on a card, and data-motion-toggle on a button with localized
 * data-label-pause / data-label-play / optional data-label-reduced labels.
 * External animations read html.dataset.motion and listen to cnps:motion-change.
 * The existing report module owns reading progress; this module never modifies it.
 */
const pauseKey = 'cnps-motion-paused';
const revealSelector = '[data-reveal], .section-heading, .intent, .catalog-card, .feature-product, .step, .journal-card, .visual-story';

function initializeMotion() {
  const root = document.documentElement;
  const listeners = new AbortController();
  const signal = listeners.signal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 1024px) and (hover: hover) and (pointer: fine)');
  const toggles = [...document.querySelectorAll('[data-motion-toggle]')];
  const animations = new Map();
  const visibleImages = new Set();
  const visibleTilts = new Set();
  const pendingTilts = new Map();
  const parallaxImages = new Map();
  const tiltCards = [...document.querySelectorAll('[data-tilt]')];
  let manuallyPaused = false;
  let frame = 0;
  let disposed = false;
  let paused = true;
  try { manuallyPaused = sessionStorage.getItem(pauseKey) === 'true'; } catch {}

  const listen = (target, event, callback, options = {}) => target.addEventListener(event, callback, {...options, signal});
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const canAnimate = () => !disposed && !paused && !document.hidden;

  function stopAnimation(element) {
    const animation = animations.get(element);
    if (animation) {
      animation.cancel();
      animations.delete(element);
    }
  }

  function resetTilt(card) {
    pendingTilts.delete(card);
    card.style.removeProperty('--cnps-tilt-x');
    card.style.removeProperty('--cnps-tilt-y');
    card.removeAttribute('data-tilt-active');
  }

  function resetSpatialMotion() {
    for (const image of parallaxImages.values()) image.style.removeProperty('--cnps-parallax-y');
    tiltCards.forEach(resetTilt);
    pendingTilts.clear();
  }

  function render() {
    frame = 0;
    if (!canAnimate() || !desktop.matches) return;
    const viewport = innerHeight || 1;
    // Read all image positions before writing transforms; only visible frames run.
    const positions = [...visibleImages].map(wrapper => {
      const rect = wrapper.getBoundingClientRect();
      const midpoint = rect.top + rect.height / 2;
      return [parallaxImages.get(wrapper), clamp((viewport / 2 - midpoint) / viewport * 14, -7, 7)];
    });
    for (const [image, offset] of positions) image.style.setProperty('--cnps-parallax-y', `${offset.toFixed(2)}px`);
    for (const [card, {x, y}] of pendingTilts) {
      card.style.setProperty('--cnps-tilt-x', `${x.toFixed(2)}deg`);
      card.style.setProperty('--cnps-tilt-y', `${y.toFixed(2)}deg`);
      card.setAttribute('data-tilt-active', '');
    }
    pendingTilts.clear();
  }

  function schedule() {
    if (!frame && canAnimate() && desktop.matches && (visibleImages.size || pendingTilts.size)) frame = requestAnimationFrame(render);
  }

  function synchronize() {
    paused = manuallyPaused || reduced.matches;
    root.dataset.motion = paused ? 'paused' : 'active';
    for (const button of toggles) {
      const label = paused ? button.dataset.labelPlay : button.dataset.labelPause;
      // A dedicated text span is optional; preserve an existing decorative icon.
      const text = button.querySelector('[data-motion-label]');
      if (label) {
        (text || button).textContent = label;
        button.setAttribute('aria-label', label);
      }
      button.setAttribute('aria-pressed', String(paused));
      button.disabled = reduced.matches;
      if (reduced.matches && button.dataset.labelReduced) button.title = button.dataset.labelReduced;
      else button.removeAttribute('title');
    }
    if (paused) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const element of animations.keys()) stopAnimation(element);
      resetSpatialMotion();
    } else schedule();
    document.dispatchEvent(new CustomEvent('cnps:motion-change', {detail: {paused}}));
  }

  function setManualPause(value) {
    if (reduced.matches && !value) return;
    manuallyPaused = value;
    try { sessionStorage.setItem(pauseKey, String(manuallyPaused)); } catch {}
    synchronize();
  }

  listen(document, 'cnps:motion-request', event => {
    if (typeof event.detail?.paused === 'boolean') setManualPause(event.detail.paused);
  });

  for (const button of toggles) {
    listen(button, 'click', () => {
      if (reduced.matches) return;
      setManualPause(!manuallyPaused);
    });
  }

  // No opacity classes, hidden attributes, timers, or forwards fills are used. A missing
  // observer or failed animation always leaves the regular server-rendered page.
  const revealObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      const element = entry.target;
      revealObserver.unobserve(element);
      element.dataset.motionSeen = 'true';
      if (!canAnimate() || typeof element.animate !== 'function') continue;
      const fadeOnly = element.dataset.reveal === 'fade' || element.matches('.section-heading, .visual-story, [data-tilt]');
      const siblings = [...element.parentElement.children].filter(sibling => sibling.matches(revealSelector));
      const delay = Math.min(siblings.indexOf(element), 3) * 65;
      const animation = element.animate(
        fadeOnly
          ? [{opacity: 0.35}, {opacity: 1}]
          : [{opacity: 0.4, transform: 'translateY(14px)'}, {opacity: 1, transform: 'translateY(0)'}],
        {duration: fadeOnly ? 650 : 600, delay, easing: 'cubic-bezier(.2,.7,.2,1)', fill: 'backwards'}
      );
      animations.set(element, animation);
      animation.finished.then(() => animations.delete(element), () => animations.delete(element));
    }
  }, {threshold: 0.08}) : null;

  for (const element of document.querySelectorAll(revealSelector)) {
    if (element.dataset.motionSeen !== 'true' && !element.matches('[data-reveal="none"]') && !element.parentElement.closest(revealSelector)) revealObserver?.observe(element);
  }

  const spatialObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
    for (const entry of entries) {
      const target = entry.target;
      if (parallaxImages.has(target)) {
        if (entry.isIntersecting) visibleImages.add(target);
        else {
          visibleImages.delete(target);
          parallaxImages.get(target).style.removeProperty('--cnps-parallax-y');
        }
      }
      if (target.hasAttribute('data-tilt')) {
        if (entry.isIntersecting) visibleTilts.add(target);
        else { visibleTilts.delete(target); resetTilt(target); }
      }
    }
    schedule();
  }, {threshold: 0}) : null;

  for (const hook of document.querySelectorAll('[data-parallax]')) {
    const image = hook.matches('img') ? hook : hook.querySelector('img');
    if (!image || !spatialObserver) continue;
    const wrapper = hook.matches('img') ? hook.parentElement : hook;
    wrapper.classList.add('cnps-parallax-frame');
    image.classList.add('cnps-parallax-image');
    parallaxImages.set(wrapper, image);
    spatialObserver.observe(wrapper);
  }

  for (const card of tiltCards) {
    spatialObserver?.observe(card);
    listen(card, 'pointermove', event => {
      if (!canAnimate() || !desktop.matches || !visibleTilts.has(card) || event.pointerType === 'touch') return;
      const box = card.getBoundingClientRect();
      const x = clamp(((event.clientY - box.top) / Math.max(box.height, 1) - 0.5) * -3, -1.5, 1.5);
      const y = clamp(((event.clientX - box.left) / Math.max(box.width, 1) - 0.5) * 3, -1.5, 1.5);
      pendingTilts.set(card, {x, y});
      schedule();
    }, {passive: true});
    listen(card, 'pointerleave', () => resetTilt(card), {passive: true});
    listen(card, 'focusin', () => resetTilt(card));
  }

  listen(document, 'focusin', event => {
    for (const element of animations.keys()) if (element.contains(event.target)) stopAnimation(element);
  });
  listen(document, 'visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      for (const element of animations.keys()) stopAnimation(element);
      resetSpatialMotion();
    } else schedule();
  });
  listen(window, 'scroll', schedule, {passive: true});
  listen(window, 'resize', schedule, {passive: true});
  listen(reduced, 'change', synchronize);
  listen(desktop, 'change', () => { if (!desktop.matches) resetSpatialMotion(); else schedule(); });
  synchronize();

  return () => {
    disposed = true;
    listeners.abort();
    cancelAnimationFrame(frame);
    revealObserver?.disconnect();
    spatialObserver?.disconnect();
    for (const element of animations.keys()) stopAnimation(element);
    resetSpatialMotion();
  };
}

let dispose = initializeMotion();
window.addEventListener('pagehide', () => dispose());
window.addEventListener('pageshow', event => { if (event.persisted) dispose = initializeMotion(); });
