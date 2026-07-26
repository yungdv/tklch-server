/* ============================================================
   TKLCH Vanilla — main.js
   Всё безопасно: каждый блок проверяет наличие своих элементов,
   поэтому один файл работает и на index.html, и на rules.html.
   ============================================================ */
(function () {
  'use strict';

  const SERVER_IP = 'tklch.xyz';   // что копируем
  const STATUS_HOST = 'tklch.xyz';            // что пингуем через API

  /* ---------- NAVBAR: тень при скролле ---------- */
  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- БУРГЕР-МЕНЮ (мобилка) ---------- */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  /* ---------- КОПИРОВАНИЕ IP ---------- */
  const toast = document.getElementById('toast');
  function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }
  function copyIP() {
    const done = () => showToast();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SERVER_IP).then(done).catch(fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      const t = document.createElement('textarea');
      t.value = SERVER_IP; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(t); done();
    }
  }
  ['copyBtn', 'copyBtn2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', copyIP);
  });

    /* ---------- СТАТУС СЕРВЕРА (live, с обходом CORS) ---------- */
  const statusDot   = document.querySelector('.stat__label .dot');
  const onlineEl    = document.getElementById('playersOnline');
  const maxEl       = document.getElementById('playersMax');
  const namesEl     = document.getElementById('onlineNames');

  const setDot = (cls) => { if (statusDot) statusDot.className = 'dot ' + cls; };
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  async function tryJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  // цепочка: прямой mcstatus → mcstatus через CORS‑прокси → mcsrvstat
  async function getStatus() {
    const target = 'https://api.mcstatus.io/v2/status/java/' + STATUS_HOST;
    try { const d = await tryJson(target); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://api.allorigins.win/raw?url=' + encodeURIComponent(target)); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://api.mcsrvstat.us/3/' + STATUS_HOST); if (d && d.online) return d; } catch (e) {}
    return null;
  }

  async function fetchStatus() {
    try {
      const d = await getStatus();
      if (d && d.online) {
        setDot('dot--green');
        if (onlineEl) onlineEl.textContent = d.players?.online ?? 0;
        if (maxEl)    maxEl.textContent    = d.players?.max ?? '—';
        if (namesEl) {
          const raw = d.players?.list || [];
          const names = raw.map(x => typeof x === 'string' ? x : (x.name_clean || x.name || '')).filter(Boolean).slice(0, 6);
          namesEl.innerHTML = names.map(n => '<span>' + esc(n) + '</span>').join('');
        }
      } else {
        setDot('dot--red');
        if (onlineEl) onlineEl.textContent = '0';
        if (maxEl)    maxEl.textContent    = '—';
        if (namesEl)  namesEl.innerHTML    = '';
      }
    } catch (e) {
      setDot('dot--check');          // честно: "не удалось", без вранья зелёным
      if (onlineEl) onlineEl.textContent = '—';
      if (maxEl)    maxEl.textContent    = '—';
    }
  }

  if (onlineEl) {
    fetchStatus();
    setInterval(fetchStatus, 5 * 60 * 1000);
  }

  /* ---------- LIGHTBOX для галереи ---------- */
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  if (lightbox && lbImg) {
    document.querySelectorAll('.bento__item[data-img]').forEach(fig => {
      fig.addEventListener('click', () => {
        lbImg.src = fig.dataset.img;
        lbImg.alt = fig.querySelector('img')?.alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
      });
    });
    const close = () => { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); };
    if (lbClose) lbClose.addEventListener('click', close);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- REVEAL при скролле ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

    /* ---------- TWITCH: честный live-детект без ключей ---------- */
  const TWITCH_USER = 'tklch_';
  const twitchCard   = document.getElementById('twitchCard');
  const twitchModal  = document.getElementById('twitchModal');
  const twitchPlayer = document.getElementById('twitchPlayer');
  const twitchClose  = document.getElementById('twitchModalClose');

  function twitchPreviewURL(w, h) {
    // публичное превью стрима: 200 если в эфире, 404 если нет
    return 'https://static-cdn.jtvnw.net/previews-ttv/live_user_' + TWITCH_USER + '-' + w + 'x' + h + '.jpg?r=' + Date.now();
  }

  function renderLive(bigSrc) {
    twitchCard.innerHTML =
      '<a class="twitch__live" id="twitchLive" href="https://twitch.tv/' + TWITCH_USER + '" target="_blank" rel="noopener">' +
        '<span class="twitch__badge"><span class="dot"></span> В ЭФИРЕ</span>' +
        '<img src="' + bigSrc + '" alt="Стрим ' + TWITCH_USER + '">' +
        '<span class="twitch__play"><svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></span>' +
        '<span class="twitch__meta"><b>' + TWITCH_USER + '</b><span>прямой эфир на Twitch · нажми, чтобы смотреть</span></span>' +
      '</a>';
    // клик по обложке (кроме самой ссылки-подложки) открывает плеер
    var live = document.getElementById('twitchLive');
    live.addEventListener('click', function (e) {
      e.preventDefault();
      openTwitchPlayer();
    });
  }

  function renderOffline() {
    twitchCard.innerHTML =
      '<div class="twitch__off">' +
        '<span class="twitch__off-ic"><svg viewBox="0 0 24 24" width="40" height="40" fill="currentColor"><path d="M4 3 1 6v12l3 3h5v-3H4V6h5V3H4Zm13 0v3h3l-4 4-3-3-2 2 3 3-3 3 2 2 3-3 4 4h-3v3h5l3-3V6l-3-3h-5Z"/></svg></span>' +
        '<div class="twitch__off-txt">' +
          '<h3>' + TWITCH_USER + '</h3>' +
          '<p>Стример проекта TKLCH Vanilla. Стримы выживания, обзоры построек и общение с комьюнити.</p>' +
          '<span class="status-line"><span class="dot"></span> сейчас не в эфире</span>' +
        '</div>' +
        '<a class="twitch__btn" href="https://twitch.tv/' + TWITCH_USER + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 3 1 6v12l3 3h5v3l3-3h4l5-5V3H4Zm15 11-3 3h-4l-3 3v-3H5V5h14v9ZM15 7h-2v5h2V7Zm-5 0H8v5h2V7Z"/></svg>' +
          'Перейти на канал' +
        '</a>' +
      '</div>';
  }

  function checkTwitch() {
    if (!twitchCard) return;
    var img = new Image();
    img.onload  = function () { renderLive(twitchPreviewURL(1280, 720)); };
    img.onerror = function () { renderOffline(); };
    img.src = twitchPreviewURL(320, 180);   // лёгкий запрос для детекта
  }

  function openTwitchPlayer() {
    if (!twitchModal || !twitchPlayer) return;
    var parent = window.location.hostname || 'localhost';
    twitchPlayer.innerHTML =
      '<iframe src="https://player.twitch.tv/?channel=' + TWITCH_USER + '&parent=' + parent + '&autoplay=true" ' +
      'allowfullscreen="true" scrolling="no" frameborder="0" ' +
      'allow="autoplay; fullscreen; picture-in-picture"></iframe>';
    twitchModal.classList.add('open');
    twitchModal.setAttribute('aria-hidden', 'false');
  }
  function closeTwitchPlayer() {
    if (!twitchModal || !twitchPlayer) return;
    twitchPlayer.innerHTML = '';                 // убираем iframe, чтобы звук не играл
    twitchModal.classList.remove('open');
    twitchModal.setAttribute('aria-hidden', 'true');
  }
  if (twitchClose) twitchClose.addEventListener('click', closeTwitchPlayer);
  if (twitchModal) twitchModal.addEventListener('click', function (e) { if (e.target === twitchModal) closeTwitchPlayer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTwitchPlayer(); });

  if (twitchCard) {
    checkTwitch();
    setInterval(checkTwitch, 3 * 60 * 1000);     // перепроверяем эфир раз в 3 минуты
  }
})();