(() => {
    "use strict";

    if (window.__alpMascot) return;

    const doc = document;
    const RM = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = () => RM.matches;

    /* 01. UTIL */
    const $ = (s, r = doc) => r.querySelector(s);
    const $$ = (s, r = doc) => Array.from(r.querySelectorAll(s));
    const rand = (a, b) => Math.random() * (b - a) + a;
    const chance = (p) => Math.random() < p;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const now = () => performance.now();

    /* kantong acak: semua isi keluar sekali dulu sebelum ada yang diulang */
    const bags = new Map();
    function bag(name, list) {
        if (!list || !list.length) return "";
        let b = bags.get(name);
        if (!b) { b = { queue: [], last: null }; bags.set(name, b); }
        if (!b.queue.length) {
            b.queue = list.slice().sort(() => Math.random() - 0.5);
            if (b.queue.length > 1 && b.queue[b.queue.length - 1] === b.last) {
                const t = b.queue.pop();
                b.queue.unshift(t);
            }
        }
        b.last = b.queue.pop();
        return b.last;
    }

    function play(el, frames, opts) {
        if (!el || reduced() || !el.animate) return Promise.resolve();
        try {
            return el.animate(frames, Object.assign({ fill: "none" }, opts)).finished.catch(() => {});
        } catch (e) {
            return Promise.resolve();
        }
    }

    /* kotak semua teks yang sedang terlihat di dalam root (dipakai balon ucapan supaya memilih sisi yang tidak menutupi tulisan) */
    function textRects(root) {
        const out = [];
        if (!root) return out;
        const vh = innerHeight;
        const memo = new Map();
        const shown = (el) => {
            if (!el || el === root.parentElement) return true;
            if (memo.has(el)) return memo.get(el);
            const cs = getComputedStyle(el);
            const ok = cs.display !== "none" && cs.visibility !== "hidden" && parseFloat(cs.opacity) > 0.05 && shown(el.parentElement);
            memo.set(el, ok);
            return ok;
        };
        const tw = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        const rg = doc.createRange();
        let n;
        while ((n = tw.nextNode())) {
            if (!n.nodeValue.trim()) continue;
            const p = n.parentElement;
            if (!p || p.closest(".mk, .page-stars, .mk-sky, script, style, svg, canvas") || !shown(p)) continue;
            rg.selectNodeContents(n);
            const rs = rg.getClientRects();
            for (let i = 0; i < rs.length; i++) {
                const q = rs[i];
                if (q.width > 2 && q.height > 2 && q.bottom > -40 && q.top < vh + 40) out.push({ l: q.left, t: q.top, r: q.right, b: q.bottom });
            }
        }
        return out;
    }

    let eggOv = null;
    const overlayOpen = () => {
        if (!eggOv) eggOv = doc.getElementById("eggOverlay");
        return !!(eggOv && eggOv.classList.contains("is-open")) || doc.body.classList.contains("celebration-open") || doc.body.classList.contains("egg-open");
    };

    /* 02. SENI SVG */
    const DEFS = '<svg id="mkDefs" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="mkBody" cx="36%" cy="28%" r="82%"><stop offset="0" stop-color="#fffef4"/><stop offset=".46" stop-color="#ffefb9"/><stop offset="1" stop-color="#f5cd78"/></radialGradient>' +
        '<radialGradient id="mkShade" cx="72%" cy="82%" r="62%"><stop offset="0" stop-color="#e7a24e" stop-opacity=".42"/><stop offset="1" stop-color="#e7a24e" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="mkGloss" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="mkCheek" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff7fa3" stop-opacity=".95"/><stop offset=".6" stop-color="#ff93b0" stop-opacity=".62"/><stop offset="1" stop-color="#ffa6bd" stop-opacity="0"/></radialGradient>' +
        '<radialGradient id="mkEye" cx="42%" cy="34%" r="75%"><stop offset="0" stop-color="#5b3646"/><stop offset=".6" stop-color="#2d1b29"/><stop offset="1" stop-color="#1e1219"/></radialGradient>' +
        '<radialGradient id="mkGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".5"/><stop offset=".55" stop-color="#ffd978" stop-opacity=".14"/><stop offset="1" stop-color="#ffd978" stop-opacity="0"/></radialGradient>' +
        '<linearGradient id="mkStarG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe2"/><stop offset=".55" stop-color="#ffe58f"/><stop offset="1" stop-color="#ffcf62"/></linearGradient>' +
        '<linearGradient id="mkStarEdge" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffeeb0"/><stop offset="1" stop-color="#f8cd68"/></linearGradient>' +
        '<linearGradient id="mkCres" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff4cf"/><stop offset=".6" stop-color="#f7d88a"/><stop offset="1" stop-color="#e9b762"/></linearGradient>' +
        '<linearGradient id="mkCloudA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9c6f0"/><stop offset="1" stop-color="#a98fd0"/></linearGradient>' +
        '<linearGradient id="mkCloudB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf1ff"/><stop offset=".7" stop-color="#e6d6f7"/><stop offset="1" stop-color="#c3aae4"/></linearGradient>' +
        '<mask id="mkCresMask" maskUnits="userSpaceOnUse" x="-40" y="-40" width="240" height="240"><rect x="-40" y="-40" width="240" height="240" fill="#fff"/><circle cx="70" cy="50" r="66" fill="#000"/></mask>' +
        '<clipPath id="mkMouthClipM"><path d="M-7.5 3.4 Q0 6 7.5 3.4 Q7 14.6 0 14.6 Q-7 14.6 -7.5 3.4Z"/></clipPath>' +
        '<clipPath id="mkMouthClipL"><path d="M-10 2 Q0 5.6 10 2 Q9.2 17 0 17 Q-9.2 17 -10 2Z"/></clipPath>' +
        '<clipPath id="mkMouthClipO"><ellipse cx="0" cy="9.4" rx="3.5" ry="4.6"/></clipPath>' +
        '</defs></svg>';

    const INK = "#2a1925", MOUTH = "#8c2540", TONGUE = "#ff8fa8", BLUSH = "#ff6f98";

    /* wajah berpusat di (0,0): dipakai Bulan (skala ~1.1) dan Bintang (skala ~.7) */
    function face() {
        const eyeOpen = (x) => '<ellipse cx="' + x + '" cy="-3" rx="5.1" ry="6.5" fill="url(#mkEye)"/><circle cx="' + (x - 1.7) + '" cy="-5.3" r="2.15" fill="#fff"/><circle cx="' + (x + 1.6) + '" cy="-0.4" r="1" fill="#fff" opacity=".9"/>';
        const eyeWow = (x) => '<ellipse cx="' + x + '" cy="-3" rx="6" ry="7.6" fill="url(#mkEye)"/><circle cx="' + (x - 2) + '" cy="-6" r="2.6" fill="#fff"/><circle cx="' + (x + 1.9) + '" cy="0" r="1.25" fill="#fff" opacity=".9"/>';
        const heart = (x) => '<path d="M' + x + ' 3 C' + (x - 9) + ' -3 ' + (x - 6) + ' -10 ' + x + ' -6.2 C' + (x + 6) + ' -10 ' + (x + 9) + ' -3 ' + x + ' 3Z" fill="' + BLUSH + '"/><circle cx="' + (x - 2.4) + '" cy="-5.2" r="1.1" fill="#fff" opacity=".85"/>';
        const stroke = (d, w) => '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>';
        const dizzy = (x) => '<g fill="none" stroke="' + INK + '" stroke-width="2.1" stroke-linecap="round"><circle cx="' + x + '" cy="-3" r="6"/><path d="M' + (x - 3.4) + ' -3 a3.4 3.4 0 1 1 3.4 3.4"/></g>';
        return '<g class="mk-cheeks"><ellipse class="mk-cheek" cx="-27" cy="9" rx="8.6" ry="5.4" fill="url(#mkCheek)"/><ellipse class="mk-cheek" cx="27" cy="9" rx="8.6" ry="5.4" fill="url(#mkCheek)"/></g>' +
            '<g class="mk-look">' +
            '<g class="mk-e mk-e-open"><g class="mk-blink">' + eyeOpen(-15) + eyeOpen(15) + '</g></g>' +
            '<g class="mk-e mk-e-wow">' + eyeWow(-15) + eyeWow(15) + '</g>' +
            '<g class="mk-e mk-e-happy">' + stroke("M-21 -1.5 Q-15 -10.5 -9 -1.5", 3.2) + stroke("M9 -1.5 Q15 -10.5 21 -1.5", 3.2) + '</g>' +
            '<g class="mk-e mk-e-closed">' + stroke("M-21 -4.5 Q-15 1.5 -9 -4.5") + stroke("M9 -4.5 Q15 1.5 21 -4.5") + '</g>' +
            '<g class="mk-e mk-e-wink">' + eyeOpen(-15) + stroke("M9 -1.5 Q15 -10.5 21 -1.5", 3.2) + '</g>' +
            '<g class="mk-e mk-e-squint">' + stroke("M-21.5 -8.5 L-10.5 -3.6 L-21.5 1.2") + stroke("M21.5 -8.5 L10.5 -3.6 L21.5 1.2") + '</g>' +
            '<g class="mk-e mk-e-angry"><g transform="translate(0 1.5) scale(1 .72)">' + eyeOpen(-15) + eyeOpen(15) + '</g>' + stroke("M-22 -12.5 L-8.5 -7.6", 3.4) + stroke("M22 -12.5 L8.5 -7.6", 3.4) + '</g>' +
            '<g class="mk-e mk-e-sad">' + eyeOpen(-15) + eyeOpen(15) + stroke("M-22 -8.4 L-9 -13.2", 2.8) + stroke("M22 -8.4 L9 -13.2", 2.8) + '</g>' +
            '<g class="mk-e mk-e-love">' + heart(-15) + heart(15) + '</g>' +
            '<g class="mk-e mk-e-dizzy">' + dizzy(-15) + dizzy(15) + '</g>' +
            '</g>' +
            '<g class="mk-m mk-m-smile"><path d="M-7.5 3.4 Q0 6 7.5 3.4 Q7 14.6 0 14.6 Q-7 14.6 -7.5 3.4Z" fill="' + MOUTH + '"/><ellipse cx="0" cy="13.4" rx="4.4" ry="3" fill="' + TONGUE + '" clip-path="url(#mkMouthClipM)"/></g>' +
            '<g class="mk-m mk-m-laugh"><path d="M-10 2 Q0 5.6 10 2 Q9.2 17 0 17 Q-9.2 17 -10 2Z" fill="' + MOUTH + '"/><ellipse cx="0" cy="16" rx="5.4" ry="3.8" fill="' + TONGUE + '" clip-path="url(#mkMouthClipL)"/></g>' +
            '<g class="mk-m mk-m-small">' + stroke("M-5.2 6 Q0 11.2 5.2 6", 2.3) + '</g>' +
            '<g class="mk-m mk-m-cat">' + stroke("M-8.4 5.2 Q-4.2 11.2 0 5.4 Q4.2 11.2 8.4 5.2", 2.2) + '</g>' +
            '<g class="mk-m mk-m-o"><ellipse cx="0" cy="9.4" rx="3.5" ry="4.6" fill="' + MOUTH + '"/><ellipse cx="0" cy="12" rx="2.4" ry="1.8" fill="' + TONGUE + '" clip-path="url(#mkMouthClipO)"/></g>' +
            '<g class="mk-m mk-m-yawn"><ellipse cx="0" cy="10" rx="4.8" ry="6.6" fill="' + MOUTH + '"/><ellipse cx="0" cy="14" rx="3.2" ry="2.6" fill="' + TONGUE + '"/></g>' +
            '<g class="mk-m mk-m-pout">' + stroke("M-6.2 11.4 Q0 4.6 6.2 11.4", 2.4) + '</g>' +
            '<g class="mk-m mk-m-flat">' + stroke("M-5 8.4 L5 8.4", 2.3) + '</g>' +
            '<g class="mk-m mk-m-blep">' + stroke("M-5.2 6 Q0 10.6 5.2 6", 2.2) + '<path d="M-0.6 8.6 L5 8.2 Q5.6 14.6 2.4 15 Q-0.4 14.8 -0.6 8.6Z" fill="' + TONGUE + '" stroke="#e66b8d" stroke-width=".8"/></g>';
    }

    const BRUSH = '<g transform="translate(115 88) rotate(-24)"><g class="mk-prop mk-prop-brush"><rect x="-2" y="-2.1" width="26" height="4.2" rx="2.1" fill="#c98a54"/><rect x="-2" y="-2.1" width="26" height="1.6" rx=".8" fill="#e2a96f" opacity=".7"/><rect x="21" y="-3.1" width="7" height="6.2" rx="1.2" fill="#d9dde6" stroke="#aeb4c2" stroke-width=".7"/><path d="M28 -3.1 Q41 -1 40 0.4 Q41 1.8 28 3.1Z" fill="#ff7fa3"/><circle cx="41" cy="0.4" r="2" fill="#ffb3c8"/></g></g>';
    const CUP = '<g transform="translate(5 60)"><g class="mk-prop mk-prop-cup mk-upright"><path d="M-8 -13 H8 V-5 A8 8 0 0 1 0 3 A8 8 0 0 1 -8 -5Z" fill="#f8f2e6" stroke="#cdbba0" stroke-width="1.2"/><path d="M8 -10 q7 0 7 5.4 t-7 5.4" fill="none" stroke="#cdbba0" stroke-width="2"/><path d="M-4 -17 q-3 -4.4 0 -8.6 M2 -17 q-3 -4.4 0 -8.6" stroke="#fff" stroke-opacity=".75" fill="none" stroke-linecap="round" stroke-width="1.6"/><path d="M-8 -13 H8 V-11 H-8Z" fill="#8a5a3a" opacity=".55"/></g></g>';

    const AHOGE = '<g class="mk-ahoge"><path d="M60 0 C61.6 14 66 20.6 81 23 C66 25.4 61.6 32 60 46 C58.4 32 54 25.4 39 23 C54 20.6 58.4 14 60 0Z" fill="url(#mkStarG)" stroke="#ffd46a" stroke-width="1.2" stroke-linejoin="round"/><circle cx="60" cy="23" r="3.4" fill="#fff" opacity=".85"/></g>';

    const FX_MARKS = (cx, cy, sx, sy, w) => '<g class="mk-fxs"><g class="mk-fx-anger" transform="translate(' + cx + ' ' + cy + ')" fill="none" stroke="#ff5d7a" stroke-width="' + w + '" stroke-linecap="round"><path d="M-6 -2 Q-2 -2 -2 -6"/><path d="M6 -2 Q2 -2 2 -6"/><path d="M-6 2 Q-2 2 -2 6"/><path d="M6 2 Q2 2 2 6"/></g>' +
        '<path class="mk-fx-sweat" d="M' + sx + ' ' + sy + ' q-6 8 0 13 q6 -5 0 -13z" fill="#9fdcff" stroke="#6cbcf0" stroke-width="1"/></g>';

    function moonSVG(o) {
        o = o || {};
        const vb = o.cloud ? "-6 -2 132 146" : "-6 -2 132 128";
        return '<svg class="mk-svg" viewBox="' + vb + '" focusable="false" aria-hidden="true">' +
            '<circle class="mk-halo" cx="60" cy="72" r="64" fill="url(#mkGlow)"/>' +
            (o.crescent ? '<g class="mk-cres"><circle cx="60" cy="74" r="76" fill="url(#mkCres)" mask="url(#mkCresMask)"/><circle cx="22" cy="18" r="2.2" fill="#fff" opacity=".7"/></g>' : "") +
            AHOGE +
            '<g class="mk-arm mk-armL"><path d="M32 88 L5 88" fill="none" stroke="#e9ac4a" stroke-width="14.4" stroke-linecap="round"/><path d="M32 88 L5 88" fill="none" stroke="#f7cd72" stroke-width="11.6" stroke-linecap="round"/><path d="M28 85.4 L9 85.4" fill="none" stroke="#fff3c9" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>' +
            '<g class="mk-arm mk-armR"><path d="M88 88 L115 88" fill="none" stroke="#e9ac4a" stroke-width="14.4" stroke-linecap="round"/><path d="M88 88 L115 88" fill="none" stroke="#f7cd72" stroke-width="11.6" stroke-linecap="round"/><path d="M92 85.4 L111 85.4" fill="none" stroke="#fff3c9" stroke-width="3" stroke-linecap="round" opacity=".7"/>' + BRUSH + '</g>' +
            (o.cloud ? '<g class="mk-cloud"><g fill="url(#mkCloudA)"><circle cx="2" cy="128" r="12"/><circle cx="20" cy="118" r="15"/><circle cx="104" cy="120" r="13"/><circle cx="122" cy="129" r="11"/><rect x="-6" y="124" width="136" height="16" rx="8"/></g><g fill="url(#mkCloudB)"><circle cx="28" cy="126" r="16"/><circle cx="52" cy="114" r="21"/><circle cx="80" cy="117" r="19"/><circle cx="100" cy="128" r="14"/><rect x="22" y="124" width="86" height="18" rx="9"/></g></g>' : "") +
            '<g class="mk-bodyg"><circle cx="60" cy="78" r="40" fill="url(#mkBody)"/><circle cx="60" cy="78" r="40" fill="url(#mkShade)"/>' +
            '<g opacity=".22" fill="#d99a45"><circle cx="86" cy="62" r="4.2"/><circle cx="91" cy="73" r="2.2"/><circle cx="34" cy="104" r="3.2"/></g>' +
            '<ellipse cx="42" cy="55" rx="12" ry="7" fill="url(#mkGloss)" transform="rotate(-32 42 55)"/>' +
            '<g transform="translate(60 81) scale(1.12)"><g class="mk-face">' + face() + '</g></g>' +
            FX_MARKS(90, 50, 30, 50, 2.6) + '</g></svg>';
    }

    function starPoints(cx, cy, R, r) {
        const p = [];
        for (let i = 0; i < 10; i++) {
            const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
            p.push((cx + Math.cos(a) * rad).toFixed(2) + "," + (cy + Math.sin(a) * rad).toFixed(2));
        }
        return p.join(" ");
    }

    function starSVG() {
        const pts = starPoints(50, 54, 44, 25);
        return '<svg class="mk-svg" viewBox="-6 -6 112 112" focusable="false" aria-hidden="true">' +
            '<circle class="mk-halo" cx="50" cy="52" r="52" fill="url(#mkGlow)"/>' +
            '<g class="mk-bodyg">' +
            '<g class="mk-arm mk-armL"><path d="M26 60 L6 60" fill="none" stroke="#e5a645" stroke-width="10.4" stroke-linecap="round"/><path d="M26 60 L6 60" fill="none" stroke="#f7cd72" stroke-width="8" stroke-linecap="round"/></g>' +
            '<g class="mk-arm mk-armR"><path d="M74 60 L94 60" fill="none" stroke="#e5a645" stroke-width="10.4" stroke-linecap="round"/><path d="M74 60 L94 60" fill="none" stroke="#f7cd72" stroke-width="8" stroke-linecap="round"/></g>' +
            '<polygon points="' + pts + '" fill="url(#mkStarG)" stroke="url(#mkStarEdge)" stroke-width="9" stroke-linejoin="round"/>' +
            '<polygon points="' + pts + '" fill="url(#mkShade)" opacity=".55" stroke="none"/>' +
            '<ellipse cx="36" cy="36" rx="9" ry="5" fill="url(#mkGloss)" transform="rotate(-38 36 36)"/>' +
            '<g transform="translate(50 57) scale(.72)"><g class="mk-face">' + face() + '</g></g>' +
            '<g class="mk-arm mk-armL">' + CUP + '</g>' +
            FX_MARKS(82, 24, 20, 30, 2.4) + '</g></svg>';
    }

    /* 03. EKSPRESI */
    const MOODS = {
        happy: { eyes: "happy", mouth: "laugh", arms: "up" },
        giggle: { eyes: "squint", mouth: "laugh", arms: "mid", cheek: "blush" },
        shy: { eyes: "closed", mouth: "small", arms: "in", cheek: "blush" },
        wow: { eyes: "wow", mouth: "o", arms: "up" },
        wink: { eyes: "wink", mouth: "blep", arms: "lean" },
        love: { eyes: "love", mouth: "cat", arms: "up", cheek: "blush" },
        angry: { eyes: "angry", mouth: "pout", arms: "down", fx: "anger", cheek: "puff" },
        sad: { eyes: "sad", mouth: "flat", arms: "down", fx: "sweat" },
        dizzy: { eyes: "dizzy", mouth: "o", arms: "mid" },
        sleep: { eyes: "closed", mouth: "small", arms: "down" },
        yawn: { eyes: "squint", mouth: "yawn", arms: "up" },
        ouch: { eyes: "squint", mouth: "o", arms: "up", fx: "sweat" },
        blep: { eyes: "open", mouth: "blep", arms: "mid" },
        proud: { eyes: "happy", mouth: "cat", arms: "up", cheek: "blush" },
        hold: { eyes: "angry", mouth: "pout", arms: "in", fx: "anger", cheek: "puff" },
        hum: { eyes: "closed", mouth: "cat", arms: "mid" },
        puff: { eyes: "squint", mouth: "flat", arms: "in", cheek: "puff" },
        cheer: { eyes: "happy", mouth: "laugh", arms: "high" },
        talk: { eyes: "open", mouth: "smile", arms: "mid" },
        sulky: { eyes: "sad", mouth: "pout", arms: "in", cheek: "puff" }
    };
    const FX_GLYPH = { heart: "\u2665", spark: "\u2726", star: "\u2727", note: "\u266a", note2: "\u266b", zzz: "Z", bang: "!", ask: "?", dots: "\u2026", puff: "", ring: "" };

    /* 05. REAKSI & AKSI UMUM */
    const REACT = {
        jump(m) { m.mood("happy", 1500); m.hop(26); m.fx("spark", 2); },
        spin(m) { m.mood("wow", 900); m.spin(1); m.fx("ring", 1, { py: 50 }); },
        giggle(m) { m.mood("giggle", 1500); m.wiggle(9, 3); m.fx("heart", 2); },
        blep(m) { m.mood("blep", 1500); m.nod(); m.fx("star", 1); },
        ouch(m) { m.mood("ouch", 1200); m.squish(); m.fx("bang", 1); },
        dance(m) { m.mood("hum", 2000); m.sway(2); m.fx("note", 3); },
        love(m) { m.mood("love", 1700); m.hop(14); m.fx("heart", 3); },
        shy(m) { m.mood("shy", 1600); m.wiggle(5, 2); m.fx("star", 1); },
        wink(m) { m.mood("wink", 1400); m.nod(); m.fx("spark", 2); },
        cheer(m) { m.mood("cheer", 1500); m.hop(30, 640); m.fx("spark", 3); },
        twirl(m) { m.mood("wow", 1000); m.spin(2, 1000); m.fx("star", 3); }
    };
    const REACT_MOON = ["jump", "giggle", "spin", "blep", "ouch", "dance", "love", "shy", "wink", "cheer"];
    const REACT_STAR = ["twirl", "giggle", "jump", "wink", "ouch", "blep", "love", "cheer", "shy", "spin"];

    const ACT = {
        async blink2(m) { m.set({ eyes: "closed" }); await sleep(110); m.rest(); await sleep(150); m.set({ eyes: "closed" }); await sleep(110); m.rest(); },
        async look(m) { const d = chance(0.5) ? -1 : 1; m.lookTo(d, rand(-0.3, 0.4), 900); await sleep(1000); m.lookTo(-d, 0, 900); await sleep(1000); m.lookTo(0, 0, 500); },
        async wave(m) { m.set({ arms: "wave", mouth: "smile" }); m.el.classList.add("is-wave"); await sleep(1900); m.el.classList.remove("is-wave"); m.rest(); },
        async hop(m) { m.mood("happy", 900); await m.hop(18); },
        async giggle(m) { m.mood("giggle", 1300); m.wiggle(6, 3); m.fx("heart", 1); await sleep(1200); },
        async yawn(m) { m.mood("yawn", 1900); m.fx("zzz", 1); await sleep(1900); },
        async twirl(m) { m.mood("wow", 900); await m.spin(1, 820); },
        async sparkle(m) { m.mood("proud", 1400); m.fx("spark", 3); m.fx("star", 2); await sleep(1400); },
        async dance(m) { m.mood("hum", 2000); m.fx("note", 2); await m.sway(2); },
        async nod(m) { m.mood("hum", 800); await m.nod(); },
        async cheek(m) { m.mood("shy", 1300); m.fx("star", 1, { py: 78 }); await sleep(1300); },
        async blep(m) { m.mood("blep", 1300); await sleep(1300); }
    };
    ACT.love = async (m) => { m.mood("love", 1700); m.fx("heart", 2); await sleep(1700); };
    const IDLE_MOON = ["blink2", "look", "wave", "hop", "giggle", "yawn", "sparkle", "dance", "nod", "cheek", "look"];
    const IDLE_STAR = ["blink2", "look", "twirl", "hop", "sparkle", "giggle", "wave", "blep", "cheek", "nod"];

    /* 04. KELAS MASKOT */
    const registry = [];
    const byId = {};

    class Mascot {
        constructor(cfg) {
            this.cfg = cfg;
            this.id = cfg.id;
            this.kind = cfg.kind || "moon";
            this.lines = cfg.lines || {};
            this.base = Object.assign({ eyes: "open", mouth: "smile", arms: "mid", cheek: "", fx: "" }, cfg.base || {});
            this.override = null;
            this.x = 0; this.y = 0; this.s = 1;
            this.visible = false;
            this.locked = false;
            this.alive = true;
            this.greeted = false;
            this.pokeTimes = [];
            this.lastHover = 0;
            this.lastSay = 0;
            this.manual = null;
            this.lookV = [0, 0];
            this.moodToken = 0;
            this.section = null;
            this.build();
            registry.push(this);
            byId[this.id] = this;
        }

        build() {
            const c = this.cfg;
            const el = this.el = doc.createElement("div");
            el.className = "mk mk-" + this.kind + (c.float ? " is-float" : "");
            el.dataset.id = this.id;
            el.style.setProperty("--bd", rand(4.2, 7).toFixed(1) + "s");
            el.style.setProperty("--bdel", (-rand(0, 5)).toFixed(1) + "s");
            el.style.setProperty("--fd", rand(4.6, 6.4).toFixed(1) + "s");
            el.style.setProperty("--fdel", (-rand(0, 5)).toFixed(1) + "s");
            const svg = this.kind === "star" ? starSVG() : moonSVG({ crescent: c.crescent, cloud: c.cloud });
            el.innerHTML = [
                '<div class="mk-x"><div class="mk-y"><div class="mk-box">',
                '<div class="mk-bubble" aria-hidden="true"><span></span></div>',
                '<div class="mk-fl"><div class="mk-sq"><div class="mk-br"><div class="mk-tilt">',
                '<div class="mk-hit">', svg, '</div><div class="mk-held"></div>',
                '</div></div></div></div>',
                '</div></div></div>'
            ].join("");
            this.xel = el.querySelector(".mk-x");
            this.yel = el.querySelector(".mk-y");
            this.box = el.querySelector(".mk-box");
            this.sq = el.querySelector(".mk-sq");
            this.br = el.querySelector(".mk-br");
            this.tilt = el.querySelector(".mk-tilt");
            this.hit = el.querySelector(".mk-hit");
            this.held = el.querySelector(".mk-held");
            this.bubble = el.querySelector(".mk-bubble");
            this.bt = this.bubble.firstChild;
            this.rest();

            const hit = this.hit;
            hit.addEventListener("pointerenter", (e) => { if (e.pointerType === "mouse") this.onHover(); });
            hit.addEventListener("pointerdown", (e) => {
                el.classList.add("is-press");
                if (e.pointerType !== "mouse") this.lookAtPoint(e.clientX, e.clientY, 2200);
            });
            const up = () => el.classList.remove("is-press");
            hit.addEventListener("pointerup", up);
            hit.addEventListener("pointercancel", up);
            hit.addEventListener("pointerleave", up);
            hit.addEventListener("click", (e) => { e.stopPropagation(); this.onClick(e); });
            hit.setAttribute("tabindex", "-1");
        }

        /* posisi & ukuran */
        mount(host) { host.appendChild(this.el); this.section = host.closest(".section"); return this; }
        setPos(x, y) { this.x = x; this.y = y; this.el.style.left = x.toFixed(1) + "px"; this.el.style.top = y.toFixed(1) + "px"; }
        setScale(s) { this.s = s; this.el.style.setProperty("--s", s.toFixed(3)); }
        get unit() { return this.kind === "star" ? 0.72 * this.s : this.s; }

        /* ekspresi */
        set(p) {
            const d = this.el.dataset;
            for (const k in p) { if (p[k] === "" || p[k] == null) delete d[k]; else d[k] = p[k]; }
        }
        restState() { return Object.assign({ cheek: "", fx: "" }, this.override || this.base); }
        rest() { this.set(this.restState()); }
        mood(name, ms) {
            const m = MOODS[name];
            if (!m) return;
            this.set(Object.assign({ eyes: "", mouth: "", arms: "", cheek: "", fx: "" }, m));
            const tok = ++this.moodToken;
            if (ms) setTimeout(() => { if (tok === this.moodToken && this.alive) this.rest(); }, ms);
        }
        prop(name) { if (name) this.el.dataset.prop = name; else delete this.el.dataset.prop; }

        /* tatapan */
        lookTo(x, y, ms) { this.manual = { x, y, until: now() + (ms || 1200) }; this.applyLook(x, y); }
        lookAtPoint(cx, cy, ms) {
            const r = this.hit.getBoundingClientRect();
            const dx = cx - (r.left + r.width / 2), dy = cy - (r.top + r.height * 0.55);
            const d = Math.hypot(dx, dy) || 1, k = clamp(d / 160, 0, 1);
            this.lookTo(dx / d * k, dy / d * k, ms);
        }
        applyLook(x, y) {
            const a = this.lookV;
            if (Math.abs(a[0] - x) < 0.04 && Math.abs(a[1] - y) < 0.04) return;
            a[0] = x; a[1] = y;
            this.el.style.setProperty("--lx", x.toFixed(2));
            this.el.style.setProperty("--ly", y.toFixed(2));
        }

        /* ucapan */
        say(text, ms) {
            if (!text || (overlayOpen() && !this.cfg.cel)) return;
            const b = this.bubble;
            this.bt.textContent = text;
            b.classList.remove("is-on", "is-below", "is-left", "is-right");
            b.style.setProperty("--bx", "0px");
            const vw = doc.documentElement.clientWidth, vh = innerHeight;
            const bw = b.offsetWidth, bh = b.offsetHeight;
            const r = this.box.getBoundingClientRect();
            const cx = r.left + r.width / 2;
            const edge = 8;
            const sr = this.section ? this.section.getBoundingClientRect() : { top: 0 };
            const topLimit = Math.max(sr.top, 6);
            /* kiri balon (untuk atas/bawah) setelah digeser supaya tetap di dalam layar */
            const hx = clamp(cx - bw / 2, edge, Math.max(edge, vw - edge - bw));
            const shift = hx - (cx - bw / 2);
            const sideTop = r.bottom - r.height * 0.26 - bh;
            const spots = {
                above: { l: hx, t: r.top + 6 - bh, ok: r.top + 6 - bh >= topLimit + 2, shift },
                below: { l: hx, t: r.bottom - 4, ok: true, shift },
                right: { l: r.right + 2, t: sideTop, ok: r.right + 2 + bw <= vw - edge, shift: 0 },
                left: { l: r.left - 2 - bw, t: sideTop, ok: r.left - 2 - bw >= edge, shift: 0 }
            };
            const order = (this.cfg.bubble || []).concat(["above", "below", "right", "left"]).filter((v, i, arr) => arr.indexOf(v) === i);
            /* pilih sisi yang paling sedikit menutupi tulisan; urutan preferensi hanya jadi penentu kalau sama-sama aman */
            const rects = this.cfg.cel ? [] : textRects(this.section);
            let best = null;
            order.forEach((side, idx) => {
                const c = spots[side];
                if (!c) return;
                let pen = idx * 30;
                if (!c.ok) pen += 1e7;
                if (c.t < 4 || c.t + bh > vh - 4) pen += 4000;
                const x2 = c.l + bw, y2 = c.t + bh;
                for (let i = 0; i < rects.length; i++) {
                    const q = rects[i];
                    const ox = Math.min(x2, q.r) - Math.max(c.l, q.l), oy = Math.min(y2, q.b) - Math.max(c.t, q.t);
                    if (ox > 1 && oy > 1) pen += ox * oy;
                }
                if (!best || pen < best.pen) best = { side, pen, shift: c.shift };
            });
            const side = best ? best.side : "above";
            b.style.setProperty("--bx", ((side === "above" || side === "below") && best ? best.shift : 0).toFixed(0) + "px");
            b.classList.toggle("is-below", side === "below");
            b.classList.toggle("is-left", side === "left");
            b.classList.toggle("is-right", side === "right");
            void b.offsetWidth;
            b.classList.add("is-on");
            this.lastSay = now();
            clearTimeout(this._bt);
            this._bt = setTimeout(() => this.hush(), ms || clamp(1700 + text.length * 50, 2600, 6000));
        }
        hush() { clearTimeout(this._bt); this.bubble.classList.remove("is-on"); }
        talk(pool, ms) {
            const list = this.lines[pool];
            if (list && list.length) this.say(bag(this.id + ":" + pool, list), ms);
        }
        chat(pool, p, gap) {
            if (now() - this.lastSay < (gap || 9000)) return;
            if (chance(p == null ? 1 : p)) this.talk(pool);
        }

        /* efek partikel */
        fx(kind, n, o) {
            n = n || 1; o = o || {};
            for (let i = 0; i < n; i++) {
                setTimeout(() => {
                    if (!this.alive) return;
                    const s = doc.createElement("i");
                    s.className = "mk-fxp mk-fxp-" + kind.replace(/\d/, "");
                    s.textContent = FX_GLYPH[kind] != null ? FX_GLYPH[kind] : "";
                    s.setAttribute("aria-hidden", "true");
                    const k = this.unit;
                    s.style.setProperty("--px", (rand(-26, 26) * k + (o.px || 0)).toFixed(0));
                    s.style.setProperty("--py", (o.py != null ? o.py : rand(60, 82)).toFixed(0));
                    s.style.setProperty("--dx", (rand(-18, 18) * k).toFixed(0));
                    s.style.setProperty("--rise", ((o.rise || rand(28, 50)) * Math.max(k, 0.7)).toFixed(0));
                    s.style.setProperty("--fs", ((o.fs || rand(12, 17)) * Math.max(k, 0.78)).toFixed(0));
                    s.style.setProperty("--rot", rand(-24, 24).toFixed(0) + "deg");
                    s.style.setProperty("--ft", (o.ft || rand(1.4, 2)).toFixed(2) + "s");
                    this.box.appendChild(s);
                    const kill = () => s.remove();
                    s.addEventListener("animationend", kill, { once: true });
                    setTimeout(kill, 2800);
                }, i * 140);
            }
        }

        /* gerak */
        hop(h, ms) {
            h = (h || 20) * this.unit; ms = ms || 560;
            const a = play(this.yel, [
                { transform: "translateY(0)", easing: "cubic-bezier(.2,.75,.4,1)" },
                { transform: "translateY(" + (-h) + "px)", offset: 0.46, easing: "cubic-bezier(.55,0,.8,.4)" },
                { transform: "translateY(0)" }
            ], { duration: ms });
            const b = play(this.sq, [
                { transform: "scale(1,1)" },
                { transform: "scale(1.1,.84)", offset: 0.12 },
                { transform: "scale(.93,1.12)", offset: 0.34 },
                { transform: "scale(.96,1.05)", offset: 0.72 },
                { transform: "scale(1.12,.84)", offset: 0.9 },
                { transform: "scale(1,1)" }
            ], { duration: ms });
            return Promise.all([a, b]);
        }
        squish(ms) {
            return play(this.sq, [
                { transform: "scale(1,1)" },
                { transform: "scale(1.16,.8)", offset: 0.28 },
                { transform: "scale(.94,1.08)", offset: 0.62 },
                { transform: "scale(1,1)" }
            ], { duration: ms || 460 });
        }
        wiggle(deg, n, ms) {
            deg = deg || 8; n = n || 3;
            const f = [{ transform: "rotate(0deg)" }];
            for (let i = 0; i < n * 2; i++) f.push({ transform: "rotate(" + (i % 2 ? -deg : deg) + "deg)" });
            f.push({ transform: "rotate(0deg)" });
            return play(this.tilt, f, { duration: ms || 520, easing: "ease-in-out" });
        }
        shake(px, ms) {
            px = (px || 4) * this.unit;
            return play(this.xel, [
                { transform: "translateX(0)" }, { transform: "translateX(" + (-px) + "px)" }, { transform: "translateX(" + px + "px)" },
                { transform: "translateX(" + (-px) + "px)" }, { transform: "translateX(" + px + "px)" }, { transform: "translateX(0)" }
            ], { duration: ms || 380 });
        }
        spin(turns, ms) {
            turns = turns || 1; ms = ms || 760;
            return Promise.all([
                play(this.tilt, [{ transform: "rotate(0deg)" }, { transform: "rotate(" + 360 * turns + "deg)" }], { duration: ms, easing: "cubic-bezier(.4,.1,.3,1)" }),
                this.hop(26, ms)
            ]);
        }
        nod() {
            return play(this.tilt, [{ transform: "rotate(0deg) translateY(0)" }, { transform: "rotate(4deg) translateY(3px)", offset: 0.4 }, { transform: "rotate(-2deg) translateY(0)", offset: 0.7 }, { transform: "rotate(0deg)" }], { duration: 560 });
        }
        sway(n, ms) {
            n = n || 2;
            const f = [{ transform: "rotate(0deg) translateX(0)" }];
            for (let i = 0; i < n * 2; i++) f.push({ transform: "rotate(" + (i % 2 ? -9 : 9) + "deg) translateX(" + (i % 2 ? -4 : 4) * this.unit + "px)" });
            f.push({ transform: "rotate(0deg) translateX(0)" });
            return play(this.tilt, f, { duration: ms || 1400, easing: "ease-in-out" });
        }
        tiltTo(deg) { this.el.style.setProperty("--tilt", String(deg)); }
        breath(v) { this.el.style.setProperty("--brx", String(v)); }

        /* pindah ke (x,y): loncat berantai kalau jauh */
        async moveTo(x, y, o) {
            o = o || {};
            const dx = x - this.x, dy = y - this.y;
            this.setPos(x, y);
            if (reduced()) return;
            const dist = Math.hypot(dx, dy);
            const h = (o.h != null ? o.h : 24) * this.unit;
            const ms = o.ms || clamp(420 + dist * 1.1, 480, 1000);
            const peak = Math.min(-dy, 0) - h;
            const px = play(this.xel, [{ transform: "translateX(" + (-dx) + "px)" }, { transform: "translateX(0)" }], { duration: ms, easing: "cubic-bezier(.4,.1,.6,.95)" });
            const py = play(this.yel, [
                { transform: "translateY(" + (-dy) + "px)", easing: "cubic-bezier(.2,.75,.4,1)" },
                { transform: "translateY(" + peak + "px)", offset: 0.5, easing: "cubic-bezier(.55,0,.8,.4)" },
                { transform: "translateY(0)" }
            ], { duration: ms });
            play(this.sq, [
                { transform: "scale(1,1)" }, { transform: "scale(1.1,.82)", offset: 0.1 }, { transform: "scale(.92,1.14)", offset: 0.3 },
                { transform: "scale(.96,1.06)", offset: 0.75 }, { transform: "scale(1.14,.82)", offset: 0.92 }, { transform: "scale(1,1)" }
            ], { duration: ms });
            await Promise.all([px, py]);
        }
        async travel(x, y, o) {
            o = o || {};
            const dist = Math.hypot(x - this.x, y - this.y);
            const n = clamp(Math.ceil(dist / 200), 1, 5);
            const sx = this.x, sy = this.y;
            for (let i = 1; i <= n; i++) {
                await this.moveTo(sx + (x - sx) * i / n, sy + (y - sy) * i / n, o);
                if (i < n) await sleep(70);
            }
        }

        /* interaksi */
        onHover() {
            const t = now();
            if (t - this.lastHover < 2800 || this.locked) return;
            this.lastHover = t;
            if (this.cfg.onHover && this.cfg.onHover(this) === true) return;
            this.mood("shy", 1100);
            this.fx("star", 1, { py: 80 });
            this.chat("hover", 0.4, 6000);
        }
        onClick() {
            const t = now();
            this.pokeTimes = this.pokeTimes.filter((x) => t - x < 4300);
            this.pokeTimes.push(t);
            if (this.cfg.onPoke && this.cfg.onPoke(this, this.pokeTimes.length) === true) return;
            if (this.locked) return;
            if (this.pokeTimes.length >= 6) { this.pokeTimes = []; this.annoyed(); return; }
            this.poke();
        }
        poke() {
            const list = this.cfg.react || (this.kind === "star" ? REACT_STAR : REACT_MOON);
            const name = bag(this.id + ":react", list);
            if (REACT[name]) REACT[name](this);
            if (chance(0.62)) this.talk("poke");
        }
        async annoyed() {
            if (this.cfg.onAnnoyed && this.cfg.onAnnoyed(this) === true) return;
            this.locked = true;
            this.mood("angry", 0);
            this.fx("bang", 2);
            this.shake(5);
            this.say(bag(this.id + ":annoy", this.lines.annoyed || ["Cukup! Aku pusing."]));
            await sleep(2600);
            this.mood("shy", 0);
            this.say(bag(this.id + ":forgive", this.lines.forgive || ["Ya sudah, aku maafin."]));
            await sleep(1500);
            this.rest();
            this.locked = false;
        }

        /* siklus diam */
        canAct() { return this.alive && this.visible && !this.locked && !doc.hidden && (this.cfg.cel || !overlayOpen()) && !reduced(); }
        startIdle() {
            const gap = this.cfg.idleGap || [5200, 10800];
            const loop = () => {
                clearTimeout(this._it);
                this._it = setTimeout(async () => {
                    if (!this.alive) return;
                    if (this.canAct()) {
                        const list = this.cfg.idle || (this.kind === "star" ? IDLE_STAR : IDLE_MOON);
                        const name = bag(this.id + ":idle", list);
                        try { if (ACT[name]) await ACT[name](this); } catch (e) { /* abaikan */ }
                    }
                    loop();
                }, rand(gap[0], gap[1]));
            };
            loop();
        }
        onVisible(v) {
            this.visible = v;
            this.el.classList.toggle("is-off", !v);
            if (v && !this.greeted) {
                this.greeted = true;
                setTimeout(() => { if (this.visible && this.alive && !this.locked) this.greet(); }, rand(700, 1500));
            }
        }
        async greet() {
            if (this.cfg.onGreet && this.cfg.onGreet(this) === true) return;
            if (reduced()) { this.talk("greet"); return; }
            this.mood("happy", 1500);
            this.hop(16);
            this.talk("greet");
        }
    }

    window.__alpMascot = { all: registry, by: byId };

    /* 06. DIALOG */
    const LINES = {
        titleMoon: {
            greet: ["Halo. Aku Bulan. Bukan keju, bukan lampu, tapi boleh disapa.", "Selamat datang. Kursi di sini cuma muat satu bulan, jadi kamu duduknya di layar saja."],
            hover: ["Eh, ada yang lewat. Halo.", "Jangan terlalu dekat, nanti aku merona.", "Aku bukan keju, tapi boleh dilirik kok.", "Halo juga. Iya, aku memang seimut ini.", "Pelan-pelan, aku masih setengah bangun."],
            poke: ["Hih, geli!", "Satu colekan, satu cahaya. Itu aturannya.", "Aku bulan, bukan tombol. Tapi ya sudah, lanjut.", "Aduh! Eh, ternyata enak. Lagi dong.", "Awas, nanti kugerhanain.", "Aku lagi sok misterius, jangan dirusak.", "Aku ganti fase tiap malam, lho. Capek juga."],
            idle: ["Dari atas huruf ini pemandangannya bagus. Ada judul, ada kamu.", "Hati-hati, hurufnya licin. Aku sudah dua kali kepeleset.", "Aku jagain judulnya. Gajinya cuma dilihatin.", "Huruf L ini kursi favoritku. Empuk, kalau dibayangkan.", "Kalau judulnya diklik, aku bisa ngambek lho. Cuma bilang."],
            hint: ["Psst, coba klik judulnya. Aku nggak bakal ngambek. (bohong)", "Judul ini kelihatan kokoh, tapi ada satu titik yang gampang dicolek. Cari saja."],
            wave: ["Wuush, ombak huruf!", "Ih, hurufnya ikut joget.", "Gelitikin terus, nanti judulnya ketawa."],
            stealStart: ["Dicolek terus, capek aku.", "Hmph. Kalau gitu, titiknya kubawa.", "Oke. Ngambek. Resmi dimulai.", "Aku tersinggung. Sedikit. Banget."],
            plucked: ["Titik i-nya kubawa. Wlee.", "Ini punyaku sekarang. Cari sendiri yang lain.", "Judulnya jadi botak. Itu salahmu."],
            sulk: ["Hmph.", "Aku lagi nggak ngomong sama siapa-siapa.", "..."],
            coax: [["Hmph. Nggak mau.", "Salah sendiri. Lanjut ngambek."], ["…jangan lihat, aku masih ngambek. Tapi lanjutkan.", "Kamu bujuknya kurang niat. Tapi ya lumayan."]],
            forgive: ["Ya sudah, nih. Jangan diulang. (kecuali lucu)", "Oke, oke. Aku maafin. Tapi aku punya buku dendam kecil, lho.", "Kelamaan ngambek capek juga. Nih, titiknya."],
            auto: ["…aku bosan ngambek. Nih.", "Nggak ada yang bujuk. Ya sudah, kukembalikan sendiri."],
            back: ["Nah, utuh lagi. Seperti tidak ada apa-apa.", "Ting! Titiknya pulang. Aku juga pulang ke sini."],
            missing: ["Lihat, judulnya jadi ‘Lıttle’. Itu hasil colekanmu.", "Judulnya botak, kan. Aku nggak ikut-ikutan.", "Cari titiknya? Bukan aku yang ambil. (aku yang ambil)"],
            playful: ["Hihi, hurufnya geli.", "Satu colekan lagi, aku bisa ngambek lho.", "Ayo, lagi. Aku suka ombaknya."],
            annoyed: ["Cukup! Aku pusing."],
            enter: ["Ayo masuk. Aku sudah siapkan jeda."]
        },
        titleStar: {
            greet: ["Kedip. Itu salamku.", "Hai! Aku Bintang kecil. Jauh, tapi dekat."],
            hover: ["Hehe, kamu lihat aku.", "Aku kecil, tapi jauhnya bukan main.", "Jangan terlalu dekat, nanti silau."],
            poke: ["Hehe, digelitikin!", "Jangan diremas, aku masih mau bersinar.", "Kedip-kedip, tuh. Dapat salam dari angkasa.", "Aduh, silau ya? Maaf, bawaan lahir.", "Aku bukan lampu tidur, tapi boleh dibilang begitu.", "Satu bintang, nol permintaan terkabul. Aku cuma figuran."],
            idle: ["Kedip. Itu bahasa kami.", "Jangan tanya umurku. Pokoknya lebih tua dari kalendermu.", "Make a wish dong, aku lagi kosong.", "Aku jagain sisi ini. Bulan jagain yang di sana.", "Kalau kamu lihat aku kedip, itu bukan genit. Itu halo."],
            sulkNote: ["Bulan lagi ngambek. Bujuk dong, tapi pelan-pelan.", "Titiknya dibawa Bulan. Aku nggak ikut-ikutan. Cuma nonton.", "Tolong, ini darurat huruf."],
            relief: ["Yeay baikan! Aku sudah gelisah dari tadi.", "Akhirnya. Judulnya utuh lagi."],
            wave: ["Wah, ombaknya sampai sini!", "Hurufnya joget, aku juga ikut."],
            annoyed: ["Aduh, aku bukan bola!"],
            forgive: ["Ya sudah, aku maafin."]
        },
        banter: [
            ["Bintang, kamu lihat tadi nggak?", "Lihat. Aku nggak akan bilang siapa-siapa. (aku bilang ke semua bintang)"],
            ["Kalau kamu jatuh, aku yang nangkap ya.", "Jangan. Aku masih mau kerja di sini."],
            ["Jam berapa sekarang?", "Malam. Itu satu-satunya jam yang kita punya."],
            ["Kok sepi ya?", "Karena kamu belum cerita. Aku dengerin kok."],
            ["Kita kelihatan keren nggak dari bawah sana?", "Keren. Tapi mereka lebih sering lihat HP, sih."],
            ["Aku mau ngambek ah.", "Jangan sekarang. Tadi baru selesai."]
        ],
        pauseMoon: {
            greet: ["Halo. Aku lagi latihan napas. Ikut?"],
            hover: ["Ssst, aku lagi konsentrasi.", "Napas dulu, baru kenalan."],
            poke: ["Jangan ganggu, aku lagi latihan napas.", "Ikut aku: hirup… hembus… nah, pintar.", "Aku bukan balon. Tapi kalau dipikir, mirip sih.", "Pipiku ini bukan bakpao, ya."],
            in: ["Tarik napas… pelan, jangan kayak ngejar bus.", "Hirup. Seolah udaranya gratis. Memang gratis.", "Isi dulu paru-parunya, urusan dunia belakangan."],
            hold: ["Tahaan… pipiku sampai penuh.", "Tahan sebentar. Dunia boleh nunggu.", "Jeda di tengah ini yang paling mahal."],
            out: ["Hufff… nah, lega kan?", "Lepasin. Bahumu juga boleh ikut turun.", "Hembus pelan. Anggap saja lilin ulang tahun."]
        },
        pauseStar: {
            greet: ["Zzz… eh? Aku nggak tidur. Cuma merem."],
            hover: ["Zzz… jangan berisik…"],
            poke: ["Zzz… lima menit lagi…", "Eh? Aku nggak tidur. Aku cuma meresapi gelap.", "Mimpiku lagi bagus, kenapa dibangunin…", "Ssst. Bulan latihan napas, aku latihan tidur."],
            wake: ["Oke, oke, aku bangun. Puas?"],
            annoyed: ["Aku bangun! Aku bangun!"],
            forgive: ["…aku lanjut tidur ya."]
        },
        thingsStar: {
            greet: ["Empat hal sederhana. Aku jagain."],
            hover: ["Pilih satu ya. Aku cuma penonton yang berkedip."],
            poke: ["Jangan cuma dipandangi, nanti kartunya canggung.", "Satu di antara empat ini pasti lagi kamu butuhkan.", "Aku nggak ikut milih. Aku penonton netral.", "Hehe, aku ikut deg-degan."],
            idle: ["Yang kecil sering menyelamatkan yang besar. Aku buktinya.", "Kopi, lagu, tidur, karya. Hidup itu sederhana, kok."],
            kopi: ["Kopi? Pesan satu, tambah telinga untuk mendengarkan.", "Ajakan ‘ngopi yuk’ itu kode. Aku paham kodenya."],
            musik: ["♪ La la la… eh, aku fals ya?", "Putar yang pelan. Aku ikut goyang."],
            istirahat: ["Ssst… istirahat dulu. Aku ikut ya. Zzz.", "Capek itu bukti kamu sudah jalan jauh."],
            mencipta: ["Gambarin kucing kentang itu dong. Aku mau lihat.", "Karya pertama boleh jelek. Aku bintang, dan aku juga pernah miring."],
            pick: ["Nah, itu! Pilihan bagus.", "Aku jagoin yang itu."]
        },
        canvasMoon: {
            greet: ["Kanvasnya sudah siap. Aku bawa kuas, kamu bawa keberanian."],
            hover: ["Hei, pelukis. Mau gambar apa?", "Jangan lihat kuasku, belum kucuci."],
            poke: ["Aku bisa bantu gambar. Tapi hasilnya bulan semua.", "Kuasku cuma satu, jangan diminta-minta.", "Hasil jelek itu cuma fase. Aku juga punya fase.", "Ssst, aku lagi cari inspirasi. Biasanya di bawah kasur."],
            idle: ["Kanvas kosong itu nggak menakutkan. Dia cuma menunggu kucing kentang.", "Gambar apa saja. Aku juri paling ramah sedunia.", "Kalau bingung mulai dari mana, mulai dari titik."],
            text: ["Tulis yang jujur ya, bukan yang bagus.", "Kata-kata juga bisa jadi gambar, lho."],
            circle: ["Lingkaran! Sahabat lama bulan.", "Bulat itu damai. Aku tahu dari pengalaman."],
            square: ["Kotak. Tegas. Aku suka yang berani.", "Kotak itu bulan yang lagi diet sudut."],
            star: ["Bintang! Salam buat temanku itu.", "Satu bintang lagi di langit kecilmu."],
            moon: ["Itu saudara jauhku. Jangan bilang-bilang.", "Wah, bulan baru. Aku punya saingan."],
            line: ["Garis. Sederhana, tapi bisa jadi jalan pulang.", "Satu garis dan dunia sudah punya arah."],
            brush: ["Coret bebas? Hati-hati, nanti ketagihan.", "Nah. Sekarang kuas kita kembar."],
            draw: ["Terus, jangan mikirin bagus dulu.", "Coret! Yang rapi itu urusan besok."],
            random: ["Wah, diacak. Hasilnya… seni.", "Kocok terus, siapa tahu jadi masterpiece."],
            clear: ["Yah, dihapus. Padahal tadi lucu.", "Bersih lagi. Kanvas kosong itu kesempatan baru."],
            save: ["Cekrek! Karyamu sudah punya rumah.", "Disimpan. Jangan malu, itu bagus kok."],
            undo: ["Mundur selangkah. Itu juga bagian dari jalan."],
            annoyed: ["Aduh, cat-ku tumpah! Pelan-pelan dong."],
            forgive: ["Ya sudah, kita lanjut menggambar."]
        },
        hiddenStar: {
            greet: ["…kamu lihat aku, ya?"],
            peek: ["…kamu lihat aku ya?", "Aku nggak malu. Aku cuma sedang berlatih jadi pemalu.", "Dia memang tidak menggigit. Aku sudah coba.", "Psst, aku di sini. Jangan bilang-bilang yang di tengah itu."],
            hover: ["Eh! Jangan dekat-dekat dulu."],
            poke: ["Eh! Jangan lihat! …Boleh lihat sedikit.", "Aku malu. Tapi sinarku nggak bisa dimatikan.", "Pipiku merah. Itu karena suhu. Iya, suhu.", "Kamu gigih juga, ya."],
            reward: ["Ya sudah, aku keluar. Tapi cuma sebentar."],
            annoyed: ["Cukup! Aku mau sembunyi lagi."],
            forgive: ["…aku keluar lagi pelan-pelan."]
        },
        endMoon: {
            greet: ["Sampai sini dulu, ya. Hati-hati di luar sana."],
            hover: ["Sudah mau pergi? Cepat sekali."],
            poke: ["Terima kasih sudah mampir. Jangan lupa istirahat.", "Kalau kangen, tinggal scroll ke atas.", "Bersambung ya. Aku masih punya banyak jahil.", "Pulang itu bukan selalu ke rumah. Kadang ke hal-hal kecil begini."],
            clap: ["Plok plok plok!", "Satu tepuk tangan kecil untukmu."],
            gate: ["Panggungnya sudah buka! Ketik namamu, jangan malu.", "Satpam panggungnya galak di depan, baik di dalam."],
            focus: ["Nama panggilan saja cukup. Gembok ini gampang kok.", "Ketik pelan-pelan. Aku nggak nyontek."],
            typed: ["Wah, namanya bagus.", "Oke, oke, aku catat."],
            annoyed: ["Aku bukan bantal tepuk!"],
            forgive: ["Ya sudah, tepuk tangan lagi."]
        },
        endStar: {
            greet: ["Tepuk tangan kecilnya jangan lupa!"],
            hover: ["Hati-hati di jalan."],
            poke: ["Hati-hati di jalan. Kalau gelap, lihat ke atas. Ada kami.", "Satu tepuk lagi? Ayo, plok.", "Aku akan kedip buat kamu malam ini. Gratis.", "Dah! Eh, belum. Masih ada bagian bawah."],
            clap: ["Plok plok plok!"],
            annoyed: ["Aduh, aku bukan bola!"],
            forgive: ["Ya sudah, aku maafin."]
        },
        eggs: {
            any: ["Nah! Ketemu juga. Bakat detektifmu ternyata ada.", "Satu terbuka. Aku nggak ngumpet jauh-jauh, sumpah.", "Bagus. Yang lain masih ngumpet, tapi mereka malu-malu."],
            n3: ["Tiga! Mulai kelihatan bakatnya."],
            n6: ["Lebih dari separuh. Aku jadi gugup."],
            n10: ["Tinggal satu. Yang terakhir memang pelit."],
            n11: ["Semuanya! Kamu… luar biasa. Beneran."]
        },
        wander: {
            hi: ["Permisi, numpang lewat!", "Jangan ditangkap, aku lagi lembur."],
            caught: ["Eh! Ketangkap. Make a wish dong, sebelum aku lanjut kerja.", "Oke, oke, aku berhenti. Satu permintaan, jangan yang mustahil."],
            bye: ["Dah! Salam buat yang di bawah.", "Permintaanmu kutitipkan ke langit."]
        }
    };

    /* 07. JUDUL */
    const Title = (() => {
        const T = { ready: false, state: "home", letters: [], moon: null, star: null, dot: null, dotIdx: -1,
            clicks: 0, steals: 0, lastForgive: 0, coax: 0, fs: 120, sc: 1, perch: { moon: -1, star: -1 }, lastClick: 0, energy: 0, lastWave: 0 };
        let wrap = null, h1 = null, ctx = null, autoTimer = 0, sulkTimer = 0, raf = 0, px = 0, py = 0, inside = false;
        const S = 200;
        const M = { dcx: 0.145, dcy: 0.56, dr: 0.05, tops: {}, iTop: 0.7 };

        const el = (tag, cls) => { const e = doc.createElement(tag); if (cls) e.className = cls; return e; };

        /* --- 07a. pecah judul jadi huruf (aria-label menjaga keterbacaan) --- */
        function build() {
            wrap = $(".landing-title-wrapper");
            h1 = wrap && $("h1", wrap);
            if (!h1) return false;
            const text = h1.textContent.replace(/\s+/g, " ").trim();
            if (!text) return false;
            T.text = text;
            h1.setAttribute("aria-label", text);
            h1.textContent = "";
            const holder = el("span", "ap-t");
            holder.setAttribute("aria-hidden", "true");
            const words = text.split(" ");
            let prev = "";
            words.forEach((word, wi) => {
                const w = el("span", "ap-w");
                const chars = Array.from(word);
                chars.forEach((chr, ci) => {
                    const ch = el("span", "ap-ch");
                    const b = el("span", "ap-b");
                    const inn = el("span", "ap-in");
                    const L = { chr, ch, b, in: inn, idx: T.letters.length, prev, nextChr: ci === chars.length - 1 && wi < words.length - 1 ? " " : "" };
                    if (chr === "i" && T.dotIdx < 0) {
                        T.dotIdx = L.idx;
                        inn.innerHTML = '<span class="ap-gi">i</span><span class="ap-gd">\u0131</span>';
                        const dot = el("i", "ap-dot");
                        b.appendChild(dot);
                        T.dot = dot;
                    } else {
                        inn.textContent = chr;
                    }
                    ch.appendChild(b);
                    ch.appendChild(inn);
                    w.appendChild(ch);
                    T.letters.push(L);
                    prev = chr;
                });
                holder.appendChild(w);
                if (wi < words.length - 1) { holder.appendChild(doc.createTextNode(" ")); prev = " "; }
            });
            h1.appendChild(holder);
            return true;
        }

        /* --- 07b. ukur kerning, titik i, dan puncak huruf lewat canvas --- */
        function measure() {
            const cs = getComputedStyle(h1);
            const c = doc.createElement("canvas");
            c.width = 700; c.height = 760;
            ctx = c.getContext("2d", { willReadFrequently: true });
            ctx.font = cs.fontStyle + " " + cs.fontWeight + " " + S + "px " + cs.fontFamily;
            if ("letterSpacing" in ctx) ctx.letterSpacing = "0.01px";
            ctx.textBaseline = "alphabetic";
            const w = (s) => ctx.measureText(s).width;

            T.letters.forEach((L) => {
                const kl = L.prev ? (w(L.prev + L.chr) - w(L.prev) - w(L.chr)) / S : 0;
                const kr = L.nextChr ? (w(L.chr + L.nextChr) - w(L.chr) - w(L.nextChr)) / S : 0;
                L.ch.style.marginLeft = Math.abs(kl) > 0.0004 ? kl.toFixed(4) + "em" : "";
                L.ch.style.marginRight = Math.abs(kr) > 0.0004 ? kr.toFixed(4) + "em" : "";
                M.tops[L.chr] = ctx.measureText(L.chr).actualBoundingBoxAscent / S;
            });

            /* titik i: cari gumpalan tinta paling atas yang terpisah dari batangnya */
            try {
                ctx.clearRect(0, 0, c.width, c.height);
                ctx.fillStyle = "#fff";
                ctx.fillText("i", 150, 520);
                const W = c.width, H = c.height, d = ctx.getImageData(0, 0, W, H).data;
                const rowInk = (y) => { for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 60) return true; return false; };
                let y0 = -1;
                for (let y = 0; y < H; y++) if (rowInk(y)) { y0 = y; break; }
                if (y0 >= 0) {
                    let y1 = y0;
                    while (y1 < H && rowInk(y1)) y1++;
                    let y2 = y1;
                    while (y2 < H && !rowInk(y2)) y2++;
                    if (y2 < H && y2 - y1 >= 2) {
                        let x0 = W, x1 = 0;
                        for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; }
                        M.dcx = ((x0 + x1) / 2 - 150) / S;
                        M.dcy = (520 - (y0 + y1) / 2) / S;
                        M.dr = Math.max(x1 - x0, y1 - y0) / 2 / S;
                        M.iTop = (520 - y0) / S;
                        M.tops.i = M.iTop;
                    }
                }
            } catch (e) { /* pakai nilai bawaan */ }
            if (T.dot) {
                T.dot.style.setProperty("--dcx", M.dcx.toFixed(4));
                T.dot.style.setProperty("--dcy", M.dcy.toFixed(4));
                T.dot.style.setProperty("--dr", M.dr.toFixed(4));
            }
        }

        /* --- 07c. tata letak: posisi huruf, ukuran maskot, tempat bertengger --- */
        function eyebrowRect() {
            const e = $(".landing-eyebrow");
            if (!e) return null;
            try { const r = doc.createRange(); r.selectNodeContents(e); return r.getBoundingClientRect(); } catch (x) { return e.getBoundingClientRect(); }
        }
        function layout() {
            if (!wrap) return;
            const wr = wrap.getBoundingClientRect();
            T.fs = parseFloat(getComputedStyle(h1).fontSize) || 120;
            const k = clamp(T.fs / 172, 0.2, 1.15);
            T.sc = clamp(0.46 + 0.54 * k, 0.54, 1.08);
            T.letters.forEach((L) => {
                const r = L.ch.getBoundingClientRect(), br = L.b.getBoundingClientRect();
                L.cx = r.left + r.width / 2 - wr.left;
                L.base = br.top - wr.top;
                L.top = L.base - (M.tops[L.chr] != null ? M.tops[L.chr] : 0.62) * T.fs;
                L.w = r.width;
            });
            [T.moon, T.star].forEach((m) => m && m.setScale(T.sc));
            /* hindari menabrak eyebrow / tanda ✦ / bintang egg */
            const avoid = [];
            const eb = eyebrowRect();
            if (eb) avoid.push({ r: eb, pad: 6 });
            [".title-mark", ".ambient-star.egg-find"].forEach((q) => { const e = $(q); if (e) avoid.push({ r: e.getBoundingClientRect(), pad: 0 }); });
            T.avoid = avoid.map((o) => ({ l: o.r.left - wr.left - o.pad, r: o.r.right - wr.left + o.pad, t: o.r.top - wr.top - o.pad, b: o.r.bottom - wr.top + o.pad }));
            T.wr = wr;
        }
        /* setengah lebar dan tinggi badan maskot di tempat bertengger (sudah termasuk lengan) */
        const bodyHW = (m) => (m.kind === "star" ? 32 : 44) * m.s;
        const bodyH = (m) => (m.kind === "star" ? 56 : 96) * m.s;
        function perchPos(i, m) {
            const L = T.letters[i];
            const y = L.top + 3 * m.unit;
            let x = L.cx;
            /* kalau badan maskot menutupi tulisan di atas judul (eyebrow, tanda ✦, bintang egg), geser ke samping secukupnya */
            const hw = bodyHW(m), h = bodyH(m);
            (T.avoid || []).forEach((a) => {
                if (y - h >= a.b || y <= a.t) return;
                if (x + hw <= a.l || x - hw >= a.r) return;
                const toLeft = a.l - (x + hw), toRight = a.r - (x - hw);
                x += Math.abs(toLeft) <= Math.abs(toRight) ? toLeft : toRight;
            });
            if (T.wr) {
                const vw = doc.documentElement.clientWidth;
                x = clamp(x, 6 + hw - T.wr.left, Math.max(6 + hw - T.wr.left, vw - 6 - hw - T.wr.left));
            }
            return { x, y };
        }
        function halfW(m) { return (m.kind === "star" ? 30 : 40) * m.s; }
        function perchHit(i, m) {
            const L = T.letters[i];
            if (!L || L.cx == null) return 1e9;
            const p = perchPos(i, m);
            const w = bodyHW(m), h = bodyH(m);
            const box = { l: p.x - w, r: p.x + w, t: p.y - h, b: p.y };
            let hit = 0;
            (T.avoid || []).forEach((a) => {
                const ox = Math.min(box.r, a.r) - Math.max(box.l, a.l), oy = Math.min(box.b, a.b) - Math.max(box.t, a.t);
                if (ox > 0 && oy > 0) hit += ox * oy;
            });
            return hit;
        }
        const perchOk = (i, m) => perchHit(i, m) === 0;
        function gapOk(i, m) {
            const o = m === T.moon ? T.star : T.moon;
            if (!o) return true;
            const j = T.perch[o.kind];
            if (j == null || j < 0 || !T.letters[j] || T.letters[j].cx == null) return true;
            return Math.abs(perchPos(i, m).x - perchPos(j, o).x) >= halfW(m) + halfW(o) + 4;
        }
        const find = (chr, nth) => { let n = 0; for (const L of T.letters) if (L.chr === chr && n++ === (nth || 0)) return L.idx; return -1; };
        function perchList(kind) {
            const pool = kind === "moon"
                ? [find("L"), find("l"), find("P"), find("A"), find("u"), find("a"), find("s"), find("t", 1)]
                : [find("e", 1), find("s"), find("a"), find("u"), find("P"), find("A"), find("t", 0)];
            return pool.filter((i) => i >= 0);
        }
        function bestPerch(m, exclude) {
            const all = perchList(m.kind).filter((i) => i !== exclude);
            const good = all.filter((i) => perchOk(i, m) && gapOk(i, m));
            if (good.length) return good;
            const loose = all.filter((i) => gapOk(i, m));
            return (loose.length ? loose : all).slice().sort((a, b) => perchHit(a, m) - perchHit(b, m));
        }
        function place(m, i, animate) {
            const p = perchPos(i, m);
            T.perch[m.kind] = i;
            if (animate) return m.travel(p.x, p.y);
            m.setPos(p.x, p.y);
            return Promise.resolve();
        }
        function pickPerch(m) {
            const opts = perchList(m.kind).filter((i) => i !== T.perch[m.kind] && perchOk(i, m) && gapOk(i, m));
            return opts.length ? opts[Math.floor(Math.random() * opts.length)] : -1;
        }
        function settle() {
            [T.moon, T.star].forEach((m) => {
                if (!m) return;
                const cur = T.perch[m.kind];
                if (T.state === "sulk" && m === T.moon && cur >= 0) { place(m, cur, false); return; }
                if (cur >= 0 && perchOk(cur, m) && gapOk(cur, m)) { place(m, cur, false); return; }
                const opts = bestPerch(m, -1);
                if (opts.length) place(m, opts[0], false);
            });
        }

        /* --- 07d. gelombang huruf --- */
        function nearestLetter(clientX) {
            const wr = wrap.getBoundingClientRect();
            let best = 0, bd = 1e9;
            T.letters.forEach((L) => { const d = Math.abs(wr.left + L.cx - clientX); if (d < bd) { bd = d; best = L.idx; } });
            return best;
        }
        function waveFrom(i, amp) {
            if (reduced()) return;
            amp = amp || 1;
            T.letters.forEach((L) => {
                const d = Math.abs(L.idx - i);
                play(L.ch, [
                    { transform: "translateY(0) scale(1,1)" },
                    { transform: "translateY(" + (-0.11 * amp * Math.pow(0.82, d)).toFixed(3) + "em) scale(1.03,.97)", offset: 0.4 },
                    { transform: "translateY(0.012em) scale(1,1)", offset: 0.78 },
                    { transform: "translateY(0) scale(1,1)" }
                ], { duration: 640, delay: d * 58, easing: "cubic-bezier(.3,.7,.4,1)" });
            });
        }
        function applyLift() {
            raf = 0;
            const wr = wrap.getBoundingClientRect();
            const fs = T.fs;
            const near = inside && py > wr.top - fs * 0.35 && py < wr.bottom + fs * 0.25;
            let e = 0;
            T.letters.forEach((L) => {
                let lift = 0, rot = 0;
                if (near) {
                    const dx = px - (wr.left + L.cx);
                    lift = Math.max(0, 1 - Math.abs(dx) / (fs * 0.6));
                    lift = lift * lift;
                    rot = clamp(-dx / fs, -1, 1) * lift * 5;
                }
                e += lift;
                L.in.style.setProperty("--ly", (-0.075 * lift).toFixed(3));
                L.in.style.setProperty("--lr", rot.toFixed(2));
            });
            T.energy = T.energy * 0.9 + e * 0.5;
            if (T.energy > 3.1 && now() - T.lastWave > 9000 && T.state === "home") {
                T.lastWave = now();
                T.energy = 0;
                T.moon.mood("giggle", 1400);
                T.moon.say(bag("t:wave", LINES.titleMoon.wave));
                if (T.star) setTimeout(() => { T.star.mood("happy", 1200); T.star.chat("wave", 0.7, 3000); }, 1700);
            }
        }
        function onMove(e) {
            if (e.pointerType === "touch" || reduced()) return;
            px = e.clientX; py = e.clientY; inside = true;
            if (!raf) raf = requestAnimationFrame(applyLift);
        }
        function onLeave() {
            inside = false;
            if (!raf) raf = requestAnimationFrame(applyLift);
        }

        /* --- 07e. titik i: terbang antara huruf dan maskot --- */
        function dotSize() { return clamp(M.dr * 2 * T.fs * 1.3, 9, 24); }
        async function flipDot(toParent, toHeld) {
            const dot = T.dot;
            const a = dot.getBoundingClientRect();
            if (toHeld) {
                T.moon.held.style.setProperty("--hd", dotSize().toFixed(0) + "px");
                dot.classList.remove("is-free");
                dot.classList.add("is-held");
            } else {
                dot.classList.remove("is-held");
                dot.classList.add("is-free");
            }
            toParent.appendChild(dot);
            const b = dot.getBoundingClientRect();
            if (reduced() || !b.width) return;
            const dx = (a.left + a.width / 2) - (b.left + b.width / 2);
            const dy = (a.top + a.height / 2) - (b.top + b.height / 2);
            const sc = a.width / b.width;
            const lift = 34 * T.sc;
            await play(dot, [
                { transform: "translate(" + dx + "px," + dy + "px) scale(" + sc + ")" },
                { transform: "translate(" + dx * 0.45 + "px," + (dy * 0.45 - lift) + "px) scale(" + ((sc + 1) / 2 * 1.25) + ")", offset: 0.45 },
                { transform: "translate(0,0) scale(1)" }
            ], { duration: toHeld ? 640 : 720, easing: "cubic-bezier(.3,.7,.4,1)" });
        }
        const sparkAtDot = () => { if (T.moon) T.moon.fx("spark", 4, { py: 22, px: 0, rise: 26 }); };

        /* --- 07f. alur ngambek --- */
        const SULK = { eyes: "angry", mouth: "pout", arms: "in", fx: "anger", cheek: "puff" };
        function clearTimers() { clearTimeout(autoTimer); clearInterval(sulkTimer); }

        async function steal(why) {
            if (T.state !== "home" || !T.ready || T.dotIdx < 0) return;
            T.state = "busy";
            const m = T.moon;
            m.locked = true;
            m.hush();
            m.mood("angry", 0);
            m.fx("bang", 2);
            m.say(bag("t:ss", LINES.titleMoon.stealStart));
            m.shake(5);
            await sleep(reduced() ? 400 : 1500);

            const i = T.dotIdx, L = T.letters[i];
            await place(m, i, true);
            await sleep(180);
            await m.squish(380);
            /* titik i lepas: huruf berubah jadi tanpa titik, titik palsu muncul persis di tempatnya */
            L.ch.classList.add("is-dotless");
            T.dot.classList.add("is-free");
            sparkAtDot();
            await sleep(120);
            await flipDot(m.held, true);
            m.override = Object.assign({}, SULK);
            m.rest();
            m.el.classList.add("is-holding");
            m.tiltTo(6);
            m.say(bag("t:pl", LINES.titleMoon.plucked));
            T.letters.forEach((l, k) => { if (k !== i) play(l.ch, [{ transform: "translateY(0)" }, { transform: "translateY(.02em)", offset: 0.5 }, { transform: "translateY(0)" }], { duration: 420, delay: Math.abs(k - i) * 40 }); });
            await sleep(reduced() ? 300 : 1500);

            /* pergi ngambek di huruf yang jauh dari i */
            let cand = perchList("moon").filter((j) => j !== i && perchOk(j, m) && gapOk(j, m));
            if (!cand.length) cand = perchList("moon").filter((j) => j !== i && gapOk(j, m));
            cand.sort((a, b) => Math.abs(T.letters[b].cx - L.cx) - Math.abs(T.letters[a].cx - L.cx));
            const spot = cand.length ? cand[0] : T.perch.moon;
            if (spot >= 0) await place(m, spot, true);
            T.state = "sulk";
            T.coax = 0;
            m.locked = true;
            armSulkTimers();
            if (T.star) setTimeout(() => { if (T.state === "sulk") { T.star.mood("giggle", 1300); T.star.talk("sulkNote"); } }, 2200);
        }

        function armSulkTimers() {
            clearTimers();
            autoTimer = setTimeout(() => forgive("auto"), 23000);
            let tick = 0;
            sulkTimer = setInterval(() => {
                const m = T.moon;
                if (T.state !== "sulk" || !m.visible || overlayOpen() || reduced()) return;
                tick++;
                if (tick % 3 === 0) { m.fx("puff", 2, { py: 70, rise: 20 }); m.wiggle(4, 2); }
                else if (tick % 3 === 1) { m.lookTo(chance(0.5) ? 1 : -1, 0.2, 1400); }
                else if (chance(0.5)) m.chat("sulk", 1, 4000);
            }, 3600);
        }

        function coax() {
            const m = T.moon;
            T.coax++;
            armSulkTimers();
            const pair = LINES.titleMoon.coax;
            if (T.coax === 1) { m.mood("angry", 1300); m.shake(4); m.say(pair[0][Math.floor(Math.random() * pair[0].length)]); m.lookTo(1, 0, 1400); }
            else if (T.coax === 2) { m.mood("sulky", 1500); m.nod(); m.say(pair[1][Math.floor(Math.random() * pair[1].length)]); m.fx("dots", 1, { py: 80 }); }
            else forgive("coax");
        }

        async function forgive(why) {
            if (T.state !== "sulk") return;
            T.state = "busy";
            clearTimers();
            const m = T.moon;
            m.override = null;
            m.mood("shy", 0);
            m.tiltTo(0);
            m.say(bag("t:fg", why === "auto" ? LINES.titleMoon.auto : LINES.titleMoon.forgive));
            await sleep(reduced() ? 300 : 1700);
            const i = T.dotIdx, L = T.letters[i];
            await place(m, i, true);
            m.mood("happy", 1600);
            await sleep(160);
            await flipDot(L.b, false);
            L.ch.classList.remove("is-dotless");
            T.dot.classList.remove("is-free");
            m.el.classList.remove("is-holding");
            sparkAtDot();
            waveFrom(i, 1.1);
            m.fx("heart", 2);
            m.say(bag("t:bk", LINES.titleMoon.back));
            T.lastForgive = now();
            T.steals++;
            if (T.star) setTimeout(() => { T.star.mood("cheer", 1600); T.star.talk("relief"); T.star.hop(24); }, 900);
            await sleep(reduced() ? 200 : 1500);
            const home = pickPerch(m);
            if (home >= 0) await place(m, home, true);
            m.locked = false;
            m.rest();
            T.state = "home";
        }

        /* --- 07g. klik judul & maskot --- */
        function onTitleClick(e) {
            if (!T.ready) return;
            const i = nearestLetter(e.clientX);
            waveFrom(i, 1);
            T.clicks++;
            T.lastClick = now();
            const m = T.moon;
            if (T.state === "busy") return;
            if (T.state === "sulk") {
                m.shake(3);
                m.say(bag("t:ms", LINES.titleMoon.missing));
                return;
            }
            const cooling = now() - T.lastForgive < 9000;
            if (T.steals === 0 || (!cooling && chance(0.7))) steal("click");
            else {
                m.mood("giggle", 1200);
                m.hop(14);
                m.say(bag("t:pf", LINES.titleMoon.playful));
            }
        }

        function banter() {
            clearTimeout(T.bt);
            T.bt = setTimeout(async () => {
                const m = T.moon, s = T.star;
                if (m && s && m.canAct() && s.canAct() && T.state === "home" && !m.bubble.classList.contains("is-on")) {
                    const pair = bag("t:banter", LINES.banter);
                    m.mood("talk", 0); m.say(pair[0]);
                    await sleep(3000);
                    if (T.state === "home") { s.mood("wink", 1800); s.say(pair[1]); }
                    await sleep(2600);
                    m.rest();
                }
                banter();
            }, rand(26000, 44000));
        }

        function initInner() {
            if (!build()) return null;
            const L = LINES;
            T.moon = new Mascot({
                id: "title-moon", kind: "moon", lines: L.titleMoon, idleGap: [5500, 11000],
                idle: ["blink2", "perchHop", "wave", "look", "giggle", "perchHop", "yawn", "dance", "sparkle", "nod", "hint"],
                onPoke: () => {
                    if (T.state === "sulk") { coax(); return true; }
                    if (T.state === "busy") return true;
                    return false;
                },
                onAnnoyed: () => { if (T.state === "home") steal("poke"); return true; }
            }).mount(wrap);
            T.star = new Mascot({
                id: "title-star", kind: "star", lines: L.titleStar, idleGap: [6500, 12500],
                onGreet: (self) => { setTimeout(() => { if (self.alive && self.visible && !self.locked && !overlayOpen()) { self.mood("wink", 1500); self.hop(14); self.talk("greet"); } }, 4300); return true; },
                idle: ["blink2", "twirl", "perchHop", "sparkle", "look", "giggle", "wave", "perchHop", "blep", "nod"],
                onPoke: () => {
                    if (T.state === "sulk") {
                        T.star.mood("wink", 1500); T.star.hop(16); T.star.talk("sulkNote");
                        return true;
                    }
                    return false;
                }
            }).mount(wrap);
            T.moon.base.arms = "mid";
            T.moon.setScale(0.9); T.star.setScale(0.9);

            ACT.perchHop = async (m) => {
                if (T.state !== "home") return;
                const i = pickPerch(m);
                if (i < 0) return;
                m.mood("happy", 900);
                await place(m, i, true);
                m.fx("spark", 2);
                if (T.letters[i]) play(T.letters[i].ch, [{ transform: "translateY(0)" }, { transform: "translateY(.03em) scale(1.02,.97)", offset: 0.4 }, { transform: "translateY(0)" }], { duration: 380 });
            };
            ACT.hint = async (m) => {
                if (m !== T.moon || T.clicks > 0 || T.steals > 0) return ACT.look(m);
                m.mood("wink", 1800);
                m.talk("hint");
                await sleep(1800);
            };

            wrap.addEventListener("pointermove", onMove, { passive: true });
            wrap.addEventListener("pointerleave", onLeave, { passive: true });
            h1.addEventListener("click", onTitleClick);

            const ready = () => {
                measure();
                layout();
                const a = bestPerch(T.moon, -1)[0];
                if (a != null) place(T.moon, a, false);
                const b = bestPerch(T.star, -1)[0];
                if (b != null) place(T.star, b, false);
                T.ready = true;
                T.moon.startIdle();
                T.star.startIdle();
                banter();
            };
            const cs0 = getComputedStyle(h1);
            const want = (doc.fonts && doc.fonts.load) ? doc.fonts.load(cs0.fontWeight + " 100px " + cs0.fontFamily, "A Little Pause i\u0131").catch(() => {}) : Promise.resolve();
            const fontsReady = want.then(() => (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : null);
            const kick = () => requestAnimationFrame(ready);
            fontsReady.then(kick, kick);
            /* aman kalau font lama sekali */
            setTimeout(() => { if (!T.ready) ready(); }, 3500);
            const remeasure = () => { if (!T.ready || T.state === "busy") return; measure(); layout(); settle(); };
            window.addEventListener("load", () => setTimeout(remeasure, 250));
            if (doc.fonts && doc.fonts.addEventListener) doc.fonts.addEventListener("loadingdone", () => setTimeout(remeasure, 120));

            let rt = 0;
            window.addEventListener("resize", () => {
                clearTimeout(rt);
                rt = setTimeout(() => { if (!T.ready || T.state === "busy") return; layout(); settle(); }, 160);
            }, { passive: true });
            return T;
        }

        function init() {
            try {
                return initInner();
            } catch (e) {
                if (h1 && T.text) { h1.textContent = T.text; h1.removeAttribute("aria-label"); }
                [T.moon, T.star].forEach((m) => { if (m && m.destroy) m.destroy(); });
                T.moon = T.star = null;
                console.warn("[A Little Pause] maskot judul tidak aktif:", e);
                return null;
            }
        }
        T.init = init;
        T.steal = steal;
        T.forgive = forgive;
        T.waveFrom = waveFrom;
        T.M = M;
        return T;
    })();

    /* 08. GLOBAL: tatapan mata & penampakan */
    const ptr = { x: -9999, y: -9999, t: 0, type: "mouse" };
    let tickRaf = 0, tickT = 0;
    function tick() {
        tickRaf = 0;
        const t = now();
        registry.forEach((m) => {
            if (!m.visible || !m.alive) return;
            if (m.manual && t < m.manual.until) return;
            const r = m.hit.getBoundingClientRect();
            const dx = ptr.x - (r.left + r.width / 2), dy = ptr.y - (r.top + r.height * 0.55);
            const d = Math.hypot(dx, dy) || 1;
            if (t - ptr.t > 2600 || d > 560) { m.applyLook(0, 0); return; }
            const k = clamp(d / 150, 0, 1);
            m.applyLook(dx / d * k, dy / d * k);
        });
    }
    function onPointer(e) {
        ptr.x = e.clientX; ptr.y = e.clientY; ptr.t = now(); ptr.type = e.pointerType || "mouse";
        if (!tickRaf) tickRaf = requestAnimationFrame(tick);
        clearTimeout(tickT);
        tickT = setTimeout(() => { if (!tickRaf) tickRaf = requestAnimationFrame(tick); }, 2800);
    }

    const elMap = new Map();
    let io = null;
    function getIO() {
        if (!io && "IntersectionObserver" in window) {
            io = new IntersectionObserver((entries) => {
                entries.forEach((en) => { const m = elMap.get(en.target); if (m) m.onVisible(en.isIntersecting && en.intersectionRatio > 0.2); });
            }, { threshold: [0, 0.25, 0.6] });
        }
        return io;
    }
    function watch(m) {
        elMap.set(m.box, m);
        const o = getIO();
        if (o) o.observe(m.box);
        else m.onVisible(true);
    }
    Mascot.prototype.destroy = function () {
        this.alive = false;
        clearTimeout(this._it); clearTimeout(this._bt);
        if (io) io.unobserve(this.box);
        elMap.delete(this.box);
        const i = registry.indexOf(this);
        if (i > -1) registry.splice(i, 1);
        delete byId[this.id];
        this.el.remove();
    };

    /* aksi tambahan */
    ACT.quip = async (m) => { if (now() - m.lastSay < 12000 || !(m.lines.idle || []).length) return ACT.look(m); m.mood("wink", 1700); m.talk("idle"); await sleep(1700); };
    ACT.snooze = async (m) => { m.fx("zzz", 2, { py: 78, rise: 36 }); m.nod(); await sleep(1800); };
    ACT.stir = async (m) => { m.set({ eyes: "open", mouth: "o" }); m.wiggle(5, 2); await sleep(900); m.rest(); };

    /* 09. PENGHUNI SECTION */
    const M = byId;
    const bpNow = () => { const w = doc.documentElement.clientWidth; return w <= 360 ? "xs" : w <= 700 ? "sm" : (w <= 1100 ? "md" : "lg"); };

    const CAST = [
        { id: "pause-moon", kind: "moon", sec: "#pause", anchor: ".breathing-orbit", ax: 0.5, ay: 0.5, crescent: true, cloud: true, float: true, lines: LINES.pauseMoon,
            idle: ["blink2", "look", "nod", "giggle", "cheek", "blink2"], idleGap: [6000, 11000],
            at: { lg: { dx: -222, dy: 84, s: 0.95 }, md: { dx: -176, dy: 70, s: 0.82 }, sm: { dx: -124, dy: 56, s: 0.64 }, xs: { dx: -104, dy: 52, s: 0.58 } } },
        { id: "pause-star", kind: "star", sec: "#pause", anchor: ".breathing-orbit", ax: 0.5, ay: 0.5, float: true, lines: LINES.pauseStar,
            base: { eyes: "closed", mouth: "small", arms: "down" }, idle: ["snooze", "stir", "snooze", "snore"], idleGap: [5500, 9500],
            at: { lg: { dx: 222, dy: 72, s: 0.95 }, md: { dx: 176, dy: 60, s: 0.82 }, sm: { dx: 124, dy: 48, s: 0.68 }, xs: { dx: 104, dy: 44, s: 0.62 } } },
        { id: "things-star", kind: "star", sec: "#little-things", anchor: ".things-grid", ax: 1, ay: 0, lines: LINES.thingsStar,
            idle: ["blink2", "quip", "twirl", "look", "sparkle", "quip", "wave", "giggle"], idleGap: [6000, 11000],
            at: { lg: { dx: -92, dy: 4, s: 1 }, md: { dx: -66, dy: 4, s: 0.92 }, sm: { dx: -40, dy: 4, s: 0.74 }, xs: { dx: -14, dy: 4, s: 0.6 } } },
        { id: "canvas-moon", kind: "moon", sec: "#canvas-section", anchor: ".canvas-stage-wrapper", ax: 0, ay: 0, lines: LINES.canvasMoon,
            idle: ["blink2", "look", "quip", "wave", "sparkle", "nod", "quip", "giggle"], idleGap: [6000, 11500],
            at: { lg: { dx: 100, dy: 4, s: 0.95 }, md: { dx: 72, dy: 4, s: 0.82 }, sm: { dx: 46, dy: 4, s: 0.66 }, xs: { dx: 40, dy: 4, s: 0.6 } } },
        { id: "hidden-star", kind: "star", sec: "#hidden-note", anchor: ".hidden-trigger-wrapper", ax: 0, ay: 0.5, lines: LINES.hiddenStar,
            idle: ["peek"], idleGap: [7000, 12000], hideDir: -1, fixedX: { lg: 46, md: 36, sm: 32 },
            at: { lg: { dx: 0, dy: 34, s: 1 }, md: { dx: 0, dy: 30, s: 0.9 }, sm: { dx: 0, dy: 26, s: 0.74 } } },
        { id: "end-moon", kind: "moon", sec: "#ending", anchor: ".ending-divider", ax: 0.5, ay: 0, lines: LINES.endMoon,
            idle: ["blink2", "wave", "look", "nod", "giggle"], idleGap: [6500, 12000], bubble: ["left", "below"],
            at: { lg: { dx: -150, dy: 3, s: 0.74 }, md: { dx: -136, dy: 3, s: 0.72 }, sm: { dx: -124, dy: 66, s: 0.62 }, xs: { dx: -104, dy: 64, s: 0.58 } } },
        { id: "end-star", kind: "star", sec: "#ending", anchor: ".ending-divider", ax: 0.5, ay: 0, lines: LINES.endStar,
            idle: ["blink2", "twirl", "sparkle", "look", "wave"], idleGap: [7000, 12500], bubble: ["right", "below"],
            at: { lg: { dx: 150, dy: 3, s: 0.84 }, md: { dx: 136, dy: 3, s: 0.8 }, sm: { dx: 124, dy: 66, s: 0.68 }, xs: { dx: 104, dy: 64, s: 0.62 } } }
    ];

    function placeCast(r) {
        const m = M[r.id], sec = $(r.sec);
        if (!m || !sec) return;
        const k = bpNow(), a = r.at[k] || r.at.sm || r.at.lg;
        const anchor = $(r.anchor, sec);
        if (!anchor) { m.el.classList.add("is-hidden"); return; }
        m.el.classList.remove("is-hidden");
        const sr = sec.getBoundingClientRect(), er = anchor.getBoundingClientRect();
        const x = r.fixedX ? (r.fixedX[k] != null ? r.fixedX[k] : (r.fixedX.sm != null && k === "xs" ? r.fixedX.sm : r.fixedX.lg)) : er.left - sr.left + er.width * r.ax + a.dx;
        const y = er.top - sr.top + er.height * r.ay + a.dy;
        m.setScale(a.s);
        m.baseX = x;
        m.setPos(x, y);
    }
    function layoutCast() { CAST.forEach(placeCast); }
    let layoutRaf = 0;
    const scheduleLayout = () => { if (!layoutRaf) layoutRaf = requestAnimationFrame(() => { layoutRaf = 0; layoutCast(); }); };

    /* --- 09a. Bulan di awan: ikut bernapas bersama label napas --- */
    function wireBreath() {
        const m = M["pause-moon"], label = $("#breathingLabel");
        if (!m || !label) return;
        let cycle = 0, last = "";
        const apply = () => {
            const t = (label.textContent || "").toLowerCase();
            let ph = t.indexOf("breathe in") > -1 ? "in" : t.indexOf("tahan") > -1 ? "hold" : t.indexOf("breathe out") > -1 ? "out" : "";
            if (!ph || ph === last) return;
            last = ph;
            if (ph === "in") {
                cycle++;
                m.override = { eyes: "closed", mouth: "small", arms: "up", cheek: "", fx: "" };
                m.breath(1.09);
            } else if (ph === "hold") {
                m.override = { eyes: "squint", mouth: "flat", arms: "in", cheek: "puff", fx: "" };
            } else {
                m.override = { eyes: "closed", mouth: "o", arms: "down", cheek: "", fx: "" };
                m.breath(0.96);
            }
            if (!m.locked) m.rest();
            if (!m.visible || overlayOpen() || reduced()) return;
            if (ph === "out") m.fx("puff", 3, { py: 74, rise: 22 });
            if (cycle <= 2 || cycle % 3 === 0) m.talk(ph, 3000);
        };
        new MutationObserver(apply).observe(label, { childList: true, characterData: true, subtree: true });
        apply();
        m.cfg.idle = ["blink2", "look", "nod", "giggle", "cheek"];
    }

    /* --- 09b. Bintang tidur: dibangunkan kalau dicolek terus --- */
    function wireSleepyStar() {
        const m = M["pause-star"];
        if (!m) return;
        m.cfg.onPoke = (self, n) => {
            if (!self.override && self.awake) { return false; }
            if (n >= 3) {
                self.pokeTimes = [];
                self.awake = true;
                self.override = null;
                self.base = { eyes: "open", mouth: "smile", arms: "mid", cheek: "", fx: "" };
                self.mood("wow", 1200);
                self.hop(22);
                self.fx("bang", 1);
                self.say(bag("ps:wake", LINES.pauseStar.wake));
                setTimeout(async () => {
                    if (!self.alive) return;
                    self.mood("yawn", 1800);
                    await sleep(1800);
                    self.awake = false;
                    self.base = { eyes: "closed", mouth: "small", arms: "down", cheek: "", fx: "" };
                    self.rest();
                    self.fx("zzz", 2, { py: 78 });
                }, 9000);
            } else {
                self.mood("giggle", 0);
                self.set({ eyes: "closed", mouth: "o" });
                self.wiggle(5, 2);
                self.fx("zzz", 1, { py: 80 });
                self.talk("poke");
                setTimeout(() => self.rest(), 1400);
            }
            return true;
        };
        m.cfg.onGreet = (self) => { self.mood("yawn", 1600); self.fx("zzz", 2, { py: 78 }); self.talk("greet"); return true; };
        m.cfg.onHover = (self) => { if (!self.awake) { self.fx("zzz", 1, { py: 80, rise: 30 }); self.chat("hover", 0.5, 7000); } return true; };
    }

    /* --- 09c. Bintang di atas kartu: bereaksi pada Kopi, Musik, Istirahat, Mencipta --- */
    function wireThings() {
        const m = M["things-star"], grid = $(".things-grid");
        if (!m || !grid) return;
        let cur = null, lastKey = "";
        const keyOf = (c) => { const t = (c.textContent || "").toLowerCase(); return t.indexOf("kopi") > -1 ? "kopi" : t.indexOf("musik") > -1 ? "musik" : t.indexOf("istirahat") > -1 ? "istirahat" : t.indexOf("mencipta") > -1 ? "mencipta" : ""; };
        const calm = () => { m.override = null; m.prop(null); m.el.classList.remove("is-wave"); m.rest(); };
        const react = (card, click) => {
            if (m.locked || overlayOpen()) return;
            const k = keyOf(card);
            if (!k) return;
            if (k !== lastKey) {
                lastKey = k;
                if (k === "kopi") { m.prop("cup"); m.override = { eyes: "happy", mouth: "smile", arms: "lean" }; m.fx("puff", 2, { py: 90, px: -18, rise: 24 }); }
                else if (k === "musik") { m.prop(null); m.override = { eyes: "closed", mouth: "cat", arms: "up" }; m.sway(2); m.fx("note", 3); }
                else if (k === "istirahat") { m.prop(null); m.override = { eyes: "closed", mouth: "small", arms: "down" }; m.fx("zzz", 2); }
                else { m.prop(null); m.override = { eyes: "wow", mouth: "o", arms: "up" }; m.fx("spark", 3); m.hop(14); }
                m.rest();
                m.chat(k, 1, 3500);
            }
            if (click) { m.hop(16); m.fx("heart", 1); if (chance(0.7)) m.talk("pick"); }
        };
        grid.addEventListener("pointerover", (e) => {
            if (e.pointerType && e.pointerType !== "mouse") return;
            const c = e.target.closest(".thing-card");
            if (c && c !== cur) { cur = c; react(c, false); }
        });
        grid.addEventListener("pointerleave", () => { cur = null; lastKey = ""; calm(); });
        grid.addEventListener("click", (e) => { const c = e.target.closest(".thing-card"); if (c) { lastKey = ""; react(c, true); setTimeout(() => { if (!cur) calm(); }, 3200); } });
    }

    /* --- 09d. Bulan pelukis: bereaksi pada kontrol kanvas --- */
    function wireCanvas() {
        const m = M["canvas-moon"], sec = $("#canvas-section");
        if (!m || !sec) return;
        m.prop("brush");
        const MAP = { addText: "text", addCircle: "circle", addSquare: "square", addMoon: "moon", addStar: "star", addLine: "line", toggleBrush: "brush", randomizeCanvas: "random", clearCanvas: "clear", saveCanvas: "save", undoCanvas: "undo" };
        const MOOD = { text: "wink", circle: "happy", square: "proud", moon: "love", star: "wow", line: "talk", brush: "cheer", random: "dizzy", clear: "sad", save: "cheer", undo: "talk" };
        sec.addEventListener("click", (e) => {
            const b = e.target.closest("button");
            if (!b || !MAP[b.id] || m.locked || overlayOpen()) return;
            const k = MAP[b.id];
            if (k === "brush" && b.getAttribute("aria-pressed") === "false") return;
            m.mood(MOOD[k], 1700);
            if (k === "save") { m.fx("ring", 1, { py: 70 }); m.fx("spark", 4); m.hop(24); }
            else if (k === "random") { m.spin(1, 800); }
            else if (k === "clear") { m.fx("zzz", 0); m.shake(4); }
            else m.hop(14);
            m.talk(k);
        });
        let lastDraw = 0;
        const cv = $("#creativeCanvas");
        if (cv) cv.addEventListener("pointerdown", () => {
            const t = now();
            if (t - lastDraw < 16000 || m.locked) return;
            lastDraw = t;
            const brush = $("#toggleBrush");
            if (brush && brush.getAttribute("aria-pressed") === "true") { m.mood("cheer", 1500); m.fx("spark", 3); m.talk("draw"); }
            else m.chat("draw", 0.35, 8000);
        }, { passive: true });
    }

    /* --- 09e. Bintang pemalu: sembunyi saat didekati, mengintip saat sepi --- */
    function wireShy() {
        const m = M["hidden-star"];
        if (!m) return;
        let hidden = false, near = 0, pokes = 0, pokeT = 0, busy = false;
        const w = () => (m.hit.offsetWidth || 60) * 0.95;
        const hide = (ms) => {
            if (hidden) return;
            hidden = true;
            m.xel.style.setProperty("--hx", String(-w()));
            m.override = { eyes: "closed", mouth: "small", arms: "in", cheek: "blush" };
            m.rest();
        };
        const peek = (line) => {
            if (!hidden) return;
            hidden = false;
            m.xel.style.setProperty("--hx", "0");
            m.override = { eyes: "open", mouth: "small", arms: "in", cheek: "blush" };
            m.rest();
            m.lookTo(1, 0.1, 1800);
            if (line && m.visible && !overlayOpen()) { m.fx("star", 1, { py: 80 }); m.talk("peek"); }
        };
        m.override = { eyes: "open", mouth: "small", arms: "in", cheek: "blush" };
        m.rest();
        ACT.peek = async (self) => {
            if (busy) return;
            if (hidden) { peek(true); await sleep(2600); }
            else { self.mood("shy", 1200); self.fx("star", 1, { py: 80 }); await sleep(1200); }
        };
        m.cfg.onHover = () => true;
        m.cfg.onPoke = (self) => {
            if (busy) return true;
            const t = now();
            pokes = (t - pokeT < 9000) ? pokes + 1 : 1;
            pokeT = t;
            if (hidden) peek(false);
            if (pokes >= 3) {
                pokes = 0; busy = true;
                (async () => {
                    self.override = null; self.rest();
                    self.talk("reward");
                    await self.moveTo(self.baseX + 62 * self.s, self.y, { h: 18 });
                    self.mood("cheer", 1500); self.fx("heart", 3); self.sway(2);
                    await sleep(2600);
                    await self.moveTo(self.baseX, self.y, { h: 14 });
                    self.override = { eyes: "open", mouth: "small", arms: "in", cheek: "blush" };
                    self.rest();
                    busy = false;
                })();
            } else {
                self.set({ eyes: "closed", mouth: "o", arms: "in", cheek: "blush" });
                self.wiggle(5, 2); self.fx("star", 2, { py: 78 });
                self.talk("poke");
                setTimeout(() => { if (!busy) self.rest(); }, 1300);
            }
            return true;
        };
        const inView = () => { const r = m.el.getBoundingClientRect(); return r.top > -60 && r.top < innerHeight + 60; };
        setInterval(() => {
            if (!inView() || overlayOpen() || busy || reduced() || doc.hidden) return;
            const r = m.el.getBoundingClientRect();
            const d = Math.hypot(ptr.x - r.left, ptr.y - (r.top - 24 * m.s));
            const fresh = now() - ptr.t < 1800;
            if (fresh && d < 170 * Math.max(m.s, 0.8)) { near = now(); if (!hidden) hide(); }
            else if (hidden && now() - near > 1700 && (!fresh || d > 260)) peek(true);
        }, 360);
        window.addEventListener("pointerdown", (e) => {
            if (!inView() || busy) return;
            const r = m.el.getBoundingClientRect();
            const d = Math.hypot(e.clientX - r.left, e.clientY - (r.top - 24 * m.s));
            if (d < 130 && d > 40 && !hidden && e.pointerType !== "mouse") { hide(); near = now() + 1600; }
        }, { passive: true });
    }

    /* --- 09f. Penutup: tepuk tangan berdua, panggung nama --- */
    let clapping = false;
    async function clapBoth() {
        const a = M["end-moon"], b = M["end-star"];
        if (!a || !b || clapping || overlayOpen()) return;
        clapping = true;
        [a, b].forEach((m) => { m.locked = true; m.mood("cheer", 0); m.fx("spark", 2); if (!reduced()) m.el.classList.add("is-clap"); });
        a.hop(14);
        a.say(bag("end:clap", LINES.endMoon.clap));
        setTimeout(() => { if (b.alive) { b.hop(16); b.talk("clap"); } }, 650);
        await sleep(reduced() ? 1200 : 2800);
        [a, b].forEach((m) => { m.el.classList.remove("is-clap"); m.locked = false; m.rest(); });
        clapping = false;
    }
    function wireEnding() {
        const a = M["end-moon"], b = M["end-star"], target = $("#ending .ending-text") || $("#ending");
        if (!a || !b) return;
        a.cfg.onPoke = () => { if (clapping) return true; if (chance(0.5)) { clapBoth(); } else { a.mood("love", 1500); a.fx("heart", 3); a.hop(16); a.talk("poke"); } return true; };
        b.cfg.onPoke = () => { if (clapping) return true; if (chance(0.5)) { clapBoth(); } else { b.mood("wink", 1400); b.fx("spark", 3); b.hop(18); b.talk("poke"); } return true; };
        a.cfg.onGreet = b.cfg.onGreet = () => true;
        if (target && "IntersectionObserver" in window) {
            let done = false;
            const o = new IntersectionObserver((es) => {
                es.forEach((en) => {
                    if (!en.isIntersecting || done || en.intersectionRatio < 0.35) return;
                    done = true; o.disconnect();
                    setTimeout(() => { if (a.alive && !overlayOpen()) { a.mood("happy", 1600); a.hop(16); a.talk("greet"); } }, 900);
                    setTimeout(() => { if (b.alive && !overlayOpen()) { b.mood("wink", 1600); b.talk("greet"); } }, 4200);
                    setTimeout(() => { if (!overlayOpen()) clapBoth(); }, 7600);
                });
            }, { threshold: [0.35, 0.7] });
            o.observe(target);
        }
        const gate = $("#celebrationGate"), input = $("#celebrationName");
        if (gate) {
            let said = 0;
            const gateOpen = () => !gate.hidden && getComputedStyle(gate).display !== "none";
            new MutationObserver(() => { if (gateOpen() && now() - said > 30000 && !overlayOpen()) { said = now(); a.mood("cheer", 1800); a.fx("spark", 3); a.talk("gate", 5200); } })
                .observe(gate, { attributes: true, attributeFilter: ["hidden", "class", "style"] });
        }
        if (input) {
            let f = 0, t = 0;
            input.addEventListener("focus", () => { if (now() - f > 20000 && a.visible) { f = now(); a.lookAtPoint(ptr.x, ptr.y, 2500); a.mood("wink", 1500); a.talk("focus"); } });
            input.addEventListener("input", () => { if (now() - t > 14000 && a.visible && input.value.trim()) { t = now(); a.mood("love", 1400); a.fx("heart", 2); a.talk("typed"); } });
        }
    }

    /* --- 09g. Egg ditemukan: maskot terdekat ikut senang --- */
    function foundCount() { try { return JSON.parse(sessionStorage.getItem("alpFound") || "[]").length; } catch (e) { return 0; } }
    function eggFound() {
        if (overlayOpen()) return;
        const mid = innerHeight / 2;
        let best = null, bd = 1e9;
        registry.forEach((m) => {
            if (!m.visible || m.locked || !m.alive || m.cfg.cel || m.id.indexOf("wander") === 0 || m.id.indexOf("gate-") === 0) return;
            const r = m.el.getBoundingClientRect();
            const d = Math.abs(r.top - mid);
            if (d < bd) { bd = d; best = m; }
        });
        if (!best) return;
        const n = foundCount();
        const E = LINES.eggs;
        const pool = n >= 11 ? E.n11 : n === 10 ? E.n10 : n === 6 ? E.n6 : n === 3 ? E.n3 : E.any;
        best.mood("cheer", 1900);
        best.hop(22);
        best.fx("spark", 3);
        best.say(bag("eggs:" + (n >= 11 ? 11 : n), pool));
    }
    function wireEggs() {
        doc.addEventListener("alp:egg-open", () => { registry.forEach((m) => m.hush()); });
        doc.addEventListener("alp:celebration-open", () => { registry.forEach((m) => m.hush()); });
        doc.addEventListener("alp:egg-close", () => { setTimeout(eggFound, 950); });
    }

    /* --- 09h. Tombol MASUK: judul ikut menyemangati --- */
    function wireEnter() {
        const btn = $("#enterButton");
        if (!btn || !Title.moon) return;
        let last = 0;
        btn.addEventListener("pointerenter", (e) => {
            if (e.pointerType && e.pointerType !== "mouse") return;
            const m = Title.moon;
            if (Title.state !== "home" || now() - last < 26000 || !m.visible || m.bubble.classList.contains("is-on")) return;
            last = now();
            m.mood("happy", 1600); m.say(bag("t:enter", LINES.titleMoon.enter));
            if (Title.star) Title.star.mood("cheer", 1600);
        });
    }

    /* 10. BINTANG JATUH BERWAJAH */
    function wanderer() {
        const sky = doc.createElement("div");
        sky.className = "mk-sky";
        sky.setAttribute("aria-hidden", "true");
        doc.body.appendChild(sky);
        let n = 0, active = false;
        const next = (first) => setTimeout(spawn, first ? rand(22000, 36000) : rand(42000, 80000));

        function spawn() {
            if (active) return next();
            if (reduced() || doc.hidden || overlayOpen() || !Title.ready) return setTimeout(spawn, 9000);
            active = true;
            const vw = doc.documentElement.clientWidth, vh = innerHeight;
            const dir = chance(0.5) ? 1 : -1;
            const y0 = rand(0.1, 0.42) * vh, y1 = y0 + rand(0.14, 0.3) * vh;
            const x0 = dir > 0 ? -70 : vw + 70, x1 = dir > 0 ? vw + 70 : -70;
            const m = new Mascot({ id: "wander-" + (++n), kind: "star", lines: LINES.wander, base: { eyes: "happy", mouth: "laugh", arms: "up" } }).mount(sky);
            m.section = null;
            m.setScale(0.62);
            m.setPos(x0, y0);
            m.visible = true;
            m.locked = true;
            m.greeted = true;
            const tail = doc.createElement("i");
            tail.className = "mk-wtail";
            tail.style.setProperty("--ang", (Math.atan2(y1 - y0, x1 - x0) * 180 / Math.PI) + "deg");
            m.box.insertBefore(tail, m.box.firstChild);
            m.el.style.pointerEvents = "none";
            const dur = rand(9000, 13000);
            const anim = m.el.animate([{ transform: "translate(0,0)" }, { transform: "translate(" + (x1 - x0) + "px," + (y1 - y0) + "px)" }], { duration: dur, easing: "linear", fill: "forwards" });
            let caught = false;
            const finish = () => { if (m.alive) m.destroy(); active = false; next(); };
            anim.onfinish = finish;
            m.cfg.onPoke = () => {
                if (caught) return true;
                caught = true;
                anim.pause();
                m.mood("wow", 1000);
                m.fx("bang", 1);
                m.fx("spark", 4);
                m.hop(20);
                m.say(bag("wd:caught", LINES.wander.caught), 4200);
                setTimeout(() => {
                    if (!m.alive) return;
                    m.mood("cheer", 1600);
                    m.say(bag("wd:bye", LINES.wander.bye), 3000);
                    m.fx("star", 3);
                    setTimeout(() => { if (m.alive) anim.play(); }, 1900);
                }, 4300);
                return true;
            };
            m.cfg.onHover = () => true;
            setTimeout(() => { if (m.alive && !caught && !overlayOpen()) { m.say(bag("wd:hi", LINES.wander.hi), 2600); } }, 1600);
            setTimeout(() => { m.el.style.pointerEvents = ""; }, 400);
        }
        window.__alpMascot.spawnWander = spawn;
        next(true);
    }

    /* 11. BOOT */
    function boot() {
        try { start(); } catch (e) { console.warn("[A Little Pause] maskot tidak aktif:", e); }
    }
    function start() {
        if (!doc.getElementById("mkDefs")) doc.body.insertAdjacentHTML("afterbegin", DEFS);
        window.addEventListener("pointermove", onPointer, { passive: true });

        const t = Title.init();
        if (t) {
            watch(t.moon); watch(t.star);
            t.moon.cfg.idle.push("quip", "quip");
            t.star.cfg.idle.push("quip");
        }

        CAST.forEach((r) => {
            const sec = $(r.sec);
            if (!sec) return;
            const m = new Mascot(r).mount(sec);
            watch(m);
            m.startIdle();
        });
        layoutCast();

        wireBreath(); wireSleepyStar(); wireThings(); wireCanvas(); wireShy(); wireEnding(); wireEggs(); wireEnter();
        wanderer();

        const ro = "ResizeObserver" in window ? new ResizeObserver(scheduleLayout) : null;
        CAST.forEach((r) => { const s = $(r.sec); if (s && ro) ro.observe(s); });
        window.addEventListener("resize", scheduleLayout, { passive: true });
        window.addEventListener("load", () => setTimeout(layoutCast, 300));
        if (doc.fonts && doc.fonts.ready) doc.fonts.ready.then(() => setTimeout(layoutCast, 200));
        window.__alpMascot.title = Title;
        window.__alpMascot.layout = layoutCast;
    }


    /* 12. PERAYAAN: maskot gerbang & kru tirai (dipakai js/Celebration.js lewat window.ALPMascot) */
    const ensureDefs = () => { if (!doc.getElementById("mkDefs") && doc.body) doc.body.insertAdjacentHTML("afterbegin", DEFS); };
    const el$ = (cls, tag) => { const e = doc.createElement(tag || "i"); e.className = cls; return e; };

    /* --- 12a. Gerbang: Bulan + Bintang kecil menemani orang mengetik nama. Tiga suasana: short (nama belum cukup), user (nama biasa), bulan (nama istimewa) --- */
    const GATE_POKE = {
        short: ["Eh, aku bukan gembok. Tapi aku ikut deg-degan.", "Ketik dulu, baru colek aku, ya.", "Tambah huruf, jangan tambah colekan. Hehe.", "Aku sabar kok. Sabar itu pekerjaanku."],
        user: ["Hehe, geli! Tombolnya di bawah, lho.", "Aku penjaga tirai, bukan tombol. Tapi lanjut aja.", "Satu colekan lagi dan naskahku bisa lupa.", "Semangat, {nama}! Tirainya sudah nggak sabar."],
        bulan: ["Eh! Jangan colek terus, nanti pipiku merah beneran.", "Aku lagi gugup. Colekan tadi nggak membantu. (tapi suka)", "Tombolnya di bawah, {nama}. Aku cuma pajangan lucu.", "Kamu lucu. Eh, maksudku: tombolnya, dong."]
    };
    const GATE_IDLE = {
        short: { moon: ["look", "nod", "cheek", "blink2", "giggle", "look"], star: ["snooze", "stir", "snooze", "blink2"] },
        user: { moon: ["blink2", "wave", "hop", "giggle", "sparkle", "look", "dance", "nod"], star: ["blink2", "twirl", "sparkle", "look", "wave", "blep"] },
        bulan: { moon: ["blink2", "love", "sparkle", "giggle", "cheek", "dance", "wave", "nod"], star: ["blink2", "twirl", "love", "sparkle", "wave", "cheek"] }
    };
    const GATE_BASE = {
        short: { moon: { eyes: "open", mouth: "small", arms: "lean", cheek: "", fx: "" }, star: { eyes: "closed", mouth: "small", arms: "down", cheek: "", fx: "" } },
        user: { moon: { eyes: "open", mouth: "smile", arms: "up", cheek: "", fx: "" }, star: { eyes: "open", mouth: "smile", arms: "mid", cheek: "", fx: "" } },
        bulan: { moon: { eyes: "open", mouth: "cat", arms: "up", cheek: "blush", fx: "" }, star: { eyes: "open", mouth: "smile", arms: "mid", cheek: "blush", fx: "" } }
    };

    function attachGate(holder, hooks) {
        ensureDefs();
        holder.classList.add("mk-gate");
        const G = { mode: "", moon: null, star: null, shown: false, built: "", lastType: 0, talkT: 0, lastCheer: 0 };
        const dims = () => (innerWidth < 480 ? { s: 0.6, w: 118, h: 88 } : { s: 0.72, w: 134, h: 100 });
        const nameNow = () => { try { return (hooks && hooks.name && hooks.name()) || "kamu"; } catch (e) { return "kamu"; } };
        const fill = (t) => t.replace(/\{nama\}/gi, nameNow());

        function layout() {
            const d = dims();
            holder.style.setProperty("--gw", d.w + "px");
            holder.style.setProperty("--gh", d.h + "px");
            if (G.moon) { G.moon.setScale(d.s); G.moon.setPos(d.w * 0.4, d.h - 3); }
            if (G.star) { G.star.setScale(d.s * 0.84); G.star.setPos(d.w * 0.87, d.h - 9); }
        }
        function kill() {
            clearInterval(G.talkT);
            [G.moon, G.star].forEach((m) => { if (m) m.destroy(); });
            G.moon = G.star = null;
        }
        function poke(m) {
            const list = m.kind === "star" ? REACT_STAR : REACT_MOON;
            const fn = REACT[bag("gate:react:" + m.id, list)];
            if (fn) fn(m);
            if (chance(0.7)) m.say(fill(bag("gate:poke:" + (G.mode || "user"), GATE_POKE[G.mode || "user"])), 3200);
            return true;
        }
        function build(bulan) {
            kill();
            G.moon = new Mascot({ id: "gate-moon", kind: "moon", crescent: bulan, cloud: bulan, float: bulan, idleGap: [3400, 7200], onGreet: () => true, onPoke: poke, onHover: () => false }).mount(holder);
            G.star = new Mascot({ id: "gate-star", kind: "star", idleGap: [4200, 8200], onGreet: () => true, onPoke: poke, onHover: () => false }).mount(holder);
            G.built = bulan ? "bulan" : "plain";
            layout();
            watch(G.moon); watch(G.star);
            G.moon.startIdle(); G.star.startIdle();
        }
        function pop() {
            [G.moon, G.star].forEach((m, i) => {
                if (!m) return;
                play(m.sq, [{ transform: "scale(.35)" }, { transform: "scale(1.18,.86)", offset: 0.55 }, { transform: "scale(1)" }], { duration: 560, delay: i * 100, easing: "cubic-bezier(.3,1.4,.5,1)" });
            });
            if (G.moon) G.moon.fx("star", 2, { py: 80 });
        }

        G.setMode = (mode) => {
            if (!mode) return;
            const bulan = mode === "bulan";
            const prev = G.mode;
            G.mode = mode;
            const fresh = !G.moon || (G.built === "bulan") !== bulan;
            if (fresh) build(bulan);
            const b = GATE_BASE[mode], idle = GATE_IDLE[mode];
            G.moon.base = Object.assign({}, b.moon); G.star.base = Object.assign({}, b.star);
            G.moon.cfg.idle = idle.moon; G.star.cfg.idle = idle.star;
            G.moon.rest(); G.star.rest();
            if (fresh && G.shown) pop();
            if (prev && prev !== mode && !fresh) {
                if (prev === "short") { G.ok(); }
                else if (mode === "short") { G.moon.mood("sad", 1400); G.moon.shake(3); G.star.mood("ouch", 1000); }
            } else if (prev && fresh) {
                G.moon.fx("ring", 1, { py: 50 });
                if (prev === "short") G.ok();
            }
        };
        G.show = () => { G.shown = true; layout(); if (G.moon) pop(); };
        G.hide = () => { G.shown = false; };

        /* tiap huruf diketik: mata menengok ke kolom nama, badan ikut mengangguk kecil */
        G.type = () => {
            const m = G.moon, t = now();
            if (!m || !G.shown || t - G.lastType < 240) return;
            G.lastType = t;
            m.lookTo(0.2, -0.85, 1100);
            if (G.mode === "short") m.nod(); else m.hop(5);
            if (chance(0.3)) m.fx("star", 1, { py: 86 });
            if (G.star && chance(0.25)) G.star.lookTo(-0.4, -0.7, 900);
        };
        /* kursor di tombol masuk */
        G.cheer = () => {
            const m = G.moon, s = G.star, t = now();
            if (!m || !G.shown || t - G.lastCheer < 1800) return;
            G.lastCheer = t;
            m.lookTo(0, 0.95, 1500);
            if (G.mode === "short") { m.mood("puff", 1500); m.nod(); if (s) s.mood("ouch", 900); return; }
            m.mood("cheer", 1600); m.hop(18); m.fx("spark", 3);
            if (s) { s.mood("cheer", 1600); s.spin(1, 700); }
            if (G.mode === "bulan") m.fx("heart", 2);
        };
        /* tombol digembok tapi diklik */
        G.tease = () => {
            const m = G.moon, s = G.star;
            if (!m || !G.shown) return;
            m.mood("wow", 1300); m.shake(5); m.fx("bang", 2); m.lookTo(0, 0.9, 1200);
            if (s) { s.mood("giggle", 1500); s.wiggle(8, 3); }
        };
        /* gembok baru lepas */
        G.ok = () => {
            const m = G.moon, s = G.star;
            if (!m || !G.shown) return;
            m.mood("cheer", 2000); m.hop(24, 640); m.fx("spark", 5); m.fx("star", 2);
            if (s) { s.mood("cheer", 2000); s.spin(1, 760); }
            if (G.mode === "bulan") m.fx("heart", 3);
        };
        /* saat kalimat di gelembung berganti: mulut ikut bergerak */
        G.talk = (ms) => {
            const m = G.moon;
            if (!m || !G.shown || reduced()) return;
            clearInterval(G.talkT);
            let on = false, n = 0;
            const max = Math.max(2, Math.round((ms || 1200) / 170));
            G.talkT = setInterval(() => {
                if (!m.alive) { clearInterval(G.talkT); return; }
                n++; on = !on;
                if (n > max) { clearInterval(G.talkT); m.rest(); return; }
                m.set({ mouth: on ? "o" : "smile" });
            }, 170);
        };
        window.addEventListener("resize", () => { layout(); }, { passive: true });
        return G;
    }

    /* --- 12b. Tirai: Bulan dan Bintang bertengkar kecil bergiliran (satu bicara, yang lain diam), baru "siap-siap" dan hitung mundur --- */
    const CREW_SEC = 30; /* cadangan lama pertengkaran (detik); nilai sebenarnya dihitung dari panjang kalimat */
    const CREW_READ = { base: 900, perChar: 38, min: 2000, max: 6000, gap: 0.25 }; /* lama gelembung = base + perChar x jumlah huruf (ms); ubah angka ini untuk mempercepat atau memperlambat */
    const CREW_LINES = {
        enter: ["Halo, {nama}! Tirainya biar aku yang buka, ya.", "Psst, {nama}. Tirainya biar aku yang buka, ya."],
        ghost: "Mmph! Jangan dibuka dulu, aku belum dandan!",
        wow: "Hah?! Siapa di dalam tirai?!",
        hide: "Bukan siapa-siapa. Cuma kain yang bisa ngomong.",
        demand: "Kain nggak punya suara seimut itu. Keluar, Bintang!",
        nibble: "Nggak mau. Aku lagi nyicip kembang apinya, dikit.",
        krupuk: "Itu bukan kerupuk, Bintang!",
        hungry: "Habis, laparku besar, badanku kecil.",
        tug1: "Satu\u2026 dua\u2026",
        tug2: "Eh eh eh! Pelan-pelan, aku geli!",
        dizzy: ["Aduh\u2026 gelap banget. Saklarnya di mana?", "Aku cuma mastiin semuanya bersinar buat {nama}\u2026 dan nyicip dikit."],
        serious: "Sudah, sudah. Malam ini nggak boleh ada yang nyangkut.",
        ready: "Pegangan dulu. Ini agak megah, dan sedikit norak.",
        starReady: "Siap!",
        pull: "TARIK!",
        away: "Selamat menikmati, {nama}!"
    };

    const Crew = (() => {
        const C = { on: false, root: null, moon: null, star: null, seam: null, timers: [], bulan: false, name: "", W: 0, H: 0, k: 1, gy: 0, sx: 0, curt: [], total: 0 };
        const pickL = (v) => (Array.isArray(v) ? v[C.bulan ? 1 : 0] : v);
        const nm = (t) => t.replace(/\{nama\}/gi, C.name || "kamu");
        const T = (fn, sec) => {
            const id = setTimeout(() => { if (C.on) { try { fn(); } catch (e) { /* abaikan */ } } }, sec * 1000);
            C.timers.push(id);
            return id;
        };
        const say = (m, t, ms) => { if (m && m.alive) m.say(nm(pickL(t)), ms); };
        const readMs = (t) => clamp(CREW_READ.base + CREW_READ.perChar * nm(pickL(t)).length, CREW_READ.min, CREW_READ.max);
        const moonX = () => C.sx - 88 * C.k;
        const starX = () => C.sx + 88 * C.k;

        function metrics() {
            C.W = C.root.clientWidth || innerWidth;
            C.H = C.root.clientHeight || innerHeight;
            C.k = clamp(Math.min(C.W / 560, C.H / 640), 0.82, 1.2);
            C.gy = Math.min(C.H * 0.8, C.H - 112);
            C.sx = C.W / 2;
        }

        function tug(level) {
            const amt = [5, 10, 20][level - 1];
            const dur = level === 3 ? 780 : 580;
            const L = C.curt[0], R = C.curt[1];
            const fl = (sign) => [
                { transform: "translateX(0)" },
                { transform: "translateX(" + (sign * amt) + "%)", offset: 0.28 },
                { transform: "translateX(" + (-sign * 0.8) + "%)", offset: 0.62 },
                { transform: "translateX(0)" }
            ];
            if (L) play(L, fl(-1), { duration: dur, easing: "cubic-bezier(.3,.7,.4,1)" });
            if (R) play(R, fl(1), { duration: dur, easing: "cubic-bezier(.3,.7,.4,1)" });
            if (C.seam) play(C.seam, [{ opacity: 0 }, { opacity: 0.5 + level * 0.16, offset: 0.28 }, { opacity: 0 }], { duration: dur });
            C.moon.wiggle(6 + level * 2, 2, dur);
            C.star.shake(3 + level * 1.5, dur);
            C.moon.fx(level === 3 ? "bang" : "spark", level);
        }

        function popOut() {
            const m = C.moon, s = C.star;
            s.el.classList.remove("is-ghost");
            s.mood("dizzy", 2000);
            s.squish(520);
            s.fx("ring", 1, { py: 50 });
            s.fx("spark", 4);
            m.mood("dizzy", 1800);
            m.spin(1, 760);
            m.fx("star", 3);
            m.moveTo(moonX(), C.gy, { h: 16 * C.k, ms: 620 });
            s.moveTo(starX(), C.gy, { h: 24 * C.k, ms: 700 });
        }

        function start(o) {
            cancel();
            if (!o || !o.root) return;
            ensureDefs();
            C.on = true;
            C.root = o.root;
            C.name = o.name || "";
            C.bulan = Boolean(o.bulan);
            metrics();
            const R = C.root;
            C.curt = $$(".cel-curtain", R);
            C.seam = el$("cel-seam");
            R.appendChild(C.seam);

            const common = { cel: true, bubble: ["above", "below"], onGreet: () => true, onHover: () => true };
            C.moon = new Mascot(Object.assign({ id: "crew-moon", kind: "moon", crescent: C.bulan, cloud: C.bulan, base: { eyes: "open", mouth: "smile", arms: "up", cheek: "", fx: "" },
                onPoke: (m) => { m.hop(16); m.mood("giggle", 900); return true; } }, common)).mount(R);
            C.star = new Mascot(Object.assign({ id: "crew-star", kind: "star", base: { eyes: "open", mouth: "smile", arms: "mid", cheek: "", fx: "" },
                onPoke: (m) => { m.hop(18); m.mood("wink", 900); return true; } }, common)).mount(R);
            [C.moon, C.star].forEach((m) => {
                m.setScale(C.k * (m.kind === "star" ? 1.08 : 1));
                m.visible = true; m.greeted = true; m.locked = true;
                m.el.style.zIndex = "6";
            });
            C.moon.setPos(moonX(), C.H + 150);
            C.star.setPos(C.sx + 150 * C.k, C.gy - 26 * C.k);
            C.star.el.classList.add("is-ghost", "is-hidden"); /* Bintang bersembunyi di balik tirai: hanya tonjolannya yang terlihat */
            C.star.box.appendChild(el$("mk-bump"));

            const m = C.moon, s = C.star, L = CREW_LINES;
            const seamX = () => C.sx + 24 * C.k;

            /* naskah: tiap langkah = siapa yang bicara, kalimatnya, dan aksi kecil sebelum bicara; langkah berjalan berurutan, tidak pernah tumpang tindih */
            const SCRIPT = [
                { w: m, t: L.enter, go: () => m.mood("happy", 1500) },
                { w: s, t: L.ghost, go: () => {
                    C.root.classList.add("is-fuss");
                    s.el.classList.remove("is-hidden");
                    s.travel(C.sx + 40 * C.k, C.gy - 26 * C.k, { h: 20 * C.k, ms: 760 });
                    m.lookTo(0.9, -0.1, 2400);
                } },
                { w: m, t: L.wow, go: () => { m.mood("wow", 1500); m.fx("bang", 1); s.travel(C.sx + 120 * C.k, C.gy - 20 * C.k, { h: 16 * C.k, ms: 600 }); } },
                { w: s, t: L.hide, go: () => { s.travel(seamX(), C.gy - 26 * C.k, { h: 14 * C.k, ms: 520 }); s.wiggle(6, 2, 700); } },
                { w: m, t: L.demand, go: () => { m.mood("puff", 2400); m.fx("ask", 1); m.travel(C.sx - 50 * C.k, C.gy, { h: 14 * C.k, ms: 520 }); } },
                { w: s, t: L.nibble, go: () => { s.hop(10 * C.k, 460); s.wiggle(5, 2, 600); } },
                { w: m, t: L.krupuk, go: () => { m.mood("angry", 1800); m.shake(5); m.fx("bang", 2); } },
                { w: s, t: L.hungry, go: () => { s.hop(12 * C.k, 520); m.mood("giggle", 1400); } },
                { w: m, t: L.tug1, ms: 1500, go: () => { m.mood("hold", 1500); tug(1); } },
                { w: s, t: L.tug2, ms: 1700, go: () => tug(2) },
                { w: s, t: L.dizzy, go: () => { tug(3); popOut(); } },
                { w: m, t: L.serious, go: () => { C.root.classList.remove("is-fuss"); m.mood("talk", 1500); } }
            ];

            let at = 1.0; /* bulan masuk dulu sebelum bicara */
            T(() => m.travel(moonX(), C.gy, { h: 50 * C.k, ms: 900 }), 0.2);
            SCRIPT.forEach((step) => {
                const ms = step.ms || readMs(step.t);
                const who = step.w, other = who === m ? s : m;
                T(() => {
                    other.hush();
                    if (step.go) step.go();
                    say(who, step.t, ms);
                }, at);
                at += ms / 1000 + CREW_READ.gap;
            });
            C.total = at;
        }

        function ready() {
            if (!C.on) return;
            const m = C.moon, s = C.star;
            s.hush();
            m.mood(C.bulan ? "love" : "cheer", 2400); s.mood("cheer", 2400);
            m.hop(14 * C.k); s.hop(16 * C.k);
            if (C.bulan) m.fx("heart", 3);
            say(m, CREW_LINES.ready, 3200);
            T(() => say(s, CREW_LINES.starReady, 1100), 0.9);
        }
        function tick(n) {
            if (!C.on) return;
            const m = C.moon, s = C.star;
            m.hop(11 * C.k, 480); s.hop(13 * C.k, 480);
            if (n === 3) { /* apit tirai: berdiri di kiri dan kanan celah */
                m.moveTo(C.sx - 120 * C.k, C.gy, { h: 10 * C.k, ms: 520 });
                s.moveTo(C.sx + 120 * C.k, C.gy, { h: 10 * C.k, ms: 520 });
            }
            if (n === 1) { m.set({ arms: "up", eyes: "open", mouth: "smile" }); s.set({ arms: "up", eyes: "open", mouth: "smile" }); }
        }
        function pull() {
            if (!C.on) return;
            const m = C.moon, s = C.star;
            m.tiltTo(-14); s.tiltTo(14);
            m.set({ eyes: "squint", mouth: "o", arms: "up" }); s.set({ eyes: "squint", mouth: "o", arms: "up" });
            say(m, CREW_LINES.pull, 1000);
        }
        function away() {
            if (!C.on) return;
            const m = C.moon, s = C.star;
            m.tiltTo(0); s.tiltTo(0);
            m.mood("cheer", 0); s.mood("love", 0);
            m.fx("spark", 4); s.fx("heart", 3);
            say(m, CREW_LINES.away, 2800);
            T(() => {
                m.hush(); s.hush();
                [m, s].forEach((mm, i) => {
                    play(mm.el, [{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: "translate(" + (-C.W * 0.34) + "px," + (-C.H * 0.64) + "px) scale(.3)", opacity: 0 }],
                        { duration: 1800 + i * 200, delay: i * 140, easing: "cubic-bezier(.5,0,.3,1)", fill: "forwards" });
                });
            }, 1.8);
            T(() => cancel(), 4.4);
        }
        function cancel() {
            C.on = false;
            C.timers.forEach((id) => clearTimeout(id));
            C.timers = [];
            [C.moon, C.star].forEach((m) => { if (m && m.destroy) m.destroy(); });
            C.moon = C.star = null;
            if (C.seam) { C.seam.remove(); C.seam = null; }
            if (C.root) C.root.classList.remove("is-fuss");
        }

        return { supported: () => true, start, ready, tick, pull, away, cancel, duration: () => C.total || CREW_SEC };
    })();

    window.ALPMascot = {
        ensureDefs,
        gate: { supported: () => true, attach: attachGate },
        crew: Crew
    };

    if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", boot);
    else boot();
})();