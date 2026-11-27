/* Portfolio scripts: sideways-scrolling galleries, full-screen viewer, links,
   About text, scroll button. No libraries needed. Content lives in config.js
   (change it with editor.html). */
(() => {
  'use strict';

  const SITE = window.SITE || {};
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smooth = reduceMotion ? 'auto' : 'smooth';

  const ICONS = {
    close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M5 5l14 14M19 5L5 19"/></svg>',
    prev:  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4l-8 8 8 8"/></svg>',
    next:  '<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4l8 8-8 8"/></svg>'
  };

  /* =====================================================================
     Shared helpers (editor.html uses these too, via window.Portfolio)
     ===================================================================== */

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number.isFinite(+v) ? +v : lo));

  // The visible part of a photo, as fractions of the full image (x, y, w, h)
  function cropOf(photo) {
    const c = photo && photo.crop;
    if (!c || !(c.w > 0) || !(c.h > 0)) return { x: 0, y: 0, w: 1, h: 1 };
    const w = clamp(c.w, 0.01, 1);
    const h = clamp(c.h, 0.01, 1);
    return { x: clamp(c.x, 0, 1 - w), y: clamp(c.y, 0, 1 - h), w, h };
  }

  // Width ÷ height of what is shown on the page
  function aspectOf(photo, natW, natH) {
    const c = cropOf(photo);
    return (c.w * natW) / (c.h * natH);
  }

  // A box that shows only the cropped part of an already-loaded <img>.
  // The original file is never changed, so a crop can always be redone.
  function makeFrame(photo, img, natW, natH, extraClass) {
    const c = cropOf(photo);
    const frame = document.createElement('div');
    frame.className = 'frame' + (extraClass ? ' ' + extraClass : '');
    frame.style.setProperty('--ar', aspectOf(photo, natW, natH).toFixed(5));
    img.style.width = (100 / c.w) + '%';
    img.style.left = (-100 * c.x / c.w) + '%';
    img.style.top = (-100 * c.y / c.h) + '%';
    frame.appendChild(img);
    return frame;
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => (img.naturalWidth ? resolve(img) : reject(new Error('Empty image ' + src)));
      img.onerror = () => reject(new Error('Could not load "' + src + '"'));
      img.src = src;
    });
  }

  // One row of photos, all the same height, that scrolls sideways.
  // Mouse wheel scrolls it smoothly, the grey bar underneath can be dragged,
  // and (with keys: true) the left/right arrow keys jump photo by photo.
  //   pageWheel: true  -> the wheel works anywhere on the page (gallery pages)
  //   pageWheel: false -> only while the pointer is over the row (editor preview)
  function createStrip(root, opts = {}) {
    root.classList.add('is-strip');
    const track = document.createElement('div');
    track.className = 'h-track';
    track.tabIndex = 0;
    track.setAttribute('aria-label', 'Photos. Scroll sideways or use the arrow keys.');
    const bar = document.createElement('div');
    bar.className = 'h-bar';
    bar.setAttribute('aria-hidden', 'true');
    const thumb = document.createElement('div');
    thumb.className = 'h-thumb';
    bar.appendChild(thumb);
    root.replaceChildren(track, bar);

    const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
    const lightboxOpen = () => document.documentElement.classList.contains('lb-lock');
    let thumbX = 0;
    let thumbW = 0;

    function update() {
      const max = maxScroll();
      const barW = bar.clientWidth;
      bar.classList.toggle('is-hidden', max < 2);
      thumbW = Math.max(36, barW * (track.clientWidth / (track.scrollWidth || 1)));
      thumbX = max ? (track.scrollLeft / max) * (barW - thumbW) : 0;
      thumb.style.width = thumbW + 'px';
      thumb.style.transform = 'translateX(' + thumbX + 'px)';
    }

    // Smooth wheel scrolling
    let target = null;
    let raf = 0;
    function stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      target = null;
    }
    function step() {
      const cur = track.scrollLeft;
      const diff = target - cur;
      if (Math.abs(diff) < 1) { track.scrollLeft = target; stop(); return; }
      track.scrollLeft = cur + diff * 0.18;
      if (track.scrollLeft === cur) { track.scrollLeft = target; stop(); return; }
      raf = requestAnimationFrame(step);
    }
    function onWheel(e) {
      if (e.ctrlKey || lightboxOpen()) return;
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;   // sideways trackpad swipe: the browser does it
      const max = maxScroll();
      if (!max) return;
      if (opts.pageWheel && !track.contains(e.target) &&
          document.documentElement.scrollHeight > window.innerHeight + 2) return;
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? track.clientWidth : 1);
      const from = target === null ? track.scrollLeft : target;
      if ((d > 0 && from >= max - 1) || (d < 0 && from <= 0)) return;   // at an end: let the page scroll
      e.preventDefault();
      if (reduceMotion) { track.scrollLeft += d; return; }
      target = clamp(from + d, 0, max);
      if (!raf) raf = requestAnimationFrame(step);
    }
    (opts.pageWheel ? document : track).addEventListener('wheel', onWheel, { passive: false });

    // Drag the grey bar, or click on it to jump
    bar.addEventListener('pointerdown', (e) => {
      const max = maxScroll();
      if (!max) return;
      e.preventDefault();
      stop();
      const rect = bar.getBoundingClientRect();
      const range = rect.width - thumbW;
      const grab = e.target === thumb ? e.clientX - rect.left - thumbX : thumbW / 2;
      const moveTo = (clientX) => {
        const x = clamp(clientX - rect.left - grab, 0, range);
        track.scrollLeft = range > 0 ? (x / range) * max : 0;
      };
      if (e.target !== thumb) moveTo(e.clientX);
      bar.setPointerCapture(e.pointerId);
      bar.classList.add('is-dragging');
      const onMove = (ev) => moveTo(ev.clientX);
      const onUp = () => {
        bar.classList.remove('is-dragging');
        bar.removeEventListener('pointermove', onMove);
        bar.removeEventListener('pointerup', onUp);
        bar.removeEventListener('pointercancel', onUp);
      };
      bar.addEventListener('pointermove', onMove);
      bar.addEventListener('pointerup', onUp);
      bar.addEventListener('pointercancel', onUp);
    });

    // Jump to the next / previous photo
    function go(dir) {
      stop();
      const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
      const x = track.scrollLeft;
      const items = Array.from(track.children);
      let dest;
      if (dir > 0) {
        const next = items.find((it) => it.offsetLeft - pad > x + 2);
        dest = next ? next.offsetLeft - pad : maxScroll();
      } else {
        const before = items.filter((it) => it.offsetLeft - pad < x - 2);
        dest = before.length ? before[before.length - 1].offsetLeft - pad : 0;
      }
      track.scrollTo({ left: Math.min(dest, maxScroll()), behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    if (opts.keys) {
      document.addEventListener('keydown', (e) => {
        if (lightboxOpen() || e.altKey || e.ctrlKey || e.metaKey) return;
        if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      });
    }

    track.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(track);
    else window.addEventListener('resize', update);

    return {
      track,
      add(el) { track.appendChild(el); update(); },
      go,
      update
    };
  }

  window.Portfolio = { cropOf, aspectOf, makeFrame, loadImage, createStrip };

  /* =====================================================================
     Links and About text from config.js
     ===================================================================== */

  function applyLinks() {
    const links = SITE.links || {};
    document.querySelectorAll('[data-link]').forEach((a) => {
      const key = a.dataset.link;
      const value = String(links[key] || '').trim();
      if (!value) {
        (a.closest('[data-link-item]') || a).remove();
        return;
      }
      a.href = key === 'email' ? 'mailto:' + value : value;
      if (a.hasAttribute('data-link-text')) a.textContent = value;
    });
  }

  function applyAbout() {
    const about = SITE.about;
    if (!about) return;

    ['lead', 'location'].forEach((key) => {
      document.querySelectorAll('[data-about="' + key + '"]').forEach((el) => {
        const value = String(about[key] || '').trim();
        if (value) el.textContent = value;
        else (el.closest('[data-about-item]') || el).remove();
      });
    });

    const bio = document.querySelector('[data-about="bio"]');
    if (bio && typeof about.bio === 'string') {
      const paragraphs = about.bio.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);
      bio.replaceChildren(...paragraphs.map((t) => {
        const p = document.createElement('p');
        p.textContent = t;
        return p;
      }));
    }

    const holder = document.querySelector('[data-about-photo]');
    const photo = about.photo;
    if (holder && photo && photo.src) {
      loadImage(photo.src).then((img) => {
        img.alt = photo.alt || '';
        holder.replaceChildren(makeFrame(photo, img, img.naturalWidth, img.naturalHeight));
      }).catch((err) => console.warn('[portfolio] ' + err.message));
    }
  }

  /* =====================================================================
     Full-screen viewer
     ===================================================================== */

  const Lightbox = (() => {
    let el, slot, caption, counter, closeBtn, prevBtn, nextBtn;
    let items = [];
    let index = 0;
    let lastFocus = null;
    let touchX = null;

    function build() {
      el = document.createElement('div');
      el.className = 'lightbox';
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-modal', 'true');
      el.setAttribute('aria-label', 'Photo viewer');
      el.innerHTML =
        '<div class="lb-count" aria-live="polite"></div>' +
        '<button class="lb-btn lb-close" type="button" aria-label="Close">' + ICONS.close + '</button>' +
        '<button class="lb-btn lb-prev" type="button" aria-label="Previous photo">' + ICONS.prev + '</button>' +
        '<figure class="lb-stage"><div class="lb-slot"></div><figcaption class="lb-caption"></figcaption></figure>' +
        '<button class="lb-btn lb-next" type="button" aria-label="Next photo">' + ICONS.next + '</button>';
      document.body.appendChild(el);

      slot = el.querySelector('.lb-slot');
      caption = el.querySelector('.lb-caption');
      counter = el.querySelector('.lb-count');
      closeBtn = el.querySelector('.lb-close');
      prevBtn = el.querySelector('.lb-prev');
      nextBtn = el.querySelector('.lb-next');

      closeBtn.addEventListener('click', close);
      prevBtn.addEventListener('click', () => show(index - 1));
      nextBtn.addEventListener('click', () => show(index + 1));
      el.addEventListener('click', (e) => {
        if (e.target === el || e.target === slot || e.target.classList.contains('lb-stage')) close();
      });
      el.addEventListener('touchstart', (e) => { touchX = e.changedTouches[0].clientX; }, { passive: true });
      el.addEventListener('touchend', (e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        touchX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      });
      document.addEventListener('keydown', onKey);
    }

    function isOpen() { return el && el.classList.contains('is-open'); }

    function show(i) {
      if (!items.length) return;
      index = (i + items.length) % items.length;
      const { photo, natW, natH } = items[index];

      const img = new Image();
      img.alt = photo.alt || '';
      const frame = makeFrame(photo, img, natW, natH, 'lb-frame is-loading');
      const done = () => frame.classList.remove('is-loading');
      img.onload = done;
      img.onerror = done;
      img.src = photo.src;
      if (img.complete && img.naturalWidth) done();
      slot.replaceChildren(frame);

      caption.textContent = photo.caption || '';
      counter.textContent = (index + 1) + ' / ' + items.length;
      prevBtn.hidden = nextBtn.hidden = items.length < 2;
    }

    function open(list, i, trigger) {
      if (!el) build();
      items = list;
      lastFocus = trigger || document.activeElement;
      document.documentElement.classList.add('lb-lock');
      el.classList.add('is-open');
      show(i);
      closeBtn.focus();
    }

    function close() {
      if (!isOpen()) return;
      el.classList.remove('is-open');
      document.documentElement.classList.remove('lb-lock');
      if (lastFocus) lastFocus.focus();
    }

    function onKey(e) {
      if (!isOpen()) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') show(index + 1);
      else if (e.key === 'ArrowLeft') show(index - 1);
      else if (e.key === 'Tab') {
        const focusables = [closeBtn, prevBtn, nextBtn].filter((b) => !b.hidden);
        const at = focusables.indexOf(document.activeElement);
        const step = e.shiftKey ? -1 : 1;
        focusables[(at + step + focusables.length) % focusables.length].focus();
        e.preventDefault();
      }
    }

    return { open };
  })();

  /* =====================================================================
     Galleries
     ===================================================================== */

  function initGallery(root) {
    const photos = (SITE.galleries && SITE.galleries[root.dataset.gallery]) || [];
    if (!photos.length) {
      root.innerHTML = '<p class="gallery-empty">No photos here yet.</p>';
      return;
    }

    const strip = createStrip(root, { pageWheel: true, keys: true });
    const viewerItems = [];

    const reveal = ('IntersectionObserver' in window && !reduceMotion)
      ? new IntersectionObserver((entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible');
              obs.unobserve(entry.target);
            }
          });
        }, { rootMargin: '0px 0px -40px 0px' })
      : null;

    // Start every download at once, then place the photos in list order
    const loading = photos.map((photo) => loadImage(photo.src).catch((err) => {
      console.warn('[portfolio] ' + err.message + '. Check the file name in config.js.');
      return null;
    }));

    (async () => {
      for (let i = 0; i < photos.length; i++) {
        const img = await loading[i];
        if (!img) continue;
        const photo = photos[i];
        const entry = { photo, natW: img.naturalWidth, natH: img.naturalHeight };
        img.alt = photo.alt || '';

        const fig = document.createElement('figure');
        fig.className = 'g-item h-item' + (photo.size === 'small' ? ' is-small' : '');
        if (!reveal) fig.classList.add('is-visible');

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'g-open';
        btn.setAttribute('aria-label', 'View larger' + (photo.alt ? ': ' + photo.alt : ''));
        btn.appendChild(makeFrame(photo, img, entry.natW, entry.natH));
        btn.addEventListener('click', () => Lightbox.open(viewerItems, viewerItems.indexOf(entry), btn));
        fig.appendChild(btn);

        viewerItems.push(entry);
        strip.add(fig);
        if (reveal) reveal.observe(fig);
      }
    })();
  }

  /* =====================================================================
     Scroll down / back to top
     ===================================================================== */

  function initScrollButton() {
    const btn = document.querySelector('.scroll-btn');
    if (!btn) return;
    let up = null;

    const update = () => {
      const doc = document.documentElement;
      const room = doc.scrollHeight - window.innerHeight;
      btn.classList.toggle('is-hidden', room < 120);
      const nowUp = window.scrollY > window.innerHeight * 0.6 || window.scrollY >= room - 4;
      if (nowUp !== up) {
        up = nowUp;
        btn.classList.toggle('is-up', up);
        btn.setAttribute('aria-label', up ? 'Back to top' : 'Scroll down');
      }
    };

    btn.addEventListener('click', () => {
      if (up) window.scrollTo({ top: 0, behavior: smooth });
      else window.scrollBy({ top: window.innerHeight * 0.85, behavior: smooth });
    });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(document.body);
    update();
  }

  /* =====================================================================
     Start
     ===================================================================== */

  applyLinks();
  applyAbout();
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
  document.querySelectorAll('[data-gallery]').forEach(initGallery);
  initScrollButton();
})();
