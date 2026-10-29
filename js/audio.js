(() => {
    "use strict";

    const BASE = "assets/sounds/";
    const UTAMA = "TULUS_Teh_Hijau.mp3";
    const satu = "Raim_Laode_IQRO.mp3";
    const dua = "Perunggu_33x.mp3";
    const tiga = "TULUS_Diri.mp3";
    const empat = "Perunggu_Ini_Abadi.mp3";
    const lima = "Nadin_Amizah_Bertaut.mp3";
    const enam = "Kunto_Aji_Rehat.mp3";
    const tujuh = "Idgitaf_Sedia_Aku_Sebelum_Hujan.mp3";
    const delapan = "TULUS_Jatuh_Suka.mp3";
    const sembilan = "Bersenja_Gurau_Raim_Laode.mp3";
    const sepuluh = "What_If_I_Call.mp3";
    const sebelas = "Merry_Christmas_i_miss_you.mp3";
    const perayaan = "Perunggu_Gemilang.mp3";

    const TRACKS = {
        main: UTAMA,
        "01": satu,
        "02": dua,
        "03": tiga,
        "04": empat,
        "05": lima,
        "06": enam,
        "07": tujuh,
        "08": delapan,
        "09": sembilan,
        "10": sepuluh,
        "11": sebelas,
        celeb: perayaan
    };

    const VOLUME = {
        main: 0.5,
        egg: 0.7,
        celeb: 0.85
    };

    const FADE = {
        first: 2.8, /* lagu utama pertama kali muncul */
        inEgg: 2.0, /* lagu egg masuk */
        outEgg: 1.6, /* lagu lama keluar */
        backMain: 2.4, /* lagu utama kembali setelah egg */
        inCeleb: 2.0, /* lagu perayaan masuk */
        outCeleb: 1.8, /* lagu perayaan / utama keluar */
        toggleOn: 1.4, /* tombol bulan: putar */
        toggleOff: 1.0 /* tombol bulan: hentikan */
    };

    const HINTS = {
        on: [
            "lagunya lagi manggung. pencet kalau mau dia pulang. awas ngambek.",
            "ssst… bulannya lagi nyanyi. jangan diganggu, dia baru berani.",
            "kalau lagunya terlalu mengena, tenang. aku nggak lihat kok.",
            "pencet buat bilang \u201ccukup\u201d ke lagunya. dia cuma pura-pura kuat."
        ],
        off: [
            "yah, lagunya ngambek. bujuk dong, pencet aku.",
            "sepi, ya? bulan juga butuh teman nyanyi.",
            "\u201clagu apa yang lagi kamu butuhkan?\u201d pencet, biar dia jawab.",
            "hening itu bagus, tapi lagunya sudah kangen.",
            "tombol ini pura-pura nggak penting. pencet saja."
        ]
    };

    const style = document.createElement("style");
    style.textContent = `
.music-dock{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));
  z-index:8500;pointer-events:none}
.music-dock>*{pointer-events:auto}
.music-toggle{position:relative;display:grid;place-items:center;width:48px;height:48px;margin:0;padding:0;border:0;
  border-radius:50%;background:transparent;color:#ffe2aa;cursor:pointer;opacity:.38;
  -webkit-tap-highlight-color:transparent;touch-action:manipulation;
  transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}
.music-toggle[data-state="on"]{opacity:.8}
.music-toggle:focus-visible{opacity:1;outline:1px solid var(--accent,#b7a58a);outline-offset:-2px}
@media (hover:hover){.music-toggle:hover{opacity:1;transform:scale(1.08)}}
.music-toggle svg{display:block;width:28px;height:28px;overflow:visible}

.mt-halo{fill:rgba(255,226,170,.16);opacity:0;transform-box:fill-box;transform-origin:center;transition:opacity .8s ease}
.mt-moon{fill:currentColor;transition:fill-opacity .8s ease,filter .8s ease}
.mt-star{fill:currentColor;transform-box:fill-box;transform-origin:center;transition:opacity .8s ease}
.mt-dot{fill:currentColor;opacity:0}

.music-toggle[data-state="off"] .mt-moon{fill-opacity:.55}
.music-toggle[data-state="off"] .mt-star{opacity:.45}
.music-toggle[data-state="on"] .mt-moon{filter:drop-shadow(0 0 5px rgba(255,226,170,.65))}
.music-toggle[data-state="on"] .mt-halo{opacity:1;animation:mtBreath 4.2s ease-in-out infinite}
.music-toggle[data-state="on"] .mt-star{animation:mtTwinkle 2.2s ease-in-out infinite}
.music-toggle[data-state="on"] .mt-dot{animation:mtDot 3s ease-in-out infinite}
.music-toggle[data-state="on"] .mt-dot-b{animation-delay:1.1s}
.music-toggle.is-waiting .mt-halo{opacity:1;animation:mtWait 3.6s ease-in-out infinite}

@keyframes mtBreath{0%,100%{transform:scale(.9);opacity:.55}50%{transform:scale(1.08);opacity:1}}
@keyframes mtTwinkle{0%,100%{transform:scale(.8) rotate(0deg);opacity:.7}50%{transform:scale(1.2) rotate(12deg);opacity:1}}
@keyframes mtDot{0%,100%{opacity:0}50%{opacity:.9}}
@keyframes mtWait{0%,100%{opacity:0;transform:scale(.8)}50%{opacity:.7;transform:scale(1.05)}}

.music-bubble{position:absolute;right:0;bottom:calc(100% + 8px);box-sizing:border-box;width:max-content;
  max-width:min(240px,calc(100vw - 24px));padding:8px 14px;border:1px solid var(--line-strong,rgba(242,240,235,.2));
  border-radius:14px;background:rgba(11,11,11,.94);color:var(--text-soft,#d7d3cc);
  font-family:var(--serif,"Cormorant Garamond",Georgia,serif);font-size:13px;font-style:italic;line-height:1.5;
  text-align:center;white-space:normal;overflow-wrap:anywhere;
  box-shadow:0 10px 30px rgba(0,0,0,.5),0 0 22px rgba(255,226,170,.08);
  opacity:0;transform:translateY(5px);pointer-events:none;
  transition:opacity .28s ease,transform .36s cubic-bezier(.2,.7,.2,1)}
.music-bubble.is-on{opacity:1;transform:translateY(0)}
.music-bubble::after{content:"";position:absolute;right:20px;bottom:-5px;width:8px;height:8px;
  border:1px solid var(--line-strong,rgba(242,240,235,.2));border-width:0 1px 1px 0;
  background:rgba(11,11,11,.94);transform:rotate(45deg)}

@media (prefers-reduced-motion:reduce){
  .music-toggle,.music-toggle *{animation:none !important;transition:none !important}
  .music-toggle[data-state="on"] .mt-halo,.music-toggle.is-waiting .mt-halo{opacity:.8}
  .music-toggle[data-state="on"] .mt-dot{opacity:.8}
  .music-bubble{transition:none}
}
`;
    document.head.appendChild(style);

    const probe = new Audio();
    probe.volume = 0.37;
    const VOLUME_OK = Math.abs(probe.volume - 0.37) < 0.01;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    let useWebAudio = Boolean(AudioCtx) && location.protocol !== "file:";
    let ctx = null;

    /* sudah ada interaksi pengunjung? (syarat membuat AudioContext) */
    let activated = Boolean(navigator.userActivation && navigator.userActivation.hasBeenActive);
    ["pointerup", "touchend", "mousedown", "keydown", "click"].forEach((type) => {
        window.addEventListener(type, () => { activated = true; }, { capture: true, passive: true });
    });

    const tracks = {};
    let raf = 0;
    let muted = false; /* true hanya jika pengunjung menekan tombol "hentikan" */
    let started = false; /* sudah ada lagu yang benar-benar berbunyi */
    let eggOpen = null; /* id egg yang sedang terbuka */
    let celebOpen = false; /* halaman perayaan sedang terbuka */
    let celebMuted = false; /* suara perayaan dimatikan lewat tombol di halamannya */
    let celebHold = false; /* perayaan sudah dibuka, tapi lagunya menunggu aba-aba (setelah keributan dan hitung mundur tirai) */

    const clamp01 = (n) => Math.max(0, Math.min(1, n));

    const btn = document.getElementById("musicToggle");
    const bubble = document.getElementById("musicBubble");
    let hovering = false;
    let bubbleTimer = 0;
    let lastHint = "";

    const isOn = () => !muted && started;

    function renderUI() {
        if (!btn) return;
        const on = isOn();
        btn.dataset.state = on ? "on" : "off";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.setAttribute("aria-label", on ? "Hentikan musik" : "Putar musik");
        btn.classList.toggle("is-waiting", !on && !muted);
    }

    function pickHint(on) {
        const pool = HINTS[on ? "on" : "off"];
        let text = pool[0];
        for (let i = 0; i < 6; i++) {
            text = pool[Math.floor(Math.random() * pool.length)];
            if (text !== lastHint || pool.length < 2) break;
        }
        lastHint = text;
        return text;
    }

    function hideBubble() {
        clearTimeout(bubbleTimer);
        if (bubble) bubble.classList.remove("is-on");
    }

    function showBubble(on, sticky) {
        if (!bubble) return;
        bubble.textContent = pickHint(on);
        bubble.classList.add("is-on");
        clearTimeout(bubbleTimer);
        if (!sticky) bubbleTimer = setTimeout(hideBubble, 3200);
    }

    function ensureCtx() {
        if (!useWebAudio) return null;
        if (!ctx) {
            try {
                ctx = new AudioCtx();
            } catch (e) {
                useWebAudio = false;
                ctx = null;
            }
        }
        return ctx;
    }

    function unlockCtx() {
        if (!ctx || ctx.state === "running") return;
        try {
            const p = ctx.resume();
            if (p && typeof p.catch === "function") p.catch(() => {});
        } catch (e) { /* abaikan */ }
    }

    function ensureGraph(t) {
        if (t.gain || t.noGraph || !useWebAudio || !activated || !t.el.paused) return;
        const c = ensureCtx();
        if (!c) return;
        try {
            const src = c.createMediaElementSource(t.el);
            const g = c.createGain();
            g.gain.value = clamp01(t.level * t.vol);
            src.connect(g);
            g.connect(c.destination);
            t.src = src;
            t.gain = g;
            t.el.volume = 1;
        } catch (e) {
            t.noGraph = true;
        }
        unlockCtx();
    }

    function setLevel(t, level) {
        t.level = clamp01(level);
        const amp = clamp01(t.level * t.vol);
        if (t.gain && ctx) {
            try {
                t.gain.gain.setTargetAtTime(amp, ctx.currentTime, 0.04);
            } catch (e) {
                t.gain.gain.value = amp;
            }
        } else if (VOLUME_OK) {
            /* batas bawah kecil: volume 0 murni kadang dianggap "muted" oleh aturan autoplay sehingga tidak tertolak dengan benar */
            t.el.volume = Math.max(amp, 0.0001);
        }
    }

    function markStarted(t) {
        if (started) return;
        if (t.gain && ctx && ctx.state !== "running") {
            /* konteks audio belum jalan: tunggu dulu agar tombol tidak bohong */
            try {
                const p = ctx.resume();
                if (p && typeof p.then === "function") {
                    p.then(() => { started = true; renderUI(); }).catch(() => {});
                }
            } catch (e) { /* abaikan */ }
            return;
        }
        started = true;
        renderUI();
    }

    function getTrack(key) {
        if (tracks[key]) return tracks[key];
        const file = TRACKS[key];
        if (!file) return null;

        const el = new Audio();
        el.preload = "none";
        el.loop = true;
        el.src = encodeURI(BASE + file);

        const t = {
            key,
            el,
            vol: key === "main" ? VOLUME.main : (key === "celeb" ? VOLUME.celeb : VOLUME.egg),
            level: 0,
            fade: null,
            wanted: false,
            warmed: false,
            selfPause: false,
            gain: null,
            src: null,
            noGraph: false
        };
        tracks[key] = t;
        setLevel(t, 0);

        el.addEventListener("playing", () => { if (t.priming) return; markStarted(t); });
        el.addEventListener("pause", () => {
            if (t.selfPause) { t.selfPause = false; return; }
            /* dihentikan sistem (mis. HP dikunci / app dipindah) */
            if (t.wanted) { started = false; renderUI(); }
        });
        el.addEventListener("error", () => {
            console.warn("[A Little Pause] Lagu tidak bisa dimuat: " + el.src);
        });
        return t;
    }

    function warm(key) {
        const t = getTrack(key);
        if (!t || t.warmed) return;
        t.warmed = true;
        t.el.preload = "auto";
        try { t.el.load(); } catch (e) { /* abaikan */ }
    }

    function fade(t, to, seconds, done) {
        t.fade = {
            from: t.level,
            to,
            t0: performance.now(),
            dur: Math.max(60, seconds * 1000),
            done: done || null
        };
        if (!raf) raf = requestAnimationFrame(tick);
    }

    function tick(now) {
        raf = 0;
        let busy = false;

        Object.keys(tracks).forEach((key) => {
            const t = tracks[key];
            const f = t.fade;
            if (!f) return;

            const p = clamp01((now - f.t0) / f.dur);
            const e = 0.5 - 0.5 * Math.cos(Math.PI * p);
            let level;
            if (f.to >= f.from) {
                level = f.from + (f.to - f.from) * Math.sin(e * Math.PI / 2);
            } else {
                level = f.to + (f.from - f.to) * Math.cos(e * Math.PI / 2);
            }

            setLevel(t, p >= 1 ? f.to : level);

            if (p >= 1) {
                t.fade = null;
                if (f.done) f.done();
            } else {
                busy = true;
            }
        });

        if (busy && !raf) raf = requestAnimationFrame(tick);
    }

    function failPlay(t, err) {
        if (err && err.name === "AbortError") return;
        t.wanted = false;
        t.fade = null;
        setLevel(t, 0);
        if (!err || err.name !== "NotAllowedError") {
            console.warn("[A Little Pause] Lagu gagal diputar (" + t.key + ")", err);
        }
        renderUI();
    }

    function playEl(t) {
        let p = null;
        try { p = t.el.play(); } catch (e) { p = null; }
        if (p && typeof p.catch === "function") p.catch((err) => failPlay(t, err));
    }

    /* dipanggil di dalam klik: lagu diputar senyap sebentar lalu dihentikan, supaya browser (terutama iOS) mengizinkannya bunyi nanti setelah hitung mundur */
    function primeTrack(t) {
        if (!t || t.primed) return;
        t.primed = true;
        t.priming = true;
        ensureGraph(t);
        unlockCtx();
        setLevel(t, 0);
        let p = null;
        try { p = t.el.play(); } catch (e) { p = null; }
        const finish = () => {
            t.priming = false;
            if (t.wanted) return;
            if (!t.el.paused) {
                t.selfPause = true;
                t.el.pause();
            }
            try { t.el.currentTime = 0; } catch (e) { /* abaikan */ }
        };
        if (p && typeof p.then === "function") p.then(finish, () => { t.priming = false; t.primed = false; });
        else finish();
    }

    function startTrack(t, seconds) {
        const playingNow = t.wanted && !t.el.paused;
        t.wanted = true;
        if (playingNow && ((t.fade && t.fade.to === 1) || (!t.fade && t.level >= 1))) return;

        ensureGraph(t);
        unlockCtx();
        playEl(t);
        fade(t, 1, seconds);
    }

    function stopTrack(t, seconds) {
        t.wanted = false;
        if (t.el.paused && !t.fade && t.level === 0) return;

        fade(t, 0, seconds, () => {
            if (t.wanted) return;
            if (!t.el.paused) {
                t.selfPause = true;
                t.el.pause();
            }
            /* lagu egg selalu mulai dari awal; lagu utama lanjut dari posisi terakhir.
               lagu perayaan: posisinya dijaga selama halamannya terbuka (tombol suara mati/nyala tidak mengulang dari awal) */
            if (t.key !== "main" && !(t.key === "celeb" && celebOpen)) {
                try { t.el.currentTime = 0; } catch (e) { /* abaikan */ }
            }
        });
    }

    function wantedKey() {
        /* halaman perayaan: lagunya sendiri, tidak ikut aturan tombol bulan */
        if (celebOpen) return (celebMuted || celebHold) ? null : "celeb";
        if (muted) return null;
        return eggOpen && TRACKS[eggOpen] ? eggOpen : "main";
    }

    function apply(inSeconds, outSeconds) {
        const want = wantedKey();
        if (want) getTrack(want);

        Object.keys(tracks).forEach((key) => {
            if (key === want) {
                startTrack(tracks[key], inSeconds);
            } else {
                stopTrack(tracks[key], outSeconds);
            }
        });
        renderUI();
    }

    document.addEventListener("alp:egg-open", (event) => {
        activated = true;
        eggOpen = (event.detail && event.detail.id) || null;
        apply(FADE.inEgg, FADE.outEgg);
    });

    document.addEventListener("alp:egg-close", () => {
        eggOpen = null;
        apply(FADE.backMain, FADE.outEgg);
    });

    /* halaman perayaan (js/celebration.js) */
    document.addEventListener("alp:celebration-open", () => {
        activated = true;
        ensureCtx();
        unlockCtx();
        celebOpen = true;
        celebMuted = false;
        celebHold = true; /* lagu perayaan baru menyala saat aba-aba "alp:celebration-start" */
        eggOpen = null;
        const ct = getTrack("celeb");
        if (ct) primeTrack(ct);
        apply(FADE.inCeleb, FADE.outCeleb);
    });

    /* tirai terbuka (setelah hitung mundur): lagu perayaan mulai dari awal */
    document.addEventListener("alp:celebration-start", () => {
        if (!celebOpen) return;
        celebHold = false;
        const ct = getTrack("celeb");
        if (ct) {
            ct.primed = true;
            if (!ct.wanted) { try { ct.el.currentTime = 0; } catch (e) { /* abaikan */ } }
        }
        apply(FADE.inCeleb, FADE.outCeleb);
    });

    document.addEventListener("alp:celebration-close", () => {
        celebOpen = false;
        celebMuted = false;
        celebHold = false;
        apply(FADE.backMain, FADE.outCeleb);
    });

    document.addEventListener("alp:celebration-sound", (event) => {
        celebMuted = Boolean(event.detail && event.detail.muted);
        apply(celebMuted ? FADE.toggleOn : FADE.inCeleb, FADE.toggleOff);
    });

    /* gerbang perayaan terbuka (11 egg ditemukan): siapkan lagunya */
    document.addEventListener("alp:celebration-ready", () => warm("celeb"));

    /* jam lagu perayaan, dibaca celebration.js agar lirik sinkron */
    window.ALPAudio = {
        /* pindah posisi lagu perayaan (dipakai saat suara dinyalakan lagi, supaya lagu dan pesan tetap sejalan) */
        seek(sec) {
            const t = tracks.celeb;
            if (!t || !isFinite(sec)) return;
            const d = t.el.duration;
            try {
                t.el.currentTime = (isFinite(d) && d > 0) ? ((sec % d) + d) % d : Math.max(0, sec);
            } catch (e) { /* abaikan */ }
        },
        clock() {
            const t = tracks.celeb;
            if (!t) return null;
            const el = t.el;
            return {
                time: el.currentTime || 0,
                duration: isFinite(el.duration) ? el.duration : 0,
                playing: t.wanted && !el.paused && el.currentTime > 0
            };
        }
    };

    /* siapkan lagu egg sebelum diklik (kursor lewat / sentuh / fokus) */
    const warmFromEvent = (event) => {
        const el = event.target && event.target.closest ? event.target : null;
        if (!el) return;
        if (el.closest("[data-celeb-open]")) { warm("celeb"); return; }
        const host = el.closest("[data-egg-id]");
        if (host && TRACKS[host.dataset.eggId]) warm(host.dataset.eggId);
    };
    document.addEventListener("pointerover", warmFromEvent, { passive: true });
    document.addEventListener("pointerdown", warmFromEvent, { passive: true });
    document.addEventListener("focusin", warmFromEvent);

    if (btn) {
        btn.addEventListener("click", () => {
            activated = true;
            ensureCtx();
            unlockCtx();

            /* sedang menyala -> hentikan; sedang mati -> putar */
            muted = isOn();
            apply(FADE.toggleOn, FADE.toggleOff);

            showBubble(!muted, hovering);
        });

        btn.addEventListener("pointerenter", (event) => {
            if (event.pointerType === "touch") return;
            hovering = true;
            showBubble(isOn(), true);
        });

        btn.addEventListener("pointerleave", () => {
            hovering = false;
            hideBubble();
        });

        btn.addEventListener("focus", () => {
            if (btn.matches(":focus-visible")) showBubble(isOn(), true);
        });

        btn.addEventListener("blur", hideBubble);
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) return;
        if (!muted) unlockCtx();
        Object.keys(tracks).forEach((key) => {
            const t = tracks[key];
            if (t.wanted && t.el.paused) playEl(t);
        });
    });

    renderUI();
    warm("main");
    apply(FADE.first, FADE.outEgg);
})();