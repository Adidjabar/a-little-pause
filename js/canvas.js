document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("creativeCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const wrap = canvas.closest(".canvas-stage-wrapper");
    const $ = (id) => document.getElementById(id);
    const el = (tag, cls, html) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        if (html != null) e.innerHTML = html;
        return e;
    };

    document.querySelectorAll(".canvas-plus, [data-canvas-plus]")
        .forEach((e) => { e.style.display = ""; });

    const css = el("style");
    css.textContent = `
    .canvas-actions{flex-wrap:wrap}
    .cvx-bar{display:grid;gap:12px;margin-top:14px;padding:14px 16px;border:1px solid var(--line);background:rgba(255,255,255,.015);text-align:left}
    .cvx-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .cvx-info{font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--accent);margin-right:auto;min-width:150px}
    .cvx-bar .canvas-control:disabled{opacity:.3;cursor:not-allowed}
    .cvx-bar .canvas-control.is-on{border-color:rgba(183,165,138,.6);background:var(--accent-soft);color:var(--accent)}
    .cvx-bar .cvx-danger:not(:disabled):hover{border-color:rgba(255,140,140,.6);color:#ffb3b3}
    .cvx-label{font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:var(--muted);opacity:.75;margin-right:4px}
    .cvx-range{display:flex;align-items:center;gap:10px;flex:1 1 200px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
    .cvx-range input{flex:1;accent-color:#b7a58a;min-width:80px}
    .cvx-range input:disabled{opacity:.3}
    .canvas-stage-wrapper canvas{outline:none;-webkit-tap-highlight-color:transparent}
    .cvx-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,12px);padding:11px 22px;background:rgba(14,14,14,.94);border:1px solid rgba(183,165,138,.45);color:#e9e6df;font-size:11px;letter-spacing:.14em;opacity:0;transition:opacity .4s ease,transform .4s ease;z-index:9999;pointer-events:none;text-align:center}
    .cvx-toast.on{opacity:1;transform:translate(-50%,0)}
    @media (max-width:600px){.cvx-bar{padding:12px}.cvx-info{flex-basis:100%}}

    /* palet warna kuas */
    .cvx-pal{display:flex;flex-wrap:wrap;gap:10px;align-items:center;flex:1 1 220px}
    .cvx-pal .canvas-swatch{flex:0 0 auto;display:inline-block;box-sizing:border-box}
    .cvx-pal .cvx-auto{background:linear-gradient(135deg,transparent 45%,rgba(242,240,235,.75) 46%,rgba(242,240,235,.75) 54%,transparent 55%),transparent}
    .cvx-pal .cvx-custom{position:relative;overflow:hidden;background:conic-gradient(#ff6b6b,#ffd166,#a6e05a,#3fd0e0,#7c83ff,#e04f9a,#ff6b6b)}
    .cvx-pal .cvx-custom.is-picked{background:radial-gradient(circle at center,var(--sw) 0 34%,rgba(0,0,0,0) 36%),conic-gradient(#ff6b6b,#ffd166,#a6e05a,#3fd0e0,#7c83ff,#e04f9a,#ff6b6b)}
    .cvx-pal .cvx-custom input{position:absolute;left:-8px;top:-8px;width:calc(100% + 16px);height:calc(100% + 16px);margin:0;padding:0;border:0;opacity:0;cursor:pointer}
    .cvx-wm-note{margin:-6px 0 0;text-align:right;font-size:9px;letter-spacing:.16em;color:var(--muted-dark);line-height:1.8}
    .cvx-wm-note em{font-family:"Cormorant Garamond",Georgia,serif;font-size:12px;letter-spacing:.08em;color:var(--accent)}
    @media (max-width:600px){.cvx-wm-note{text-align:center}}

    /* lembar pratinjau simpan (HP) */
    .cvx-sheet{position:fixed;left:0;top:0;right:0;bottom:0;z-index:10000;display:flex;align-items:center;justify-content:center;padding:18px;background:rgba(6,6,6,.92);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);opacity:0;transition:opacity .35s ease}
    .cvx-sheet.on{opacity:1}
    .cvx-sheet-card{width:min(560px,100%);max-height:100%;display:flex;flex-direction:column;gap:14px;align-items:center;text-align:center;overflow:auto}
    .cvx-sheet-card img{display:block;max-width:100%;max-height:56vh;height:auto;border:1px solid rgba(183,165,138,.3);box-shadow:0 18px 50px rgba(0,0,0,.55);pointer-events:auto;-webkit-touch-callout:default;-webkit-user-select:auto;user-select:auto}
    .cvx-sheet-tip{margin:0;font-size:11px;line-height:1.75;letter-spacing:.06em;color:var(--muted)}
    .cvx-sheet-tip b{color:var(--accent);font-weight:500}
    .cvx-sheet-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
    .cvx-sheet-actions .canvas-action{text-decoration:none;display:inline-flex;align-items:center;justify-content:center}
    `;
    document.head.appendChild(css);

    const TAU = Math.PI * 2;
    const rnd = (a, b) => Math.random() * (b - a) + a;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const pick = (a) => a[Math.floor(Math.random() * a.length)];
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const norm = (a) => { while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU; return a; };
    const lum = (h) => {
        const n = parseInt(h.slice(1), 16);
        return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
    };

    let toastTimer = null;
    const toast = (msg) => {
        let t = document.querySelector(".cvx-toast");
        if (!t) { t = el("div", "cvx-toast"); document.body.appendChild(t); }
        t.textContent = msg;
        requestAnimationFrame(() => t.classList.add("on"));
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => t.classList.remove("on"), 2300);
    };

    let W = 800, H = 500, dpr = 1;
    const S = {
        bgKind: "solid", bgColor: "#0b0b0b", bgGrad: null, stars: [],
        grain: true, vignette: true, frame: false
    };
    const objects = [];
    let sel = [];
    let currentColor = null, brushColor = null;
    let brush = false, brushStyle = "garis", multi = false;
    let mode = null, g = null, marquee = null, activeStroke = null, lastDot = null;
    let fade = 1, pending = null, recTimer = null, wheelTimer = null, lastK = -1;
    const undoS = [], redoS = [];

    const FONTS = [
        { n: "Cormorant Garamond", w: 500, k: 1, i: true },
        { n: "Caveat", w: 500, k: 1.3 },
        { n: "Manrope", w: 400, k: 0.5, up: true, ls: "0.28em" }
    ];
    const FILL_ALWAYS = new Set(["star", "moon", "dot", "sparkle", "hill", "cloud", "flower"]);
    const LIGHT = {
        "#f2f0eb": "#2a2622", "#b7a58a": "#8f7650", "#ffe2aa": "#c9953a",
        "#ffb3c7": "#e0758f", "#c9b8ff": "#8e7bd6", "#9fe3ff": "#4aa6c4"
    };
    const isLight = () => S.bgKind === "solid" && lum(S.bgColor) > 0.6;
    const ink = (d) => currentColor || (isLight() && LIGHT[d]) || d;

    const GR = {
        senja: ["#2c1a2e", "#6b3a4a", "#c97b5a"], malam: ["#05060d", "#0c1226", "#131b33"],
        fajar: ["#1c1f33", "#7a6a8a", "#f0c9a0"], samudra: ["#04121f", "#0b3550", "#2a7f8f"],
        mawar: ["#2a1424", "#7a3b5c", "#e8a0a8"], lavender: ["#17132b", "#4b3f78", "#b9a7e8"],
        aurora: ["#040a16", "#0c3f48", "#5fcf9e"]
    };
    const GLOW = {
        senja: "255,190,140", fajar: "255,225,170", mawar: "255,200,200", aurora: "110,255,200",
        lavender: "215,195,255", samudra: "120,220,230", malam: "110,130,255"
    };
    const STARRY = new Set(["malam", "aurora", "lavender", "samudra"]);

    const WORDS = [
        "sebuah jeda", "pelan saja", "aku di sini", "cukup", "sejenak", "tidak apa-apa",
        "breathe", "pulang sebentar", "hari ini sudah cukup", "pelan-pelan juga sampai",
        "bulan saja istirahat", "it's okay", "kamu sudah hebat", "tidak harus kuat terus"
    ];

    const addBtn = (parent, label, attrs, cls = "canvas-control") => {
        const b = el("button", cls, label);
        b.type = "button";
        Object.entries(attrs || {}).forEach(([k, v]) => b.setAttribute(k, v));
        parent.appendChild(b);
        return b;
    };

    const firstBg = document.querySelector("[data-background]");
    if (firstBg) {
        [["#efe8da", "Kertas"], ["#14213d", "Tinta"], ["#1f2d26", "Lumut"]].forEach(([c, n]) => {
            const b = addBtn(firstBg.parentElement, `<span class="color-dot" style="background:${c}"></span>${n}`, { "data-background": c });
            b.querySelector(".color-dot").style.background = c;
        });
    }
    const firstGrad = document.querySelector("[data-gradient]");
    if (firstGrad) {
        [["samudra", "Samudra"], ["mawar", "Mawar"], ["lavender", "Lavender"], ["aurora", "Aurora"]]
            .forEach(([k, n]) => addBtn(firstGrad.parentElement, n, { "data-gradient": k }));
    }

    const moreBox = $("addMoon") ? $("addMoon").parentElement : null;
    const NEW_SHAPES = [
        ["heart", "+ Hati"], ["sparkle", "+ Kilau"], ["cloud", "+ Awan"], ["flower", "+ Bunga"],
        ["sun", "+ Matahari"], ["hill", "+ Bukit"], ["bird", "+ Burung"],
        ["triangle", "+ Segitiga"], ["wave", "+ Gelombang"]
    ];
    if (moreBox) NEW_SHAPES.forEach(([k, n]) => addBtn(moreBox, n, { "data-add": k }));
    if ($("addText")) addBtn($("addText").parentElement, "✎ Tulis sendiri", { "data-add": "mytext" });

    const hint = document.querySelector(".canvas-hint");
    if (hint) {
        hint.textContent = "Ketuk untuk memilih · tarik area kosong untuk memilih banyak · tarik sudut untuk ubah ukuran · titik di atas untuk memutar. Di kanvas ini tidak ada yang salah.";
    }

    /* panel seleksi & finishing */
    const bar = el("div", "cvx-bar");
    bar.innerHTML = `
    <div class="cvx-row">
        <span class="cvx-info" id="cvxInfo"></span>
        <button class="canvas-control" type="button" data-act="multi">☑ Pilih banyak</button>
        <button class="canvas-control" type="button" data-act="all">Pilih semua</button>
        <button class="canvas-control" type="button" data-act="dup" data-needsel>Gandakan</button>
        <button class="canvas-control" type="button" data-act="front" data-needsel>Ke depan</button>
        <button class="canvas-control" type="button" data-act="back" data-needsel>Ke belakang</button>
        <button class="canvas-control cvx-danger" type="button" data-act="del" data-needsel>🗑 Hapus terpilih</button>
    </div>
    <div class="cvx-row">
        <button class="canvas-control" type="button" data-act="fill" data-needsel>Isi / garis</button>
        <button class="canvas-control" type="button" data-act="glow" data-needsel>Cahaya</button>
        <button class="canvas-control" type="button" data-act="font" data-needtext>Ganti huruf</button>
        <button class="canvas-control" type="button" data-act="edit" data-needtext>Ubah teks</button>
        <label class="cvx-range">Ukuran <input type="range" id="cvxSize" min="0.15" max="4" step="0.01" value="1"></label>
        <label class="cvx-range">Transparan <input type="range" id="cvxAlpha" min="0.1" max="1" step="0.01" value="1"></label>
    </div>
    <div class="cvx-row">
        <span class="cvx-label">Kuas</span>
        <button class="canvas-control" type="button" data-act="bGaris">Garis</button>
        <button class="canvas-control" type="button" data-act="bCahaya">Cahaya</button>
        <button class="canvas-control" type="button" data-act="bTitik">Titik</button>
        <span class="cvx-label" style="margin-left:12px">Finishing</span>
        <button class="canvas-control" type="button" data-act="grain">Butiran</button>
        <button class="canvas-control" type="button" data-act="vig">Vinyet</button>
        <button class="canvas-control" type="button" data-act="frame">Bingkai</button>
    </div>
    <div class="cvx-row">
        <span class="cvx-label">Warna kuas</span>
        <div class="cvx-pal" id="cvxPal" role="group" aria-label="Palet warna coretan bebas"></div>
    </div>`;
    if (wrap && wrap.parentElement) wrap.parentElement.insertBefore(bar, wrap.nextSibling);
    const info = $("cvxInfo"), sizeR = $("cvxSize"), alphaR = $("cvxAlpha");

    /* tombol aksi bawah */
    const undoBtn = $("undoCanvas"), randBtn = $("randomizeCanvas"),
        clearBtn = $("clearCanvas"), saveBtn = $("saveCanvas");
    const actionsBox = (saveBtn || clearBtn || randBtn || {}).parentElement;
    let redoBtn = null, jpgBtn = null;
    if (actionsBox) {
        redoBtn = el("button", "canvas-action", "Ulangi");
        redoBtn.type = "button"; redoBtn.id = "redoCanvas"; redoBtn.disabled = true;
        actionsBox.insertBefore(redoBtn, undoBtn ? undoBtn.nextSibling : actionsBox.firstChild);
        jpgBtn = el("button", "canvas-action primary", "Simpan JPG →");
        jpgBtn.type = "button"; jpgBtn.id = "saveJpg";
        actionsBox.appendChild(jpgBtn);

        const wmNote = el("p", "cvx-wm-note",
            "Setiap karya yang kamu simpan diberi tanda kecil <em>A Little Pause</em> dan tanggalnya, biar suatu hari kamu ingat bahwa kamu pernah berhenti sebentar.");
        actionsBox.parentElement.insertBefore(wmNote, actionsBox.nextSibling);
    }
    if (clearBtn) clearBtn.textContent = "Kosongkan";
    if (randBtn) randBtn.textContent = "Acak ✦";
    if (saveBtn) saveBtn.textContent = "Simpan PNG →";

    canvas.tabIndex = 0;
    canvas.style.touchAction = "none";

    const mk = (type, x, y, size, o = {}) => ({
        type, x, y, size, opacity: 1, color: "#f2f0eb", lineWidth: 1.2,
        rotation: 0, sc: 1, filled: false, glow: 0, ...o
    });

    const fontStr = (o) => {
        const f = FONTS[o.font || 0];
        return `${f.i ? "italic " : ""}${f.w} ${o.size * f.k}px "${f.n}", Georgia, serif`;
    };
    const mctx = document.createElement("canvas").getContext("2d");

    const bounds = (o) => {
        const s = o.size;
        let w = 40, h = 40;
        switch (o.type) {
            case "circle": case "dot": case "heart": case "sparkle": case "flower": w = h = s * 2; break;
            case "square": w = h = s; break;
            case "triangle": w = s * 1.8; h = s * 1.5; break;
            case "moon": case "star": w = h = s * 2.1; break;
            case "sun": w = h = s * 1.95; break;
            case "cloud": w = s * 2.3; h = s * 1.2; break;
            case "hill": w = s * 3; h = s; break;
            case "bird": w = s * 2; h = s * 0.8; break;
            case "line": w = s; h = Math.max(18, (o.lineWidth || 1) * 6); break;
            case "wave": w = s; h = Math.max(18, (o.lineWidth || 1) * 4 + s * 0.14); break;
            case "stroke": {
                let a = 0, b = 0, c = 0, d = 0;
                (o.points || []).forEach((p) => {
                    a = Math.min(a, p.x); b = Math.max(b, p.x); c = Math.min(c, p.y); d = Math.max(d, p.y);
                });
                w = Math.max(24, b - a); h = Math.max(24, d - c);
                break;
            }
            case "text": {
                const f = FONTS[o.font || 0];
                mctx.font = fontStr(o);
                try { mctx.letterSpacing = f.ls || "0px"; } catch (e) { /* abaikan */ }
                w = Math.max(40, mctx.measureText(f.up ? o.text.toUpperCase() : o.text).width);
                h = o.size * f.k * 1.25;
                break;
            }
        }
        const sc = o.sc || 1;
        return { w: w * sc, h: h * sc };
    };

    const toWorld = (o, lx, ly) => {
        const cs = Math.cos(o.rotation || 0), sn = Math.sin(o.rotation || 0);
        return { x: o.x + lx * cs - ly * sn, y: o.y + lx * sn + ly * cs };
    };

    const hitObj = (p, o) => {
        if (o.type === "dot") return dist(p, o) <= Math.max(10, o.size * (o.sc || 1) + 6);
        const b = bounds(o), a = -(o.rotation || 0);
        const dx = p.x - o.x, dy = p.y - o.y;
        const lx = dx * Math.cos(a) - dy * Math.sin(a);
        const ly = dx * Math.sin(a) + dy * Math.cos(a);
        return Math.abs(lx) <= b.w / 2 + 8 && Math.abs(ly) <= b.h / 2 + 8;
    };
    const findAt = (p) => {
        for (let i = objects.length - 1; i >= 0; i--) if (hitObj(p, objects[i])) return objects[i];
        return null;
    };

    const paintShape = (c, o) => {
        const s = o.size;
        const fill = FILL_ALWAYS.has(o.type) || o.filled;
        c.lineCap = "round"; c.lineJoin = "round";
        c.beginPath();
        switch (o.type) {
            case "circle": case "dot": c.arc(0, 0, s, 0, TAU); break;
            case "square": c.rect(-s / 2, -s / 2, s, s); break;
            case "triangle":
                c.moveTo(0, -s); c.lineTo(s * 0.87, s * 0.5); c.lineTo(-s * 0.87, s * 0.5); c.closePath(); break;
            case "moon":
                c.arc(0, 0, s, Math.PI * 0.5, Math.PI * 1.5, false);
                c.arc(s * 0.46, 0, s * 0.92, Math.PI * 1.5, Math.PI * 0.5, true);
                c.closePath(); break;
            case "star":
                for (let i = 0; i < 10; i++) {
                    const r = i % 2 === 0 ? s : s * 0.42, a = (Math.PI / 5) * i - Math.PI / 2;
                    if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                    else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
                }
                c.closePath(); break;
            case "sparkle":
                c.moveTo(0, -s);
                c.quadraticCurveTo(s * 0.12, -s * 0.12, s, 0);
                c.quadraticCurveTo(s * 0.12, s * 0.12, 0, s);
                c.quadraticCurveTo(-s * 0.12, s * 0.12, -s, 0);
                c.quadraticCurveTo(-s * 0.12, -s * 0.12, 0, -s);
                c.closePath(); break;
            case "heart":
                c.moveTo(0, s * 0.85);
                c.bezierCurveTo(-s * 1.25, -s * 0.05, -s * 0.65, -s, 0, -s * 0.35);
                c.bezierCurveTo(s * 0.65, -s, s * 1.25, -s * 0.05, 0, s * 0.85);
                c.closePath(); break;
            case "cloud":
                [[-0.7, 0.25, 0.4], [-0.2, -0.05, 0.55], [0.4, 0.05, 0.45], [0.85, 0.28, 0.32]]
                    .forEach(([x, y, r]) => { c.moveTo((x + r) * s, y * s); c.arc(x * s, y * s, r * s, 0, TAU); });
                c.rect(-0.7 * s, 0.25 * s, 1.55 * s, 0.35 * s); break;
            case "flower":
                for (let i = 0; i < 6; i++) {
                    const a = (i * TAU) / 6, x = Math.sin(a) * s * 0.62, y = -Math.cos(a) * s * 0.62;
                    c.moveTo(x + s * 0.3, y); c.arc(x, y, s * 0.3, 0, TAU);
                }
                c.moveTo(s * 0.3, 0); c.arc(0, 0, s * 0.3, 0, TAU);
                c.fill();
                c.shadowBlur = 0;
                c.fillStyle = "#fff1c9";
                c.beginPath(); c.arc(0, 0, s * 0.24, 0, TAU); c.fill();
                return;
            case "sun":
                c.arc(0, 0, s * 0.5, 0, TAU); c.fill();
                c.beginPath();
                for (let i = 0; i < 12; i++) {
                    const a = (i * TAU) / 12;
                    c.moveTo(Math.cos(a) * s * 0.68, Math.sin(a) * s * 0.68);
                    c.lineTo(Math.cos(a) * s * 0.95, Math.sin(a) * s * 0.95);
                }
                c.stroke();
                return;
            case "hill":
                c.moveTo(-s * 1.5, s * 0.5);
                c.bezierCurveTo(-s * 0.7, -s * 0.75, s * 0.5, -s * 0.75, s * 1.5, s * 0.5);
                c.closePath(); break;
            case "bird":
                c.moveTo(-s, 0);
                c.quadraticCurveTo(-s * 0.5, -s * 0.75, 0, s * 0.05);
                c.quadraticCurveTo(s * 0.5, -s * 0.75, s, 0); break;
            case "line": c.moveTo(-s / 2, 0); c.lineTo(s / 2, 0); break;
            case "wave":
                for (let x = -s / 2; x <= s / 2; x += 4) {
                    const y = Math.sin((x / s) * TAU * 2) * s * 0.06;
                    if (x === -s / 2) c.moveTo(x, y); else c.lineTo(x, y);
                }
                break;
            case "stroke": {
                const p = o.points || [];
                if (p.length < 2) return;
                c.moveTo(p[0].x, p[0].y);
                for (let i = 1; i < p.length - 1; i++) {
                    c.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
                }
                c.lineTo(p[p.length - 1].x, p[p.length - 1].y);
                c.stroke();
                return;
            }
            case "text": {
                const f = FONTS[o.font || 0];
                c.font = fontStr(o);
                try { c.letterSpacing = f.ls || "0px"; } catch (e) { /* abaikan */ }
                c.textAlign = "center"; c.textBaseline = "middle";
                c.fillText(f.up ? o.text.toUpperCase() : o.text, 0, 0);
                return;
            }
        }
        if (fill) c.fill(); else c.stroke();
    };

    const drawObj = (c, o, k, mul) => {
        c.save();
        c.globalAlpha = clamp(o.opacity, 0, 1) * mul;
        c.strokeStyle = o.color; c.fillStyle = o.color;
        c.lineWidth = o.lineWidth || 1;
        c.translate(o.x, o.y);
        c.rotate(o.rotation || 0);
        const sc = o.sc || 1;
        c.scale(sc, sc);
        if (o.glow) { c.shadowColor = o.color; c.shadowBlur = o.glow * k * sc; }
        paintShape(c, o);
        c.restore();
    };

    const makeStars = () => Array.from({ length: Math.round(rnd(60, 90)) }, () => ({
        x: Math.random(), y: rnd(0, 0.85), s: rnd(0.5, 1.7), o: rnd(0.25, 0.9)
    }));

    const paintBG = (c, w, h) => {
        const stops = GR[S.bgGrad];
        if (S.bgKind === "gradient" && stops) {
            const lg = c.createLinearGradient(0, 0, 0, h);
            [0, 0.55, 1].forEach((p, i) => lg.addColorStop(p, stops[i]));
            c.fillStyle = lg; c.fillRect(0, 0, w, h);
            const rg = c.createRadialGradient(w / 2, h, 0, w / 2, h, Math.max(w, h * 0.9) * 0.75);
            rg.addColorStop(0, `rgba(${GLOW[S.bgGrad]},.26)`);
            rg.addColorStop(1, `rgba(${GLOW[S.bgGrad]},0)`);
            c.fillStyle = rg; c.fillRect(0, 0, w, h);
            if (STARRY.has(S.bgGrad)) {
                c.save(); c.fillStyle = "#fff";
                S.stars.forEach((st) => {
                    c.globalAlpha = st.o; c.beginPath();
                    c.arc(st.x * w, st.y * h, (st.s * w) / 800, 0, TAU); c.fill();
                });
                c.restore();
            }
            return;
        }
        c.fillStyle = S.bgColor; c.fillRect(0, 0, w, h);
    };

    const grainTile = (() => {
        const t = document.createElement("canvas");
        t.width = t.height = 128;
        const gx = t.getContext("2d");
        if (!gx || !gx.createImageData) return null;
        const d = gx.createImageData(128, 128);
        for (let i = 0; i < d.data.length; i += 4) {
            d.data[i] = d.data[i + 1] = d.data[i + 2] = Math.random() * 255;
            d.data[i + 3] = 255;
        }
        gx.putImageData(d, 0, 0);
        return t;
    })();

    const finish = (c, w, h, frame, frameText = true) => {
        const light = isLight();
        if (S.vignette) {
            const vg = c.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.55);
            vg.addColorStop(0, "rgba(0,0,0,0)");
            vg.addColorStop(1, `rgba(0,0,0,${light ? 0.2 : 0.42})`);
            c.fillStyle = vg; c.fillRect(0, 0, w, h);
        }
        if (S.grain && grainTile) {
            c.save();
            c.globalAlpha = light ? 0.1 : 0.08;
            c.globalCompositeOperation = "overlay";
            c.fillStyle = c.createPattern(grainTile, "repeat");
            c.fillRect(0, 0, w, h);
            c.restore();
        }
        if (frame) {
            const inset = Math.min(w, h) * 0.035, fs = Math.max(10, w * 0.016);
            const col = light ? "42,38,34" : "245,241,232";
            c.save();
            c.strokeStyle = `rgba(${col},.45)`;
            c.lineWidth = Math.max(1, w / 900);
            c.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
            if (frameText) {
                c.fillStyle = `rgba(${col},.75)`;
                c.font = `italic 500 ${fs}px "Cormorant Garamond", Georgia, serif`;
                c.textAlign = "center"; c.textBaseline = "alphabetic";
                try { c.letterSpacing = "0.25em"; } catch (e) { /* abaikan */ }
                c.fillText("a little pause", w / 2, h - inset - fs * 0.9);
            }
            c.restore();
        }
    };

    const handlePos = (o) => {
        const b = bounds(o);
        return { rs: toWorld(o, b.w / 2 + 8, b.h / 2 + 8), rot: toWorld(o, 0, -b.h / 2 - 28) };
    };

    function redraw() {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, W, H);
        paintBG(ctx, W, H);
        objects.forEach((o) => drawObj(ctx, o, dpr, fade));
        finish(ctx, W, H, S.frame);

        sel.forEach((o) => {
            const b = bounds(o);
            ctx.save();
            ctx.translate(o.x, o.y); ctx.rotate(o.rotation || 0);
            ctx.strokeStyle = "#d9a94a"; ctx.lineWidth = 1; ctx.setLineDash([4, 5]);
            ctx.strokeRect(-b.w / 2 - 8, -b.h / 2 - 8, b.w + 16, b.h + 16);
            if (sel.length === 1) {
                ctx.setLineDash([]);
                ctx.fillStyle = "#d9a94a";
                ctx.fillRect(b.w / 2 + 3, b.h / 2 + 3, 10, 10);
                ctx.beginPath();
                ctx.moveTo(0, -b.h / 2 - 8); ctx.lineTo(0, -b.h / 2 - 28); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, -b.h / 2 - 28, 6, 0, TAU); ctx.fill();
            }
            ctx.restore();
        });

        if (marquee) {
            ctx.save();
            ctx.fillStyle = "rgba(217,169,74,.1)"; ctx.strokeStyle = "rgba(217,169,74,.85)";
            ctx.setLineDash([4, 4]);
            const x = Math.min(marquee.x0, marquee.x1), y = Math.min(marquee.y0, marquee.y1);
            const w = Math.abs(marquee.x1 - marquee.x0), h = Math.abs(marquee.y1 - marquee.y0);
            ctx.fillRect(x, y, w, h); ctx.strokeRect(x, y, w, h);
            ctx.restore();
        }
    }

    const makeSnap = () => ({ o: JSON.stringify(objects), s: JSON.stringify(S) });
    const restore = (sn) => {
        objects.length = 0;
        objects.push(...JSON.parse(sn.o));
        Object.assign(S, JSON.parse(sn.s));
        sel = [];
    };
    const record = (sn) => {
        undoS.push(sn || makeSnap());
        if (undoS.length > 40) undoS.shift();
        redoS.length = 0;
        sync();
    };
    const recordSoon = () => {
        if (!recTimer) record();
        clearTimeout(recTimer);
        recTimer = setTimeout(() => { recTimer = null; }, 700);
    };
    const touch = () => { if (pending) { record(pending); pending = null; } };
    const undo = () => {
        if (!undoS.length) return;
        redoS.push(makeSnap()); restore(undoS.pop()); sync(); redraw();
    };
    const redo = () => {
        if (!redoS.length) return;
        undoS.push(makeSnap()); restore(redoS.pop()); sync(); redraw();
    };

    function sync() {
        const n = sel.length, o = sel[0];
        const hasText = sel.some((x) => x.type === "text");
        info.textContent = n ? `${n} terpilih` : `${objects.length} elemen · belum ada yang dipilih`;
        bar.querySelectorAll("[data-needsel]").forEach((b) => { b.disabled = !n; });
        bar.querySelectorAll("[data-needtext]").forEach((b) => { b.disabled = !hasText; });
        sizeR.disabled = alphaR.disabled = !n;
        if (o) { sizeR.value = o.sc || 1; alphaR.value = o.opacity; }
        const on = (act, v) => {
            const b = bar.querySelector(`[data-act="${act}"]`);
            if (b) b.classList.toggle("is-on", !!v);
        };
        on("multi", multi); on("grain", S.grain); on("vig", S.vignette); on("frame", S.frame);
        on("bGaris", brush && brushStyle === "garis");
        on("bCahaya", brush && brushStyle === "cahaya");
        on("bTitik", brush && brushStyle === "titik");
        if (undoBtn) undoBtn.disabled = !undoS.length;
        if (redoBtn) redoBtn.disabled = !redoS.length;
    }

    const scaleAll = (r) => {
        const fix = (arr) => arr.forEach((o) => { o.x *= r; o.y *= r; o.sc = (o.sc || 1) * r; });
        fix(objects);
        [undoS, redoS].forEach((list) => list.forEach((sn) => {
            const a = JSON.parse(sn.o); fix(a); sn.o = JSON.stringify(a);
        }));
    };

    function resize() {
        if (!wrap) return;
        const ww = wrap.clientWidth;
        if (!ww || ww < 20) return;
        const nw = Math.max(280, Math.round(ww)), nh = Math.round(nw * 0.625);
        const nd = Math.min(window.devicePixelRatio || 1, 2);
        if (nw === W && nd === dpr && canvas.width === Math.round(W * dpr)) return;
        if (nw !== W) scaleAll(nw / W);
        W = nw; H = nh; dpr = nd;
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(H * dpr);
        canvas.style.width = `${W}px`;
        canvas.style.height = `${H}px`;
        redraw();
    }

    const rx = (p) => rnd(p, Math.max(p + 1, W - p));
    const ry = (p) => rnd(p, Math.max(p + 1, H - p));
    const col = (d) => ink(d);

    const ADD = {
        text: () => mk("text", rx(100), ry(70), rnd(22, 36), {
            text: pick(WORDS), font: pick([0, 0, 1]), opacity: rnd(0.65, 0.95),
            color: col("#f2f0eb"), rotation: rnd(-0.08, 0.08)
        }),
        circle: () => mk("circle", rx(65), ry(65), rnd(18, 55), {
            opacity: rnd(0.4, 0.8), color: col("#b7a58a"), lineWidth: rnd(1, 1.6), rotation: rnd(0, 3)
        }),
        square: () => mk("square", rx(65), ry(65), rnd(30, 90), {
            opacity: rnd(0.35, 0.7), color: col("#f2f0eb"), lineWidth: rnd(1, 1.5), rotation: rnd(-0.35, 0.35)
        }),
        moon: () => mk("moon", rx(80), ry(80), rnd(26, 46), {
            opacity: rnd(0.7, 0.95), color: col("#ffe2aa"), glow: 14, rotation: rnd(-0.3, 0.3)
        }),
        star: () => mk("star", rx(70), ry(70), rnd(14, 30), {
            opacity: rnd(0.65, 0.95), color: col("#ffe2aa"), glow: 10, rotation: rnd(0, 3)
        }),
        line: () => mk("line", rx(90), ry(90), rnd(60, 160), {
            opacity: rnd(0.45, 0.8), color: col("#b7a58a"), lineWidth: rnd(1.2, 2.2), rotation: rnd(0, 3)
        }),
        heart: () => mk("heart", rx(70), ry(70), rnd(16, 32), {
            opacity: rnd(0.75, 0.95), color: col("#ffb3c7"), filled: true, glow: 10, rotation: rnd(-0.3, 0.3)
        }),
        sparkle: () => mk("sparkle", rx(70), ry(70), rnd(12, 28), {
            opacity: rnd(0.7, 0.95), color: col("#ffe2aa"), glow: 14, rotation: rnd(-0.2, 0.2)
        }),
        cloud: () => mk("cloud", rx(90), ry(70), rnd(30, 56), {
            opacity: rnd(0.3, 0.6), color: col("#f2f0eb")
        }),
        flower: () => mk("flower", rx(70), ry(70), rnd(18, 34), {
            opacity: rnd(0.8, 0.95), color: currentColor || pick(["#ffb3c7", "#c9b8ff", "#ffcf99", "#9fe3ff"]),
            rotation: rnd(0, 3)
        }),
        sun: () => mk("sun", rx(80), ry(80), rnd(50, 80), {
            opacity: rnd(0.8, 0.95), color: currentColor || "#ffd9a0", lineWidth: 2, glow: 22, filled: true
        }),
        hill: () => mk("hill", rx(120), H - rnd(20, 50), rnd(80, 130), {
            opacity: 0.92, color: currentColor || pick(["#1b2145", "#2c1730", "#1f2d26"])
        }),
        bird: () => mk("bird", rx(70), ry(70), rnd(10, 18), {
            opacity: 0.85, color: col("#f2f0eb"), lineWidth: 1.8, rotation: rnd(-0.25, 0.25)
        }),
        triangle: () => mk("triangle", rx(70), ry(70), rnd(24, 56), {
            opacity: rnd(0.4, 0.8), color: col("#b7a58a"), lineWidth: rnd(1, 1.6), rotation: rnd(-0.5, 0.5)
        }),
        wave: () => mk("wave", rx(120), ry(80), rnd(160, 320), {
            opacity: rnd(0.3, 0.6), color: currentColor || pick(["#6fd6a8", "#9fe3ff", "#c9b8ff"]),
            lineWidth: rnd(3, 9), glow: 18, rotation: rnd(-0.2, 0.2)
        }),
        mytext: () => {
            const v = prompt("Mau menulis apa di kanvasmu? Boleh curhat singkat, kok.", "");
            if (!v || !v.trim()) return null;
            return mk("text", W / 2, H / 2, 32, {
                text: v.trim().slice(0, 60), font: 0, opacity: 0.95, color: col("#f2f0eb")
            });
        }
    };

    function place(o) {
        if (!o) return;
        record();
        o.sc = Math.max(0.35, W / 800);
        objects.push(o);
        sel = [o];
        sync(); redraw();
    }

    [["addText", "text"], ["addCircle", "circle"], ["addSquare", "square"], ["addMoon", "moon"],
        ["addStar", "star"], ["addLine", "line"]].forEach(([id, key]) => {
        if ($(id)) $(id).addEventListener("click", () => place(ADD[key]()));
    });
    document.querySelectorAll("[data-add]").forEach((b) => {
        b.addEventListener("click", () => place(ADD[b.dataset.add]()));
    });

    const setBG = (kind, val) => {
        S.bgKind = kind;
        if (kind === "solid") { S.bgColor = val; S.bgGrad = null; S.stars = []; }
        else { S.bgGrad = val; S.stars = STARRY.has(val) ? makeStars() : []; }
    };

    document.querySelectorAll("[data-background]").forEach((b) => {
        b.addEventListener("click", () => {
            if (!b.dataset.background) return;
            record(); setBG("solid", b.dataset.background); sync(); redraw();
        });
    });
    document.querySelectorAll("[data-gradient]").forEach((b) => {
        b.addEventListener("click", () => {
            const n = b.dataset.gradient;
            if (!GR[n]) return;
            record(); setBG("gradient", n); sync(); redraw();
        });
    });

    const swatches = document.querySelectorAll("[data-color]");
    swatches.forEach((b) => {
        b.addEventListener("click", () => {
            const c = b.dataset.color;
            if (!c) return;
            const was = b.classList.contains("is-active");
            swatches.forEach((x) => { x.classList.remove("is-active"); x.setAttribute("aria-pressed", "false"); });
            if (was) { currentColor = null; return; }
            currentColor = c;
            b.classList.add("is-active"); b.setAttribute("aria-pressed", "true");
            if (sel.length) { record(); sel.forEach((o) => { o.color = c; }); redraw(); }
        });
    });

    const setBrush = (on) => {
        brush = on;
        const tb = $("toggleBrush");
        if (tb) { tb.classList.toggle("is-active", on); tb.setAttribute("aria-pressed", String(on)); }
        if (wrap) wrap.classList.toggle("is-brush-mode", on);
        canvas.style.cursor = on ? "crosshair" : "";
        if (on) sel = [];
        sync(); redraw();
    };
    if ($("toggleBrush")) $("toggleBrush").addEventListener("click", () => setBrush(!brush));

    const BRUSH_COLORS = [
        ["#f5f1e8", "Putih tulang"], ["#ffd166", "Madu"], ["#ff9f6e", "Jingga senja"],
        ["#ff6b6b", "Koral"], ["#ff8fb1", "Mawar"], ["#e04f9a", "Fuchsia"],
        ["#b583ff", "Ungu"], ["#7c83ff", "Biru senja"], ["#4ea8ff", "Biru langit"],
        ["#3fd0e0", "Tosca"], ["#4fd6a0", "Mint"], ["#a6e05a", "Hijau pucuk"],
        ["#8b5e3c", "Cokelat"], ["#2a2622", "Arang"]
    ];
    const palBox = $("cvxPal");
    let customPicked = false, customBtn = null, customInput = null;
    const palBtns = [];

    const paintPalette = () => {
        palBtns.forEach((b) => {
            const v = b.dataset.bcolor || null;
            const on = !customPicked && v === brushColor;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", String(on));
        });
        if (customBtn) {
            const on = customPicked && !!brushColor;
            customBtn.classList.toggle("is-active", on);
            customBtn.classList.toggle("is-picked", customPicked);
            if (brushColor) customBtn.style.setProperty("--sw", brushColor);
        }
    };
    const useBrushColor = (c, fromCustom) => {
        brushColor = c || null;
        customPicked = !!fromCustom;
        if (!brush) setBrush(true);
        paintPalette();
    };

    if (palBox) {
        const auto = el("button", "canvas-swatch cvx-auto");
        auto.type = "button"; auto.dataset.bcolor = "";
        auto.style.setProperty("--sw", "#f2f0eb");
        auto.setAttribute("aria-label", "Warna otomatis (mengikuti latar)");
        auto.title = "Otomatis";
        auto.addEventListener("click", () => useBrushColor(null, false));
        palBox.appendChild(auto); palBtns.push(auto);

        BRUSH_COLORS.forEach(([c, n]) => {
            const b = el("button", "canvas-swatch");
            b.type = "button"; b.dataset.bcolor = c;
            b.style.setProperty("--sw", c);
            b.setAttribute("aria-label", n); b.title = n;
            b.addEventListener("click", () => useBrushColor(c, false));
            palBox.appendChild(b); palBtns.push(b);
        });

        customBtn = el("label", "canvas-swatch cvx-custom");
        customBtn.style.setProperty("--sw", "#ff6b6b");
        customBtn.title = "Pilih warna sendiri";
        customInput = el("input");
        customInput.type = "color"; customInput.value = "#ff6b6b";
        customInput.setAttribute("aria-label", "Pilih warna sendiri");
        const fromPicker = () => useBrushColor(customInput.value, true);
        customInput.addEventListener("input", fromPicker);
        customInput.addEventListener("change", fromPicker);
        customBtn.appendChild(customInput);
        palBox.appendChild(customBtn);
        paintPalette();
    }

    const selText = () => sel.filter((o) => o.type === "text");
    const reorder = (front) => {
        if (!sel.length) return;
        record();
        const s = new Set(sel);
        const rest = objects.filter((o) => !s.has(o)), mv = objects.filter((o) => s.has(o));
        objects.length = 0;
        objects.push(...(front ? [...rest, ...mv] : [...mv, ...rest]));
        redraw();
    };

    const ACT = {
        multi() { multi = !multi; sync(); },
        all() { sel = objects.slice(); sync(); redraw(); },
        dup() {
            if (!sel.length) return;
            record();
            const cl = sel.map((o) => ({ ...JSON.parse(JSON.stringify(o)), x: o.x + 20, y: o.y + 20 }));
            objects.push(...cl); sel = cl; sync(); redraw();
        },
        front() { reorder(true); },
        back() { reorder(false); },
        del() {
            if (!sel.length) return;
            record();
            const s = new Set(sel), keep = objects.filter((o) => !s.has(o));
            objects.length = 0; objects.push(...keep);
            sel = []; sync(); redraw();
        },
        fill() {
            if (!sel.length) return;
            record();
            const on = !sel.every((o) => FILL_ALWAYS.has(o.type) || o.filled);
            sel.forEach((o) => { o.filled = on; });
            redraw();
        },
        glow() {
            if (!sel.length) return;
            record();
            const on = !sel.every((o) => o.glow);
            sel.forEach((o) => { o.glow = on ? 16 : 0; });
            redraw();
        },
        font() {
            const t = selText();
            if (!t.length) return;
            record();
            t.forEach((o) => { o.font = ((o.font || 0) + 1) % FONTS.length; });
            redraw();
        },
        edit() {
            const t = selText()[0];
            if (!t) return;
            const v = prompt("Mau diganti jadi apa tulisannya?", t.text);
            if (v && v.trim()) { record(); t.text = v.trim().slice(0, 60); redraw(); }
        },
        grain() { record(); S.grain = !S.grain; sync(); redraw(); },
        vig() { record(); S.vignette = !S.vignette; sync(); redraw(); },
        frame() { record(); S.frame = !S.frame; sync(); redraw(); },
        bGaris() { brushStyle = "garis"; setBrush(true); },
        bCahaya() { brushStyle = "cahaya"; setBrush(true); },
        bTitik() { brushStyle = "titik"; setBrush(true); }
    };
    bar.addEventListener("click", (e) => {
        const b = e.target.closest("[data-act]");
        if (b && !b.disabled && ACT[b.dataset.act]) ACT[b.dataset.act]();
    });

    sizeR.addEventListener("input", () => {
        if (!sel.length) return;
        recordSoon();
        sel.forEach((o) => { o.sc = parseFloat(sizeR.value); });
        redraw();
    });
    alphaR.addEventListener("input", () => {
        if (!sel.length) return;
        recordSoon();
        sel.forEach((o) => { o.opacity = parseFloat(alphaR.value); });
        redraw();
    });

    if (undoBtn) undoBtn.addEventListener("click", undo);
    if (redoBtn) redoBtn.addEventListener("click", redo);
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            record(); objects.length = 0; sel = []; sync(); redraw();
            toast("Bersih. Kanvas baru, napas baru, cerita baru.");
        });
    }

    const fin = (grain, vig, frame) => { S.grain = !!grain; S.vignette = !!vig; S.frame = !!frame; };
    const hillAt = (color, s, fx, lift = 0) =>
        mk("hill", W * fx, H + 6 - s * 0.5 - lift, s, { color, opacity: 1 });

    const COMPOSERS = [
        ["Malam & bulan", () => {
            setBG("gradient", "malam"); fin(1, 1, 0);
            const u = W / 800, mx = W * rnd(0.64, 0.8), my = H * rnd(0.2, 0.3), L = [];
            L.push(mk("circle", mx, my, 130 * u, { color: "#ffe9b8", opacity: 0.06, filled: true }));
            L.push(mk("circle", mx, my, 88 * u, { color: "#ffe9b8", opacity: 0.1, filled: true }));
            L.push(mk("moon", mx, my, 54 * u, { color: "#ffe9b8", opacity: 0.97, glow: 34, rotation: rnd(-0.5, -0.2) }));
            for (let i = 0; i < Math.round(rnd(14, 20)); i++) {
                L.push(mk("sparkle", W * rnd(0.04, 0.96), H * rnd(0.04, 0.6), rnd(4, 10) * u, {
                    color: pick(["#fff3d6", "#c9b8ff", "#9fe3ff", "#ffe2aa"]), glow: 10, opacity: rnd(0.45, 0.95)
                }));
            }
            L.push(hillAt("#1b2145", 170 * u, rnd(0.2, 0.4)));
            L.push(hillAt("#121832", 130 * u, rnd(0.6, 0.85), 4 * u));
            L.push(hillAt("#0a0d1c", 95 * u, rnd(0.3, 0.6)));
            L.push(mk("text", W / 2, H * 0.9, 24 * u, { text: pick(WORDS), color: "#f2f0eb", opacity: 0.85 }));
            return L;
        }],
        ["Senja pulang", () => {
            setBG("gradient", "senja"); fin(1, 1, 0);
            const u = W / 800, L = [];
            L.push(mk("sun", W * rnd(0.35, 0.65), H * 0.62, 84 * u, {
                color: "#ffd9a0", glow: 38, filled: true, lineWidth: 2 * u, opacity: 0.95
            }));
            for (let i = 0; i < 3; i++) {
                L.push(mk("cloud", W * rnd(0.1, 0.9), H * rnd(0.12, 0.4), rnd(30, 55) * u, {
                    color: "#ffd0b8", opacity: rnd(0.18, 0.34)
                }));
            }
            L.push(hillAt("#4a2a40", 150 * u, rnd(0.2, 0.5)));
            L.push(hillAt("#2c1730", 115 * u, rnd(0.55, 0.85)));
            L.push(hillAt("#170d1c", 80 * u, rnd(0.3, 0.7)));
            for (let i = 0; i < 4; i++) {
                L.push(mk("bird", W * rnd(0.2, 0.8), H * rnd(0.15, 0.45), rnd(8, 14) * u, {
                    color: "#2a1a2e", opacity: 0.8, lineWidth: 1.5 * u, rotation: rnd(-0.2, 0.2)
                }));
            }
            L.push(mk("text", W / 2, H * 0.92, 24 * u, { text: pick(WORDS), color: "#fff1dc", opacity: 0.88 }));
            return L;
        }],
        ["Orbit kecil", () => {
            setBG("solid", "#0a0c14"); fin(1, 1, 0);
            const u = W / 800, cx = W * 0.5, cy = H * 0.5, L = [];
            [46, 92, 140, 190, 245, 305].forEach((r, i) => {
                L.push(mk("circle", cx, cy, r * u, { color: "#b7a58a", opacity: 0.5 - i * 0.07, lineWidth: u }));
            });
            L.push(mk("circle", cx, cy, 40 * u, { color: "#ffe2aa", opacity: 0.12, filled: true }));
            L.push(mk("circle", cx, cy, 20 * u, { color: "#ffe2aa", opacity: 0.97, filled: true, glow: 46 }));
            [92, 140, 190, 245].forEach((r) => {
                const a = rnd(0, TAU);
                L.push(mk("circle", cx + Math.cos(a) * r * u, cy + Math.sin(a) * r * u, rnd(5, 11) * u, {
                    color: pick(["#ffb3c7", "#c9b8ff", "#9fe3ff", "#ffcf99"]), filled: true, glow: 14, opacity: 0.95
                }));
            });
            const am = rnd(0, TAU);
            L.push(mk("moon", cx + Math.cos(am) * 140 * u, cy + Math.sin(am) * 140 * u, 9 * u, {
                color: "#f5f1e8", glow: 10, rotation: am
            }));
            for (let i = 0; i < 12; i++) {
                L.push(mk("sparkle", W * rnd(0.04, 0.96), H * rnd(0.05, 0.95), rnd(3, 7) * u, {
                    color: "#fff3d6", opacity: rnd(0.3, 0.8), glow: 8
                }));
            }
            L.push(mk("text", W * 0.5, H * 0.94, 22 * u, { text: "a little pause", font: 2, color: "#b7a58a", opacity: 0.8 }));
            return L;
        }],
        ["Taman kertas", () => {
            setBG("solid", "#efe8da"); fin(1, 1, 1);
            const u = W / 800, L = [], flowers = [];
            for (let i = 0; i < Math.round(rnd(7, 10)); i++) {
                const s = rnd(16, 34) * u, x = W * rnd(0.08, 0.92), y = H * rnd(0.3, 0.62);
                flowers.push({ s, x, y, c: pick(["#f4a6b8", "#b9a6f0", "#ffc58a", "#8fd3e8", "#f08f84"]) });
            }
            flowers.forEach((f) => {
                const len = H - f.y - f.s * 0.8;
                L.push(mk("line", f.x, f.y + f.s * 0.8 + len / 2, len, {
                    color: "#7f9a74", lineWidth: 2.2 * u, rotation: Math.PI / 2, opacity: 0.9
                }));
            });
            flowers.forEach((f) => L.push(mk("flower", f.x, f.y, f.s, { color: f.c, opacity: 0.95, rotation: rnd(0, 3) })));
            for (let i = 0; i < 3; i++) {
                L.push(mk("heart", W * rnd(0.1, 0.9), H * rnd(0.12, 0.3), rnd(8, 13) * u, {
                    color: "#f08f84", filled: true, opacity: 0.8, rotation: rnd(-0.4, 0.4)
                }));
            }
            L.push(mk("sun", W * 0.12, H * 0.17, 46 * u, { color: "#e9b44c", filled: true, lineWidth: 1.6 * u, glow: 12 }));
            L.push(mk("text", W * 0.56, H * 0.12, 26 * u, { text: pick(WORDS), color: "#2a2622", opacity: 0.85 }));
            return L;
        }],
        ["Geometri tenang", () => {
            const dark = Math.random() < 0.5, u = W / 800, L = [];
            setBG("solid", dark ? "#0b0b0b" : "#e9e6df"); fin(1, 1, 1);
            const p = dark ? ["#ffb3c7", "#ffe2aa", "#9fe3ff", "#f2f0eb"] : ["#e76f51", "#264653", "#e9c46a", "#2a2622"];
            L.push(mk("circle", W * 0.34, H * 0.5, 120 * u, { color: p[0], opacity: 0.9, filled: true }));
            L.push(mk("circle", W * 0.34 + 62 * u, H * 0.5 - 22 * u, 120 * u, { color: p[1], opacity: 0.95, lineWidth: 1.6 * u }));
            L.push(mk("triangle", W * 0.72, H * 0.36, 58 * u, { color: p[2], filled: true, opacity: 0.92, rotation: rnd(-0.3, 0.3) }));
            L.push(mk("square", W * 0.76, H * 0.66, 84 * u, { color: p[1], lineWidth: 1.6 * u, rotation: 0.26, opacity: 0.95 }));
            L.push(mk("line", W * 0.5, H * 0.82, 300 * u, { color: p[3], lineWidth: 2 * u, opacity: 0.85 }));
            for (let i = 0; i < 5; i++) L.push(mk("circle", W * 0.7 + i * 16 * u, H * 0.82, 3 * u, { color: p[0], filled: true }));
            L.push(mk("text", W * 0.5, H * 0.91, 22 * u, { text: "pelan-pelan", font: 2, color: p[3], opacity: 0.85 }));
            return L;
        }],
        ["Aurora pelan", () => {
            setBG("gradient", "aurora"); fin(1, 1, 0);
            const u = W / 800, L = [];
            for (let i = 0; i < 4; i++) {
                L.push(mk("wave", W * 0.5, H * (0.2 + i * 0.1), W * 1.15, {
                    color: pick(["#6fd6a8", "#9fe3ff", "#c9b8ff", "#a8e6cf"]), lineWidth: rnd(10, 22) * u,
                    opacity: rnd(0.16, 0.3), glow: 30, rotation: rnd(-0.12, 0.12)
                }));
            }
            for (let i = 0; i < 8; i++) {
                L.push(mk("sparkle", W * rnd(0.05, 0.95), H * rnd(0.05, 0.5), rnd(3, 7) * u, {
                    color: "#e9fff6", glow: 8, opacity: rnd(0.4, 0.9)
                }));
            }
            L.push(hillAt("#0a2230", 120 * u, rnd(0.2, 0.5)));
            L.push(hillAt("#050b14", 85 * u, rnd(0.5, 0.8)));
            L.push(mk("text", W / 2, H * 0.92, 24 * u, { text: pick(WORDS), color: "#e9fff6", opacity: 0.85 }));
            return L;
        }]
    ];

    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function animateIn() {
        if (reduceMotion) { fade = 1; redraw(); return; }
        const t0 = performance.now(), D = 700;
        fade = 0;
        const step = (t) => {
            const p = clamp((t - t0) / D, 0, 1);
            fade = p * p * (3 - 2 * p);
            redraw();
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    function randomize() {
        record();
        let k;
        do { k = Math.floor(Math.random() * COMPOSERS.length); } while (k === lastK);
        lastK = k;
        const list = COMPOSERS[k][1]();
        objects.length = 0; objects.push(...list);
        sel = [];
        sync(); animateIn();
        toast(`✦ ${COMPOSERS[k][0]}`);
    }
    if (randBtn) randBtn.addEventListener("click", randomize);

    const pos = (e) => {
        const r = canvas.getBoundingClientRect();
        return { x: ((e.clientX - r.left) * W) / r.width, y: ((e.clientY - r.top) * H) / r.height };
    };

    const startBrush = (p) => {
        const glowy = brushStyle === "cahaya";
        if (brushStyle === "titik") { mode = "dots"; lastDot = p; return; }
        activeStroke = mk("stroke", p.x, p.y, 1, {
            points: [{ x: 0, y: 0 }], opacity: 0.92, color: brushColor || currentColor || (glowy ? "#ffe2aa" : ink("#f2f0eb")),
            lineWidth: glowy ? 3.6 : 2.4, glow: glowy ? 14 : 0, sc: 1
        });
        objects.push(activeStroke);
        mode = "brush";
    };

    canvas.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        canvas.focus({ preventScroll: true });
        const p = pos(e);
        pending = makeSnap();
        g = null;

        if (brush) {
            startBrush(p);
        } else {
            if (sel.length === 1) {
                const o = sel[0], h = handlePos(o);
                if (dist(p, h.rot) <= 16) { mode = "rotate"; g = { o }; }
                else if (dist(p, h.rs) <= 16) { mode = "resize"; g = { o, d0: Math.max(8, dist(p, o)), sc0: o.sc || 1 }; }
            }
            if (!mode) {
                const hit = findAt(p), add = e.shiftKey || multi;
                if (hit) {
                    if (add) sel = sel.includes(hit) ? sel.filter((x) => x !== hit) : [...sel, hit];
                    else if (!sel.includes(hit)) sel = [hit];
                    if (sel.includes(hit)) {
                        mode = "drag";
                        g = { start: p, orig: sel.map((o) => ({ o, x: o.x, y: o.y })) };
                    }
                } else {
                    mode = "marquee";
                    g = { base: add ? sel.slice() : [] };
                    marquee = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
                    if (!add) sel = [];
                }
            }
        }
        if (mode && canvas.setPointerCapture) {
            try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
        }
        sync(); redraw();
    });

    canvas.addEventListener("pointermove", (e) => {
        const p = pos(e);
        if (!mode) {
            if (brush) return;
            let cur = "default";
            if (sel.length === 1) {
                const h = handlePos(sel[0]);
                if (dist(p, h.rot) <= 16) cur = "grab";
                else if (dist(p, h.rs) <= 16) cur = "nwse-resize";
            }
            if (cur === "default" && findAt(p)) cur = "move";
            canvas.style.cursor = cur;
            return;
        }
        if (mode === "drag") {
            touch();
            const dx = p.x - g.start.x, dy = p.y - g.start.y;
            g.orig.forEach(({ o, x, y }) => { o.x = clamp(x + dx, -20, W + 20); o.y = clamp(y + dy, -20, H + 20); });
        } else if (mode === "resize") {
            touch();
            g.o.sc = clamp(g.sc0 * (dist(p, g.o) / g.d0), 0.15, 6);
        } else if (mode === "rotate") {
            touch();
            let a = Math.atan2(p.y - g.o.y, p.x - g.o.x) + Math.PI / 2;
            if (e.shiftKey) a = Math.round(a / (Math.PI / 12)) * (Math.PI / 12);
            g.o.rotation = norm(a);
        } else if (mode === "marquee") {
            marquee.x1 = p.x; marquee.y1 = p.y;
            const x0 = Math.min(marquee.x0, marquee.x1), x1 = Math.max(marquee.x0, marquee.x1);
            const y0 = Math.min(marquee.y0, marquee.y1), y1 = Math.max(marquee.y0, marquee.y1);
            const inside = objects.filter((o) => o.x >= x0 && o.x <= x1 && o.y >= y0 && o.y <= y1);
            sel = [...new Set([...g.base, ...inside])];
            sync();
        } else if (mode === "brush" && activeStroke) {
            const last = activeStroke.points[activeStroke.points.length - 1];
            const q = { x: p.x - activeStroke.x, y: p.y - activeStroke.y };
            if (Math.hypot(q.x - last.x, q.y - last.y) >= 2) { touch(); activeStroke.points.push(q); }
        } else if (mode === "dots") {
            const d = dist(p, lastDot);
            if (d >= 5) {
                touch();
                objects.push(mk("dot", p.x, p.y, clamp(d * 0.055, 1.2, 3.5), {
                    opacity: rnd(0.35, 0.7), color: brushColor || currentColor || ink("#b7a58a")
                }));
                lastDot = p;
            }
        }
        redraw();
    });

    const endPointer = (e) => {
        if (activeStroke) {
            const pts = activeStroke.points;
            if (pts.length < 2) {
                const i = objects.indexOf(activeStroke);
                if (i !== -1) objects.splice(i, 1);
            } else {
                let sx = 0, sy = 0;
                pts.forEach((q) => { sx += q.x; sy += q.y; });
                const cx = sx / pts.length, cy = sy / pts.length;
                activeStroke.x += cx; activeStroke.y += cy;
                activeStroke.points = pts.map((q) => ({ x: q.x - cx, y: q.y - cy }));
            }
            activeStroke = null;
        }
        mode = null; g = null; marquee = null; lastDot = null; pending = null;
        if (e && typeof e.pointerId === "number") {
            try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* abaikan */ }
        }
        sync(); redraw();
    };
    canvas.addEventListener("pointerup", endPointer);
    canvas.addEventListener("pointercancel", endPointer);

    canvas.addEventListener("wheel", (e) => {
        if (!sel.length) return;
        const p = pos(e);
        if (!sel.some((o) => hitObj(p, o))) return;
        e.preventDefault();
        recordSoon();
        const dir = e.deltaY > 0 ? 1 : -1;
        sel.forEach((o) => { o.rotation = norm((o.rotation || 0) + dir * 0.08); });
        redraw();
    }, { passive: false });

    canvas.addEventListener("dblclick", (e) => {
        const hit = findAt(pos(e));
        if (hit && hit.type === "text") { sel = [hit]; sync(); redraw(); ACT.edit(); }
    });

    canvas.addEventListener("keydown", (e) => {
        const k = e.key, mod = e.ctrlKey || e.metaKey, kl = k.length === 1 ? k.toLowerCase() : k;
        if (k === "Delete" || k === "Backspace") ACT.del();
        else if (mod && kl === "z") { if (e.shiftKey) redo(); else undo(); }
        else if (mod && kl === "y") redo();
        else if (mod && kl === "d") ACT.dup();
        else if (mod && kl === "a") ACT.all();
        else if (k === "Escape") { sel = []; sync(); redraw(); }
        else if (k.indexOf("Arrow") === 0 && sel.length) {
            recordSoon();
            const st = e.shiftKey ? 10 : 2;
            sel.forEach((o) => {
                if (k === "ArrowLeft") o.x -= st;
                if (k === "ArrowRight") o.x += st;
                if (k === "ArrowUp") o.y -= st;
                if (k === "ArrowDown") o.y += st;
            });
            redraw();
        } else return;
        e.preventDefault();
    });

    const pad2 = (n) => String(n).padStart(2, "0");
    const dateStamp = (d = new Date()) => `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

    /* teks dengan jarak huruf manual (letterSpacing bawaan belum ada di semua browser) */
    const spacedText = (c, text, x, y, track, align) => {
        const chars = Array.from(text);
        const ws = chars.map((ch) => c.measureText(ch).width);
        const total = ws.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
        let cx = align === "right" ? x - total : x;
        c.textAlign = "left";
        chars.forEach((ch, i) => { c.fillText(ch, cx, y); cx += ws[i] + track; });
        return total;
    };

    /* warna pita bawah: menyatu dengan latar (gradasi -> warna paling gelapnya) */
    const stripColor = () => (S.bgKind === "gradient" && GR[S.bgGrad]) ? GR[S.bgGrad][0] : S.bgColor;

    /* pita tipis di bawah karya: bulan kecil + "A Little Pause" di kiri, tanggal di kanan */
    const paintCaption = (c, ow, top, sh, dateText) => {
        const light = isLight();
        const pad = Math.round(ow * 0.03);
        const mid = top + sh * 0.56;
        const nameFs = sh * 0.36, dateFs = sh * 0.26;
        const nameCol = light ? "#6b5636" : "#b7a58a";
        const dateCol = light ? "rgba(42,38,34,.72)" : "rgba(245,241,232,.58)";

        c.save();
        c.fillStyle = stripColor();
        c.fillRect(0, top, ow, sh);

        c.fillStyle = light ? "rgba(42,38,34,.22)" : "rgba(183,165,138,.28)";
        c.fillRect(pad, top, ow - pad * 2, Math.max(1, Math.round(ow / 1600)));

        c.textBaseline = "middle";
        try { c.letterSpacing = "0px"; } catch (e) { /* abaikan */ }

        /* bulan sabit mungil (digambar, bukan emoji, supaya sama di semua perangkat) */
        const ms = nameFs * 0.42;
        c.save();
        c.translate(pad + ms, mid);
        c.fillStyle = nameCol;
        c.beginPath();
        c.arc(0, 0, ms, Math.PI * 0.5, Math.PI * 1.5, false);
        c.arc(ms * 0.46, 0, ms * 0.92, Math.PI * 1.5, Math.PI * 0.5, true);
        c.closePath();
        c.fill();
        c.restore();

        c.fillStyle = nameCol;
        c.font = `italic 500 ${nameFs}px "Cormorant Garamond", Georgia, serif`;
        spacedText(c, "A Little Pause", pad + ms * 2 + nameFs * 0.5, mid, nameFs * 0.14, "left");

        c.fillStyle = dateCol;
        c.font = `400 ${dateFs}px "Manrope", "Helvetica Neue", Arial, sans-serif`;
        spacedText(c, dateText, ow - pad, mid, dateFs * 0.18, "right");
        c.restore();
    };

    function renderExport(ow) {
        const s = ow / W, oh = Math.round(H * s);
        const sh = Math.round(ow * 0.046);
        const c = document.createElement("canvas");
        c.width = ow; c.height = oh + sh;
        const x = c.getContext("2d");

        /* alas rata dulu: hasil tidak pernah transparan (JPG tidak jadi hitam) */
        x.fillStyle = stripColor();
        x.fillRect(0, 0, ow, oh + sh);

        paintBG(x, ow, oh);
        x.save();
        x.beginPath(); x.rect(0, 0, ow, oh); x.clip();
        x.scale(s, s);
        objects.forEach((o) => drawObj(x, o, s, 1));
        x.restore();
        finish(x, ow, oh, S.frame, false);
        paintCaption(x, ow, oh, sh, dateStamp());
        return c;
    }

    const ensureFonts = () => {
        if (!document.fonts || !document.fonts.load) return Promise.resolve();
        const specs = ['italic 500 24px "Cormorant Garamond"', '500 24px "Cormorant Garamond"',
            '400 16px "Manrope"', '500 24px "Caveat"'];
        const all = Promise.all(specs.map((s) =>
            document.fonts.load(s, "A Little Pause 0123456789/").catch(() => null)));
        return Promise.race([all, new Promise((r) => setTimeout(r, 2500))]);
    };

    const canvasToBlob = (c, type, q) => new Promise((resolve) => {
        try {
            if (c.toBlob) { c.toBlob((b) => resolve(b), type, q); return; }
            const u = c.toDataURL(type, q), i = u.indexOf(",");
            const bin = atob(u.slice(i + 1)), arr = new Uint8Array(bin.length);
            for (let k = 0; k < bin.length; k++) arr[k] = bin.charCodeAt(k);
            resolve(new Blob([arr], { type: u.slice(5, u.indexOf(";")) || type }));
        } catch (err) { resolve(null); }
    });

    /* pastikan berkas benar-benar bisa dibuka sebagai gambar sebelum diberikan */
    const canOpen = (blob) => new Promise((resolve) => {
        if (!blob || !blob.size) { resolve(false); return; }
        let url = null, done = false;
        const fin = (ok) => { if (done) return; done = true; if (url) URL.revokeObjectURL(url); resolve(ok); };
        try {
            url = URL.createObjectURL(blob);
            const im = new Image();
            im.onload = () => fin(im.naturalWidth > 0 && im.naturalHeight > 0);
            im.onerror = () => fin(false);
            im.src = url;
            setTimeout(() => fin(true), 6000);
        } catch (err) { fin(true); }
    });

    /* coba ukuran penuh; kalau HP kehabisan memori, turun bertahap */
    async function makeImage(fmt) {
        const type = fmt === "jpg" ? "image/jpeg" : "image/png";
        const sizes = [Math.max(1600, Math.round(W * 2)), 1280, 960];
        for (const w of sizes) {
            const c = renderExport(w);
            const blob = await canvasToBlob(c, type, 0.95);
            c.width = c.height = 1;
            if (blob && blob.size && await canOpen(blob)) {
                return { blob, ext: blob.type === "image/jpeg" ? "jpg" : "png" };
            }
        }
        return null;
    }

    const UA = navigator.userAgent || "";
    const isIOS = /iP(hone|ad|od)/.test(UA) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const inApp = /FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|Twitter|Telegram|WhatsApp|; wv\)/i.test(UA);
    const isTouch = () => isIOS || !!(window.matchMedia && window.matchMedia("(pointer:coarse)").matches);

    const downloadBlob = (blob, name) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = name; a.rel = "noopener";
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 60000);
    };

    /* lembar pratinjau untuk HP: lihat hasil akhir, lalu simpan / bagikan / tahan gambar */
    let sheetEl = null, sheetUrl = null, sheetKey = null;
    const closeSheet = () => {
        if (!sheetEl) return;
        const e = sheetEl, u = sheetUrl;
        sheetEl = sheetUrl = null;
        document.removeEventListener("keydown", sheetKey);
        e.classList.remove("on");
        setTimeout(() => { e.remove(); if (u) URL.revokeObjectURL(u); }, 350);
    };

    const openSheet = (blob, name) => {
        closeSheet();
        const url = URL.createObjectURL(blob);
        const ext = name.split(".").pop().toUpperCase();
        const ov = el("div", "cvx-sheet");
        ov.setAttribute("role", "dialog");
        ov.setAttribute("aria-modal", "true");
        ov.setAttribute("aria-label", "Hasil karyamu");
        const tip = isIOS
            ? "Tahan gambar lalu pilih <b>Simpan ke Foto</b>, atau ketuk <b>Bagikan</b> → <b>Simpan Gambar</b>."
            : "Tahan gambar lalu pilih <b>Download image</b>, atau ketuk <b>Unduh</b>.";
        ov.innerHTML = `<div class="cvx-sheet-card"><img alt="Hasil karyamu"><p class="cvx-sheet-tip">${tip}</p><div class="cvx-sheet-actions"></div></div>`;
        ov.querySelector("img").src = url;
        const acts = ov.querySelector(".cvx-sheet-actions");

        const dl = el("a", "canvas-action primary", `Unduh ${ext} →`);
        dl.href = url; dl.download = name;
        acts.appendChild(dl);

        let file = null;
        try { file = new File([blob], name, { type: blob.type }); } catch (err) { /* abaikan */ }
        if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
            const sh = el("button", "canvas-action primary", "Bagikan");
            sh.type = "button";
            sh.addEventListener("click", async () => {
                try { await navigator.share({ files: [file], title: "A Little Pause" }); }
                catch (err) { if (!err || err.name !== "AbortError") toast("Tahan gambar untuk menyimpannya"); }
            });
            acts.appendChild(sh);
        }
        const close = el("button", "canvas-action", "Tutup");
        close.type = "button";
        close.addEventListener("click", closeSheet);
        acts.appendChild(close);

        ov.addEventListener("click", (e) => { if (e.target === ov) closeSheet(); });
        sheetKey = (e) => { if (e.key === "Escape") closeSheet(); };
        document.addEventListener("keydown", sheetKey);
        document.body.appendChild(ov);
        sheetEl = ov; sheetUrl = url;
        requestAnimationFrame(() => ov.classList.add("on"));
    };

    let saving = false;
    async function saveImage(fmt) {
        if (saving) return;
        saving = true;
        const btn = fmt === "png" ? saveBtn : jpgBtn;
        const label = btn ? btn.textContent : "";
        if (btn) { btn.disabled = true; btn.textContent = "Menyiapkan…"; }
        try {
            await ensureFonts();
            const res = await makeImage(fmt);
            if (!res) { toast("Aduh, gambarnya belum mau pulang. Coba kurangi isi kanvas sedikit."); return; }
            const name = `a-little-pause-jejak-${dateStamp().replace(/\//g, "-")}.${res.ext}`;
            if (inApp || isTouch()) {
                openSheet(res.blob, name);
            } else {
                downloadBlob(res.blob, name);
                toast(`Aman, tersimpan sebagai ${res.ext.toUpperCase()} ✦`);
            }
        } catch (err) {
            toast("Aduh, gambarnya belum mau pulang. Coba sekali lagi, ya.");
        } finally {
            saving = false;
            if (btn) { btn.disabled = false; btn.textContent = label; }
        }
    }
    if (saveBtn) saveBtn.addEventListener("click", () => saveImage("png"));
    if (jpgBtn) jpgBtn.addEventListener("click", () => saveImage("jpg"));

    let rt = null;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(resize, 100); };
    window.addEventListener("resize", onResize);
    if (window.ResizeObserver && wrap) new ResizeObserver(onResize).observe(wrap);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);

    resize();
    objects.push(...COMPOSERS[0][1]());
    lastK = 0;
    sync();
    redraw();
});