<div align="center">

![TKLCH Vanilla — сервер проекта](assets/spawn1.png)

# ⛏️ TKLCH Vanilla

**Уютный ванильный PvE‑сервер Minecraft 1.21.11**

[![Minecraft](https://img.shields.io/badge/Minecraft-1.21.11-5b8c3a?style=for-the-badge&logo=minecraft&logoColor=white)](https://www.minecraft.net)
[![Loader](https://img.shields.io/badge/Loader-Fabric-d64545?style=for-the-badge)](https://fabricmc.net)
[![Mode](https://img.shields.io/badge/Mode-PvE%20%C2%B7%20Vanilla+-8b5cf6?style=for-the-badge)](#)
[![Status](https://img.shields.io/badge/Status-Online-22c55e?style=for-the-badge)](#)

🌐 **Сайт проекта:** [site.tklch.xyz](https://site.tklch.xyz)

</div>

---

## ️ О самом сайте

Это статический сайт‑лендинг проекта, собранный **на чистом HTML / CSS / JavaScript** — без фреймворков и сборщиков. Хостится бесплатно на **GitHub Pages** и открывается в РФ без VPN.

Что умеет:

- 🟢 **Живой статус сервера** — онлайн, слоты и ники игроков тянутся в реальном времени через публичный API [`mcstatus.io`](https://mcstatus.io) (с фолбэком через CORS‑прокси, чтобы работало отовсюду)
- 📺 **Twitch‑детект эфира без API‑ключа** — честно определяет, стримит ли `tklch_` прямо сейчас, по наличию preview‑картинки на CDN Twitch; по клику открывает официальный плеер в модалке
- 🖼️ **Галерея построек** с lightbox на весь экран и ленивой загрузкой
- 📋 **Отдельная страница правил** (`rules.html`) в едином стиле
- ✨ Парящий маскот‑«полароид», летящие частицы, scroll‑reveal, адаптив под мобилки
- 🔍 **SEO‑обвязка** — мета‑теги, Open Graph, schema.org (JSON‑LD), `sitemap.xml`, `robots.txt`

---

## 📁 Структура

```
.
├── index.html          главная страница
├── rules.html          страница правил
├── css/
│   └── style.css       весь дизайн: палитра, секции, анимации, адаптив
├── js/
│   └── main.js         статус сервера, копирование IP, Twitch, lightbox, reveal
└── assets/
    ├── logo.png        логотип / аватар бренда
    ├── dog.png         маскот в hero
    ├── background.png  фон hero
    └── spawn1.png …    скриншоты для галереи и OG‑превью
```

---

## 🚀 Запуск локально

1. Склонируй репозиторий:
   ```bash
   git clone https://github.com/yungdv/tklch-site.git
   cd tklch-site
   ```
2. Открой папку в **VS Code** и запусти через расширение **Live Server** (ПКМ по `index.html` → *Open with Live Server*), либо просто открой `index.html` в браузере.
   > Живой статус сервера и шрифты корректнее всего работают через локальный сервер (`http://`), а не через `file://`.

---

## 🙏 Credits

Сделано с ♥ — **yungdv** · [github.com/yungdv](https://github.com/yungdv)
