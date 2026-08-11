(function () {
  'use strict';

  const SERVER_IP = 'tklch.xyz';
  const STATUS_HOST = 'tklch.xyz';
  const TWITCH_USER = 'tklch_';
  const WIPE_DATE = '2026-06-26';
  const NAMES_LIMIT = 24;

  const SEND_MODE = 'telegram';
  const WORKER_URL = 'https://frosty-bonus-8a1a.dvtasher1337.workers.dev';

  // Реальный ID сервера Discord из твоей ссылки discord.gg/ajmHTSqC7
  const DISCORD_GUILD_ID = '1283459988966035496'; 

  function basePath() {
    return location.pathname.replace(/\/index\.html$/, '/');
  }
  if (location.pathname.indexOf('index.html') !== -1) {
    try { history.replaceState(null, '', basePath() + location.search + location.hash); } catch (e) {}
  }

  const nav = document.getElementById('nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 30);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');
  if (burger && navLinks) {
    burger.addEventListener('click', () => navLinks.classList.toggle('open'));
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => navLinks.classList.remove('open'))
    );
  }

  const toast = document.getElementById('toast');
  function showToast() {
    if (!toast) return;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 2200);
  }

  function showMcPopup(anchor, text) {
    if (!anchor) return;
    const r = anchor.getBoundingClientRect();
    const p = document.createElement('span');
    p.className = 'mc-pop';
    p.textContent = text;
    p.style.left = (r.left + r.width / 2) + 'px';
    p.style.top = (r.top - 6) + 'px';
    document.body.appendChild(p);
    const a = p.animate([
      { transform: 'translate(-50%,-100%) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%,-135%) scale(1)', opacity: 1, offset: .25 },
      { transform: 'translate(-50%,-210%) scale(1)', opacity: 0 }
    ], { duration: 1100, easing: 'cubic-bezier(.16,1,.3,1)' });
    a.onfinish = () => p.remove();
  }

  function copyIP(e) {
    const btn = e ? e.currentTarget : null;
    const anchor = (btn && btn.tagName !== 'CODE') ? btn : (document.getElementById('ipText') || btn);
    const done = () => { flashBtn(btn); showMcPopup(anchor, '+1 IP ✦'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(SERVER_IP).then(done).catch(fallbackCopy);
    } else { fallbackCopy(); }
    function fallbackCopy() {
      const t = document.createElement('textarea');
      t.value = SERVER_IP; t.style.position = 'fixed'; t.style.opacity = '0';
      document.body.appendChild(t); t.select();
      try { document.execCommand('copy'); } catch (err) {}
      document.body.removeChild(t); done();
    }
  }

  function flashBtn(btn) {
    if (!btn || btn.tagName === 'CODE') return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> В инвентаре!';
    btn.classList.add('copied');
    clearTimeout(btn._t);
    btn._t = setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 1800);
  }

  ['copyBtn', 'copyBtn2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', copyIP);
  });

  const ipTextEl = document.getElementById('ipText');
  if (ipTextEl) ipTextEl.addEventListener('click', () => copyIP());

  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  function animateNumber(el, to) {
    if (!el) return;
    to = parseInt(to, 10);
    if (isNaN(to) || to < 0) { el.textContent = (isNaN(to) ? '—' : to); return; }
    const from = Math.max(0, parseInt(el.textContent, 10) || 0);
    if (from === to) { el.textContent = to; return; }
    if (el._raf) cancelAnimationFrame(el._raf);
    const dur = 700, start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.max(0, Math.round(from + (to - from) * e));
      if (p < 1) { el._raf = requestAnimationFrame(tick); } else { el._raf = null; }
    })(start);
  }

  const statusDot = document.querySelector('.stat__label .dot');
  const onlineEl = document.getElementById('playersOnline');
  const maxEl = document.getElementById('playersMax');
  const namesEl = document.getElementById('onlineNames');
  const setDot = (cls) => { if (statusDot) statusDot.className = 'dot ' + cls; };
  let hadSuccess = false;

  function fetchWithTimeout(url, ms) {
    const c = new AbortController();
    const t = setTimeout(() => c.abort(), ms || 4000);
    return fetch(url, { signal: c.signal }).finally(() => clearTimeout(t));
  }
  async function tryJson(url, ms) {
    const r = await fetchWithTimeout(url, ms || 4000);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  async function getStatus() {
    const target = 'https://api.mcstatus.io/v2/status/java/' + STATUS_HOST;
    try { const d = await tryJson(target, 4000); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://api.allorigins.win/raw?url=' + encodeURIComponent(target), 4000); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://corsproxy.io/?' + encodeURIComponent(target), 4000); if (d && d.online) return d; } catch (e) {}
    return null;
  }

  async function fetchStatus() {
    let d = null;
    try { d = await getStatus(); } catch (e) { d = null; }
    if (d && d.online) {
      hadSuccess = true;
      setDot('dot--green');
      animateNumber(onlineEl, d.players?.online ?? 0);
      animateNumber(maxEl, d.players?.max ?? 0);
      if (namesEl) {
        const raw = d.players?.list || [];
        const all = raw.map(x => typeof x === 'string' ? x : (x.name_clean || x.name || '')).filter(Boolean);
        const shown = all.slice(0, NAMES_LIMIT);
        const extra = all.length - shown.length;
        namesEl.innerHTML = shown.map(n =>
          '<span><img src="https://mc-heads.net/avatar/' + encodeURIComponent(n) + '/18" alt="" loading="lazy" decoding="async" onerror="this.style.display=\'none\'">' + esc(n) + '</span>'
        ).join('') + (extra > 0 ? '<span class="online-names__more">+' + extra + '</span>' : '');
      }
    } else if (!hadSuccess) {
      setDot('dot--check');
      if (onlineEl) onlineEl.textContent = '—';
      if (maxEl) maxEl.textContent = '—';
    }
  }

  if (onlineEl) {
    fetchStatus();
    setInterval(fetchStatus, 5 * 60 * 1000);
  }

  const wipeEl = document.getElementById('wipeDays');
  if (wipeEl) {
    const wipe = new Date(WIPE_DATE + 'T00:00:00');
    const days = Math.max(0, Math.floor((Date.now() - wipe.getTime()) / 86400000));
    animateNumber(wipeEl, days);
  }

const TICKER = [
    { who: 'tklch', what: 'опять сгорел на стриме' },
    { who: 'Danka', what: 'жестко завозит(нет)' },
    { who: 'karma777', what: 'нашёл алмазы на Y = -58' },
    { who: 'opiuuuuuuuuuuum', what: 'приручил волка' },
    { who: 'ZeroTwo_Ezik', what: 'открыл магазин у площади' },
    { who: 'lavina444', what: 'посадил вишнёвую рощу' },
    { who: 'BitterSweet', what: 'проложил дорогу к шахте' },
    { who: '5Kroc_', what: 'достроил новую базу' },
    { who: 'GROMKLED', what: 'летает на элитрах' },
    { who: 'tareika200', what: 'поймал редкую рыбу' },
    { who: 'yanomenko', what: 'фармит данжи' },
    { who: 'justaa22', what: 'джуста' },
    { who: 'mianmi', what: 'кошмарит сервер' },
    { who: 'topkinf', what: 'проводит ивент' },
    { who: 'nten4ik', what: 'построил ферму' }
  ];
  const tickerTrack = document.getElementById('tickerTrack');
  if (tickerTrack) {
    const one = TICKER.map(t =>
      '<span class="ticker__item"><span class="tk">[Server]</span> <span class="tn">' + esc(t.who) + '</span> ' + esc(t.what) + '</span>'
    ).join('');
    tickerTrack.innerHTML = one + one;
  }

  // ПАРАЛЛАКС И АНИМАЦИИ МЫШИ
  const heroBg = document.querySelector('.hero__bg');
  const heroArt = document.querySelector('.hero__art');
  const hero = document.querySelector('.hero');
  const finePointer = window.matchMedia('(pointer:fine)').matches;
  if (hero && finePointer) {
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      if (heroBg) {
        heroBg.style.setProperty('--px', (x * -22).toFixed(1) + 'px');
        heroBg.style.setProperty('--py', (y * -22).toFixed(1) + 'px');
      }
      if (heroArt) {
        heroArt.style.setProperty('--rx', (x * 12).toFixed(1) + 'deg');
        heroArt.style.setProperty('--ry', (y * -8).toFixed(1) + 'deg');
      }
    });
    hero.addEventListener('mouseleave', () => {
      if (heroBg) { heroBg.style.setProperty('--px', '0px'); heroBg.style.setProperty('--py', '0px'); }
      if (heroArt) { heroArt.style.setProperty('--rx', '0deg'); heroArt.style.setProperty('--ry', '0deg'); }
    });
  }

  function ripple(x, y) {
    const ring = document.createElement('span');
    ring.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:18px;height:18px;' +
      'border:2px solid rgba(167,139,250,.9);border-radius:50%;z-index:400;pointer-events:none;' +
      'transform:translate(-50%,-50%);box-shadow:0 0 14px rgba(139,92,246,.5);';
    document.body.appendChild(ring);
    const anim = ring.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: .9 },
      { transform: 'translate(-50%,-50%) scale(9)', opacity: 0 }
    ], { duration: 600, easing: 'cubic-bezier(.16,1,.3,1)' });
    anim.onfinish = () => ring.remove();
  }

  function pop(brandEl) {
    const logo = brandEl.querySelector('.brand__logo') || brandEl;
    logo.animate([
      { transform: 'scale(1) rotate(0deg)' },
      { transform: 'scale(1.18) rotate(-6deg)' },
      { transform: 'scale(1) rotate(0deg)' }
    ], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
  }

  const isHome = location.pathname === '/' || location.pathname.endsWith('/index.html');
  document.querySelectorAll('.brand').forEach(b => {
    b.addEventListener('click', (e) => {
      e.preventDefault();
      ripple(e.clientX, e.clientY);
      pop(b);
      if (isHome) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        try { history.replaceState(null, '', basePath() + location.search); } catch (err) {}
      } else {
        setTimeout(() => { window.location.href = 'index.html'; }, 200);
      }
    });
  });

  const polaroid = document.querySelector('.polaroid');
  if (polaroid) {
    polaroid.style.cursor = 'pointer';
    polaroid.addEventListener('click', (e) => {
      polaroid.animate([
        { transform: 'rotate(-4deg) scale(1)' },
        { transform: 'rotate(3deg) scale(1.08) translateY(-12px)' },
        { transform: 'rotate(-4deg) scale(1)' }
      ], { duration: 460, easing: 'cubic-bezier(.16,1,.3,1)' });
      const h = document.createElement('span');
      h.className = 'mascot-heart';
      h.textContent = '♥';
      h.style.left = e.clientX + 'px';
      h.style.top = e.clientY + 'px';
      document.body.appendChild(h);
      const a = h.animate([
        { transform: 'translate(-50%,-50%) scale(.5)', opacity: 0 },
        { transform: 'translate(-50%,-130%) scale(1.3)', opacity: 1, offset: .3 },
        { transform: 'translate(-50%,-280%) scale(1)', opacity: 0 }
      ], { duration: 950, easing: 'cubic-bezier(.16,1,.3,1)' });
      a.onfinish = () => h.remove();
    });
  }

  document.querySelectorAll('a[href^="#"]:not(.brand)').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
      try { history.replaceState(null, '', basePath() + location.search); } catch (err) {}
    });
  });

  const spyLinks = Array.from(document.querySelectorAll('.nav__links a[href^="#"]'));
  const spyMap = spyLinks.map(a => ({ a, sec: document.querySelector(a.getAttribute('href')) })).filter(o => o.sec);
  if (spyMap.length && 'IntersectionObserver' in window) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          spyLinks.forEach(a => a.classList.remove('active'));
          const m = spyMap.find(o => o.sec === en.target);
          if (m) m.a.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    spyMap.forEach(o => so.observe(o.sec));
  }

  const faqItems = document.querySelectorAll('.faq__item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq__q');
    const a = item.querySelector('.faq__a');
    if (!q || !a) return;
    q.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach(other => {
        other.classList.remove('open');
        const oa = other.querySelector('.faq__a');
        if (oa) oa.style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  });

  const toTop = document.getElementById('toTop');
  if (toTop) {
    const toggleTop = () => toTop.classList.toggle('show', window.scrollY > 600);
    toggleTop();
    window.addEventListener('scroll', toggleTop, { passive: true });
    toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbClose = document.getElementById('lbClose');
  if (lightbox && lbImg) {
    document.querySelectorAll('.bento__item[data-img]').forEach(fig => {
      const openLightbox = () => {
        lbImg.src = fig.dataset.img;
        lbImg.alt = fig.querySelector('img')?.alt || '';
        lightbox.classList.add('open');
        lightbox.setAttribute('aria-hidden', 'false');
        };
      fig.addEventListener('click', openLightbox);
      fig.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox();
        }
      });
    });
    const close = () => { lightbox.classList.remove('open'); lightbox.setAttribute('aria-hidden', 'true'); };
    if (lbClose) lbClose.addEventListener('click', close);
    lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

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

  const twitchCard = document.getElementById('twitchCard');
  const twitchModal = document.getElementById('twitchModal');
  const twitchPlayer = document.getElementById('twitchPlayer');
  const twitchClose = document.getElementById('twitchModalClose');

  function twitchPreviewURL(w, h) {
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
    const live = document.getElementById('twitchLive');
    live.addEventListener('click', function (e) { e.preventDefault(); openTwitchPlayer(); });
  }

  function renderOffline() {
    twitchCard.innerHTML =
      '<div class="twitch__off">' +
        '<span class="twitch__off-ic"><svg viewBox="0 0 24 24" width="38" height="38" fill="currentColor"><path d="M4 3 1 6v12l3 3h5v3l3-3h4l5-5V3H4Zm15 11-3 3h-4l-3 3v-3H5V5h14v9ZM15 7h-2v5h2V7Zm-5 0H8v5h2V7Z"/></svg></span>' +
        '<h3>' + TWITCH_USER + '</h3>' +
        '<p>Стример проекта TKLCH Vanilla. Стримы выживания, обзоры построек и общение с комьюнити.</p>' +
        '<span class="status-line"><span class="dot"></span> сейчас не в эфире</span>' +
        '<a class="twitch__btn" href="https://twitch.tv/' + TWITCH_USER + '" target="_blank" rel="noopener">' +
          '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M4 3 1 6v12l3 3h5v3l3-3h4l5-5V3H4Zm15 11-3 3h-4l-3 3v-3H5V5h14v9ZM15 7h-2v5h2V7Zm-5 0H8v5h2V7Z"/></svg>' +
          'Перейти на канал' +
        '</a>' +
      '</div>';
  }

  async function checkTwitch() {
    if (!twitchCard) return;
    let live = null;
    try {
      const r = await fetchWithTimeout('https://api.allorigins.win/raw?url=' + encodeURIComponent('https://decapi.me/twitch/uptime/' + TWITCH_USER), 4000);
      const txt = (await r.text()).trim();
      if (txt) live = !/offline|not live|not found|unknown|error/i.test(txt);
    } catch (e) { live = null; }
    if (live === true) { renderLive(twitchPreviewURL(1280, 720)); return; }
    if (live === false) { renderOffline(); return; }
    let settled = false;
    const img = new Image();
    const t = setTimeout(() => { if (!settled) { settled = true; renderOffline(); } }, 5000);
    img.onload = function () { if (settled) return; settled = true; clearTimeout(t); renderLive(twitchPreviewURL(1280, 720)); };
    img.onerror = function () { if (settled) return; settled = true; clearTimeout(t); renderOffline(); };
    img.src = twitchPreviewURL(320, 180);
  }

  function openTwitchPlayer() {
    if (!twitchModal || !twitchPlayer) return;
    const parent = window.location.hostname || 'localhost';
    twitchPlayer.innerHTML =
      '<iframe src="https://player.twitch.tv/?channel=' + TWITCH_USER + '&parent=' + parent + '&autoplay=true" ' +
      'allowfullscreen="true" scrolling="no" frameborder="0" ' +
      'allow="autoplay; fullscreen; picture-in-picture"></iframe>';
    twitchModal.classList.add('open');
    twitchModal.setAttribute('aria-hidden', 'false');
  }

  function closeTwitchPlayer() {
    if (!twitchModal || !twitchPlayer) return;
    twitchPlayer.innerHTML = '';
    twitchModal.classList.remove('open');
    twitchModal.setAttribute('aria-hidden', 'true');
  }

  if (twitchClose) twitchClose.addEventListener('click', closeTwitchPlayer);
  if (twitchModal) twitchModal.addEventListener('click', function (e) { if (e.target === twitchModal) closeTwitchPlayer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeTwitchPlayer(); });

  if (twitchCard) {
    checkTwitch();
    setInterval(checkTwitch, 3 * 60 * 1000);
  }

  // ФОРМА ЗАЯВКИ
  const appealForm = document.getElementById('appealForm');
  if (appealForm) {
    const box   = document.getElementById('appealBox');
    const done  = document.getElementById('appealDone');
    const errEl = document.getElementById('appealErr');
    const btn   = document.getElementById('appealSubmit');
    const about = document.getElementById('fAbout');
    const nickField = document.getElementById('fNick');
    const nickAvatar = document.getElementById('nickAvatar');
    const capQ = document.getElementById('capQ');
    
    // Генерация капчи
    const capA = 1 + Math.floor(Math.random() * 12);
    const capB = 1 + Math.floor(Math.random() * 12);
    const capExpiry = Date.now() + 5 * 60 * 1000;
    let capToken = '';

    // Упрощенная генерация токена (SHA-256 хеш от строки)
    async function generateToken(a, b, expiry) {
      const data = `${a}:${b}:${Math.floor(expiry / 300000)}`;
      const msgBuffer = new TextEncoder().encode(data);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    }

    generateToken(capA, capB, capExpiry).then(token => {
      capToken = token;
    });
    if (capQ) capQ.textContent = capA + ' + ' + capB + ' =';

    if (nickField && nickAvatar) {
      const syncAvatar = () => {
        const v = nickField.value.trim();
        if (/^[a-zA-Z0-9_]{3,16}$/.test(v)) {
          nickAvatar.src = 'https://mc-heads.net/avatar/' + encodeURIComponent(v) + '/64';
          nickAvatar.classList.add('show');
        } else {
          nickAvatar.classList.remove('show');
        }
      };
      nickField.addEventListener('input', syncAvatar);
    }

    const setErr = (field, on) => { if (field) field.closest('.field').classList.toggle('field--err', on); };
    const showErr = (msg) => { if (errEl) { errEl.textContent = msg; errEl.hidden = false; } };
    const hideErr = () => { if (errEl) errEl.hidden = true; };
    
    const DUP_KEY = 'tklch_appeal_sent';
    const sentNicks = () => { try { return JSON.parse(localStorage.getItem(DUP_KEY) || '{}'); } catch (e) { return {}; } };
    const alreadySent = (n) => { const m = sentNicks(); const t = m[n.toLowerCase()]; return !!(t && (Date.now() - t < 2 * 3600 * 1000)); };
    const rememberNick = (n) => { const m = sentNicks(); m[n.toLowerCase()] = Date.now(); try { localStorage.setItem(DUP_KEY, JSON.stringify(m)); } catch (e) {} };

    appealForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideErr();
      const nick        = document.getElementById('fNick');
      const age         = document.getElementById('fAge');
      const agree       = document.getElementById('rulesAgree');
      const gotcha      = document.getElementById('fGotcha');
      const capInput    = document.getElementById('fCap');

      if (gotcha && gotcha.value) { finish(); return; }

      const nickOk     = /^[a-zA-Z0-9_]{3,16}$/.test(nick.value.trim());
      const aboutOk    = about.value.trim().length > 0 && about.value.trim().length <= 1000;
      const ageNum     = parseInt(age.value, 10);
      const ageOk      = !isNaN(ageNum) && ageNum >= 6 && ageNum <= 99;
      const capOk      = capInput && parseInt(capInput.value, 10) === capA + capB;
      
      setErr(nick, !nickOk); setErr(about, !aboutOk); setErr(age, !ageOk);

      if (!nickOk || !aboutOk || !ageOk) { showErr('Проверь подсвеченные поля.'); return; }
      if (!capOk) { showErr('Неверный ответ на пример.'); return; }
      if (!agree.checked) { showErr('Нужно подтвердить правила.'); return; }

      const data = {
        nick: nick.value.trim(),
        about: about.value.trim(),
        age: ageNum,
        friend: document.getElementById('fFriend').value.trim(),
        _gotcha: gotcha ? gotcha.value : '',
        _ca: capA,
        _cb: capB,
        _cr: capInput ? parseInt(capInput.value, 10) : NaN,
        _ct: capToken,
        _exp: capExpiry
      };

      if (alreadySent(data.nick)) { showErr('Заявка уже отправлена недавно.'); return; }

      btn.disabled = true;
      const orig = btn.innerHTML;
      btn.innerHTML = '<span class="spinner" style="width:18px;height:18px;border-width:2.5px"></span> Отправляем…';

      try {
        if (SEND_MODE === 'telegram') {
          const r = await fetch(WORKER_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
          let j = null; try { j = await r.json(); } catch (_) {}
          if (!j || j.ok !== true) {
            const code = j && (j.error || j.status);
            if (code === 'dup') showErr('Заявка уже есть.');
            else if (code === 'rate' || code === 'ipn') showErr('Много заявок с этого IP.');
            else if (code === 'captcha' || code === 'invalid') showErr('Ошибка проверки.');
            else if (code === 'flood') showErr('Подожди минуту.');
            else showErr('Ошибка отправки.');
            btn.disabled = false; btn.innerHTML = orig; return;
          }
        } else {
          await new Promise(res => setTimeout(res, 700));
        }
        rememberNick(data.nick);
        finish();
      } catch (err) {
        showErr('Не удалось отправить.');
        btn.disabled = false; btn.innerHTML = orig;
      }
    });

    function finish() {
      if (box) box.hidden = true;
      if (done) { done.hidden = false; done.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    }
  }

  // DISCORD WIDGET
  const discordCountEl = document.getElementById('discordCount');
  async function fetchDiscordStats() {
    if (!discordCountEl) return;
    try {
      const widgetUrl = `https://discord.com/api/guilds/${DISCORD_GUILD_ID}/widget.json`;
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(widgetUrl)}`;
      const response = await fetchWithTimeout(proxyUrl, 5000);
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      const onlineCount = data.presence_count || 0;
      discordCountEl.innerHTML = `<span style="color: #4ade80; font-weight: bold;">${onlineCount}</span>`;
      discordCountEl.title = `${onlineCount} человек онлайн`;
    } catch (e) {
      discordCountEl.textContent = 'N/A';
      discordCountEl.title = 'Не удалось получить статистику';
    }
  }

  if (discordCountEl) {
    fetchDiscordStats();
    setInterval(fetchDiscordStats, 2 * 60 * 1000);
  }
})();