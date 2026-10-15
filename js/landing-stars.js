document.addEventListener("DOMContentLoaded", () => {
    /* LANDING STARS: status siap + pemisah bintang dekoratif/egg (pointer diatur main.js) */

    /* 01. ELEMEN */
    const landing = document.getElementById("landing");
    const stars = document.querySelectorAll(".ambient-star");

    if (!landing || !stars.length) {
        return;
    }

    /* 02. LANDING READY (class stars-ready untuk CSS) */
    requestAnimationFrame(() => {
        landing.classList.add("stars-ready");
    });

    /* 03. BINTANG DEKORATIF vs INTERAKTIF (hanya .egg-trigger yang jadi egg) */
    stars.forEach((star) => {
        const isInteractive = star.classList.contains("egg-trigger");

        if (isInteractive) {
            star.setAttribute("aria-hidden", "false");
            return;
        }

        star.setAttribute("aria-hidden", "true");
    });

    /* 04. POINTER: jangan tambah listener di sini, sudah ditangani main.js */

    /* 05. REDUCED MOTION */
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReducedMotion = () => {
        landing.classList.toggle("reduced-motion", reducedMotion.matches);
    };

    syncReducedMotion();

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", syncReducedMotion);
    }
});

/* REVISI 8: efek langit di semua halaman (gaya ada di css/style.css, REVISI 8 bagian 3) */
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".section");
    if (!sections.length) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.matchMedia("(max-width: 700px)").matches;
    const mid = !small && window.matchMedia("(max-width: 1100px) and (pointer: coarse)").matches; /* tablet */
    const finePointer = window.matchMedia("(pointer: fine)").matches;

    const rand = (a, b) => Math.random() * (b - a) + a;
    const pick = (list) => list[Math.floor(Math.random() * list.length)];
    const count = (n) => Math.max(0, Math.round(n * (small ? 0.6 : mid ? 0.8 : 1)));
    const px = (n) => n.toFixed(1) + "px";

    /* suasana tiap halaman */
    const MOODS = {
        "landing":        { glint: 12, dust: 9,  fly: 0, shoot: [5000, 11000] },
        "pause":          { glint: 9,  dust: 8,  fly: 0, shoot: [9000, 18000], breath: true },
        "little-things":  { glint: 8,  dust: 5,  fly: 9, shoot: null },
        "canvas-section": { glint: 10, dust: 6,  fly: 0, shoot: [8000, 16000] },
        "hidden-note":    { glint: 9,  dust: 9,  fly: 3, shoot: [7000, 15000] },
        "ending":         { glint: 13, dust: 12, fly: 5, shoot: [4500, 10000] }
    };
    const DEFAULT_MOOD = { glint: 8, dust: 6, fly: 0, shoot: [9000, 16000] };

    /* lebih banyak di sisi kiri/kanan supaya teks tengah tetap enak dibaca */
    const edgeX = () => {
        if (Math.random() < 0.55) return Math.random() < 0.5 ? rand(2, 24) : rand(76, 98);
        return rand(2, 98);
    };

    const add = (layer, cls, vars) => {
        const el = document.createElement("span");
        el.className = cls;
        el.setAttribute("aria-hidden", "true");
        Object.keys(vars).forEach((k) => el.style.setProperty(k, vars[k]));
        layer.appendChild(el);
        return el;
    };

    /* bangun lapisan */
    const states = new Map();

    sections.forEach((section) => {
        const mood = MOODS[section.id] || DEFAULT_MOOD;
        const layer = document.createElement("div");
        layer.className = "fx-layer";
        layer.setAttribute("aria-hidden", "true");

        if (mood.breath) add(layer, "fx-breath", {});

        for (let i = 0; i < count(mood.dust); i++) {
            add(layer, "fx-dust", {
                "--x": rand(2, 98).toFixed(1) + "%",
                "--y": rand(25, 100).toFixed(1) + "%",
                "--s": px(rand(6, 16)),
                "--dx": px(rand(-40, 40)),
                "--dy": px(-rand(60, 160)),
                "--t": rand(9, 18).toFixed(1) + "s",
                "--d": (-rand(0, 14)).toFixed(1) + "s"
            });
        }

        for (let i = 0; i < count(mood.fly); i++) {
            add(layer, "fx-fly", {
                "--x": edgeX().toFixed(1) + "%",
                "--y": rand(15, 92).toFixed(1) + "%",
                "--s": px(rand(3.5, 6.5)),
                "--x1": px(rand(-60, 60)), "--y1": px(rand(-50, 30)),
                "--x2": px(rand(-70, 70)), "--y2": px(rand(-60, 20)),
                "--x3": px(rand(-40, 40)), "--y3": px(rand(-30, 30)),
                "--t": rand(13, 22).toFixed(1) + "s",
                "--d": (-rand(0, 18)).toFixed(1) + "s"
            });
        }

        for (let i = 0; i < count(mood.glint); i++) {
            add(layer, "fx-glint", {
                "--x": edgeX().toFixed(1) + "%",
                "--y": rand(3, 97).toFixed(1) + "%",
                "--s": px(rand(8, 20)),
                "--c": Math.random() < 0.2 ? "rgba(223, 232, 255, 0.9)" : "rgba(255, 236, 196, 0.95)",
                "--t": rand(3.4, 6.8).toFixed(1) + "s",
                "--d": (-rand(0, 7)).toFixed(1) + "s"
            });
        }

        section.insertBefore(layer, section.firstChild);
        states.set(section, { layer, mood, on: false, timer: 0, first: true });
    });

    /* bintang jatuh */
    const shoot = (s) => {
        const rect = s.layer.getBoundingClientRect();
        const w = rect.width;
        const h = rect.height;
        if (!w || !h) return;

        /* hanya di bagian section yang sedang terlihat */
        const visTop = Math.max(0, -rect.top);
        const visBot = Math.min(h, window.innerHeight - rect.top);
        if (visBot - visTop < 80) return;

        const dir = Math.random() < 0.5 ? 1 : -1;
        const a = rand(16, 32) * Math.PI / 180;
        const dist = rand(280, 460) * (small ? 0.7 : 1);
        const dx = dir * dist * Math.cos(a);
        const dy = dist * Math.sin(a);

        const el = add(s.layer, "fx-shoot", {
            "--x": px(dir > 0 ? rand(0.04, 0.5) * w : rand(0.5, 0.96) * w),
            "--y": px(visTop + rand(0.06, 0.45) * (visBot - visTop)),
            "--len": px(rand(90, 150)),
            "--dx": px(dx),
            "--dy": px(dy),
            "--a": (Math.atan2(dy, dx) * 180 / Math.PI).toFixed(1) + "deg",
            "--t": rand(1.1, 1.8).toFixed(2) + "s"
        });
        el.addEventListener("animationend", () => el.remove());
    };

    const arm = (s) => {
        clearTimeout(s.timer);
        if (!s.on || !s.mood.shoot || reduced) return;
        const wait = s.first ? rand(1800, 4200) : rand(s.mood.shoot[0], s.mood.shoot[1]);
        s.first = false;
        s.timer = setTimeout(() => {
            if (s.on && !document.hidden) shoot(s);
            arm(s);
        }, wait);
    };

    const setOn = (s, on) => {
        s.on = on;
        s.layer.classList.toggle("is-fx-on", on);
        if (on) arm(s); else clearTimeout(s.timer);
    };

    /* hemat tenaga: jalan hanya saat section terlihat */
    if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const s = states.get(entry.target);
                if (s) setOn(s, entry.isIntersecting);
            });
        }, { threshold: 0.12 });
        states.forEach((s, section) => io.observe(section));
    } else {
        states.forEach((s) => setOn(s, true));
    }

    /* KILAU KECIL DI KURSOR / SENTUHAN (tidak muncul di canvas, muncul di popup egg) */
    if (reduced) return;

    const host = document.createElement("div");
    host.className = "fx-trail-host";
    host.setAttribute("aria-hidden", "true");
    document.body.appendChild(host);

    /* harus di atas popup egg (z-index 9999) dan sheet simpan canvas (10000) */
    host.style.zIndex = "10001";

    /* blokir hanya canvas, kontrolnya, dan sheet simpan; popup egg boleh */
    const isBlocked = (target) => {
        if (!target || !target.closest) return true;
        if (target.closest(".egg-overlay")) return false;
        return !!target.closest(".canvas-stage-wrapper, .canvas-controls, .cvx-sheet");
    };

    const spark = (x, y) => {
        if (host.childElementCount > 40) return;
        const el = document.createElement("span");
        el.className = "fx-tspark";
        el.textContent = pick(["✦", "✧", "✦", "·"]);
        el.style.setProperty("--x", px(x));
        el.style.setProperty("--y", px(y));
        el.style.setProperty("--s", px(rand(8, 16)));
        el.style.setProperty("--dx", px(rand(-24, 24)));
        el.style.setProperty("--dy", px(rand(10, 36)));
        el.style.setProperty("--t", rand(0.7, 1.2).toFixed(2) + "s");
        el.addEventListener("animationend", () => el.remove());
        host.appendChild(el);
    };

    if (finePointer) {
        let lastX = -999;
        let lastY = -999;
        let lastT = 0;
        document.addEventListener("pointermove", (event) => {
            if (event.pointerType !== "mouse") return;
            const now = performance.now();
            if (now - lastT < 55) return;
            const mx = event.clientX - lastX;
            const my = event.clientY - lastY;
            if (mx * mx + my * my < 22 * 22) return;
            if (isBlocked(event.target)) return;
            lastT = now;
            lastX = event.clientX;
            lastY = event.clientY;
            spark(event.clientX, event.clientY);
        }, { passive: true });
    }

    document.addEventListener("pointerdown", (event) => {
        if (isBlocked(event.target)) return;
        if (event.target.closest("[data-egg-id]")) return;
        for (let i = 0; i < 5; i++) spark(event.clientX, event.clientY);
    }, { passive: true });

});