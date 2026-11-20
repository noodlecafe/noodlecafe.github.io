/* Noodlecafé site: playable fretboard, download celebration, per-reel tracking. No trackers, no cookies. */
(function () {
  'use strict';
  var CHECKOUT = 'https://whop.com/checkout/plan_scpA0tf0ttkQr';   // hidden plan 'Reels: 14 days free (website)'; NOODLE499 = $4.99 first month
  var params = new URLSearchParams(location.search);
  var from = (params.get('r') || document.body.getAttribute('data-reel') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 24);   // e.g. 45, pdf43, ig, bio

  /* ---- every join button: checkout link tagged with where the visitor came from ---- */
  var page = document.body.getAttribute('data-page') || 'site';
  document.querySelectorAll('a[data-join]').forEach(function (a) {
    var u = new URL(CHECKOUT);
    u.searchParams.set('promoCode', 'NOODLE499');
    u.searchParams.set('utm_source', 'website');
    u.searchParams.set('utm_medium', a.getAttribute('data-medium') || page);
    u.searchParams.set('utm_campaign', /^\d+$/.test(from) ? 'reel' + from : (from || 'direct'));
    a.href = u.toString();
  });

  /* ---- sound: a soft plucked string (Karplus-Strong), made in the browser ---- */
  var ctx = null, cache = {};
  function pluck(midi) {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var f = 440 * Math.pow(2, (midi - 69) / 12), sr = ctx.sampleRate;
      if (!cache[midi]) {
        var n = Math.floor(sr * 1.6), buf = ctx.createBuffer(1, n, sr), d = buf.getChannelData(0);
        var p = Math.max(2, Math.round(sr / f)), ring = new Float32Array(p);
        for (var i = 0; i < p; i++) ring[i] = Math.random() * 2 - 1;
        var idx = 0, last = 0;
        for (var j = 0; j < n; j++) {
          var cur = ring[idx], nxt = ring[(idx + 1) % p];
          var v = 0.996 * 0.5 * (cur + nxt);
          ring[idx] = v; idx = (idx + 1) % p;
          last = last * 0.3 + v * 0.7; d[j] = last * 0.6;
        }
        cache[midi] = buf;
      }
      var src = ctx.createBufferSource(), g = ctx.createGain();
      src.buffer = cache[midi]; g.gain.value = 0.55;
      src.connect(g); g.connect(ctx.destination); src.start();
    } catch (e) { /* no audio: the dots still light up */ }
  }

  /* ---- the playable fretboard (home page) ---- */
  var fb = document.getElementById('fretboard');
  if (fb) {
    var NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    var STR = [{ n: 'e', m: 64 }, { n: 'B', m: 59 }, { n: 'G', m: 55 }, { n: 'D', m: 50 }, { n: 'A', m: 45 }, { n: 'E', m: 40 }];
    var now = document.getElementById('fb-now');
    var head = '<div></div>';
    for (var fr = 0; fr <= 12; fr++) head += '<div class="lbl">' + (fr === 0 ? 'open' : ([3, 5, 7, 9, 12].indexOf(fr) >= 0 ? fr : '')) + '</div>';
    var html = head;
    STR.forEach(function (s) {
      html += '<div class="str">' + s.n + '</div>';
      for (var fr = 0; fr <= 12; fr++) {
        var m = s.m + fr, name = NAMES[m % 12];
        var zone = fr === 0 ? 0 : fr <= 4 ? 1 : fr <= 8 ? 2 : 3;
        var cls = 'fb-cell' + (fr === 0 ? ' open' : '') + (fr === 1 ? ' nut' : '');
        html += '<div class="' + cls + '"><button type="button" class="note z' + zone + '" data-m="' + m + '" data-n="' + name + '" data-fr="' + fr + '" data-s="' + s.n + '" aria-label="' + name + ', ' + (s.n === 'e' ? 'high E' : s.n) + ' string, fret ' + fr + '">' + name + '</button></div>';
      }
    });
    fb.innerHTML = html;
    fb.addEventListener('click', function (ev) {
      var b = ev.target.closest('.note'); if (!b) return;
      var m = +b.getAttribute('data-m'), n = b.getAttribute('data-n');
      pluck(m);
      fb.querySelectorAll('.note.on').forEach(function (x) { x.classList.remove('on'); });
      fb.querySelectorAll('.note[data-n="' + CSS.escape(n) + '"]').forEach(function (x) { x.classList.add('on'); });
      if (now) now.textContent = n + ' · string ' + b.getAttribute('data-s') + ' · fret ' + b.getAttribute('data-fr') + ' · every ' + n + ' lit up';
    });
  }

  /* ---- noodle confetti ---- */
  function confetti() {
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    var cols = ['#E8336F', '#FDCC2B', '#111111', '#F7E9A0'];
    for (var i = 0; i < 46; i++) {
      var s = document.createElement('i');
      s.style.left = (Math.random() * 100) + 'vw';
      s.style.background = cols[i % cols.length];
      s.style.animationDelay = (Math.random() * 0.35) + 's';
      s.style.height = (14 + Math.random() * 18) + 'px';
      s.style.transform = 'rotate(' + (Math.random() * 180) + 'deg)';
      box.appendChild(s);
    }
    document.body.appendChild(box);
    setTimeout(function () { box.remove(); }, 2300);
  }

  /* ---- free page: the visitor's reel first, celebrate the download, then show what's inside ---- */
  var list = document.getElementById('sheets');
  if (list) {
    var reel = from.replace(/^pdf/, '');
    var hot = reel && list.querySelector('[data-reel="' + reel + '"]');
    if (hot) { hot.classList.add('hot'); hot.querySelector('.tag').textContent = 'YOUR REEL'; list.prepend(hot); }
    var toast = document.getElementById('toast'), after = document.getElementById('after');
    list.addEventListener('click', function (ev) {
      var a = ev.target.closest('a[download]'); if (!a) return;
      var card = a.closest('.sheet'), title = card ? card.getAttribute('data-title') : 'Your sheet';
      confetti(); pluck(64); setTimeout(function () { pluck(67); }, 110); setTimeout(function () { pluck(71); }, 220);
      if (toast) { toast.querySelector('b').textContent = title; toast.classList.add('show'); setTimeout(function () { toast.classList.remove('show'); }, 5200); }
      if (after) {
        after.classList.add('show');
        setTimeout(function () { after.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 900);
      }
    });
  }
  /* ---- the takeover: the moment they save the PDF, one clear next step slides up ---- */
  var ovl = document.getElementById('offer');
  function openOffer() {
    if (!ovl) return;
    ovl.hidden = false; requestAnimationFrame(function () { ovl.classList.add('open'); });
    document.body.classList.add('locked');
    var cta = ovl.querySelector('.btn-pink'); if (cta) setTimeout(function () { cta.focus({ preventScroll: true }); }, 450);
  }
  function closeOffer() {
    if (!ovl) return; ovl.classList.remove('open'); document.body.classList.remove('locked');
    setTimeout(function () { ovl.hidden = true; }, 300);
  }
  if (ovl) {
    ovl.addEventListener('click', function (ev) { if (ev.target === ovl || ev.target.closest('.ovl-x, .ovl-no')) closeOffer(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeOffer(); });
  }
  var KEY = 'nc_saved_' + location.pathname;
  document.querySelectorAll('[data-pdf]').forEach(function (a) {
    a.addEventListener('click', function () {
      try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
      confetti(); pluck(64); setTimeout(function () { pluck(67); }, 110); setTimeout(function () { pluck(71); }, 220);
      setTimeout(openOffer, 250);
    });
  });
  /* if the PDF opened in the same window (Instagram's browser), the offer is waiting when they come back */
  window.addEventListener('pageshow', function () {
    var saved = false; try { saved = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
    if (saved && ovl && !ovl.classList.contains('open')) openOffer();
  });
  var sticky = document.getElementById('sticky');
  if (sticky) {
    var join = document.getElementById('join');
    var onScroll = function () {
      var past = window.scrollY > 420;
      var atJoin = join && join.getBoundingClientRect().top < window.innerHeight && join.getBoundingClientRect().bottom > 0;
      sticky.classList.toggle('show', past && !atJoin);
    };
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
})();
