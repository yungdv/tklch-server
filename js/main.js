(function () {
  'use strict';

  const SERVER_IP = 'tklch.xyz';
  const STATUS_HOST = 'tklch.xyz';
  const TWITCH_USER = 'tklch_';
  const WIPE_DATE = '2026-06-26';
  const NAMES_LIMIT = 24;

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

  function copyIP(e) {
    const btn = e ? e.currentTarget : null;
    const done = () => { showToast(); flashBtn(btn); };
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
    btn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Скопировано!';
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
    if (isNaN(to)) { el.textContent = '—'; return; }
    const from = parseInt(el.textContent, 10) || 0;
    if (from === to) { el.textContent = to; return; }
    const dur = 700, start = performance.now();
    (function tick(now) {
      const p = Math.min(1, (now - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * e);
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }

  const statusDot = document.querySelector('.stat__label .dot');
  const onlineEl = document.getElementById('playersOnline');
  const maxEl = document.getElementById('playersMax');
  const namesEl = document.getElementById('onlineNames');
  const iconEl = document.getElementById('serverIcon');
  const motdEl = document.getElementById('serverMotd');
  const setDot = (cls) => { if (statusDot) statusDot.className = 'dot ' + cls; };
  let hadSuccess = false;

  async function tryJson(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error('http ' + r.status);
    return r.json();
  }

  async function getStatus() {
    const target = 'https://api.mcstatus.io/v2/status/java/' + STATUS_HOST;
    try { const d = await tryJson(target); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://api.allorigins.win/raw?url=' + encodeURIComponent(target)); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://corsproxy.io/?' + encodeURIComponent(target)); if (d && d.online) return d; } catch (e) {}
    try { const d = await tryJson('https://api.mcsrvstat.us/3/' + STATUS_HOST); if (d && d.online) return d; } catch (e) {}
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
        namesEl.innerHTML = shown.map(n => '<span>' + esc(n) + '</span>').join('')
          + (extra > 0 ? '<span class="online-names__more">+' + extra + '</span>' : '');
      }
      if (iconEl && d.icon) { iconEl.src = d.icon; iconEl.hidden = false; }
      if (motdEl) {
        const ml = d.motd && (d.motd.clean || d.motd.html || []);
        motdEl.textContent = (ml && ml.length) ? ml.join('\n') : '';
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
    { who: 'Danka', what: 'построил маяк на спавне' },
    { who: 'karma777', what: 'нашёл алмазы на Y = -58' },
    { who: 'opiuuuuuuuuuuum', what: 'приручил волка' },
    { who: 'ZeroTwo_Ezik', what: 'открыл магазин у площади' },
    { who: 'lavina444', what: 'посадила вишнёвую рощу' },
    { who: 'BitterSweet', what: 'проложил дорогу к шахте' },
    { who: '5Kroc_', what: 'достроил неоновую базу' },
    { who: 'tareika200', what: 'поймал редкую рыбу' }
  ];
  const tickerTrack = document.getElementById('tickerTrack');
  if (tickerTrack) {
    const one = TICKER.map(t =>
      '<span class="ticker__item"><span class="tk">[Server]</span> <span class="tn">' + esc(t.who) + '</span> ' + esc(t.what) + '</span>'
    ).join('');
    tickerTrack.innerHTML = one + one;
  }

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

  const CONFETTI = ['#8b5cf6', '#a78bfa', '#38bdf8', '#34d399', '#ffffff'];
  function burst(x, y) {
    for (let i = 0; i < 26; i++) {
      const p = document.createElement('span');
      const size = 6 + Math.random() * 8;
      p.style.cssText = 'position:fixed;left:' + x + 'px;top:' + y + 'px;width:' + size + 'px;height:' + size +
        'px;background:' + CONFETTI[i % CONFETTI.length] + ';border-radius:2px;z-index:400;pointer-events:none;' +
        'box-shadow:0 0 8px ' + CONFETTI[i % CONFETTI.length] + ';';
      document.body.appendChild(p);
      const ang = Math.random() * Math.PI * 2;
      const dist = 70 + Math.random() * 130;
      const dx = Math.cos(ang) * dist;
      const dy = Math.sin(ang) * dist - 50;
      const anim = p.animate([
        { transform: 'translate(-50%,-50%) rotate(0deg)', opacity: 1 },
        { transform: 'translate(calc(-50% + ' + dx + 'px),calc(-50% + ' + dy + 'px)) rotate(' + (Math.random() * 720 - 360) + 'deg)', opacity: 0 }
      ], { duration: 700 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' });
      anim.onfinish = () => p.remove();
    }
  }
  document.querySelectorAll('.brand').forEach(b => {
    b.addEventListener('click', (e) => { burst(e.clientX, e.clientY); });
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
    const img = new Image();
    img.onload = function () { renderLive(twitchPreviewURL(1280, 720)); };
    img.onerror = function () { renderOffline(); };
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
})();
