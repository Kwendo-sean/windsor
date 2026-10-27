// Windsor Waterfront Gardens — interactions
// Slow reveal · scroll-aware counter · experience image swap · drawer
// Designed to feel quiet. Nothing flashy.

(() => {
  'use strict';

  /* ── Graceful image fallback ─────────────────────────────── */
  // Until real photos are dropped into /images, hide broken <img>
  // so the gradient placeholder behind it shows through cleanly.
  document.querySelectorAll('.ph__img').forEach((img) => {
    const fail = () => img.classList.add('is-broken');
    if (img.complete && img.naturalWidth === 0) fail();
    img.addEventListener('error', fail);
  });

  /* ── Nav state on scroll ─────────────────────────────────── */
  const nav = document.querySelector('.nav');
  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 60);

    const stickyCta = document.querySelector('.sticky-cta');
    if (stickyCta) {
      const heroBottom = document.querySelector('.hero').getBoundingClientRect().bottom;
      const contactTop = document.querySelector('.contact').getBoundingClientRect().top;
      stickyCta.classList.toggle('is-visible', heroBottom < 0 && contactTop > window.innerHeight * 0.4);
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Hamburger drawer ────────────────────────────────────── */
  const menuBtn = document.querySelector('.nav__menu');
  const drawer  = document.querySelector('.drawer');
  const toggleDrawer = (force) => {
    const next = typeof force === 'boolean' ? force : !drawer.classList.contains('is-open');
    drawer.classList.toggle('is-open', next);
    nav.classList.toggle('is-open', next);
    document.body.style.overflow = next ? 'hidden' : '';
  };
  menuBtn.addEventListener('click', () => toggleDrawer());
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) toggleDrawer(false);
  });

  /* ── Reveal on scroll ────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('is-visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('is-visible'));
  }

  /* ── Gallery: scroll-driven counter, caption, progress ───── */
  const track     = document.querySelector('.gallery__track');
  const cards     = track ? Array.from(track.querySelectorAll('.gallery__card')) : [];
  const numEl     = document.querySelector('.gallery__counter .num');
  const captionEl = document.querySelector('.gallery__caption');
  const dots      = document.querySelectorAll('.gallery__progress span');
  const totalEl   = document.querySelector('.gallery__counter .total');

  if (track && cards.length) {
    totalEl.textContent = `/ ${String(cards.length).padStart(2, '0')} frames`;

    const updateGalleryFromIndex = (idx) => {
      cards.forEach((c, i) => c.classList.toggle('is-active', i === idx));
      if (numEl) numEl.textContent = String(idx + 1).padStart(2, '0');
      if (captionEl) {
        const cap = cards[idx].getAttribute('data-caption') || '';
        captionEl.textContent = `“${cap}”`;
      }
      dots.forEach((d, i) => d.classList.toggle('is-active', i === idx));
    };

    // Determine active card by which one is closest to the track's left edge.
    const computeActive = () => {
      const trackRect = track.getBoundingClientRect();
      let best = 0, bestDist = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const dist = Math.abs(r.left - trackRect.left - 40);
        if (dist < bestDist) { bestDist = dist; best = i; }
      });
      updateGalleryFromIndex(best);
    };

    let rafId = null;
    track.addEventListener('scroll', () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(computeActive);
    }, { passive: true });

    // Arrow buttons
    const scrollByCard = (dir) => {
      const trackRect = track.getBoundingClientRect();
      let target = 0, found = false;
      for (let i = 0; i < cards.length; i++) {
        const r = cards[i].getBoundingClientRect();
        if (dir > 0 && r.left - trackRect.left > 12) { target = i; found = true; break; }
        if (dir < 0 && r.left - trackRect.left < -12) target = i;
      }
      if (!found && dir > 0) target = cards.length - 1;
      cards[target].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    };
    const prevBtn = document.querySelector('.gallery__nav .prev');
    const nextBtn = document.querySelector('.gallery__nav .next');
    if (prevBtn) prevBtn.addEventListener('click', () => scrollByCard(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByCard(1));

    // Click a dot to jump
    dots.forEach((d, i) => {
      d.style.cursor = 'pointer';
      d.addEventListener('click', () => cards[i].scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' }));
    });

    computeActive();
  }

  /* ── Experiences: index list → image crossfade ──────────── */
  const items  = document.querySelectorAll('.exp__item');
  const slides = document.querySelectorAll('.exp__slide');
  if (items.length && slides.length) {
    let autoplayTimer = null;
    let userInteracted = false;

    const setActive = (idx) => {
      items.forEach((el, i) => el.classList.toggle('is-active', i === idx));
      slides.forEach((el, i) => el.classList.toggle('is-active', i === idx));
    };

    items.forEach((item, i) => {
      const btn = item.querySelector('button');
      btn.addEventListener('mouseenter', () => { userInteracted = true; setActive(i); });
      btn.addEventListener('focus', () => setActive(i));
      btn.addEventListener('click', () => { userInteracted = true; setActive(i); });
    });

    // Gentle autoplay until user hovers anything in the section.
    const expSection = document.querySelector('.exp');
    if (expSection && 'IntersectionObserver' in window) {
      const startAutoplay = () => {
        if (autoplayTimer || userInteracted) return;
        let idx = 0;
        autoplayTimer = setInterval(() => {
          if (userInteracted) { clearInterval(autoplayTimer); autoplayTimer = null; return; }
          idx = (idx + 1) % items.length;
          setActive(idx);
        }, 4200);
      };
      const stopAutoplay = () => {
        if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
      };
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => e.isIntersecting ? startAutoplay() : stopAutoplay());
      }, { threshold: 0.4 });
      io.observe(expSection);
    }
  }

  /* ── Ambient waterfall sound ─────────────────────────────── */
  // Opt-in only (browsers block autoplay audio). Routed through a
  // GainNode so fades also work on iOS, where audio.volume is ignored;
  // file:// previews fall back to audio.volume, since Web Audio mutes
  // media it considers cross-origin. Softens as you scroll away.
  const ambient = document.querySelector('.ambient');
  const soundBtns = document.querySelectorAll('.sound-toggle');
  if (ambient && soundBtns.length) {
    const BASE = 0.7, FLOOR = 0.18, FADE = 1.2;
    const useGraph = location.protocol !== 'file:' && (window.AudioContext || window.webkitAudioContext);
    let ctx = null, gain = null, on = false, level = 0, fadeId = null;

    const targetLevel = () => {
      const hero = document.querySelector('.hero');
      const past = Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 1.5)));
      return BASE * (1 - past * (1 - FLOOR / BASE));
    };
    const rampTo = (v, secs) => {
      if (gain) {
        const t = ctx.currentTime;
        gain.gain.cancelScheduledValues(t);
        gain.gain.setValueAtTime(gain.gain.value, t);
        gain.gain.linearRampToValueAtTime(v, t + secs);
        return;
      }
      cancelAnimationFrame(fadeId);
      const from = level, start = performance.now();
      const step = (now) => {
        const k = Math.min(1, (now - start) / (secs * 1000));
        level = from + (v - from) * k;
        ambient.volume = level;
        if (k < 1) fadeId = requestAnimationFrame(step);
      };
      fadeId = requestAnimationFrame(step);
    };
    const render = () => soundBtns.forEach((b) => {
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
      b.setAttribute('aria-label', on ? 'Mute waterfall sound' : 'Play waterfall sound');
    });

    const setSound = (next) => {
      on = next;
      render();
      if (on) {
        if (useGraph && !ctx) {
          ctx = new useGraph();
          gain = ctx.createGain();
          gain.gain.value = 0;
          ctx.createMediaElementSource(ambient).connect(gain).connect(ctx.destination);
        }
        if (ctx) ctx.resume();
        else ambient.volume = level;
        ambient.play().catch(() => { on = false; render(); });
        rampTo(targetLevel(), FADE);
      } else {
        rampTo(0, FADE * 0.6);
        setTimeout(() => { if (!on) ambient.pause(); }, FADE * 600);
      }
    };

    soundBtns.forEach((b) => b.addEventListener('click', () => setSound(!on)));
    window.addEventListener('scroll', () => { if (on) rampTo(targetLevel(), 0.3); }, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (!on) return;
      if (document.hidden) ambient.pause();
      else ambient.play().catch(() => {});
    });
  }

  /* ── Subtle parallax on hero reel ────────────────────────── */
  const heroReel = document.querySelector('.hero__reel .ph__media');
  if (heroReel) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        heroReel.style.setProperty('--parallax', `${y * 0.18}px`);
        heroReel.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        ticking = false;
      });
    }, { passive: true });
  }
})();
