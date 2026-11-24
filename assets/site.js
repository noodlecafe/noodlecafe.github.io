/* Noodlecafé site: playable fretboard, download celebration, funnel tracking via our own Noodle Counter (Cloudflare; counter/ in the kit). */
(function () {
  'use strict';
  var CHECKOUT = 'https://whop.com/checkout/plan_scpA0tf0ttkQr';   // hidden plan 'Reels: 14 days free (website)'; NOODLE499 = $4.99 first month
  var params = new URLSearchParams(location.search);
  var from = (params.get('r') || document.body.getAttribute('data-reel') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 24);   // e.g. 45, pdf43, ig, bio

  /* ---- the Noodle Counter: every join button goes through the counter's /go (counted on the server, then the
     Whop checkout with NOODLE499 + UTM). On-page events are sent with sendBeacon, which survives leaving the page. ---- */
  var COUNTER = 'https://noodle-counter.noodlecafe.workers.dev';
  var page = document.body.getAttribute('data-page') || 'site';
  var sheet = document.body.getAttribute('data-sheet') || 'site';
  var src = /^\d+$/.test(from) ? 'direct' : (from.replace(/^pdf\d*$/, 'pdf') || 'direct');      // ig (Zorcha DM), pdf, bio...
  document.querySelectorAll('a[data-join]').forEach(function (a) {
    a.href = COUNTER + '/go?s=' + encodeURIComponent(sheet) + '&p=' + encodeURIComponent(a.getAttribute('data-medium') || page) + '&src=' + encodeURIComponent(src) + '&pg=' + encodeURIComponent(page);
  });
  function track(ev, s) {
    if (/^(localhost|127\.|file)/.test(location.hostname || 'file')) { try { console.log('[counter test]', ev, s || sheet, page, src); } catch (e) {} return; }
    var body = JSON.stringify({ ev: ev, sheet: s || sheet, page: page, src: src });
    try { if (navigator.sendBeacon && navigator.sendBeacon(COUNTER + '/e', body)) return; } catch (e) {}
    try { fetch(COUNTER + '/e', { method: 'POST', body: body, keepalive: true, mode: 'no-cors' }); } catch (e) {}
  }
  track('view');
  function sheetOf(a) { var m = (a.getAttribute('href') || '').match(/noodlecafe-([a-z0-9]+)\.pdf/i); return m ? m[1].toLowerCase() : sheet; }

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
      track('pdf_save', sheetOf(a));
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
    track('popup_open');
    ovl.hidden = false; requestAnimationFrame(function () { ovl.classList.add('open'); });
    document.body.classList.add('locked');
    setTimeout(function () { try { ovl.focus({ preventScroll: true }); } catch (e) {} }, 450);
  }
  function closeOffer() {
    if (!ovl) return; ovl.classList.remove('open'); document.body.classList.remove('locked');
    setTimeout(function () { ovl.hidden = true; }, 300);
  }
  if (ovl) {
    ovl.addEventListener('click', function (ev) { if (ev.target === ovl || ev.target.closest('.ovl-x, .ovl-no')) { track('popup_close'); closeOffer(); } });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') closeOffer(); });
  }
  var KEY = 'nc_saved_' + location.pathname;
  /* 22 Nov: asking for the PDF opens the panel FIRST (nothing leaves Instagram yet); the PDF itself opens from the
     panel's 'Open my free PDF' button, which goes through the counter (/pdf). */
  /* 24 Nov: the email step. 'Get my free PDF' asks for the email first (#ask), sends it to the counter's /sub
     (which passes it to Sender and only counts it), then the offer panel opens as before. Pages without #ask
     keep the old flow. A network error never blocks the PDF. */
  var ask = document.getElementById('ask'), askForm = document.getElementById('ask-form');
  var EKEY = 'nc_email_given';
  function given() { try { return sessionStorage.getItem(EKEY) === '1'; } catch (e) { return false; } }
  function celebrate(s) {
    track('pdf_save', s);
    confetti(); pluck(64); setTimeout(function () { pluck(67); }, 110); setTimeout(function () { pluck(71); }, 220);
    setTimeout(openOffer, 150);
  }
  function openAsk() {
    track('ask_open');
    ask.hidden = false; requestAnimationFrame(function () { ask.classList.add('open'); });
    document.body.classList.add('locked');
    setTimeout(function () { try { ask.focus({ preventScroll: true }); } catch (e) {} }, 450);
  }
  function closeAsk(after) {
    ask.classList.remove('open');
    setTimeout(function () { ask.hidden = true; if (after) after(); else document.body.classList.remove('locked'); }, 280);
  }
  if (ask && askForm) {
    ask.addEventListener('click', function (ev) { if (ev.target === ask || ev.target.closest('.ovl-x')) { track('ask_close'); closeAsk(); } });
    var input = document.getElementById('ask-email'), err = document.getElementById('ask-err'), go = document.getElementById('ask-go');
    askForm.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var email = (input.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) { err.hidden = false; input.focus(); return; }
      err.hidden = true; go.disabled = true; go.textContent = 'One sec…';
      var done = function () {
        try { sessionStorage.setItem(EKEY, '1'); } catch (e) {}
        go.disabled = false; go.textContent = 'Get my free PDF';
        closeAsk(function () { celebrate(sheet); });
      };
      if (/^(localhost|127\.|file)/.test(location.hostname || 'file')) { try { console.log('[counter test] sub', sheet); } catch (e) {} done(); return; }
      fetch(COUNTER + '/sub', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, sheet: sheet, page: page, src: src, p: 'ask', hp: askForm.company ? askForm.company.value : '' }) })
        .then(function (r) {
          if (r.status === 400) { go.disabled = false; go.textContent = 'Get my free PDF'; err.hidden = false; input.focus(); return; }
          done();
        })
        .catch(done);
    });
  }
  document.querySelectorAll('[data-get]').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      if (ask && askForm && !given()) { openAsk(); return; }
      celebrate(sheetOf(a));
    });
  });
  document.querySelectorAll('[data-pdf-open]').forEach(function (a) {
    a.href += '&src=' + encodeURIComponent(src);
    a.addEventListener('click', function () { try { sessionStorage.setItem(KEY, '1'); } catch (e) {} });
  });
  document.querySelectorAll('[data-pdf]').forEach(function (a) {
    a.addEventListener('click', function () {
      track('pdf_save', sheetOf(a));
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
