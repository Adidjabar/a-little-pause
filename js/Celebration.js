(() => {
    "use strict";

    const init = () => {

        const $ = (id) => document.getElementById(id);

        const root = $("celebration");
        const gate = $("celebrationGate");
        const openBtn = $("celebrationOpen");
        const bgC = $("celBg");
        const fxC = $("celFx");
        const stage = $("celLyrics");
        const intro = $("celIntro");
        const countEl = $("celCount");
        const closeBtn = $("celClose");
        const soundBtn = $("celSound");
        const soundLabel = $("celSoundLabel");
        const burstBtn = $("celBurst");
        const titleEl = $("celTitle");
        const songEl = $("celSong");
        const eyebrowEl = root.querySelector(".cel-eyebrow");
        const subEl = root.querySelector(".cel-sub");
        const introTxt = intro.querySelector("p");

        /* kolom nama di gerbang (boleh tidak ada: perayaan tetap jalan) */
        const gateEyebrow = $("gateEyebrow");
        const gateTease = $("gateTease");
        const gateLabel = gate.querySelector(".gate-label");
        const nameInput = $("celebrationName");
        const nameField = $("gateNameField");
        const nameHint = $("gateNameHint");

        if (![root, gate, openBtn, bgC, fxC, stage, intro, countEl,
              closeBtn, soundBtn, burstBtn].every(Boolean)) {
            return;
        }

        const bg = bgC.getContext("2d");
        const fx = fxC.getContext("2d");
        if (!bg || !fx) return;

        const body = document.body;
        const appEl = $("app");

        /* nama diisi pengunjung lewat kolom di gerbang (lihat 05B) */
        let NAMA = "kamu"; /* nama yang tampil di judul + lirik */
        let FIRE_NAME = "KAMU"; /* huruf yang dibentuk kembang api */
        let isBulan = false; /* true = mode khusus Bulan */

        const JUDUL_LAGU = "Lagu Perayaan"; /* tulisan kecil di bawah lirik; ganti kalau lagu sudah final */

        const NAME_MIN = 3; /* minimal jumlah huruf */
        const NAME_MAX = 24; /* maksimal karakter */
        const NAME_STORE = "alpName"; /* sessionStorage: nama tidak perlu diketik ulang */
        /* ejaan Bulan disimpan sebagai hash (nameHash dari nameKey), bukan teks polos; 4 ejaan: panggilan, depan, depan + tengah, lengkap */
        const BULAN_KEYS = [6528598661508740, 5974493572962237, 5384190306467040, 4756734980297349];
        /* hash awalan nama lengkap (4 huruf ke atas) untuk cahaya + maskot, supaya tidak berkedip saat mengetik; perayaan tetap pakai BULAN_KEYS */
        const BULAN_NEAR = [
            6528598661508740, 191938574299658, 7121056665050123, 2151552388869380, 1520046566838952,
            5974493572962237, 1989001580220060, 1225256063023880, 6146761524624221, 5588202556785408,
            7672726749174800, 5384190306467040, 7794924361737492, 2723244369174987, 3915644238215512,
            940393668601578, 4756734980297349
        ];
        const BULAN_HEART_GAP = 17; /* khusus Bulan: jeda minimal antar kembang api hati (nama lain: 45) */

        const ALL_IDS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11"];
        const STORE_KEY = "alpFound";

        const LYRIC_START = 9; /* detik: baris pertama (jika t kosong) */
        const LYRIC_END_PAD = 10; /* baris terakhir mulai sekian detik sebelum lagu habis, lalu tampil sampai lagu selesai */
        const LYRIC_STEP = 7; /* jarak antarbaris bila durasi lagu belum terbaca */
        const LYRIC_FX = ["rise", "zoom", "drop", "flip", "blur", "spread"];

        /* penjadwal pesan otomatis (dipakai bila lirik belum disinkronkan manual) */
        const LY = {
            START: 8, /* detik: baris pertama muncul (setelah lagu menyala, pembukaan kembang api dulu) */
            TAIL: 10, /* baris penutup mulai sekian detik sebelum lagu habis */
            HOLD_AFTER: 5, /* baris penutup tetap tampil sekian detik setelah lagu habis, lalu hilang (tidak diulang dari awal) */
            FALLBACK: 210, /* durasi anggapan bila lagu belum terbaca */
            IDEAL: 1.28, /* waktu tampil ideal = kebutuhan baca x angka ini */
            F_MIN: 0.94, /* paling rapat: 94% dari ideal; kalau lebih rapat, baris disisihkan */
            STRETCH: 1.35, /* paling renggang sebelum baris tambahan disisipkan */
            MAXD: 14, /* satu baris tidak tampil lebih lama dari ini (kecuali lagu sangat panjang dan semua baris tambahan sudah terpakai) */
            MIND: 4.6 /* dan tidak lebih singkat dari ini */
        };

        const QUERY = location.search || "";
        const SYNC = /[?&]sync(?:=|&|$)/i.test(QUERY);
        const FORCE = SYNC || /[?&]celebrate(?:=|&|$)/i.test(QUERY);

        /* x: true = baris tambahan. Hanya dipakai kalau lagunya panjang (supaya pesan tidak habis sebelum lagu, tidak diulang dari awal, dan jarak antarbaris tetap nyaman).
           p = prioritas: 1 inti, 2 boleh disisihkan, 3 disisihkan paling awal bila lagunya pendek. */
        const LYRICS = [
            /* 1. datang */
            { t: null, text: "Malam ini, langit menyalakan semua lampunya." },
            { t: null, text: "Bulan sudah gladi resik dari tadi." },
            { t: null, text: "Bintang-bintang berbaris rapi, siap bertepuk tangan.", p: 2, x: true },
            { t: null, text: "Dan semua ini cuma untukmu, {nama}.", show: "name", only: "other" },
            { t: null, text: "Namanya {nama}, dan malam ini seluruh langit memperhatikan satu orang saja.", only: "other", p: 2, x: true },
            { t: null, text: "Kalau merasa salah alamat, tenang, kembang apinya tetap gratis.", only: "other", p: 2 },
            { t: null, text: "Bulan berbisik, \u201cSelamat datang, {nama}. Duduk saja, biar kami yang bekerja.\u201d", only: "other", p: 2 },
            { t: null, text: "Malam ini panggungnya hanya mengenal satu nama, {nama}.", show: "name", only: "bulan" },
            { t: null, text: "Bulan berbisik pada bintang kecil, \u201cItu tamunya. Tolong bersinarnya yang sopan.\u201d", only: "bulan", p: 2 },
            { t: null, text: "Bulan dan bintang biasanya berebut lampu sorot. Malam ini mereka mengalah.", only: "bulan", show: "moonStar", p: 2 },
            { t: null, text: "Langit rela lembur malam ini, dan tidak minta uang makan sepeser pun.", only: "bulan", p: 2, x: true },

            /* 2. tidak perlu apa-apa, cukup datang */
            { t: null, text: "Tidak ada ujian. Tidak ada syarat. Kamu cukup datang." },
            { t: null, text: "Duduk saja dulu. Malam ini tidak ada yang mengejarmu.", only: "other", p: 2 },
            { t: null, text: "Langit berkata pelan, \u201cDuduk saja dulu, {nama}. Kursinya sudah dihangatkan.\u201d", only: "bulan", p: 2 },
            { t: null, text: "Tidak ada yang menghitung jam. Malam ini waktu boleh berjalan pelan.", p: 2, x: true },

            /* 3. hal-hal baik yang jarang dilihat */
            { t: null, text: "Sebab hal-hal baik darimu sering lewat tanpa tepuk tangan." },
            { t: null, text: "Seperti menanyakan kabar orang lain, padahal kabarmu sendiri belum sempat ditanya.", p: 2, x: true },
            { t: null, text: "Seperti hari-hari yang kamu jalani diam-diam, tapi tetap berani.", show: "star" },
            { t: null, text: "Ada hari yang kamu lewati dengan senyum seadanya, dan itu tetap berarti.", p: 2, x: true },
            { t: null, text: "Yang peka pada hal kecil biasanya paling jarang disapa.", only: "other", show: "moon", p: 2 },
            { t: null, text: "Malam ini, giliranmu disapa.", only: "other", p: 3 },
            { t: null, text: "Dan tawa yang kamu bagikan tanpa sadar.", show: "rainbow" },
            { t: null, text: "Padahal ada orang yang pulang dengan hati lebih hangat karenamu.", p: 2, x: true },
            { t: null, text: "Juga karya yang lahir dari tanganmu, sekecil apa pun.", show: "peacock" },
            { t: null, text: "Coretan di pinggir buku pun tetap karya, asal dibuat dengan hati.", p: 2, x: true },
            { t: null, text: "Bulan berbisik, \u201cTenang, semuanya tercatat. Termasuk kebaikan kecil yang kamu kira tidak ada yang lihat.\u201d", only: "bulan", p: 2 },
            { t: null, text: "Kamu pernah menguatkan orang lain tanpa sadar, dan langit ingat semuanya.", only: "bulan", p: 2, x: true },
            { t: null, text: "Kalau dunia ini kanvas, kamu boleh pilih warnanya. Panggung ini ikut saja.", only: "bulan", show: "palette", p: 2 },

            /* 4. tidak perlu sempurna */
            { t: null, text: "Kamu tidak perlu sempurna untuk dirayakan." },
            { t: null, text: "Bulan saja punya sisi gelap, dan semua orang tetap memandangnya dengan kagum.", p: 2, x: true },
            { t: null, text: "Kamu cukup hadir, dan dunia sudah mulai bertepuk tangan." },
            { t: null, text: "Mahkotanya memang tidak kelihatan, tapi malam ini pas sekali di kepalamu.", only: "bulan", show: "crown", p: 2 },
            { t: null, text: "Kembang api ini pilih-pilih, lho, {nama}. Dan malam ini mereka memilih kamu.", only: "other", p: 2 },
            { t: null, text: "Seluruh kembang api sudah diberi tahu, hati-hati, ini tamu penting.", only: "other", p: 2, x: true },

            /* 5. bahagia yang tidak bisa berbisik */
            { t: null, text: "Ini konser tunggal. Penontonnya satu, lampunya sepuluh ribu." },
            { t: null, text: "Kembang api berbisik, \u201cJangan lihat dulu, aku masih gugup.\u201d", only: "other", p: 2 },
            { t: null, text: "Lampu-lampu itu betah banget malam ini. Katanya, langitnya lagi bagus.", only: "bulan", p: 2, x: true },
            { t: null, text: "Kalau langit punya album, malam ini pasti difoto berkali-kali.", only: "bulan", p: 2, x: true },
            { t: null, text: "Maaf kalau berisik. Bahagia memang belum pernah belajar berbisik." },
            { t: null, text: "Bulan berbisik, \u201cKalau matamu mendadak panas, bilang saja kelilipan kembang api. Langit pandai menjaga rahasia.\u201d", only: "bulan", p: 2 },
            { t: null, text: "Kalau kamu senyum-senyum sendiri sekarang, itu sah. Panggungnya sudah izin.", only: "bulan", p: 2, x: true },
            { t: null, text: "Bunga-bunga ini datang tanpa diundang. Mereka cuma ingin lihat kamu senyum.", only: "bulan", show: "flower", p: 2 },
            { t: null, text: "Bunganya sudah gladi bersama cahaya. Sekarang mereka menunggu aba-abamu.", only: "bulan", p: 2, x: true },
            { t: null, text: "Kelopak bunga berjatuhan pelan, supaya langkahmu ikut wangi.", only: "bulan", show: "sakura", p: 3, x: true },

            /* 6. boleh istirahat */
            { t: null, text: "Kamu sering jadi tempat orang bersandar. Malam ini, gantian kamu yang bersandar." },
            { t: null, text: "Menjadi sandaran itu mulia, tapi sandaran pun boleh lelah.", p: 2, x: true },
            { t: null, text: "Kalau capek, istirahatlah. Langit tidak ke mana-mana.", show: "willow" },
            { t: null, text: "Kalau hatimu lelah, titipkan sebentar ke langit. Langit sudah biasa jadi tempat menitip.", only: "other", show: "ripple", p: 2 },
            { t: null, text: "Kalau hatimu lelah, titipkan sebentar ke langit malam ini. Biar langit yang jaga.", only: "bulan", show: "heartGlow", p: 2 },
            { t: null, text: "Ada rasa capek yang tidak pernah kamu ceritakan ke siapa-siapa. Langit tahu semuanya, dan tidak menghakimi.", only: "bulan", p: 2 },
            { t: null, text: "Masih banyak hal baik yang belum sempat ditulis di sini. Layarnya keburu penuh.", only: "bulan", show: "sparkle" },
            { t: null, text: "Orang baik biasanya tidak sadar dirinya baik. Kamu salah satunya.", only: "bulan", p: 2, x: true },
            { t: null, text: "\u201cKapan terakhir kali kamu berterima kasih pada dirimu sendiri?\u201d", p: 2 },
            { t: null, text: "Kalau jawabannya lupa, malam ini boleh jadi yang pertama.", p: 2, x: true },

            /* 7. harapan, dan diingat */
            { t: null, text: "Semoga minggu ini ramah padamu. Yang berikutnya juga.", p: 2 },
            { t: null, text: "Semoga kebaikan yang kamu tanam diam-diam, kembali kepadamu dalam bentuk yang paling lembut.", only: "bulan", p: 2, x: true },
            { t: null, text: "Dan kalau suatu hari kamu ragu, ingat malam ini." },
            { t: null, text: "Ingat bahwa kamu pernah dirayakan sebesar ini.", show: "dahlia" },
            { t: null, text: "Simpan ingatan ini di saku yang tidak bolong.", p: 2, x: true },
            { t: null, text: "Biar kembang api dan langit jadi saksi, bahwa kamu itu berharga.", p: 3 },
            { t: null, text: "Hari ini, besok, dan seterusnya.", p: 2 },

            /* 8. penutup */
            { t: null, text: "Malam ini kamu tamu paling penting, {nama}, lengkap dengan karpet merah.", only: "other", p: 2 },
            { t: null, text: "Kalau ada yang bertanya kamu siapa, jawab saja, \u201ctamu kehormatan malam ini.\u201d", only: "other", p: 2, x: true },
            { t: null, text: "Terima kasih sudah mampir sampai sini. Pintunya sengaja dibuat panjang, biar yang sabar dapat kembang apinya.", only: "other", p: 2 },
            { t: null, text: "Langit berpesan, \u201cKapan-kapan mampir lagi ya, {nama}. Pintunya tidak dikunci.\u201d", only: "other", p: 2 },
            { t: null, text: "Kamu bukan sekadar tamu malam ini, {nama}. Lampunya sengaja dinyalakan lebih lama.", only: "bulan" },
            { t: null, text: "Bintang kecil bertanya, \u201cKenapa tamu ini disambut paling meriah?\u201d Bulan menjawab, \u201cKarena dia selalu sibuk merayakan orang lain.\u201d", only: "bulan", p: 2 },
            { t: null, text: "Semoga di mana pun kamu berada, selalu ada tempat yang terasa seperti rumah.", only: "bulan", p: 2, x: true },
            { t: null, text: "Selamat sudah sampai sejauh ini, dan tetap menjadi dirimu sendiri.", p: 2 },
            { t: null, text: "Ke mana pun kamu melangkah setelah ini, semoga langit selalu teduh di atasmu.", only: "bulan", p: 2 },
            { t: null, text: "Terima kasih untuk hal-hal kecil yang mungkin tidak pernah kamu sadari sudah kamu berikan.", only: "bulan", p: 2 },
            { t: null, text: "Terima kasih sudah menjadi orang baik, bahkan di hari-hari yang tidak mudah.", only: "bulan" },
            { t: null, text: "Selamat, {nama}. Terima kasih sudah berhenti sebentar.", big: true, show: "finale" },
            { t: null, text: "Dan terima kasih\u2026 sudah ada.", only: "other", big: true, fx: "blur" },
            { t: null, text: "Dan terima kasih\u2026 sudah ada, {nama}.", only: "bulan", big: true, fx: "blur" }
        ];

        const TAU = Math.PI * 2;
        const rand = (a, b) => a + Math.random() * (b - a);
        const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

        const reducedMQ = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
        const reduced = () => Boolean(reducedMQ && reducedMQ.matches);

        const timers = new Set();
        const later = (fn, seconds) => {
            const id = setTimeout(() => { timers.delete(id); fn(); }, Math.max(0, seconds) * 1000);
            timers.add(id);
            return id;
        };
        const clearTimers = () => {
            timers.forEach((id) => clearTimeout(id));
            timers.clear();
        };

        const clock = () => {
            const api = window.ALPAudio;
            if (!api || typeof api.clock !== "function") return null;
            try { return api.clock(); } catch (e) { return null; }
        };

        if (songEl) songEl.textContent = JUDUL_LAGU;

        const found = new Set();
        let unlocked = false;

        let isOpen = false;
        let lit = false;
        let soundOn = true;
        let lastFocus = null;
        let prevOverflow = "";
        let prevPadRight = "";

        let W = 0;
        let H = 0;
        let DPR = 1;
        let small = false; /* true = HP (layar sempit) */
        let tier = "desktop"; /* "phone" | "tablet" | "desktop" */
        let perf = 1; /* 1 = kualitas penuh; turun otomatis bila berat */
        let perfWarm = 0;
        let perfAcc = 0;
        let perfN = 0;
        let perfSlow = 0;

        let raf = 0;
        let lastNow = 0;
        let clockT = 0;
        let fxBusy = false;

        let stars = [];
        let bokeh = [];
        let crowd = [];
        let shooters = [];
        let confetti = [];

        const particles = [];
        const rockets = [];
        const flashes = [];

        let nextShot = 0;
        let nextFinale = 0;
        let nextShooter = 2;
        let lastBurst = 0;
        let lastNameAt = -1e9; /* waktu (ms) ledakan nama terakhir: cegah ledakan nama dobel */
        let clapT = 1.5; /* hitung mundur ke tepuk tangan bintang berikutnya */
        let lastTap = 0;
        let namePts = null;
        let nameWide = false; /* nama panjang (8 huruf ke atas): tulisan kembang api dibuat lebih lebar + titik lebih bersih */
        let nameRatio = 0.34; /* tinggi / lebar kanvas tulisan nama kembang api (bertambah kalau nama dipecah jadi beberapa baris) */

        /* KHUSUS BULAN: langit + maskot */
        let aur = null; /* aurora (kanvas kecil, dibuat sekali) */
        let flies = []; /* kunang-kunang */
        let lanterns = []; /* lentera langit */
        let bulanT = 0; /* detik sejak panggung menyala */
        let nextLantern = 0.6;

        let nameOk = false;
        let teaseCount = 0;
        let lastTease = -1;
        let teased = false;
        let hintTimer = 0;

        const readStore = () => {
            try {
                JSON.parse(sessionStorage.getItem(STORE_KEY) || "[]").forEach((id) => found.add(String(id)));
            } catch (e) { /* abaikan */ }
        };

        const isComplete = () => ALL_IDS.every((id) => found.has(id));

        const unlock = (animated) => {
            if (unlocked) return;
            unlocked = true;
            gate.hidden = false;
            requestAnimationFrame(() => requestAnimationFrame(() => gate.classList.add("is-unlocked")));
            document.dispatchEvent(new CustomEvent("alp:celebration-ready"));

            /* beri jeda agar popup ke-11 selesai menutup, lalu bawa gerbang ke layar */
            if (animated && !reduced()) {
                later(() => {
                    const r = gate.getBoundingClientRect();
                    if (r.top > window.innerHeight * 0.62 || r.bottom < 0) {
                        gate.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }, 0.9);
            }
        };

        const check = (animated) => {
            readStore();
            if (isComplete()) unlock(animated);
        };

        document.addEventListener("alp:egg-open", (event) => {
            const id = event.detail && event.detail.id;
            if (id) found.add(String(id));
        });

        document.addEventListener("alp:egg-close", () => check(true));

        check(false);
        if (FORCE) unlock(false);

        const TEASE = [
            "Eits. Pintunya digembok, dan kuncinya cuma satu, yaitu namamu.",
            "Tombolnya pemalu. Kenalan dulu, baru mau dipencet.",
            "Kolom namanya dicuekin, tombolnya malah diklik. Tega.",
            "Ini bukan kasir minimarket, tapi tetap harus isi data.",
            "Kata satpam panggung, tanpa nama berarti tanpa tiket.",
            "Ketik namamu dulu. Kembang apinya bingung mau teriak nama siapa.",
            "Diklik sepuluh kali pun tetap digembok. Tombolnya lagi mode batu.",
            "Kolom di atas itu bukan hiasan. Dia kesepian, temani sebentar.",
            "Sabar. Kembang apinya lagi latihan menyebut namamu, tapi namanya belum ada.",
            "Tombol ini setia. Dia hanya mau dibuka oleh yang sudah memperkenalkan diri."
        ];

        /* tombol diklik padahal nama baru 1-2 huruf */
        const TEASE_SHORT = [
            "Tombolnya masih malu-malu. Kasih tiga huruf dulu, baru dia berani.",
            "Kurang dikit lagi. Tombol ini suka yang berusaha, jangan nyerah.",
            "Buru-buru amat. Gembok juga butuh pendekatan, tahu.",
            "Tiga huruf itu bukan syarat berat, apalagi buat yang punya niat."
        ];

        const HINT_EMPTY = "Gemboknya cuma mau dibuka pakai namamu.";
        /* sindiran di bawah kolom saat mengetik: [untuk 1 huruf, untuk 2 huruf] */
        const HINT_SHORT = [
            [
                "Satu huruf doang? Itu bukan nama, itu kode rahasia agen. Tambah dua lagi, ya.",
                "Baru satu huruf, udah mau masuk. Pelan-pelan, kenalan itu ada prosesnya.",
                "Satu huruf? Aku sih penasaran, tapi gemboknya minta minimal tiga."
            ],
            [
                "Dua huruf. Dikit lagi. Aku nggak minta mas kawin kok, cuma satu huruf.",
                "Tinggal satu huruf lagi. Gemboknya udah mau luluh, tinggal gengsinya.",
                "Dua huruf doang? Pelit amat. Sisihkan satu lagi, nggak bakal bangkrut."
            ]
        ];
        const HINT_SEED = Math.floor(Math.random() * 3); /* variasi antar kunjungan, stabil selama mengetik */
        const HINT_OK = [
            "Nama yang bagus. Gemboknya mulai goyah.",
            "Oke, {nama}. Pintunya sudah bisa didorong.",
            "{nama}, ya. Kembang apinya sudah latihan menyebut itu dari tadi.",
            "Dicatat, {nama}. Satpam panggung mengangguk pelan.",
            "Cakep. Tinggal tekan tombolnya, {nama}."
        ];

        const TINY_LOCKED = "tombolnya digembok sampai namamu terisi";
        const TINY_OK = "nyalakan suaranya ya, ada lagunya";

        const cleanName = (v) => {
            let s = String(v == null ? "" : v);
            try {
                s = s.replace(/[^\p{L}\p{M}' .\-]/gu, "");
            } catch (e) {
                s = s.replace(/[^A-Za-z' .\-]/g, "");
            }
            return s.replace(/\s+/g, " ").replace(/^\s+/, "").slice(0, NAME_MAX);
        };

        const countLetters = (s) => {
            try { return (s.match(/\p{L}/gu) || []).length; }
            catch (e) { return (s.match(/[A-Za-z]/g) || []).length; }
        };

        const nameKey = (s) => String(s).toLowerCase().replace(/[^a-z]/g, "");

        /* hash sinkron (cyrb53): hanya penyamaran supaya ejaan khusus tidak tertulis polos di kode */
        const nameHash = (str) => {
            let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
            for (let i = 0; i < str.length; i++) {
                const ch = str.charCodeAt(i);
                h1 = Math.imul(h1 ^ ch, 2654435761);
                h2 = Math.imul(h2 ^ ch, 1597334677);
            }
            h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
            h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
            return 4294967296 * (2097151 & h2) + (h1 >>> 0);
        };

        /* nama tampilan mode khusus: 4 huruf pertama ejaan yang dikenali, huruf awal kapital (tanpa menulis nama di kode) */
        const specialName = (s) => {
            const k = nameKey(s).slice(0, 4);
            return k.charAt(0).toUpperCase() + k.slice(1);
        };

        const titleCase = (s) => s.split(" ").map((w) => {
            return w && w === w.toLowerCase() ? w.charAt(0).toUpperCase() + w.slice(1) : w;
        }).join(" ");

        const readName = () => {
            const text = nameInput ? cleanName(nameInput.value).trim() : "";
            const letters = countLetters(text);
            const ok = letters >= NAME_MIN;
            const key = ok ? nameHash(nameKey(text)) : 0;
            return {
                text, ok, letters,
                typed: letters >= 1, /* sudah ada huruf: cahaya + maskot menyala */
                bulan: ok && BULAN_KEYS.indexOf(key) !== -1, /* ejaan tepat: perayaan khusus (applyName) */
                near: ok && BULAN_NEAR.indexOf(key) !== -1 /* ejaan tepat / sedang menuju ke sana: cahaya + maskot khusus */
            };
        };

        /* pasang nama ke seluruh halaman perayaan */
        function applyName() {
            const n = readName();

            if (!nameInput) { /* HTML lama tanpa kolom nama */
                NAMA = "kamu"; FIRE_NAME = "KAMU"; isBulan = false;
            } else if (!n.ok) {
                NAMA = "kamu"; FIRE_NAME = "KAMU"; isBulan = false;
            } else {
                /* nama yang tampil (judul "Selamat", lirik, kembang api) = persis yang diketik di gerbang, termasuk mode khusus */
                NAMA = titleCase(n.text);
                FIRE_NAME = NAMA.toUpperCase();
                isBulan = Boolean(n.bulan);
            }

            namePts = null; /* huruf kembang api dibuat ulang */
            root.classList.toggle("is-bulan", isBulan);

            if (titleEl) {
                titleEl.textContent = "Selamat, " + NAMA + ".";
                titleEl.classList.toggle("is-long", NAMA.length > 12);
                titleEl.style.textWrap = "balance"; /* nama panjang: baris judul dibagi rata, tidak ada satu kata tersisa sendirian */
            }
            if (eyebrowEl) {
                eyebrowEl.textContent = isBulan ? "PERAYAAN \u00b7 UNTUK SATU NAMA" : "PERAYAAN \u00b7 PANGGUNG KECIL";
            }
            if (subEl) {
                subEl.textContent = isBulan
                    ? "Malam ini, langit pun rela mengalah. Panggungnya milikmu."
                    : "Malam ini panggung ini hanya punya satu bintang, dan itu kamu.";
            }
            if (introTxt) {
                introTxt.textContent = isBulan
                    ? "sebentar lagi, tirainya dibuka, siap-siap senyum"
                    : "sebentar lagi, tirainya dibuka";
            }
        }

        /* tampilan gerbang: terkunci / terbuka / khusus Bulan */
        let buddyGate = null; /* maskot gerbang baru (js/mascot.js); null = pakai maskot lama */

        function renderGate() {
            const n = readName();
            const was = nameOk;
            nameOk = n.ok;

            gate.classList.toggle("is-name-ok", n.ok);
            gate.classList.toggle("is-glow", n.typed); /* cahaya menyala sejak huruf pertama (semua nama) */
            gate.classList.toggle("is-bulan", n.near); /* sedikit lebih terang, naik pelan (lihat CSS) */
            openBtn.classList.toggle("is-locked", !n.ok);
            openBtn.setAttribute("aria-disabled", n.ok ? "false" : "true");
            buddySync(n); /* maskot muncul sejak huruf pertama; kalimat beda per jenis nama */

            if (nameField) {
                nameField.classList.toggle("is-ok", n.ok);
                nameField.classList.toggle("is-glow", n.typed);
                nameField.classList.toggle("is-bulan", n.near);
            }

            if (!teased || n.ok) {
                setTiny(n.ok ? TINY_OK : TINY_LOCKED, false);
                if (n.ok) teased = false;
            }

            if (n.ok && !was) { /* gembok baru lepas */
                retrigger(openBtn, "is-unlocking", 900);
                if (buddyGate) buddyGate.ok();
            }
        }

        function setTiny(text, isTease) {
            if (!gateTease) return;
            gateTease.textContent = text;
            gateTease.classList.toggle("is-tease", Boolean(isTease));
            if (isTease) retrigger(gateTease, "is-pop", 600);
        }

        function setHint(text, mode) {
            if (!nameHint) return;
            nameHint.textContent = text;
            nameHint.classList.toggle("is-ok", mode === "ok");
            retrigger(nameHint, "is-pop", 600);
        }

        function retrigger(el, cls, ms) {
            if (!el) return;
            el.classList.remove(cls);
            void el.offsetWidth;
            el.classList.add(cls);
            setTimeout(() => el.classList.remove(cls), ms);
        }

        /* sindiran hint saat mengetik (valid: ditunda sebentar agar tidak berkedip) */
        function updateHint() {
            clearTimeout(hintTimer);
            const n = readName();
            const len = n.text.length;

            if (!len) { setHint(HINT_EMPTY, "idle"); return; }
            if (!n.ok) {
                const pool = HINT_SHORT[Math.max(1, Math.min(n.letters, 2)) - 1];
                setHint(pool[(HINT_SEED + n.letters) % pool.length], "short");
                return;
            }

            hintTimer = setTimeout(() => {
                const cur = readName();
                if (!cur.ok) return;
                const shown = titleCase(cur.text);
                const line = HINT_OK[cur.text.length % HINT_OK.length];
                setHint(line.replace(/\{nama\}/gi, shown), "ok");
            }, 380);
        }

        /* tombol diklik padahal nama belum ada */
        function teaseLocked() {
            const n = readName();
            teaseCount++;
            teased = true;

            let msg;
            if (n.text && !n.ok) {
                msg = TEASE_SHORT[teaseCount % TEASE_SHORT.length];
            } else if (teaseCount <= TEASE.length) {
                msg = TEASE[teaseCount - 1];
            } else {
                let i = Math.floor(Math.random() * TEASE.length);
                if (i === lastTease) i = (i + 1) % TEASE.length;
                msg = TEASE[i];
            }
            lastTease = TEASE.indexOf(msg);

            setTiny(msg, true);
            retrigger(openBtn, "is-shake", 700);
            retrigger(nameField, "is-shake", 700);
            if (buddyGate) buddyGate.tease();

            /* fokus langsung (sinkron dalam klik) supaya keyboard HP ikut muncul */
            if (nameInput) nameInput.focus({ preventScroll: true });
        }

        /* satu pintu masuk: cek nama dulu, baru buka */
        function tryOpen() {
            if (!readName().ok && nameInput) {
                teaseLocked();
                return;
            }
            applyName();
            open();
        }

        const MASCOT_SVG = '<svg class="mc-svg" viewBox="0 0 64 64" focusable="false" aria-hidden="true">' +
            '<path class="mc-arm mc-arm-l" d="M6 27 Q7 35 14 38"></path>' +
            '<path class="mc-arm mc-arm-r" d="M58 27 Q57 35 50 38"></path>' +
            '<path class="mc-star" d="M32 2 L34.2 8.6 L41 10.8 L34.2 13 L32 19.6 L29.8 13 L23 10.8 L29.8 8.6 Z"></path>' +
            '<ellipse class="mc-body" cx="32" cy="38" rx="20" ry="19"></ellipse>' +
            '<ellipse class="mc-shine" cx="24" cy="28" rx="6" ry="3.4" transform="rotate(-24 24 28)"></ellipse>' +
            '<ellipse class="mc-eye" cx="25.5" cy="36" rx="2.1" ry="3.1"></ellipse>' +
            '<ellipse class="mc-eye" cx="38.5" cy="36" rx="2.1" ry="3.1"></ellipse>' +
            '<circle class="mc-glint" cx="26.2" cy="34.8" r="0.8"></circle>' +
            '<circle class="mc-glint" cx="39.2" cy="34.8" r="0.8"></circle>' +
            '<circle class="mc-cheek" cx="19.5" cy="42" r="3.2"></circle>' +
            '<circle class="mc-cheek" cx="44.5" cy="42" r="3.2"></circle>' +
            '<path class="mc-mouth" d="M28.5 42.5 Q32 46.5 35.5 42.5"></path></svg>';

        /* kalimat maskot di gerbang: SHORT = nama 1-2 huruf, USER = nama lain (ceria + humor), BULAN = nama istimewa; {nama} diisi otomatis */
        const BUDDY_SHORT = [
            "Halo! Aku penjaga tirai. Tambah huruf dikit lagi, nanti kubukain.",
            "Tiga huruf aja cukup, kok. Aku nggak tega lihat gembok ini kesepian.",
            "Lanjut ketik, ya. Aku udah siap di depan tirai, tinggal nunggu kamu."
        ];
        const BUDDY_USER = [
            "Halo! Aku penjaga tirai. Gajiku tepuk tangan, tapi aku bahagia.",
            "Tombol di bawah itu bukan hiasan, lho. Dia nunggu dipencet dari tadi.",
            "Tirainya sudah kupegang erat. Tinggal kamu bilang \u201coke\u201d, {nama}.",
            "Sentuh pelan aja. Tombolnya nggak gigit, paling kembang apinya yang berisik.",
            "Aku udah gladi resik tiga kali. Jangan sampai sia-sia ya, {nama}.",
            "Lampu panggungnya udah dipanasin dari sore. Kasihan kalau nganggur.",
            "Satu klik, tirai terbuka, dan aku bisa pura-pura tenang. Yuk, {nama}!"
        ];
        const BUDDY_BULAN = [
            "Wah, {nama}. Lampu panggung langsung minder, padahal belum dinyalain.",
            "Tirainya udah kupegang. Pencet tombolnya dong, nanti aku baper kalau ditunda.",
            "Aku udah latihan senyum buat kamu. Hasilnya kaku, tapi niatnya tulus.",
            "Tombolnya geer, dari tadi ngeliatin kamu. Kasih satu pencetan kecil aja.",
            "Tenang, {nama}. Yang deg-degan di sini cuma aku dan kembang apinya.",
            "Kata lampu sorot, kamu yang paling ditunggu. Aku cuma nyampein, jangan geer.",
            "Satu pencetan, tirai kebuka, dan aku berhenti pura-pura tenang. Ayo, {nama}!"
        ];
        const BUDDY_CHEER = {
            short: [
                "Digembok dulu, ya. Tambah huruf sampai tiga, baru kupinjamkan kuncinya.",
                "Sabar, tombolnya lagi jual mahal. Tiga huruf, baru dia luluh."
            ],
            user: [
                "Nah, itu dia! Tinggal klik, {nama}.",
                "Dekat banget. Satu sentuhan lagi dan tirainya terbuka."
            ],
            bulan: [
                "Nah, itu tombolnya. Pencet pelan-pelan, aku siap gemetaran.",
                "Dekat banget, {nama}. Satu sentuhan kecil, tirainya langsung kaget."
            ]
        };
        const BUDDY_POOLS = { short: BUDDY_SHORT, user: BUDDY_USER, bulan: BUDDY_BULAN };

        const BUDDY_DWELL = 9500; /* kalimat ganti pelan: tiap 9,5 detik */
        const BUDDY_SWITCH_MIN = 2600; /* jeda minimal sebelum ganti jenis kalimat (mis. nama baru lengkap) */
        const BUDDY_CHEER_GAP = 6000; /* maskot baru boleh menyorak kalau kalimat terakhir sudah tampil selama ini */

        let buddy = null;
        let buddyBubble = null;
        let buddyIdx = 0;
        let buddyTimer = 0;
        let buddySwitchTimer = 0;
        let buddyShown = false;
        let buddyMode = ""; /* "short" | "user" | "bulan" */
        let buddyTpl = ""; /* kalimat yang sedang tampil (masih berisi {nama}) */
        let buddyLastSay = 0;
        let buddyLast = 0;

        /* isi {nama}: nama istimewa dipendekkan ke panggilannya, nama lain = kata pertama */
        const buddyName = () => {
            const n = readName();
            if (n.near) return specialName(n.text);
            return (titleCase(n.text).split(" ")[0] || "").slice(0, 14);
        };

        const buddyFill = (tpl) => tpl.replace(/\{nama\}/gi, buddyName());

        const buddySay = (tpl) => {
            if (!buddyBubble) return;
            buddyTpl = tpl;
            buddyBubble.textContent = buddyFill(tpl);
            buddyLastSay = performance.now();
            retrigger(buddyBubble, "is-pop", 600);
            if (buddyGate) buddyGate.talk(1300);
        };

        /* nama masih diketik: isi {nama} ikut diperbarui, tanpa animasi dan tanpa ganti kalimat */
        const buddyRefresh = () => {
            if (buddyBubble && buddyTpl && /\{nama\}/i.test(buddyTpl)) {
                buddyBubble.textContent = buddyFill(buddyTpl);
            }
        };

        const buddyWant = (n) => (!n.ok ? "short" : n.near ? "bulan" : "user");

        const buddyLoop = () => {
            clearTimeout(buddyTimer);
            if (!buddyShown) return;
            buddyTimer = setTimeout(() => {
                if (!gate.hidden && !isOpen && !document.hidden) {
                    const pool = BUDDY_POOLS[buddyMode] || BUDDY_USER;
                    buddyIdx = (buddyIdx + 1) % pool.length;
                    buddySay(pool[buddyIdx]);
                }
                buddyLoop();
            }, BUDDY_DWELL);
        };

        const buddyEnter = (mode) => {
            buddyMode = mode;
            if (buddyGate) buddyGate.setMode(mode);
            buddyIdx = 0;
            buddySay(BUDDY_POOLS[mode][0]);
            buddyLoop();
        };

        const buddyOn = (on) => {
            if (!buddy || on === buddyShown) return;
            buddyShown = on;
            if (on) {
                buddy.hidden = false;
                void buddy.offsetWidth;
                buddy.classList.add("is-on");
                if (buddyGate) buddyGate.show();
            } else {
                clearTimeout(buddyTimer);
                clearTimeout(buddySwitchTimer);
                buddy.classList.remove("is-on");
                buddy.hidden = true;
                if (buddyGate) buddyGate.hide();
                buddyMode = "";
                buddyTpl = "";
            }
        };

        /* dipanggil tiap nama berubah; jenis kalimat baru dipakai setelah jeda singkat supaya maskot tidak berganti-ganti */
        const buddySync = (n) => {
            if (!buddy) return;
            if (!n.typed) { buddyOn(false); return; }

            const want = buddyWant(n);
            if (!buddyShown) {
                buddyOn(true);
                buddyEnter(want);
                return;
            }

            buddyRefresh();
            clearTimeout(buddySwitchTimer);
            if (want === buddyMode) return;

            const wait = Math.max(700, BUDDY_SWITCH_MIN - (performance.now() - buddyLastSay));
            buddySwitchTimer = setTimeout(() => {
                const cur = readName();
                if (!buddyShown || !cur.typed) return;
                const w = buddyWant(cur);
                if (w !== buddyMode) buddyEnter(w);
            }, wait);
        };

        const buddyCheer = () => {
            const now = performance.now();
            if (!buddyShown || !buddyMode || now - buddyLast < 2600) return;
            buddyLast = now;
            retrigger(buddy, "is-excited", 800);
            if (buddyGate) buddyGate.cheer();
            if (now - buddyLastSay < BUDDY_CHEER_GAP) return; /* kalimat baru saja tampil: jangan ditimpa */
            buddySay(pick(BUDDY_CHEER[buddyMode]));
            buddyLoop();
        };

        if (nameInput) {
            buddy = document.createElement("div");
            buddy.className = "gate-buddy";
            buddy.hidden = true;
            buddy.innerHTML = '<div class="gate-buddy-row"><div class="mascot" aria-hidden="true"></div>' +
                '<p class="buddy-bubble" aria-live="off"></p></div><span class="buddy-arrow" aria-hidden="true">\u2193</span>';
            buddyBubble = buddy.querySelector(".buddy-bubble");
            openBtn.parentNode.insertBefore(buddy, openBtn);
            {
                const A = window.ALPMascot;
                const holder = buddy.querySelector(".mascot");
                if (A && A.gate && typeof A.gate.supported === "function" && A.gate.supported()) {
                    buddyGate = A.gate.attach(holder, { name: buddyName });
                }
                /* maskot lama di gerbang hanya muncul kalau Bulan + Bintang gagal termuat */
                if (!buddyGate) holder.innerHTML = MASCOT_SVG;
            }
            openBtn.addEventListener("pointerenter", buddyCheer);
            openBtn.addEventListener("focus", buddyCheer);
        }

        if (nameInput) {
            /* isi otomatis: ?name=... (untuk tes) atau nama yang tersimpan di sesi ini */
            let pre = "";
            try {
                const m = QUERY.match(/[?&]name=([^&]*)/i);
                if (m) pre = decodeURIComponent(m[1].replace(/\+/g, " "));
            } catch (e) { /* abaikan */ }
            if (!pre) {
                try { pre = sessionStorage.getItem(NAME_STORE) || ""; } catch (e) { /* abaikan */ }
            }
            nameInput.value = cleanName(pre);

            nameInput.addEventListener("input", (event) => {
                if (!event.isComposing) {
                    const clean = cleanName(nameInput.value);
                    if (clean !== nameInput.value) nameInput.value = clean;
                }
                try { sessionStorage.setItem(NAME_STORE, nameInput.value.trim()); } catch (e) { /* abaikan */ }
                teased = false;
                renderGate();
                updateHint();
                if (buddyGate) buddyGate.type();
            });

            nameInput.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    tryOpen();
                }
            });

            renderGate();
            if (readName().ok) updateHint();
        }

        applyName();

        /* profil perangkat: batas kerja tiap jenis layar (sinkron HP / tablet / laptop) */
        const TIER = {
            phone:   { dpr: 1.5, parts: 900,  stars: 110, rockets: 8,  bokeh: 8,  confetti: 150, px: 3000000 },
            tablet:  { dpr: 1.5, parts: 1300, stars: 150, rockets: 10, bokeh: 12, confetti: 210, px: 3200000 },
            desktop: { dpr: 2,   parts: 1800, stars: 190, rockets: 14, bokeh: 16, confetti: 260, px: 5200000 }
        };

        const computeTier = () => {
            const m = Math.min(W, H);
            const coarse = Boolean(window.matchMedia && window.matchMedia("(pointer: coarse)").matches);
            if (m < 540) return "phone";
            if (coarse || Math.max(W, H) < 1100) return "tablet"; /* layar sentuh, atau jendela sedang */
            return "desktop";
        };

        /* resolusi kanvas: dibatasi per perangkat + total piksel, dan turun bila perf turun */
        const calcDPR = () => {
            const T = TIER[tier];
            let d = Math.min(window.devicePixelRatio || 1, T.dpr);
            d *= perf >= 0.85 ? 1 : perf >= 0.7 ? 0.82 : 0.66;
            if (W * H * d * d > T.px) d = Math.sqrt(T.px / (W * H));
            return Math.max(0.75, d);
        };

        function sizeCanvases() {
            DPR = calcDPR();
            [bgC, fxC].forEach((c) => {
                c.width = Math.max(1, Math.round(W * DPR));
                c.height = Math.max(1, Math.round(H * DPR));
            });
            bg.setTransform(DPR, 0, 0, DPR, 0, 0);
            fx.setTransform(DPR, 0, 0, DPR, 0, 0);
        }

        const resize = () => {
            W = root.clientWidth || window.innerWidth;
            H = root.clientHeight || window.innerHeight;
            tier = computeTier();
            small = tier === "phone";

            sizeCanvases();
            buildStars();
            buildBokeh();
            buildCrowd();
            buildBulanFx();
        };

        /* penjaga performa: pantau rata-rata waktu per frame, turunkan kualitas bertahap bila berat */
        function applyPerf() {
            sizeCanvases();
            const cap = maxParticles();
            if (particles.length > cap) particles.length = cap;
            const cc = Math.round(TIER[tier].confetti * perf);
            if (confetti.length > cc) confetti.length = cc;
        }

        function perfWatch(raw) {
            if (!lit || reduced() || raw > 0.25) return; /* tab disembunyikan / jeda: abaikan */
            perfWarm += raw;
            if (perfWarm < 2.5) return; /* tunggu pembuka selesai */
            perfAcc += raw;
            perfN++;
            if (perfAcc < 1.6) return;

            const avg = perfAcc / perfN;
            perfAcc = 0;
            perfN = 0;
            perfSlow = avg > 0.03 ? perfSlow + 1 : 0; /* lebih lambat dari ~33 fps */

            if (perfSlow >= 2 && perf > 0.55) {
                perf = Math.max(0.55, perf - 0.15);
                perfSlow = 0;
                applyPerf();
            }
        }

        function buildStars() {
            const n = clamp(Math.round((W * H) / 6500), 70, TIER[tier].stars);
            const tints = ["#ffe6b8", "#e8eeff", "#ffd9ec", "#d4ecff"];
            stars = [];
            for (let i = 0; i < n; i++) {
                stars.push({
                    x: Math.random() * W,
                    y: Math.random() * H * 0.84,
                    r: rand(0.4, 1.5),
                    ph: rand(0, TAU),
                    sp: rand(0.6, 2.0),
                    col: Math.random() < 0.4 ? tints[0] : pick(tints),
                    big: false,
                    glint: Math.random() < 0.07, /* bintang kecil dengan kilau silang tipis */
                    c: 0, /* kilau tepuk tangan (1 = paling terang) */
                    d: 0 /* tunda sebelum menyala */
                });
            }
            for (let i = 0; i < Math.min(14, n); i++) {
                stars[i].big = true;
                stars[i].r = rand(1.5, 2.4);
            }
        }

        function buildBokeh() {
            const n = TIER[tier].bokeh;
            bokeh = [];
            for (let i = 0; i < n; i++) {
                bokeh.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: rand(16, 60),
                    sp: rand(4, 14),
                    ph: rand(0, TAU),
                    hue: pick([42, 330, 190, 270, 28]),
                    a: rand(0.04, 0.095)
                });
            }
        }

        function buildCrowd() {
            const step = small ? 30 : 36;
            const n = Math.ceil(W / step) + 2;
            crowd = [];
            for (let i = 0; i < n; i++) {
                const row = i % 2;
                crowd.push({
                    x: i * step - step * 0.5 + rand(-8, 8),
                    row,
                    head: rand(13, 19) * (row ? 0.86 : 1),
                    y: H - (row ? 8 : 22) - rand(0, 6),
                    stick: Math.random() < (row ? 0.5 : 0.62),
                    len: rand(30, 48),
                    ph: rand(0, TAU),
                    sw: rand(1.2, 2.4),
                    hue: rand(0, 360)
                });
            }
        }

        function drawStars(t, dt) {
            for (let i = 0; i < stars.length; i++) {
                const s = stars[i];

                /* tepuk tangan: tunggu sebentar, menyala lembut, lalu memudar pelan */
                if (s.d > 0) {
                    s.d -= dt;
                    if (s.d <= 0) s.c = rand(0.5, 0.75);
                }
                if (s.c > 0) s.c = Math.max(0, s.c - dt * 2.2);

                const tw = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph);
                const base = (0.38 + 0.62 * tw) * (s.big ? 1 : 0.85);
                const a = Math.min(1, base + s.c * 0.7);
                const r = s.r * (1 + s.c * 0.5);

                bg.fillStyle = s.c > 0.3 ? "#fffbea" : s.col;

                if (s.c > 0.08) {
                    bg.globalAlpha = s.c * 0.14;
                    bg.beginPath();
                    bg.arc(s.x, s.y, r * 3.4, 0, TAU);
                    bg.fill();
                }

                bg.globalAlpha = a;
                bg.beginPath();
                bg.arc(s.x, s.y, r, 0, TAU);
                bg.fill();

                if (s.big || s.glint || s.c > 0.3) {
                    let L = s.big ? s.r * (3.4 + 1.8 * a) : s.r * (1.6 + 1.0 * tw);
                    L += s.c * (2.5 + s.r * 2);
                    bg.globalAlpha = Math.min(1, a * 0.65);
                    bg.strokeStyle = bg.fillStyle;
                    bg.lineWidth = 0.8;
                    bg.beginPath();
                    bg.moveTo(s.x - L, s.y);
                    bg.lineTo(s.x + L, s.y);
                    bg.moveTo(s.x, s.y - L);
                    bg.lineTo(s.x, s.y + L);
                    bg.stroke();
                }
            }
            bg.globalAlpha = 1;
        }

        /* batas bintang yang boleh menyala bersamaan (supaya ringan) */
        const glowMax = () => Math.max(6, Math.round((small ? 12 : 22) * perf));

        function glowNow() {
            let n = 0;
            for (let i = 0; i < stars.length; i++) {
                if (stars[i].c > 0.05 || stars[i].d > 0) n++;
            }
            return n;
        }

        /* tepuk tangan bintang: segelintir bintang menyala lembut, bukan semuanya sekaligus */
        function applaud(frac) {
            if (reduced()) return;
            let room = glowMax() - glowNow();
            if (room <= 0) return;
            const f = Math.min(frac * 0.4, 0.07);
            for (let i = 0; i < stars.length && room > 0; i++) {
                const st = stars[i];
                if (st.d > 0 || st.c > 0.05) continue;
                if (Math.random() < f) {
                    st.d = rand(0.01, 0.12);
                    room--;
                }
            }
        }

        function applaudWave(beats, frac) {
            const n = Math.min(beats, 2);
            for (let i = 0; i < n; i++) {
                later(() => { if (isOpen) applaud(frac); }, i * rand(0.2, 0.34));
            }
        }

        /* beberapa bintang di sekitar titik ledakan ikut menyala */
        function applaudAt(x, y, rad) {
            if (reduced()) return;
            let room = Math.min(small ? 6 : 10, glowMax() - glowNow());
            if (room <= 0) return;
            const r2 = rad * rad;
            for (let i = 0; i < stars.length && room > 0; i++) {
                const st = stars[i];
                if (st.d > 0 || st.c > 0.05) continue;
                const dx = st.x - x;
                const dy = st.y - y;
                if (dx * dx + dy * dy < r2 && Math.random() < 0.4) {
                    st.d = rand(0.06, 0.4);
                    room--;
                }
            }
        }

        function drawBokeh(t, dt) {
            bg.globalCompositeOperation = "lighter";
            for (let i = 0; i < bokeh.length; i++) {
                const b = bokeh[i];
                b.y -= b.sp * dt;
                if (b.y < -b.r) {
                    b.y = H + b.r;
                    b.x = Math.random() * W;
                }
                const x = b.x + Math.sin(t * 0.4 + b.ph) * 14;
                const g = bg.createRadialGradient(x, b.y, 0, x, b.y, b.r);
                g.addColorStop(0, "hsla(" + b.hue + ",90%,70%," + (b.a * 1.6) + ")");
                g.addColorStop(1, "hsla(" + b.hue + ",90%,60%,0)");
                bg.fillStyle = g;
                bg.beginPath();
                bg.arc(x, b.y, b.r, 0, TAU);
                bg.fill();
            }
            bg.globalCompositeOperation = "source-over";
        }

        /* bintang jatuh / komet: sering melintas, 1-3 sekaligus, lebih terang dan berekor panjang supaya terlihat di balik kembang api */
        function drawShooters(dt) {
            if (lit && !reduced()) {
                nextShooter -= dt;
                if (nextShooter <= 0) {
                    nextShooter = rand(0.9, 2.2);

                    const cap = Math.max(3, Math.round((small ? 5 : 7) * (0.5 + 0.5 * perf)));
                    const r = Math.random();
                    let n = r < 0.3 ? 1 : r < 0.72 ? 2 : 3;
                    n = Math.min(n, cap - shooters.length);

                    /* satu kelompok melintas searah, sedikit berbeda sudut dan posisi */
                    const left = Math.random() < 0.5;
                    const base = rand(0.32, 0.62);
                    const bx = rand(W * 0.1, W * 0.9);
                    for (let i = 0; i < n; i++) {
                        const a = base + rand(-0.07, 0.07);
                        const ang = left ? a : Math.PI - a;
                        const sp = rand(9, 13);
                        shooters.push({
                            x: clamp(bx + rand(-W * 0.2, W * 0.2), W * 0.03, W * 0.97),
                            y: rand(-8, H * 0.3),
                            vx: Math.cos(ang) * sp,
                            vy: Math.sin(ang) * sp,
                            wait: i * rand(0.12, 0.28),
                            life: 0,
                            max: rand(1.0, 1.5),
                            wd: rand(2.2, 3.0)
                        });
                    }
                }
            }

            const k = dt * 60;
            bg.lineCap = "round";
            for (let i = shooters.length - 1; i >= 0; i--) {
                const s = shooters[i];
                if (s.wait > 0) { s.wait -= dt; continue; }

                s.life += dt;
                s.x += s.vx * k;
                s.y += s.vy * k;
                if (s.life > s.max || s.x < -160 || s.x > W + 160 || s.y > H * 0.9) { shooters.splice(i, 1); continue; }

                /* muncul cepat, bertahan terang, lalu padam di ujung */
                const u = s.life / s.max;
                const f = Math.min(1, u * 7) * Math.min(1, (1 - u) * 2.6);
                const tx = s.x - s.vx * 15;
                const ty = s.y - s.vy * 15;

                const g = bg.createLinearGradient(s.x, s.y, tx, ty);
                g.addColorStop(0, "rgba(255,250,232," + f + ")");
                g.addColorStop(0.35, "rgba(255,226,170," + (0.6 * f) + ")");
                g.addColorStop(1, "rgba(255,210,150,0)");

                /* pendar lebar di belakang garis utama */
                bg.strokeStyle = g;
                bg.globalAlpha = 0.28;
                bg.lineWidth = s.wd * 3;
                bg.beginPath();
                bg.moveTo(s.x, s.y);
                bg.lineTo(tx, ty);
                bg.stroke();

                bg.globalAlpha = 1;
                bg.lineWidth = s.wd;
                bg.beginPath();
                bg.moveTo(s.x, s.y);
                bg.lineTo(tx, ty);
                bg.stroke();

                /* kepala komet */
                bg.fillStyle = "rgba(255,252,240," + f + ")";
                bg.beginPath();
                bg.arc(s.x, s.y, s.wd * 0.8, 0, TAU);
                bg.fill();
                bg.fillStyle = "rgba(255,236,190," + (0.22 * f) + ")";
                bg.beginPath();
                bg.arc(s.x, s.y, s.wd * 2.8, 0, TAU);
                bg.fill();
            }
            bg.globalAlpha = 1;
        }

        function drawCrowd(t) {
            for (let pass = 1; pass >= 0; pass--) {
                for (let i = 0; i < crowd.length; i++) {
                    const c = crowd[i];
                    if (c.row !== pass) continue;

                    const hy = c.y + Math.sin(t * c.sw + c.ph) * 2;

                    if (c.stick) {
                        const ang = Math.sin(t * c.sw * 0.9 + c.ph) * 0.38;
                        const bx = c.x + 7;
                        const by = hy - c.head * 0.2;
                        const ex = bx + Math.sin(ang) * c.len;
                        const ey = by - Math.cos(ang) * c.len;
                        const hue = (c.hue + t * 36) % 360;

                        bg.globalCompositeOperation = "lighter";
                        bg.lineCap = "round";
                        bg.strokeStyle = "hsla(" + hue + ",95%,62%,0.2)";
                        bg.lineWidth = 8;
                        bg.beginPath();
                        bg.moveTo(bx, by);
                        bg.lineTo(ex, ey);
                        bg.stroke();
                        bg.strokeStyle = "hsla(" + hue + ",100%,78%,0.95)";
                        bg.lineWidth = 2.6;
                        bg.beginPath();
                        bg.moveTo(bx, by);
                        bg.lineTo(ex, ey);
                        bg.stroke();
                        bg.globalCompositeOperation = "source-over";
                    }

                    bg.fillStyle = pass ? "#0b0618" : "#05030b";
                    bg.beginPath();
                    bg.arc(c.x, hy, c.head, 0, TAU);
                    bg.fill();
                    bg.fillRect(c.x - c.head * 1.45, hy + c.head * 0.55, c.head * 2.9, H);
                }
            }
        }

        function addConfetti(n) {
            if (reduced()) return;
            if (isBulan) n = Math.round(n * 1.25);
            const room = Math.round(TIER[tier].confetti * (isBulan ? 1.25 : 1) * perf) - confetti.length;
            for (let i = 0; i < Math.min(n, room); i++) {
                confetti.push({
                    x: rand(0, W),
                    y: rand(-H * 0.3, -10),
                    vx: rand(-0.8, 0.8),
                    vy: rand(1.5, 3.4),
                    rot: rand(0, TAU),
                    vr: rand(-6, 6),
                    w: rand(6, 11),
                    h: rand(3, 6),
                    hue: pick([42, 338, 190, 272, 150, 22, 310]),
                    kind: isBulan ? (Math.random() < 0.3 ? "petal" : Math.random() < 0.3 ? "star" : "rect") : "rect",
                    ph: rand(0, TAU)
                });
            }
        }

        function drawConfetti(t, dt) {
            const k = dt * 60;
            for (let i = confetti.length - 1; i >= 0; i--) {
                const c = confetti[i];
                c.y += c.vy * k;
                c.x += c.vx * k + Math.sin(t * 3 + c.ph) * 0.6;
                c.rot += c.vr * dt;
                if (c.y > H + 20) { confetti.splice(i, 1); continue; }

                bg.save();
                bg.translate(c.x, c.y);
                bg.rotate(c.rot);
                bg.scale(1, Math.cos(c.rot * 2));
                bg.globalAlpha = 0.92;
                if (c.kind === "petal") { /* kelopak (khusus Bulan) */
                    bg.fillStyle = "hsl(" + (332 + (c.hue % 22)) + ",88%,80%)";
                    bg.beginPath();
                    bg.ellipse(0, 0, c.w * 0.62, c.h * 0.9, 0, 0, TAU);
                    bg.fill();
                } else if (c.kind === "star") { /* serpihan bintang (khusus Bulan) */
                    const r = c.w * 0.62;
                    bg.fillStyle = "#fff3c8";
                    bg.beginPath();
                    bg.moveTo(0, -r);
                    bg.quadraticCurveTo(0, 0, r, 0);
                    bg.quadraticCurveTo(0, 0, 0, r);
                    bg.quadraticCurveTo(0, 0, -r, 0);
                    bg.quadraticCurveTo(0, 0, 0, -r);
                    bg.fill();
                } else {
                    bg.fillStyle = "hsl(" + c.hue + ",90%,66%)";
                    bg.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
                }
                bg.restore();
            }
            bg.globalAlpha = 1;
        }

        /* rasi bulan sabit: kontur sabit + satu bintang kecil di sisinya */
        const CON_PTS = [
            [0.66, 0.0], [0.34, 0.14], [0.12, 0.48], [0.3, 0.84], [0.66, 1.0],
            [0.46, 0.76], [0.36, 0.48], [0.46, 0.22], [0.9, 0.34]
        ];
        const CON_SEGS = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 0]];
        const CON_R = [2.6, 1.9, 2.1, 1.9, 2.6, 1.7, 1.9, 1.7, 3.0];

        function buildBulanFx() {
            aur = null;
            flies = [];
            if (!isBulan) return;

            /* aurora digambar sekali di kanvas kecil, lalu digeser pelan tiap frame */
            try {
                const w = Math.max(64, Math.round(W / 5));
                const h = Math.max(40, Math.round((H * 0.46) / 5));
                const c = document.createElement("canvas");
                c.width = w;
                c.height = h;
                const g = c.getContext("2d");
                g.globalCompositeOperation = "lighter";
                [[165, 0.3, 0.11, 0.9], [275, 0.2, 0.1, 1.4], [335, 0.26, 0.08, 2.1]].forEach((r) => {
                    for (let x = 0; x < w; x++) {
                        const yy = h * r[1] + Math.sin((x / w) * 5.2 + r[3]) * h * 0.14 + Math.sin((x / w) * 11 + r[3] * 2) * h * 0.05;
                        const len = h * (0.34 + 0.12 * Math.sin((x / w) * 7 + r[3]));
                        const gr = g.createLinearGradient(0, yy - len, 0, yy + len * 0.35);
                        gr.addColorStop(0, "hsla(" + r[0] + ",90%,70%,0)");
                        gr.addColorStop(0.7, "hsla(" + r[0] + ",90%,68%," + r[2] + ")");
                        gr.addColorStop(1, "hsla(" + r[0] + ",90%,70%,0)");
                        g.fillStyle = gr;
                        g.fillRect(x, yy - len, 1, len * 1.35);
                    }
                });
                aur = c;
            } catch (e) { aur = null; }

            const n = small ? 8 : 14;
            for (let i = 0; i < n; i++) {
                flies.push({ x: rand(0, W), y: rand(H * 0.5, H * 0.84), ph: rand(0, TAU), sx: rand(0.2, 0.5), sy: rand(0.25, 0.6), sp: rand(1.2, 2.6) });
            }
        }

        /* lapisan belakang: aurora + rasi bulan sabit */
        function drawBulanBack(t, dt) {
            if (!lit) return;
            bulanT += dt;
            const ramp = clamp(bulanT / 4, 0, 1);

            if (aur && perf >= 0.7) {
                const aw = W * 1.12;
                const ah = H * 0.46;
                bg.globalCompositeOperation = "lighter";
                bg.globalAlpha = ramp * (0.65 + 0.35 * Math.sin(t * 0.5));
                bg.drawImage(aur, -W * 0.06 + Math.sin(t * 0.12) * W * 0.035, 0, aw, ah);
                bg.globalAlpha = ramp * (0.4 + 0.3 * Math.sin(t * 0.37 + 2));
                bg.save();
                bg.translate(W, 0);
                bg.scale(-1, 1);
                bg.drawImage(aur, -W * 0.06 + Math.cos(t * 0.09) * W * 0.04, 0, aw, ah * 0.9);
                bg.restore();
                bg.globalAlpha = 1;
                bg.globalCompositeOperation = "source-over";
            }

            const size = clamp(Math.min(W, H) * 0.17, 70, 150);
            const ox = W * (small ? 0.8 : 0.86) - size / 2;
            const oy = H * (small ? 0.34 : 0.3);
            const prog = clamp((bulanT - 1.2) / 5, 0, 1) * CON_SEGS.length;
            const P = CON_PTS.map((p) => [ox + p[0] * size, oy + p[1] * size * 0.95]);

            bg.lineCap = "round";
            bg.lineWidth = 1;
            bg.strokeStyle = "rgba(255,236,190," + (0.4 * ramp) + ")";
            for (let i = 0; i < CON_SEGS.length; i++) {
                const f = clamp(prog - i, 0, 1);
                if (f <= 0) break;
                const a = P[CON_SEGS[i][0]];
                const b = P[CON_SEGS[i][1]];
                bg.beginPath();
                bg.moveTo(a[0], a[1]);
                bg.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f);
                bg.stroke();
            }

            for (let i = 0; i < P.length; i++) {
                const tw = 0.7 + 0.3 * Math.sin(t * 1.4 + i * 1.7);
                const r = CON_R[i];
                bg.fillStyle = "rgba(255,230,176," + (0.16 * tw * ramp) + ")";
                bg.beginPath();
                bg.arc(P[i][0], P[i][1], r * 3.2, 0, TAU);
                bg.fill();
                bg.fillStyle = "rgba(255,250,232," + (0.9 * ramp) + ")";
                bg.beginPath();
                bg.arc(P[i][0], P[i][1], r, 0, TAU);
                bg.fill();
            }

            const la = clamp((bulanT - 5.5) / 2, 0, 1) * 0.55;
            if (la > 0.01) {
                bg.font = "italic " + (small ? 10 : 12) + "px \"Cormorant Garamond\", Georgia, serif";
                bg.textAlign = "center";
                bg.fillStyle = "rgba(255,236,190," + la + ")";
                bg.fillText("Rasi Jeda Kecil", ox + size / 2, oy + size * 0.95 + 20);
            }
        }

        /* lapisan tengah: lentera langit + kunang-kunang (di belakang penonton) */
        function drawBulanMid(t, dt) {
            if (reduced()) return;

            if (lit) {
                nextLantern -= dt;
                if (nextLantern <= 0 && lanterns.length < Math.max(3, Math.round((small ? 5 : 8) * perf))) {
                    nextLantern = rand(1.6, 3.2);
                    lanterns.push({ x: rand(W * 0.06, W * 0.94), y: H + 30, w: rand(13, 22), sp: rand(16, 28), ph: rand(0, TAU), hue: pick([34, 28, 42, 340, 22]) });
                }
            }

            for (let i = lanterns.length - 1; i >= 0; i--) {
                const l = lanterns[i];
                l.y -= l.sp * dt;
                if (l.y < -40) { lanterns.splice(i, 1); continue; }
                const x = l.x + Math.sin(t * 0.7 + l.ph) * 12;
                const fade = clamp((H + 30 - l.y) / 120, 0, 1) * clamp(l.y / (H * 0.2) + 0.3, 0, 1);
                const fl = 0.82 + 0.18 * Math.sin(t * 7 + l.ph * 3);
                const h = l.w * 1.25;

                bg.globalCompositeOperation = "lighter";
                const g = bg.createRadialGradient(x, l.y, 0, x, l.y, l.w * 2.6);
                g.addColorStop(0, "hsla(" + l.hue + ",100%,66%," + (0.34 * fade * fl) + ")");
                g.addColorStop(1, "hsla(" + l.hue + ",100%,60%,0)");
                bg.fillStyle = g;
                bg.beginPath();
                bg.arc(x, l.y, l.w * 2.6, 0, TAU);
                bg.fill();
                bg.globalCompositeOperation = "source-over";

                bg.globalAlpha = 0.9 * fade;
                bg.fillStyle = "hsl(" + l.hue + ",95%," + (58 + 10 * fl).toFixed(0) + "%)";
                bg.beginPath();
                bg.moveTo(x - l.w * 0.5, l.y - h * 0.5);
                bg.lineTo(x + l.w * 0.5, l.y - h * 0.5);
                bg.lineTo(x + l.w * 0.38, l.y + h * 0.5);
                bg.lineTo(x - l.w * 0.38, l.y + h * 0.5);
                bg.closePath();
                bg.fill();
                bg.fillStyle = "rgba(90,40,20,0.85)";
                bg.fillRect(x - l.w * 0.5, l.y - h * 0.5 - 2, l.w, 2.4);
                bg.fillRect(x - l.w * 0.38, l.y + h * 0.5 - 0.6, l.w * 0.76, 2);
                bg.globalAlpha = 1;
            }

            if (!lit) return;
            const k = clamp(bulanT / 3, 0, 1);
            bg.globalCompositeOperation = "lighter";
            for (let i = 0; i < flies.length; i++) {
                const f = flies[i];
                const x = f.x + Math.sin(t * f.sx + f.ph) * 38;
                const y = f.y + Math.cos(t * f.sy + f.ph * 1.7) * 26;
                const a = Math.pow(0.5 + 0.5 * Math.sin(t * f.sp + f.ph), 2) * k;
                if (a < 0.02) continue;
                const g = bg.createRadialGradient(x, y, 0, x, y, 10);
                g.addColorStop(0, "rgba(236,255,170," + (0.85 * a) + ")");
                g.addColorStop(1, "rgba(200,255,120,0)");
                bg.fillStyle = g;
                bg.beginPath();
                bg.arc(x, y, 10, 0, TAU);
                bg.fill();
            }
            bg.globalCompositeOperation = "source-over";
        }

        function drawBackground(t, dt) {
            bg.clearRect(0, 0, W, H);
            drawBokeh(t, dt);
            drawStars(t, dt);
            if (isBulan) drawBulanBack(t, dt);
            drawShooters(dt);
            if (isBulan) drawBulanMid(t, dt);
            drawCrowd(t);
            drawConfetti(t, dt);
        }

        const PAL = [
            { h: 42,  s: 100, l: 62, h2: 30 }, /* emas */
            { h: 338, s: 95,  l: 68, h2: 318 }, /* mawar */
            { h: 190, s: 95,  l: 64, h2: 215 }, /* sian */
            { h: 272, s: 90,  l: 72, h2: 300 }, /* ungu */
            { h: 150, s: 85,  l: 58, h2: 175 }, /* zamrud */
            { h: 22,  s: 100, l: 60, h2: 45 }, /* jingga */
            { h: 210, s: 20,  l: 92, h2: 40 }, /* perak */
            { h: 310, s: 95,  l: 66, h2: 340 }, /* magenta */
            { h: 220, s: 95,  l: 68, h2: 190 }, /* biru */
            { h: 95,  s: 85,  l: 60, h2: 130 }, /* limau */
            { h: 8,   s: 90,  l: 64, h2: 350 }, /* koral */
            { h: 172, s: 80,  l: 58, h2: 195 }, /* tosca */
            { h: 255, s: 85,  l: 76, h2: 280 }, /* lavender */
            { h: 140, s: 70,  l: 78, h2: 170 }, /* hijau pastel */
            { h: 54,  s: 100, l: 70, h2: 38 }, /* kuning */
            { h: 28,  s: 95,  l: 55, h2: 12 }, /* tembaga */
            { h: 200, s: 100, l: 78, h2: 222 } /* es */
        ];

        const GOLD = { h: 40, s: 100, l: 66, h2: 28 };
        const SILVER = { h: 205, s: 25, l: 92, h2: 45 };
        const ICE = { h: 195, s: 85, l: 84, h2: 215 };
        const ROSEGOLD = { h: 14, s: 90, l: 80, h2: 40 };
        const WHITE = { h: 48, s: 60, l: 96, h2: 40 };

        const hueGap = (a, b) => {
            const d = Math.abs(a.h - b.h) % 360;
            return Math.min(d, 360 - d);
        };

        /* pilih warna yang jaraknya cukup jauh dari warna lain supaya kombinasi tampak jelas */
        const pickPal = (...not) => {
            let p = pick(PAL);
            for (let i = 0; i < 12; i++) {
                if (not.every((n) => !n || hueGap(n, p) > 40)) break;
                p = pick(PAL);
            }
            return p;
        };

        /* keadaan ledakan yang sedang dibuat (warna, pola warna, gaya) */
        let cur = { p1: PAL[0], p2: PAL[1], p3: PAL[2], tone: "mono", glint: false, strobe: false, trail: false, crackle: false };

        /* pola warna: mono, dua warna selang-seling, tiga warna, inti beda, belah dua */
        const toneColor = (i, p, fallback) => {
            switch (cur.tone) {
                case "mix2": return i % 2 ? cur.p2 : cur.p1;
                case "mix3": return [cur.p1, cur.p2, cur.p3][i % 3];
                case "core": return Math.hypot(p[0], p[1]) < 0.55 ? cur.p2 : cur.p1;
                case "split": return p[0] < 0 ? cur.p1 : cur.p2;
                default: return fallback;
            }
        };

        const SHAPE_W = {
            sphere: 7, peony: 7, chrysanthemum: 7, pistil: 6, dahlia: 5, crackle: 5, glitter: 6, strobe: 3,
            ring: 4, rings: 4, atom: 4, saturn: 4, ripple: 4, doubleShell: 5,
            spiral: 5, flower: 6, butterfly: 4, snowflake: 3, sparkle: 4, peacock: 4, fireflies: 3,
            willow: 4, kamuro: 4, palm: 5, rainbow: 4, star: 3, moon: 3, smiley: 1.5, heart: 1
        };

        /* khusus Bulan: sedikit lebih banyak bentuk bertema langit & bunga (bukan hati) */
        const BULAN_BOOST = { moon: 1.4, star: 1.4, flower: 1.3, butterfly: 1.4, snowflake: 1.2, sparkle: 1.3, rainbow: 1.2, fireflies: 1.3 };

        /* bentuk khusus Bulan (bobot). Hati sedikit lebih sering dari nama lain, tetap dijaga jedanya. */
        const BULAN_W = { heart: 2, heartGlow: 2.6, crown: 3, sakura: 4, palette: 3, moonStar: 3.5 };
        const isHeart = (n) => n === "heart" || n === "heartGlow";
        const shapeNames = () => (isBulan
            ? Object.keys(SHAPE_W).concat(Object.keys(BULAN_W).filter((n) => !(n in SHAPE_W)))
            : Object.keys(SHAPE_W));

        const HEART_GAP = 45;
        const recentShapes = [];
        let sinceHeart = 0;

        function nextShape() {
            const names = shapeNames();
            const gap = isBulan ? BULAN_HEART_GAP : HEART_GAP;
            let total = 0;
            const ws = names.map((n) => {
                const base = isBulan && BULAN_W[n] != null ? BULAN_W[n] : SHAPE_W[n];
                let w = base * (isBulan && BULAN_BOOST[n] ? BULAN_BOOST[n] : 1);
                let cnt = 0;
                for (let i = 0; i < recentShapes.length; i++) if (recentShapes[i] === n) cnt++;
                if (recentShapes[recentShapes.length - 1] === n) w = 0;
                else w /= 1 + cnt * 2.5;
                if (isHeart(n) && sinceHeart < gap) w = 0;
                total += w;
                return w;
            });

            let r = Math.random() * total;
            let out = names[0];
            for (let i = 0; i < names.length; i++) {
                r -= ws[i];
                if (r <= 0) { out = names[i]; break; }
            }

            recentShapes.push(out);
            if (recentShapes.length > 10) recentShapes.shift();
            sinceHeart = isHeart(out) ? 0 : sinceHeart + 1;
            return out;
        }

        const maxParticles = () => Math.round(TIER[tier].parts * perf);

        /* emit: pts = posisi akhir (satuan R); v0 = R * (1 - d) agar bentuk pas di ujung gerakan; opsi: mix, loose, glint, strobe */
        function emit(x, y, pts, R, o) {
            const drag = o.drag || 0.95;
            const v0 = R * (1 - drag);
            const life = o.life || [1.5, 2.1];
            const size = o.size || [1.4, 2.2];
            const glint = o.glint != null ? o.glint : cur.glint;
            const strobe = o.strobe != null ? o.strobe : cur.strobe;
            const trail = o.trail != null ? o.trail : (Boolean(o.loose) && cur.trail);
            const crackle = o.crackle != null ? o.crackle : (Boolean(o.loose) && cur.crackle);

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                const j = o.jit ? 1 + rand(-o.jit, o.jit) : 1;
                const c = o.col ? o.col(i, p) : (o.mix ? toneColor(i, p, o.pal) : o.pal);
                const L = rand(life[0], life[1]);
                particles.push({
                    x, y,
                    vx: p[0] * v0 * j,
                    vy: p[1] * v0 * j,
                    h: c.h,
                    h2: o.shift === false ? c.h : (c.h2 != null ? c.h2 : c.h),
                    s: c.s,
                    l: c.l,
                    life: L,
                    max: L,
                    size: rand(size[0], size[1]),
                    drag,
                    grav: o.grav == null ? 0.03 : o.grav,
                    tw: Boolean(o.tw),
                    trail: Boolean(trail),
                    crackle: Boolean(crackle) && Math.random() < 0.4,
                    glint: Boolean(glint),
                    strobe: Boolean(strobe),
                    ph: rand(0, TAU),
                    form: false
                });
            }
        }

        const randDisc = (n, min) => {
            const pts = [];
            for (let i = 0; i < n; i++) {
                const a = rand(0, TAU);
                const m = Math.sqrt(rand(min == null ? 0.12 : min, 1));
                pts.push([Math.cos(a) * m, Math.sin(a) * m]);
            }
            return pts;
        };

        const circle = (n, r, sx, sy, rot) => {
            const pts = [];
            const c = Math.cos(rot || 0);
            const s = Math.sin(rot || 0);
            for (let i = 0; i < n; i++) {
                const a = (i / n) * TAU;
                const px = Math.cos(a) * r * (sx || 1);
                const py = Math.sin(a) * r * (sy || 1);
                pts.push([px * c - py * s, px * s + py * c]);
            }
            return pts;
        };

        /* bantu bentuk: pusatkan, skala ke radius 1, putar */
        const center = (pts) => {
            let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
            for (let i = 0; i < pts.length; i++) {
                x0 = Math.min(x0, pts[i][0]); x1 = Math.max(x1, pts[i][0]);
                y0 = Math.min(y0, pts[i][1]); y1 = Math.max(y1, pts[i][1]);
            }
            const cx = (x0 + x1) / 2;
            const cy = (y0 + y1) / 2;
            return pts.map((p) => [p[0] - cx, p[1] - cy]);
        };

        const norm = (pts) => {
            let m = 0;
            for (let i = 0; i < pts.length; i++) m = Math.max(m, Math.hypot(pts[i][0], pts[i][1]));
            return m > 0 ? pts.map((p) => [p[0] / m, p[1] / m]) : pts;
        };

        const rot2 = (pts, a) => {
            const c = Math.cos(a);
            const s = Math.sin(a);
            return pts.map((p) => [p[0] * c - p[1] * s, p[0] * s + p[1] * c]);
        };

        /* kurva hati (dipakai heartGlow) */
        const heartCurve = (n, sc) => {
            const pts = [];
            for (let i = 0; i < n; i++) {
                const t = (i / n) * TAU;
                pts.push([
                    ((16 * Math.pow(Math.sin(t), 3)) / 17) * sc,
                    ((-(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))) / 17) * sc + 0.04
                ]);
            }
            return pts;
        };

        const SHAPES = {
            sphere(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(110 * b)), R, {
                    pal: p1, life: [1.5, 2.3], size: [1.3, 2.3], drag: 0.955, grav: 0.03, tw: true, jit: 0.04, mix: true, loose: true
                });
            },

            peony(x, y, R, p1, p2, b) {
                const per = Math.round(38 * b);
                const rings = [circle(per, 1), circle(per, 0.7), circle(per, 0.42)];
                const cols = [p1, p2, p1];
                const pts = rings[0].concat(rings[1], rings[2]);
                emit(x, y, pts, R, {
                    col: (i) => cols[Math.floor(i / per)] || p1,
                    life: [1.6, 2.2], size: [1.5, 2.3], drag: 0.95, grav: 0.016, tw: true, loose: true
                });
            },

            ring(x, y, R, p1, p2, b) {
                emit(x, y, circle(Math.round(72 * b), 1), R, {
                    pal: p1, mix: true, life: [1.5, 1.9], size: [1.7, 2.4], drag: 0.945, grav: 0.008, tw: true
                });
            },

            rings(x, y, R, p1, p2, b) {
                emit(x, y, circle(Math.round(70 * b), 1), R, {
                    pal: p1, life: [1.5, 1.9], size: [1.7, 2.4], drag: 0.945, grav: 0.008, tw: true
                });
                emit(x, y, circle(Math.round(44 * b), 0.55), R, {
                    pal: p2, life: [1.4, 1.8], size: [1.5, 2.1], drag: 0.945, grav: 0.008, tw: true
                });
            },

            heart(x, y, R, p1, p2, b) {
                const heart = (n, sc) => {
                    const pts = [];
                    for (let i = 0; i < n; i++) {
                        const t = (i / n) * TAU;
                        const hx = 16 * Math.pow(Math.sin(t), 3);
                        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
                        pts.push([(hx / 17) * sc, (hy / 17) * sc + 0.04]);
                    }
                    return pts;
                };
                emit(x, y, heart(Math.round(86 * b), 1), R * 1.05, {
                    pal: { h: 340, s: 95, l: 66, h2: 322 }, life: [1.7, 2.1], size: [1.8, 2.5], drag: 0.94, grav: 0.005, tw: true
                });
                emit(x, y, heart(Math.round(46 * b), 0.55), R * 1.05, {
                    pal: { h: 350, s: 90, l: 82, h2: 40 }, life: [1.5, 1.9], size: [1.5, 2.1], drag: 0.94, grav: 0.005, tw: true
                });
            },

            star(x, y, R, p1, p2, b) {
                const V = [];
                for (let i = 0; i < 10; i++) {
                    const a = -Math.PI / 2 + (i * Math.PI) / 5;
                    const r = i % 2 ? 0.42 : 1;
                    V.push([Math.cos(a) * r, Math.sin(a) * r]);
                }
                const per = Math.max(5, Math.round(9 * b));
                const pts = [];
                for (let i = 0; i < 10; i++) {
                    const A = V[i];
                    const B = V[(i + 1) % 10];
                    for (let k = 0; k < per; k++) {
                        const t = k / per;
                        pts.push([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t]);
                    }
                }
                emit(x, y, pts, R * 1.05, {
                    pal: { h: 46, s: 100, l: 70, h2: 34 }, life: [1.6, 2.0], size: [1.7, 2.4], drag: 0.94, grav: 0.005, tw: true
                });
                emit(x, y, circle(18, 0.28), R, {
                    pal: p2, life: [1.0, 1.4], size: [1.2, 1.8], drag: 0.93, grav: 0.01
                });
            },

            moon(x, y, R, p1, p2, b) {
                const bc = [0.5, 0];
                const br = 0.82;
                const tilt = rand(-0.6, 0.6);
                const ct = Math.cos(tilt);
                const st = Math.sin(tilt);
                const pts = [];
                const put = (px, py) => {
                    const qx = px + 0.42;
                    pts.push([qx * ct - py * st, qx * st + py * ct]);
                };
                const nA = Math.round(120 * b);
                const nB = Math.round(90 * b);
                for (let i = 0; i < nA; i++) {
                    const a = (i / nA) * TAU;
                    const px = Math.cos(a);
                    const py = Math.sin(a);
                    if (Math.hypot(px - bc[0], py - bc[1]) > br) put(px, py);
                }
                for (let i = 0; i < nB; i++) {
                    const a = (i / nB) * TAU;
                    const qx = bc[0] + br * Math.cos(a);
                    const qy = bc[1] + br * Math.sin(a);
                    if (Math.hypot(qx, qy) < 1) put(qx, qy);
                }
                emit(x, y, pts, R, {
                    pal: { h: 46, s: 100, l: 76, h2: 36 }, life: [1.7, 2.1], size: [1.7, 2.4], drag: 0.94, grav: 0.005, tw: true
                });
            },

            spiral(x, y, R, p1, p2, b) {
                const arms = 3;
                const per = Math.max(10, Math.round(26 * b));
                const dir = Math.random() < 0.5 ? 1 : -1;
                const off = rand(0, TAU);
                const pts = [];
                for (let a = 0; a < arms; a++) {
                    for (let i = 0; i < per; i++) {
                        const ang = off + (a * TAU) / arms + dir * i * 0.26;
                        const m = (i + 1) / per;
                        pts.push([Math.cos(ang) * m, Math.sin(ang) * m]);
                    }
                }
                emit(x, y, pts, R, {
                    col: (i) => (Math.floor(i / per) % 2 ? p2 : p1),
                    life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.95, grav: 0.01, tw: true
                });
            },

            willow(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(66 * b), 0.3), R * 0.9, {
                    pal: Math.random() < 0.7 ? GOLD : { h: 200, s: 25, l: 90, h2: 45 },
                    life: [2.8, 3.8], size: [1.4, 2.0], drag: 0.968, grav: 0.055, tw: true, trail: true, jit: 0.05, shift: false
                });
            },

            saturn(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(48 * b), 0.1), R * 0.62, {
                    pal: p1, life: [1.5, 2.0], size: [1.4, 2.1], drag: 0.95, grav: 0.012, tw: true
                });
                emit(x, y, circle(Math.round(64 * b), 1.25, 1, 0.3, rand(-0.7, 0.7)), R, {
                    pal: p2, life: [1.5, 1.9], size: [1.6, 2.2], drag: 0.945, grav: 0.006, tw: true
                });
            },

            rainbow(x, y, R, p1, p2, b) {
                const pts = circle(Math.round(60 * b), 1).concat(circle(Math.round(40 * b), 0.62));
                emit(x, y, pts, R, {
                    col: (i, p) => {
                        const h = (Math.atan2(p[1], p[0]) / TAU * 360 + 360) % 360;
                        return { h, h2: h + 36, s: 95, l: 64 };
                    },
                    life: [1.5, 2.0], size: [1.6, 2.3], drag: 0.945, grav: 0.01, tw: true
                });
            },

            crackle(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(90 * b)), R, {
                    pal: p1, mix: true, life: [1.3, 1.9], size: [1.5, 2.3], drag: 0.955, grav: 0.025, tw: true, crackle: true, jit: 0.05
                });
            },

            /* krisan: bola padat dengan ekor berjejak */
            chrysanthemum(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(96 * b), 0.2), R, {
                    pal: p1, mix: true, life: [2.2, 3.0], size: [1.4, 2.1], drag: 0.962, grav: 0.035, tw: true, trail: true, jit: 0.05
                });
            },

            /* pistil: bola besar dengan inti berwarna lain dan titik putih di tengah */
            pistil(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(86 * b), 0.38), R, {
                    pal: p1, life: [1.6, 2.2], size: [1.4, 2.2], drag: 0.955, grav: 0.025, tw: true, jit: 0.04
                });
                emit(x, y, randDisc(Math.round(44 * b), 0.05), R * 0.56, {
                    pal: p2, life: [1.5, 2.0], size: [1.4, 2.0], drag: 0.95, grav: 0.02, tw: true
                });
                emit(x, y, circle(Math.round(18 * b), 0.2), R * 0.5, {
                    pal: WHITE, life: [1.1, 1.5], size: [1.3, 1.9], drag: 0.94, grav: 0.01, tw: true
                });
            },

            /* dahlia: empat lapis cincin berlapis warna, seperti mandala */
            dahlia(x, y, R, p1, p2, b, p3) {
                const cols = [p1, p3, p2, p1];
                for (let j = 0; j < 4; j++) {
                    emit(x, y, circle(Math.round((50 - j * 8) * b), 1 - j * 0.24, 1, 1, j * 0.11), R, {
                        pal: cols[j], life: [1.6 - j * 0.08, 2.1 - j * 0.1], size: [1.5, 2.2], drag: 0.95, grav: 0.01, tw: true
                    });
                }
            },

            /* glitter: hujan emas, tiap titik berkilau silang */
            glitter(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(120 * b), 0.1), R, {
                    pal: { h: 44, s: 100, l: 72, h2: 36 }, life: [2.4, 3.2], size: [1.2, 1.9], drag: 0.968, grav: 0.04, tw: true, glint: true, shift: false, jit: 0.05
                });
            },

            /* strobe: bola perak yang titiknya berkedip pelan bergantian */
            strobe(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(100 * b), 0.1), R, {
                    pal: { h: 210, s: 20, l: 94, h2: 48 }, life: [2.0, 2.8], size: [1.5, 2.3], drag: 0.958, grav: 0.03, strobe: true, jit: 0.04
                });
            },

            /* kunang-kunang: titik hangat melayang pelan dan berkedip */
            fireflies(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(46 * b), 0), R * 0.55, {
                    pal: { h: 62, s: 95, l: 70, h2: 50 }, life: [2.8, 3.8], size: [1.8, 2.8], drag: 0.975, grav: -0.003, tw: true, strobe: true, jit: 0.3
                });
            },

            /* atom: tiga cincin miring saling silang + inti */
            atom(x, y, R, p1, p2, b, p3) {
                const base = rand(0, Math.PI);
                [p1, p2, p3].forEach((c, i) => {
                    emit(x, y, circle(Math.round(52 * b), 1, 1, 0.32, base + (i * Math.PI) / 3), R, {
                        pal: c, life: [1.6, 2.1], size: [1.6, 2.2], drag: 0.945, grav: 0.007, tw: true
                    });
                });
                emit(x, y, randDisc(Math.round(14 * b), 0.05), R * 0.2, {
                    pal: WHITE, life: [1.2, 1.6], size: [1.5, 2.1], drag: 0.94, grav: 0.005, tw: true
                });
            },

            /* riak: tiga cincin berurutan dari titik yang sama */
            ripple(x, y, R, p1, p2, b, p3) {
                const keep = cur;
                [p1, p2, p3].forEach((c, i) => {
                    const go = () => emit(x, y, circle(Math.round((46 + i * 12) * b), 1), R * (0.46 + 0.27 * i), {
                        pal: c, life: [1.3, 1.7], size: [1.6, 2.2], drag: 0.945, grav: 0.006, tw: true
                    });
                    if (i === 0) go();
                    else later(() => { if (!isOpen) return; cur = keep; go(); }, i * 0.17);
                });
            },

            /* kulit ganda: bola besar lalu bola kecil meledak lagi dari tengahnya */
            doubleShell(x, y, R, p1, p2, b, p3) {
                const keep = cur;
                emit(x, y, randDisc(Math.round(80 * b), 0.5), R, {
                    pal: p1, life: [1.5, 2.1], size: [1.3, 2.0], drag: 0.955, grav: 0.022, tw: true
                });
                later(() => {
                    if (!isOpen) return;
                    cur = keep;
                    flashes.push({ x, y, r: R * 0.5, life: 0.3, max: 0.3, h: p2.h });
                    emit(x, y, circle(Math.round(40 * b), 1), R * 0.5, {
                        pal: p2, life: [1.2, 1.6], size: [1.5, 2.1], drag: 0.94, grav: 0.01, tw: true
                    });
                    emit(x, y, randDisc(Math.round(30 * b), 0.1), R * 0.34, {
                        pal: p3, life: [1.1, 1.5], size: [1.4, 2.0], drag: 0.94, grav: 0.01, tw: true
                    });
                }, 0.28);
            },

            /* bunga: kurva mawar 3 sampai 7 kelopak + putik */
            flower(x, y, R, p1, p2, b) {
                const k = pick([3, 4, 5, 5, 6, 7]);
                const span = k % 2 ? Math.PI : TAU;
                const n = Math.round(150 * b);
                const pts = [];
                for (let i = 0; i < n; i++) {
                    const th = (i / n) * span;
                    const rr = Math.cos(k * th);
                    pts.push([rr * Math.cos(th), rr * Math.sin(th)]);
                }
                emit(x, y, rot2(pts, rand(0, TAU)), R, {
                    pal: p1, life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.945, grav: 0.006, tw: true
                });
                emit(x, y, circle(Math.round(24 * b), 0.2), R, {
                    pal: p2, life: [1.5, 1.9], size: [1.5, 2.1], drag: 0.945, grav: 0.006, tw: true
                });
            },

            /* kupu-kupu: kurva kupu-kupu klasik, sayap luar dan dalam beda warna */
            butterfly(x, y, R, p1, p2, b) {
                const n = Math.round(210 * b);
                const raw = [];
                for (let i = 0; i < n; i++) {
                    const t = (i / n) * 12 * Math.PI;
                    const rr = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin(t / 12), 5);
                    raw.push([Math.sin(t) * rr, -Math.cos(t) * rr]);
                }
                const pts = rot2(norm(center(raw)), rand(-0.25, 0.25));
                emit(x, y, pts, R, {
                    col: (i, p) => (Math.hypot(p[0], p[1]) < 0.5 ? p2 : p1),
                    life: [1.8, 2.3], size: [1.5, 2.2], drag: 0.945, grav: 0.006, tw: true
                });
            },

            /* kepingan salju: enam lengan bercabang, titik berkilau */
            snowflake(x, y, R, p1, p2, b) {
                const per = Math.max(7, Math.round(11 * b));
                const off = rand(0, TAU);
                const pts = [];
                for (let a = 0; a < 6; a++) {
                    const ang = off + (a * TAU) / 6;
                    const dx = Math.cos(ang);
                    const dy = Math.sin(ang);
                    for (let i = 0; i < per; i++) {
                        const m = (i + 1) / per;
                        pts.push([dx * m, dy * m]);
                    }
                    [[0.45, 0.3], [0.72, 0.22]].forEach((br) => {
                        for (let sg = -1; sg <= 1; sg += 2) {
                            const ba = ang + (sg * Math.PI) / 3;
                            for (let i = 1; i <= 3; i++) {
                                const m = (i / 3) * br[1];
                                pts.push([dx * br[0] + Math.cos(ba) * m, dy * br[0] + Math.sin(ba) * m]);
                            }
                        }
                    });
                }
                emit(x, y, pts, R, {
                    pal: Math.random() < 0.65 ? ICE : p1, glint: true, life: [1.8, 2.3], size: [1.5, 2.2], drag: 0.945, grav: 0.008, tw: true
                });
            },

            /* kilau: bintang empat sudut (astroid) berlapis dua */
            sparkle(x, y, R, p1, p2, b) {
                const n = Math.round(76 * b);
                const a1 = [];
                const a2 = [];
                for (let i = 0; i < n; i++) {
                    const t = (i / n) * TAU;
                    const cx = Math.pow(Math.cos(t), 3);
                    const sy = Math.pow(Math.sin(t), 3);
                    a1.push([cx, sy]);
                    a2.push([cx * 0.5, sy * 0.5]);
                }
                const tilt = rand(-0.35, 0.35);
                emit(x, y, rot2(a1, tilt), R * 1.05, {
                    pal: p1, glint: true, life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.945, grav: 0.006, tw: true
                });
                emit(x, y, rot2(a2, tilt + Math.PI / 4), R * 1.05, {
                    pal: p2, glint: true, life: [1.5, 2.0], size: [1.4, 2.0], drag: 0.945, grav: 0.006, tw: true
                });
            },

            /* merak: kipas busur berlapis empat warna */
            peacock(x, y, R, p1, p2, b, p3) {
                const cols = [p1, p2, p3, p1];
                const tilt = rand(-0.25, 0.25);
                for (let j = 0; j < 4; j++) {
                    const m = 1 - j * 0.2;
                    const n = Math.max(8, Math.round((36 - j * 6) * b));
                    const pts = [];
                    for (let i = 0; i < n; i++) {
                        const a = -Math.PI * 0.9 + (i / (n - 1)) * Math.PI * 0.8 + tilt;
                        pts.push([Math.cos(a) * m, Math.sin(a) * m + 0.5]);
                    }
                    emit(x, y, pts, R, {
                        pal: cols[j], life: [1.7, 2.2], size: [1.5, 2.2], drag: 0.945, grav: 0.007, tw: true
                    });
                }
            },

            /* kamuro: willow rapat dan panjang, emas / perak / emas muda */
            kamuro(x, y, R, p1, p2, b) {
                emit(x, y, randDisc(Math.round(92 * b), 0.25), R * 0.85, {
                    pal: pick([GOLD, SILVER, ROSEGOLD]), life: [3.4, 4.4], size: [1.2, 1.9], drag: 0.972, grav: 0.06, tw: true, trail: true, jit: 0.05, shift: false
                });
            },

            /* palem: lengan melengkung ke atas lalu menjuntai berjejak */
            palm(x, y, R, p1, p2, b) {
                const arms = 6 + Math.floor(Math.random() * 3);
                const per = Math.max(5, Math.round(9 * b));
                const pts = [];
                for (let a = 0; a < arms; a++) {
                    const ang = -Math.PI * 0.94 + ((a + 0.5) / arms) * Math.PI * 0.88;
                    for (let i = 0; i < per; i++) {
                        const m = 0.35 + 0.65 * ((i + 1) / per);
                        pts.push([Math.cos(ang) * m, Math.sin(ang) * m]);
                    }
                }
                emit(x, y, pts, R, {
                    col: (i) => (Math.floor(i / per) % 2 ? p2 : p1),
                    life: [2.0, 2.7], size: [1.6, 2.3], drag: 0.962, grav: 0.04, tw: true, trail: true
                });
            },

            /* mahkota emas: tiga puncak, pita bawah, permata berwarna */
            crown(x, y, R, p1, p2, b) {
                const poly = [[-0.8, 0.45], [0.8, 0.45], [0.8, -0.25], [0.4, 0.1], [0, -0.5], [-0.4, 0.1], [-0.8, -0.25], [-0.8, 0.45]];
                const per = Math.max(6, Math.round(11 * b));
                const pts = [];
                for (let i = 0; i < poly.length - 1; i++) {
                    const A = poly[i];
                    const B = poly[i + 1];
                    for (let k = 0; k < per; k++) pts.push([A[0] + (B[0] - A[0]) * (k / per), A[1] + (B[1] - A[1]) * (k / per)]);
                }
                for (let k = 0; k < per * 2; k++) pts.push([-0.8 + 1.6 * (k / (per * 2 - 1)), 0.27]);
                emit(x, y, pts, R * 1.05, { pal: GOLD, glint: true, life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.94, grav: 0.005, tw: true });
                [[-0.8, -0.25, p1], [0, -0.5, p2], [0.8, -0.25, p1]].forEach((j) => {
                    emit(x, y, circle(8, 0.11).map((q) => [q[0] + j[0], q[1] + j[1] - 0.12]), R * 1.05, {
                        pal: j[2], glint: true, life: [1.6, 2.1], size: [1.5, 2.2], drag: 0.94, grav: 0.005, tw: true
                    });
                });
            },

            /* sakura: lima kelopak merah muda + putik emas */
            sakura(x, y, R, p1, p2, b) {
                const n = Math.round(140 * b);
                const rot = rand(0, TAU);
                const pts = [];
                for (let i = 0; i < n; i++) {
                    const th = (i / n) * TAU;
                    const m = 0.5 + 0.5 * Math.abs(Math.cos(2.5 * th));
                    pts.push([Math.cos(th) * m, Math.sin(th) * m]);
                }
                emit(x, y, rot2(pts, rot), R, { pal: { h: 340, s: 88, l: 84, h2: 328 }, life: [1.8, 2.3], size: [1.6, 2.3], drag: 0.945, grav: 0.012, tw: true });
                const st = [];
                for (let a = 0; a < 5; a++) {
                    const ang = rot + (a * TAU) / 5;
                    for (let i = 1; i <= 3; i++) st.push([Math.cos(ang) * 0.1 * i, Math.sin(ang) * 0.1 * i]);
                }
                emit(x, y, st, R, { pal: GOLD, glint: true, life: [1.6, 2.1], size: [1.4, 2.0], drag: 0.945, grav: 0.006, tw: true });
            },

            /* palet cat: kontur palet + lima bulatan cat (Bulan anak DKV) */
            palette(x, y, R, p1, p2, b) {
                const n = Math.round(110 * b);
                const bite = [0.6, 0.5, 0.32];
                const edge = [];
                for (let i = 0; i < n; i++) {
                    const th = (i / n) * TAU;
                    const px = Math.cos(th);
                    const py = Math.sin(th) * 0.78;
                    if (Math.hypot(px - bite[0], py - bite[1]) > bite[2]) edge.push([px, py]);
                }
                for (let i = 0; i < 26; i++) {
                    const th = (i / 26) * TAU;
                    const qx = bite[0] + Math.cos(th) * bite[2];
                    const qy = bite[1] + Math.sin(th) * bite[2];
                    if (qx * qx + (qy / 0.78) * (qy / 0.78) < 0.94) edge.push([qx, qy]);
                }
                emit(x, y, edge, R * 1.02, { pal: { h: 38, s: 70, l: 90, h2: 30 }, life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.94, grav: 0.006, tw: true });
                emit(x, y, circle(10, 0.1).map((q) => [q[0] - 0.58, q[1] + 0.34]), R * 1.02, { pal: WHITE, life: [1.5, 2.0], size: [1.3, 1.9], drag: 0.94, grav: 0.006, tw: true });
                [[-0.58, -0.22, 350], [-0.18, -0.48, 48], [0.28, -0.4, 205], [0.66, -0.12, 140], [-0.66, 0.06, 275]].forEach((d) => {
                    emit(x, y, circle(9, 0.15).map((q) => [q[0] + d[0], q[1] + d[1]]), R * 1.02, {
                        pal: { h: d[2], s: 92, l: 64, h2: d[2] + 14 }, life: [1.6, 2.1], size: [1.7, 2.4], drag: 0.94, grav: 0.006, tw: true
                    });
                });
            },

            /* hati berlapis: hati mawar + hati emas kecil + cincin kilau */
            heartGlow(x, y, R, p1, p2, b) {
                emit(x, y, heartCurve(Math.round(84 * b), 1), R * 1.05, {
                    pal: { h: 340, s: 95, l: 68, h2: 322 }, glint: true, life: [1.8, 2.2], size: [1.8, 2.5], drag: 0.94, grav: 0.005, tw: true
                });
                emit(x, y, heartCurve(Math.round(44 * b), 0.55), R * 1.05, {
                    pal: { h: 44, s: 100, l: 78, h2: 36 }, life: [1.6, 2.0], size: [1.5, 2.1], drag: 0.94, grav: 0.005, tw: true
                });
                emit(x, y, circle(Math.round(28 * b), 1.3), R * 1.05, {
                    pal: WHITE, glint: true, life: [1.4, 1.9], size: [1.2, 1.8], drag: 0.94, grav: 0.006, tw: true
                });
            },

            /* bulan sabit dengan bintang kecil di dalam lengkungnya */
            moonStar(x, y, R, p1, p2, b) {
                const tilt = rand(-0.45, 0.45);
                const bc = [0.46, 0];
                const br = 0.8;
                const cres = [];
                const nA = Math.round(120 * b);
                const nB = Math.round(90 * b);
                for (let i = 0; i < nA; i++) {
                    const a = (i / nA) * TAU;
                    const px = Math.cos(a);
                    const py = Math.sin(a);
                    if (Math.hypot(px - bc[0], py - bc[1]) > br) cres.push([px + 0.19, py]);
                }
                for (let i = 0; i < nB; i++) {
                    const a = (i / nB) * TAU;
                    const qx = bc[0] + br * Math.cos(a);
                    const qy = bc[1] + br * Math.sin(a);
                    if (Math.hypot(qx, qy) < 1) cres.push([qx + 0.19, qy]);
                }
                const star = [];
                for (let i = 0; i < 10; i++) {
                    const a1 = -Math.PI / 2 + (i * Math.PI) / 5;
                    const a2 = -Math.PI / 2 + ((i + 1) * Math.PI) / 5;
                    const r1 = i % 2 ? 0.1 : 0.25;
                    const r2 = (i + 1) % 2 ? 0.1 : 0.25;
                    for (let k = 0; k < 5; k++) {
                        const f = k / 5;
                        star.push([0.41 + Math.cos(a1) * r1 * (1 - f) + Math.cos(a2) * r2 * f, Math.sin(a1) * r1 * (1 - f) + Math.sin(a2) * r2 * f]);
                    }
                }
                emit(x, y, rot2(cres, tilt), R, { pal: { h: 46, s: 100, l: 78, h2: 36 }, life: [1.8, 2.2], size: [1.7, 2.4], drag: 0.94, grav: 0.005, tw: true });
                emit(x, y, rot2(star, tilt), R, { pal: WHITE, glint: true, life: [1.7, 2.2], size: [1.6, 2.3], drag: 0.94, grav: 0.005, tw: true });
                emit(x, y, rot2(circle(Math.round(14 * b), 0.2).map((q) => [q[0] + 0.41, q[1]]), tilt), R, { pal: p2, glint: true, life: [1.5, 2.0], size: [1.3, 1.9], drag: 0.94, grav: 0.005, tw: true });
            },

            /* senyum: lingkaran + dua mata + senyum, langka */
            smiley(x, y, R, p1, p2, b) {
                const pts = circle(Math.round(64 * b), 1);
                [-0.36, 0.36].forEach((ex) => {
                    circle(7, 0.09).forEach((q) => pts.push([q[0] + ex, q[1] - 0.3]));
                });
                const nm = Math.round(22 * b);
                for (let i = 0; i < nm; i++) {
                    const a = 0.2 * Math.PI + (i / (nm - 1)) * 0.6 * Math.PI;
                    pts.push([Math.cos(a) * 0.55, Math.sin(a) * 0.5 + 0.04]);
                }
                emit(x, y, pts, R, {
                    pal: { h: 50, s: 100, l: 68, h2: 38 }, life: [1.7, 2.1], size: [1.7, 2.4], drag: 0.94, grav: 0.005, tw: true
                });
            }
        };

        /* nama panjang dipecah jadi 2-3 baris (per kata) supaya hurufnya tetap besar dan terbaca */
        function nameLines(text, tall) {
            const words = text.split(" ").filter(Boolean);
            if (words.length < 2 || text.length <= 10) return [text];
            const split = (k) => {
                let best = null;
                const rec = (i, left, acc) => {
                    if (left === 1) {
                        const lines = acc.concat(words.slice(i).join(" "));
                        const m = Math.max.apply(null, lines.map((l) => l.length));
                        if (!best || m < best.m) best = { m, lines };
                        return;
                    }
                    for (let j = i + 1; j <= words.length - left + 1; j++) rec(j, left - 1, acc.concat(words.slice(i, j).join(" ")));
                };
                rec(0, k, []);
                return best;
            };
            const two = split(2);
            if (words.length >= 3) {
                const three = split(3);
                /* layar tegak: 3 baris kalau hurufnya jadi jauh lebih besar */
                if (three && three.m < two.m && (two.m > 13 || (tall && two.m - three.m >= 3))) return three.lines;
            }
            return two.lines;
        }

        /* huruf nama: titik-titik diambil dari tulisan di kanvas kecil */
        function getNamePts() {
            if (namePts) return namePts;
            namePts = [];
            try {
                const text = String(FIRE_NAME).toUpperCase().replace(/\s+/g, " ").trim();
                const lines = nameLines(text, H > W * 1.15);
                const n = lines.length;
                const S = 2; /* kanvas 2x supaya huruf kecil tetap rapi */
                const w = 360;
                const fam = '"Cormorant Garamond", Georgia, serif';
                const meas = document.createElement("canvas").getContext("2d");
                let size = 96;
                meas.font = "600 " + size + "px " + fam;
                const mw = Math.max.apply(null, lines.map((l) => meas.measureText(l).width));
                if (mw > w * 0.92) size = Math.floor((size * w * 0.92) / mw);
                const lineH = Math.ceil(size * 1.18); /* jarak antar baris rapat mengikuti ukuran huruf */
                const h = Math.max(120, lineH * n);
                const c = document.createElement("canvas");
                c.width = w * S;
                c.height = h * S;
                const g = c.getContext("2d");
                g.scale(S, S);
                g.textAlign = "center";
                g.textBaseline = "middle";
                g.font = "600 " + size + "px " + fam;
                g.fillStyle = "#fff";
                const top = (h - lineH * n) / 2;
                lines.forEach((l, i) => g.fillText(l, w / 2, top + lineH * (i + 0.5) + size * 0.04));

                const d = g.getImageData(0, 0, w * S, h * S).data;
                const sample = (step) => {
                    const out = [];
                    for (let y = 0; y < h * S; y += step) {
                        for (let x = 0; x < w * S; x += step) {
                            if (d[(y * w * S + x) * 4 + 3] > 120) out.push([x, y]);
                        }
                    }
                    return out;
                };
                /* nama panjang butuh titik lebih banyak supaya hurufnya tetap jelas */
                const letters = text.replace(/ /g, "").length;
                const boost = 1 + clamp((letters - 8) * 0.1, 0, small ? 1.1 : 1.6);
                const cap = Math.round((small ? 300 : tier === "tablet" ? 400 : 520) * boost);
                let step = size < 56 ? 3 : 4;
                let raw = sample(step);
                if (raw.length > cap) { /* kerapatan merata: perbesar jarak antar titik (bukan membuang titik acak) */
                    step = Math.max(step, Math.round(step * Math.sqrt(raw.length / cap)));
                    raw = sample(step);
                }
                const jit = (step / S) * 0.22;
                const pts = raw.map((q) => [(q[0] / S - w / 2 + (Math.random() - 0.5) * jit) / (w / 2), (q[1] / S - h / 2 + (Math.random() - 0.5) * jit) / (w / 2)]);
                /* acak urutan titik: kalau penjaga performa memangkas partikel dari ujung daftar, semua baris nama menipis rata (bukan baris bawah yang hilang) */
                for (let i = pts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    const t = pts[i];
                    pts[i] = pts[j];
                    pts[j] = t;
                }
                namePts = pts;
                nameRatio = h / w;
                nameWide = letters >= 8;
            } catch (e) {
                namePts = [];
            }
            return namePts;
        }

        function formName(x, y) {
            const pts = getNamePts();
            if (!pts.length) { SHAPES.sphere(x, y, 150, pickPal(), pickPal(), 1); return; }

            let sc = clamp(W * (nameWide ? 0.9 : 0.74), 260, 660) / 2;
            sc = Math.min(sc, Math.max(110, (y - 28) / nameRatio)); /* nama beberapa baris: jangan melewati tepi atas layar */
            flashes.push({ x, y, r: sc * 0.9, life: 0.5, max: 0.5, h: 42 });

            for (let i = 0; i < pts.length; i++) {
                const p = pts[i];
                let h = 46 - ((p[0] + 1) / 2) * 76;
                if (h < 0) h += 360;
                const L = rand(3.0, 3.5);
                particles.push({
                    x, y,
                    sx: x, sy: y,
                    tx: x + p[0] * sc,
                    ty: y + p[1] * sc,
                    age: -rand(0, 0.12),
                    fd: 0.95,
                    vx: 0, vy: 0,
                    h, h2: h,
                    s: 100,
                    l: rand(66, 90),
                    life: L,
                    max: L,
                    size: nameWide ? rand(1.4, 2.0) : rand(1.5, 2.2),
                    drag: 1, grav: 0,
                    tw: true, trail: false, crackle: false,
                    glint: nameWide ? false : Math.random() < 0.3, ph: rand(0, TAU),
                    form: true
                });
            }
        }

        function explode(r) {
            const R = clamp(Math.min(W, H) * 0.27, 92, 215) * r.power * rand(0.88, 1.12);
            const crowded = particles.length > maxParticles() * 0.8;
            const b = (crowded ? 0.5 : 1) * (reduced() ? 0.55 : 1);

            if (r.shape === "name") {
                formName(r.x, r.y);
                return;
            }

            cur = {
                p1: r.pal, p2: r.pal2, p3: r.pal3 || r.pal,
                tone: r.tone || "mono",
                glint: Boolean(r.glint), strobe: Boolean(r.strobe),
                trail: Boolean(r.trail), crackle: Boolean(r.crackle)
            };

            flashes.push({ x: r.x, y: r.y, r: R * 0.75, life: 0.38, max: 0.38, h: r.pal.h });
            applaudAt(r.x, r.y, R * 1.3);
            (SHAPES[r.shape] || SHAPES.sphere)(r.x, r.y, R, r.pal, r.pal2, b, r.pal3 || r.pal);
        }

        function launch(shape, o) {
            o = o || {};
            if (rockets.length > TIER[tier].rockets) return;

            const x0 = o.x0 != null ? o.x0 : rand(W * 0.12, W * 0.88);
            const tx = o.tx != null ? o.tx : clamp(x0 + rand(-70, 70), W * 0.08, W * 0.92);
            const ty = o.ty != null ? o.ty : rand(H * 0.16, H * 0.46);
            const y0 = H - rand(14, 40);
            const dist = Math.max(60, y0 - ty);
            const pal = o.pal || pickPal();
            const pal2 = pickPal(pal);
            const pal3 = pickPal(pal, pal2);

            /* pola warna + gaya diundi tiap tembakan */
            const tr = Math.random();
            const tone = tr < 0.5 ? "mono" : tr < 0.7 ? "mix2" : tr < 0.8 ? "mix3" : tr < 0.92 ? "core" : "split";
            const st = Math.random();

            rockets.push({
                shape, pal, pal2, pal3, tone,
                glint: st < 0.2,
                strobe: st >= 0.2 && st < 0.27,
                trail: st >= 0.27 && st < 0.38,
                crackle: st >= 0.38 && st < 0.45,
                wob: Math.random() < 0.22 ? rand(5, 11) : 0,
                wph: rand(0, TAU),
                tHue: Math.random() < 0.3 ? pal.h : 44,
                x0, tx, y0, ty,
                x: x0, y: y0,
                t: 0,
                T: clamp((dist / H) * 1.1 + 0.28, 0.5, 1.2) * rand(0.9, 1.1),
                power: o.power || 1
            });
        }

        /* kombinasi tembakan: beberapa roket sekaligus dengan pola tertentu */
        const later2 = (fn, sec) => later(() => { if (isOpen) fn(); }, sec);

        const COMBO_FX = {
            /* tiga bentuk berbeda berjajar */
            trio() {
                const cx = rand(W * 0.3, W * 0.7);
                const gap = clamp(W * 0.2, 70, 230);
                const pal = pickPal();
                [-1, 0, 1].forEach((d, i) => {
                    const x = clamp(cx + d * gap, W * 0.1, W * 0.9);
                    later2(() => launch(nextShape(), { x0: x, tx: x, ty: H * (d ? 0.34 : 0.24), power: 0.8, pal: i === 1 ? pickPal(pal) : pal }), i * 0.13);
                });
            },

            /* dua bentuk sama, kiri dan kanan */
            twin() {
                const sh = nextShape();
                const c = rand(0.38, 0.62);
                const pa = pickPal();
                const same = Math.random() < 0.5;
                const ty = rand(H * 0.2, H * 0.4);
                launch(sh, { x0: W * (c - 0.17), tx: W * (c - 0.17), ty, pal: pa, power: 0.92 });
                launch(sh, { x0: W * (c + 0.17), tx: W * (c + 0.17), ty, pal: same ? pa : pickPal(pa), power: 0.92 });
            },

            /* kipas: busur ledakan berganti warna dari kiri ke kanan */
            fan() {
                const shape = pick(["sphere", "peony", "chrysanthemum", "dahlia", "pistil", "ring"]);
                const n = small ? 5 : 7;
                const s0 = Math.floor(Math.random() * PAL.length);
                for (let i = 0; i < n; i++) {
                    const u = i / (n - 1);
                    const x = W * (0.14 + 0.72 * u);
                    later2(() => launch(shape, { x0: x, tx: x, ty: H * (0.44 - 0.22 * Math.sin(u * Math.PI)), power: 0.78, pal: PAL[(s0 + i * 2) % PAL.length] }), i * 0.12);
                }
            },

            /* tangga: ledakan naik bertingkat di satu garis */
            ladder() {
                const x = rand(W * 0.3, W * 0.7);
                const shape = pick(["sphere", "ring", "peony", "glitter", "sparkle"]);
                const s0 = Math.floor(Math.random() * PAL.length);
                for (let i = 0; i < 4; i++) {
                    later2(() => launch(shape, { x0: x + rand(-14, 14), tx: x + rand(-14, 14), ty: H * (0.5 - i * 0.1), power: 0.62 + i * 0.1, pal: PAL[(s0 + i * 3) % PAL.length] }), i * 0.2);
                }
            },

            /* tirai: willow / kamuro berderet di langit atas */
            curtain() {
                const shape = pick(["willow", "kamuro", "kamuro", "glitter"]);
                const n = small ? 4 : 6;
                for (let i = 0; i < n; i++) {
                    const x = W * ((i + 0.5) / n);
                    later2(() => launch(shape, { x0: x, tx: x + rand(-20, 20), ty: H * rand(0.2, 0.3), power: 0.95 }), i * 0.14);
                }
            },

            /* cermin: bentuk indah yang sama, kiri dan kanan, warna beda */
            mirror() {
                const sh = pick(isBulan
                    ? ["butterfly", "flower", "snowflake", "sparkle", "peacock", "atom", "sakura", "moonStar", "crown"]
                    : ["butterfly", "flower", "snowflake", "sparkle", "peacock", "atom"]);
                const pa = pickPal();
                const pb = pickPal(pa);
                const ty = rand(H * 0.24, H * 0.38);
                launch(sh, { x0: W * 0.28, tx: W * 0.28, ty, pal: pa, power: 0.88 });
                launch(sh, { x0: W * 0.72, tx: W * 0.72, ty, pal: pb, power: 0.88 });
            }
        };

        let sinceCombo = 0;
        let lastCombo = "";

        /* tembakan otomatis: umumnya satu bentuk, sesekali kombinasi. Mengembalikan true bila kombinasi. */
        function launchAuto() {
            sinceCombo++;
            if (sinceCombo >= (isBulan ? 6 : 5) && !reduced() && Math.random() < 0.22) {
                const names = Object.keys(COMBO_FX).filter((n) => n !== lastCombo);
                lastCombo = pick(names);
                sinceCombo = 0;
                COMBO_FX[lastCombo]();
                return true;
            }
            launch(nextShape(), { power: pick([0.84, 0.94, 1, 1, 1.08, 1.18]) });
            return false;
        }

        const launchRandom = () => launchAuto();

        function stepFx(dt) {
            const idle = !particles.length && !rockets.length && !flashes.length;
            if (idle) {
                if (fxBusy) {
                    fx.globalCompositeOperation = "source-over";
                    fx.clearRect(0, 0, W, H);
                    fxBusy = false;
                }
                return;
            }
            fxBusy = true;

            const k = dt * 60;

            /* pudarkan jejak lama */
            fx.globalCompositeOperation = "destination-out";
            fx.fillStyle = "rgba(0,0,0,0.24)";
            fx.fillRect(0, 0, W, H);
            fx.globalCompositeOperation = "lighter";

            /* kilatan ledakan */
            for (let i = flashes.length - 1; i >= 0; i--) {
                const f = flashes[i];
                f.life -= dt;
                if (f.life <= 0) { flashes.splice(i, 1); continue; }
                const a = f.life / f.max;
                const rr = f.r * (1.25 - 0.5 * a);
                const g = fx.createRadialGradient(f.x, f.y, 0, f.x, f.y, rr);
                g.addColorStop(0, "hsla(" + f.h + ",100%,88%," + (0.5 * a) + ")");
                g.addColorStop(1, "hsla(" + f.h + ",100%,60%,0)");
                fx.fillStyle = g;
                fx.beginPath();
                fx.arc(f.x, f.y, rr, 0, TAU);
                fx.fill();
            }

            /* roket */
            for (let i = rockets.length - 1; i >= 0; i--) {
                const r = rockets[i];
                r.t += dt;
                const u = Math.min(1, r.t / r.T);
                const e = 1 - (1 - u) * (1 - u);
                r.x = r.x0 + (r.tx - r.x0) * e + (r.wob ? Math.sin(r.t * 15 + r.wph) * r.wob * (1 - u) : 0);
                r.y = r.y0 + (r.ty - r.y0) * e;

                if (particles.length < maxParticles() && Math.random() < 0.8) {
                    const L = rand(0.3, 0.55);
                    particles.push({
                        x: r.x + rand(-1, 1), y: r.y,
                        vx: rand(-0.25, 0.25), vy: rand(0.3, 1),
                        h: r.tHue, h2: r.tHue === 44 ? 30 : r.tHue, s: 100, l: 78,
                        life: L, max: L, size: 1.3, drag: 0.92, grav: 0.02,
                        tw: false, trail: false, crackle: false, form: false
                    });
                }

                fx.fillStyle = "rgba(255,238,200,0.95)";
                fx.beginPath();
                fx.arc(r.x, r.y, 2.1, 0, TAU);
                fx.fill();

                if (u >= 1) {
                    rockets.splice(i, 1);
                    explode(r);
                }
            }

            /* partikel */
            const budget = maxParticles();
            for (let i = particles.length - 1; i >= 0; i--) {
                const p = particles[i];
                p.life -= dt;

                if (p.life <= 0) {
                    if (p.crackle && particles.length < budget) {
                        for (let n = 0; n < 3; n++) {
                            const L = rand(0.25, 0.5);
                            particles.push({
                                x: p.x, y: p.y,
                                vx: rand(-1.5, 1.5), vy: rand(-1.5, 1.5),
                                h: 46, h2: 40, s: 100, l: 86,
                                life: L, max: L, size: 1.1, drag: 0.9, grav: 0.03,
                                tw: true, trail: false, crackle: false, form: false
                            });
                        }
                    }
                    particles.splice(i, 1);
                    continue;
                }

                if (p.form) {
                    p.age += dt;
                    const e = clamp(p.age / p.fd, 0, 1);
                    const ez = 1 - Math.pow(1 - e, 3);
                    p.x = p.sx + (p.tx - p.sx) * ez;
                    p.y = p.sy + (p.ty - p.sy) * ez + (e >= 1 ? (p.age - p.fd) * 7 : 0);
                } else {
                    const dr = Math.pow(p.drag, k);
                    p.vx *= dr;
                    p.vy *= dr;
                    p.vy += p.grav * k;
                    p.x += p.vx * k;
                    p.y += p.vy * k;

                    if (p.trail && particles.length < budget && Math.random() < 0.1 * k) {
                        const L = rand(0.35, 0.6);
                        particles.push({
                            x: p.x, y: p.y,
                            vx: rand(-0.2, 0.2), vy: rand(0, 0.5),
                            h: p.h, h2: p.h2, s: p.s, l: 80,
                            life: L, max: L, size: 1, drag: 0.92, grav: 0.02,
                            tw: true, trail: false, crackle: false, form: false
                        });
                    }
                }

                const f = p.life / p.max;
                let a = Math.min(1, f * 1.9);
                if (p.tw && Math.random() < 0.16) a *= 0.35;
                if (p.strobe) a *= Math.sin(clockT * 13 + p.ph) > 0.15 ? 1 : 0.1;
                const hue = p.h + (p.h2 - p.h) * (1 - f);

                fx.fillStyle = "hsla(" + hue.toFixed(0) + "," + p.s + "%," + (p.l + (1 - f) * 8).toFixed(0) + "%," + a.toFixed(2) + ")";
                fx.beginPath();
                fx.arc(p.x, p.y, p.size * (0.6 + 0.4 * f), 0, TAU);
                fx.fill();

                if (p.glint && a > 0.3) {
                    const L = p.size * (2.4 + 3.4 * f);
                    fx.strokeStyle = fx.fillStyle;
                    fx.lineWidth = 0.9;
                    fx.beginPath();
                    fx.moveTo(p.x - L, p.y);
                    fx.lineTo(p.x + L, p.y);
                    fx.moveTo(p.x, p.y - L);
                    fx.lineTo(p.x, p.y + L);
                    fx.stroke();
                }
            }

            fx.globalCompositeOperation = "source-over";
        }

        const OPENING = [
            ["sphere", 0.0, 0.50], ["ring", 0.4, 0.28], ["peony", 0.8, 0.72], ["flower", 1.3, 0.50],
            ["star", 1.8, 0.30], ["rainbow", 2.2, 0.70], ["moon", 2.7, 0.50], ["name", 3.3, 0.50]
        ];

        /* pembuka khusus Bulan: lebih panjang, beragam bentuk, huruf nama cukup satu kali (tanpa hati) */
        const OPENING_BULAN = [
            ["chrysanthemum", 0.0, 0.50], ["ring", 0.5, 0.26], ["peony", 0.8, 0.74], ["butterfly", 1.3, 0.50],
            ["star", 1.7, 0.30], ["rainbow", 2.1, 0.70], ["moon", 2.6, 0.50], ["saturn", 3.0, 0.22],
            ["name", 3.6, 0.50], ["flower", 4.7, 0.30], ["dahlia", 4.9, 0.70], ["kamuro", 5.3, 0.50]
        ];

        function finaleList() {
            const base = isBulan ? (small ? 9 : 13) : (small ? 8 : 12);
            const n = Math.max(6, Math.round(base * (0.6 + 0.4 * perf)));
            const list = [];
            for (let i = 0; i < n; i++) {
                list.push([nextShape(), i * 0.22 + rand(0, 0.12), (i + 0.5) / n + rand(-0.04, 0.04)]);
            }
            list.push([pick(["doubleShell", "chrysanthemum", "pistil", "dahlia"]), n * 0.22 + 0.3, 0.5]);
            if (isBulan) {
                list.push([pick(["butterfly", "flower", "peacock"]), n * 0.22 + 0.55, 0.28]);
                list.push([pick(["snowflake", "sparkle", "atom", "sakura", "crown"]), n * 0.22 + 0.55, 0.72]);
                if (Math.random() < 0.5) {
                    list.push(["heartGlow", n * 0.22 + 0.9, 0.5]);
                    sinceHeart = 0;
                }
            }
            if (Math.random() < 0.5) {
                list.push(["name", n * 0.22 + 1.3, 0.5]);
            }
            return list;
        }

        function flare() {
            root.classList.remove("is-flare");
            void root.offsetWidth;
            root.classList.add("is-flare");
            later(() => root.classList.remove("is-flare"), 1.4);
        }

        function volley(kind) {
            const list = kind === "opening" ? (isBulan ? OPENING_BULAN : OPENING) : finaleList();
            list.forEach((it) => {
                later(() => {
                    if (!isOpen) return;
                    if (it[0] === "name") { fireShow("name"); return; }
                    const x = clamp(W * it[2], W * 0.1, W * 0.9);
                    launch(it[0], { x0: x + rand(-30, 30), tx: x + rand(-40, 40) });
                }, it[1]);
            });

            if (kind === "opening") {
                later(() => addConfetti(small ? 60 : 110), 0.4);
                later(() => applaudWave(2, 0.2), 1.0);
                later(() => applaudWave(2, 0.2), 3.2);
                if (isBulan) later(() => { flare(); addConfetti(small ? 40 : 80); }, 3.0);
            } else {
                if (isBulan) nextShot = Math.max(nextShot, 2.2); /* beri jeda: finale jangan ditimpa tembakan otomatis */
                later(() => { flare(); addConfetti(small ? 70 : 130); applaudWave(2, 0.22); }, 0.3);
                later(() => { addConfetti(small ? 40 : 90); applaudWave(2, 0.2); }, 2.4);
            }
        }

        function fireShow(name) {
            if (name === "finale") volley("finale");
            else if (name === "name") {
                const nowMs = performance.now();
                if (nowMs - lastNameAt < 9000) return; /* jarak antar ledakan nama minimal 9 detik */
                lastNameAt = nowMs;
                getNamePts(); /* hitung dulu: nama beberapa baris butuh titik ledak lebih rendah supaya tidak menabrak judul */
                launch("name", { x0: W * 0.5, tx: W * 0.5, ty: nameRatio > 0.5 ? clamp(H * 0.4, 140, H * 0.46) : clamp(H * 0.3, 120, H * 0.42) });
            }
            else launch(name, { x0: rand(W * 0.3, W * 0.7) });
        }

        function showTick(dt) {
            if (!lit) return;

            nextShot -= dt;
            if (nextShot <= 0) {
                /* langit sudah penuh: tunda dulu, biar tidak menumpuk dan berat */
                const load = particles.length / Math.max(1, maxParticles());
                if (!reduced() && load > (isBulan ? 0.8 : perf < 1 ? 0.8 : 9)) {
                    nextShot = 0.35;
                } else {
                    const combo = launchAuto();
                    const slow = 1 + (1 - perf) * 1.2;
                    nextShot = (reduced() ? rand(2.8, 4.2) : rand(0.55, 1.5) * (small ? 1.2 : 1) * (isBulan ? 0.8 : 1) * slow) + (combo ? 1.1 : 0);
                }
            }

            /* bintang bertepuk tangan tiap beberapa detik */
            clapT -= dt;
            if (clapT <= 0) {
                applaudWave(1 + (Math.random() < 0.35 ? 1 : 0), rand(0.14, 0.22));
                clapT = isBulan ? rand(2.2, 3.8) : rand(3.0, 5.0);
            }

            nextFinale -= dt;
            if (nextFinale <= 0) {
                volley("finale");
                nextFinale = isBulan ? rand(10, 14) : rand(13, 18);
            }
        }

        /* lirik yang aktif: disaring sesuai mode (Bulan / nama lain), dibangun ulang saat mode berganti */
        let rt = [];
        let rtMode = "";

        const HAS_KNOWN = LYRICS.some((l) => typeof l.t === "number");

        function makeList(mode) {
            const allowX = !SYNC && !HAS_KNOWN; /* baris tambahan hanya untuk jadwal otomatis */
            return LYRICS.filter((l) => (!l.only || l.only === mode) && (allowX || !l.x)).map((l) => ({
                t: typeof l.t === "number" ? l.t : null,
                text: l.text,
                fx: l.fx,
                big: l.big,
                show: l.show,
                only: l.only,
                x: Boolean(l.x),
                p: l.p || 1
            }));
        }

        function buildRt() {
            const mode = isBulan ? "bulan" : "other";
            if (rtMode === mode) return false;
            rtMode = mode;
            rt = makeList(mode);
            return true;
        }

        buildRt();

        let timeline = [];
        let timelineDur = 0;
        let planDur = 0; /* durasi yang dipakai penjadwal otomatis (anggapan bila lagu belum terbaca) */
        let planAutoOn = false;

        const lyWords = (l) => String(l.text || "").replace(/\{nama\}/gi, "Nama").split(/\s+/).filter(Boolean).length;
        /* waktu minimal agar satu baris nyaman dibaca: pendek = cepat lewat, panjang = butuh lebih lama */
        const lyNeed = (l) => clamp(3.2 + 0.3 * lyWords(l), 5.5, 9.5);

        /* urutan "tersebar": ambil baris tambahan dari bagian cerita yang berbeda-beda, bukan menumpuk di satu tempat */
        function spreadOrder(len) {
            const seen = new Set();
            const out = [];
            for (let k = 1; out.length < len && k < len * 8 + 8; k++) {
                const idx = Math.floor(((k * 0.6180339887) % 1) * len);
                if (!seen.has(idx)) { seen.add(idx); out.push(idx); }
            }
            for (let i = 0; i < len; i++) if (!seen.has(i)) out.push(i);
            return out;
        }

        /* menentukan kapan tiap baris tampil agar pas dengan panjang lagu D (detik):
           - lagu pendek  : baris kurang penting disisihkan, jarak tetap lega (tidak terburu-buru)
           - lagu pas     : semua baris inti, jarak mengikuti panjang kalimat
           - lagu panjang : baris tambahan disisipkan; pesan tidak habis dulu dan tidak diulang dari awal */
        function planAuto(list, D) {
            const n = list.length;
            const out = new Array(n).fill(null);
            if (!n) return out;
            const last = n - 1;
            const S = Math.max(0, D - LY.TAIL - LY.START); /* dari baris pertama sampai awal baris penutup */
            const w = (i) => lyNeed(list[i]) * LY.IDEAL;
            const sum = (arr) => arr.reduce((a, i) => (i === last ? a : a + w(i)), 0);

            let keep = list.map((l, i) => i).filter((i) => !list[i].x);

            if (sum(keep) * LY.F_MIN <= S) {
                const ex = list.map((l, i) => i).filter((i) => list[i].x);
                const order = spreadOrder(ex.length);
                for (let k = 0; k < order.length && sum(keep) * LY.STRETCH < S; k++) keep.push(ex[order[k]]);
                keep.sort((a, b) => a - b);
            } else {
                const mid = (n - 1) / 2;
                const prot = new Set([keep[0], last, last - 1]); /* pembuka dan dua baris penutup selalu ikut */
                while (keep.length > 4 && sum(keep) * LY.F_MIN > S) {
                    let worst = 1;
                    keep.forEach((i) => { if (!prot.has(i)) worst = Math.max(worst, list[i].p || 1); });
                    let cand = keep.filter((i) => !prot.has(i) && (list[i].p || 1) === worst);
                    if (!cand.length) cand = keep.filter((i) => !prot.has(i));
                    if (!cand.length) break;
                    cand.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
                    keep.splice(keep.indexOf(cand[0]), 1);
                }
            }

            const W = sum(keep) || 1;
            const f = Math.max(S > 0 ? S / W : LY.F_MIN, 0.62);
            const allUsed = list.every((l, i) => !l.x || keep.indexOf(i) > -1);
            const maxd = allUsed ? 1e9 : LY.MAXD; /* lagu super panjang: semua baris direnggangkan merata, tanpa jeda kosong panjang sebelum penutup */
            let t = LY.START;
            keep.forEach((i) => {
                if (i === last) return;
                out[i] = t;
                t += clamp(w(i) * f, LY.MIND, maxd);
            });
            out[last] = Math.max(t, D - LY.TAIL);
            return out;
        }
        let lyricIdx = -2;
        let vt = 0;
        let fxCursor = 0;

        function buildTimeline(duration) {
            timelineDur = duration || 0;
            const n = rt.length;
            const known = rt.map((l) => (typeof l.t === "number" && isFinite(l.t) ? l.t : null));
            const ts = new Array(n).fill(null);
            planAutoOn = false;

            if (SYNC) {
                for (let i = 0; i < n; i++) ts[i] = known[i];
            } else if (known.every((k) => k === null)) {
                /* lirik belum disinkronkan manual: jadwal otomatis mengikuti panjang lagu */
                planDur = duration || LY.FALLBACK;
                planAutoOn = true;
                planAuto(rt, planDur).forEach((v, i) => { ts[i] = v; });
            } else {
                const span = duration ? Math.max(0, duration - LYRIC_END_PAD - LYRIC_START) : 0;
                const auto = duration ? clamp(span / Math.max(1, n), 4.5, 14) : LYRIC_STEP;
                let prev = LYRIC_START - auto;
                let i = 0;
                while (i < n) {
                    if (known[i] !== null) { ts[i] = known[i]; prev = known[i]; i++; continue; }
                    let j = i;
                    while (j < n && known[j] === null) j++;
                    const count = j - i;
                    const nextKnown = j < n ? known[j] : null;
                    const step = nextKnown !== null ? (nextKnown - prev) / (count + 1) : auto;
                    for (let m = 0; m < count; m++) ts[i + m] = prev + step * (m + 1);
                    prev = ts[j - 1];
                    i = j;
                }
            }

            timeline = [];
            for (let i = 0; i < n; i++) {
                if (ts[i] !== null) timeline.push({ t: ts[i], i, end: 0 });
            }
            timeline.sort((a, b) => a.t - b.t);
            timeline.forEach((e, idx) => {
                const nx = timeline[idx + 1];
                if (nx) e.end = nx.t - 0.12;
                else if (planAutoOn) e.end = Math.max(e.t + 9, planDur + LY.HOLD_AFTER); /* penutup bertahan sampai lagu usai, lalu hilang */
                else e.end = timelineDur ? Math.max(e.t + 4, timelineDur - 0.8) : e.t + 9;
            });
        }

        function clearLine() {
            stage.querySelectorAll(".ly-line:not(.is-out)").forEach((o) => {
                o.classList.add("is-out");
                setTimeout(() => o.remove(), 1100);
            });
        }

        function showLine(e) {
            const data = rt[e.i];
            const text = String(data.text || "").replace(/\{nama\}/gi, NAMA);
            const words = text.split(/\s+/).filter(Boolean);
            if (!words.length) { clearLine(); return; }

            const dur = Math.max(1.2, e.end - e.t);
            const total = words.reduce((s, w) => s + w.length + 1, 0);
            const sing = Math.min(dur * 0.82, Math.max(1.2, words.length * 0.5));
            const fxName = data.fx || LYRIC_FX[fxCursor++ % LYRIC_FX.length];

            const line = document.createElement("p");
            line.className = "ly-line fx-" + fxName + (data.big ? " is-big" : "");

            let acc = 0.35;
            words.forEach((w, n) => {
                const wd = Math.max(0.18, (sing * (w.length + 1)) / total);
                const outer = document.createElement("span");
                outer.className = "ly-w";
                outer.style.setProperty("--i", String(n));
                const inner = document.createElement("span");
                inner.className = "ly-t";
                inner.textContent = w;
                inner.style.setProperty("--d", acc.toFixed(2) + "s");
                inner.style.setProperty("--dur", wd.toFixed(2) + "s");
                acc += wd;
                outer.appendChild(inner);
                line.appendChild(outer);
                line.appendChild(document.createTextNode(" ")); /* spasi untuk pembaca layar; tidak memengaruhi tata letak flex */
            });

            clearLine();
            stage.appendChild(line);

            if (lit) {
                if (data.show) fireShow(data.show);
                else if (Math.random() < 0.6) launchRandom();
            }
        }

        let lyricHold = false; /* setelah tirai terbuka: jam pesan menunggu lagu benar-benar berbunyi (maks. beberapa detik) */
        let holdSince = 0;
        let lyricAt = 0; /* cap waktu tick terakhir: jam pesan memakai waktu nyata, bukan selisih frame (aman di perangkat dengan FPS rendah) */

        function lyricTick(dt) {
            if (!lit) return;

            const c = clock();
            const playing = Boolean(c && c.playing);

            if (lyricHold) {
                const waited = performance.now() - holdSince;
                if (playing || !soundOn || !c || waited > 2800) {
                    lyricHold = false;
                    if (playing) vt = Math.min(c.time, 1.5);
                    lyricAt = performance.now();
                } else {
                    lyricAt = 0;
                    return;
                }
            }

            if (SYNC) {
                /* alat sinkron: jam mengikuti lagu apa adanya, mengulang bersama lagunya */
                if (playing) {
                    if (c.duration && Math.abs(c.duration - timelineDur) > 0.5) buildTimeline(c.duration);
                    if (c.time + 3 < vt) lyricIdx = -2;
                    vt = c.time;
                } else {
                    vt += dt;
                    const loopAt = timelineDur || (timeline.length ? timeline[timeline.length - 1].end + 6 : 60);
                    if (vt > loopAt) { vt = 0; lyricIdx = -2; }
                }
            } else {
                /* jam pesan berjalan sendiri dan hanya maju. Lagu hanya mengoreksi bila selisih jauh,
                   sehingga saat lagu mengulang (loop) atau suara dimatikan, pesan tidak kembali ke awal */
                const tNow = performance.now();
                vt += lyricAt ? Math.min(120, (tNow - lyricAt) / 1000) : dt;
                lyricAt = tNow;
                if (playing && c.time > vt - 1.5 && Math.abs(c.time - vt) > 0.4) vt = c.time;
                if (c && c.duration && timeline.length && vt < timeline[0].t - 0.5 && Math.abs(c.duration - timelineDur) > 0.5) {
                    buildTimeline(c.duration); /* durasi lagu baru terbaca sebelum pesan pertama: susun ulang */
                }
            }

            let idx = -1;
            for (let k = 0; k < timeline.length; k++) {
                if (vt >= timeline[k].t && vt < timeline[k].end + 0.1) idx = k;
            }

            if (idx !== lyricIdx) {
                lyricIdx = idx;
                if (idx >= 0) showLine(timeline[idx]);
                else clearLine();
            }
        }

        buildTimeline(0);

        const syncPanel = $("celSync");
        const syncInfo = $("celSyncInfo");
        const syncTapBtn = $("celSyncTap");
        const syncUndoBtn = $("celSyncUndo");
        const syncCopyBtn = $("celSyncCopy");
        let syncIdx = 0;

        const renderSync = () => {
            if (!syncInfo) return;
            if (syncIdx >= rt.length) {
                syncInfo.textContent = "Semua baris sudah di-tap (" + rt.length + "/" + rt.length + "). Tekan Salin, lalu tempel ke LYRICS.";
                return;
            }
            const next = String(rt[syncIdx].text).replace(/\{nama\}/gi, NAMA);
            syncInfo.textContent = "(" + (syncIdx + 1) + "/" + rt.length + ") Tap saat baris ini dinyanyikan: \u201c" + next + "\u201d";
        };

        const syncTap = () => {
            if (!isOpen || !lit || syncIdx >= rt.length) return;
            const c = clock();
            const tm = c && c.playing ? c.time : vt;
            rt[syncIdx].t = Math.round(tm * 10) / 10;
            syncIdx++;
            buildTimeline(timelineDur);
            lyricIdx = -2;
            renderSync();
        };

        const syncUndo = () => {
            if (syncIdx <= 0) return;
            syncIdx--;
            rt[syncIdx].t = null;
            buildTimeline(timelineDur);
            lyricIdx = -2;
            renderSync();
        };

        const syncCopy = () => {
            const rows = rt.map((l) => {
                const parts = ["t: " + (l.t == null ? "null" : l.t.toFixed(1)), "text: " + JSON.stringify(l.text)];
                if (l.fx) parts.push("fx: " + JSON.stringify(l.fx));
                if (l.big) parts.push("big: true");
                if (l.show) parts.push("show: " + JSON.stringify(l.show));
                if (l.only) parts.push("only: " + JSON.stringify(l.only));
                return "    { " + parts.join(", ") + " }";
            });
            const out = "const LYRICS = [\n" + rows.join(",\n") + "\n];";
            console.log(out);

            const fallback = () => {
                const ta = document.createElement("textarea");
                ta.value = out;
                ta.style.position = "fixed";
                ta.style.opacity = "0";
                document.body.appendChild(ta);
                ta.select();
                try { document.execCommand("copy"); } catch (e) { /* abaikan */ }
                ta.remove();
            };

            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(out).catch(fallback);
            } else {
                fallback();
            }
            syncCopyBtn.textContent = "Tersalin \u2713";
            setTimeout(() => { syncCopyBtn.textContent = "Salin"; }, 1600);
        };

        if (SYNC && syncPanel && syncTapBtn && syncUndoBtn && syncCopyBtn) {
            rt.forEach((l) => { l.t = null; });
            buildTimeline(0);
            syncPanel.hidden = false;
            renderSync();
            syncTapBtn.addEventListener("click", syncTap);
            syncUndoBtn.addEventListener("click", syncUndo);
            syncCopyBtn.addEventListener("click", syncCopy);
            document.addEventListener("keydown", (event) => {
                if (isOpen && (event.key === "t" || event.key === "T")) syncTap();
            });
        }

        function frame(now) {
            raf = requestAnimationFrame(frame);
            const raw = (now - lastNow) / 1000 || 0.016;
            const dt = Math.min(0.05, raw);
            lastNow = now;
            clockT += dt;
            perfWatch(raw);

            drawBackground(clockT, dt);
            stepFx(dt);
            showTick(dt);
            lyricTick(dt);
        }

        const startLoop = () => {
            if (raf) return;
            lastNow = performance.now();
            raf = requestAnimationFrame(frame);
        };

        const stopLoop = () => {
            if (raf) cancelAnimationFrame(raf);
            raf = 0;
        };

        const lockScroll = () => {
            prevOverflow = body.style.overflow;
            prevPadRight = body.style.paddingRight;
            const bar = window.innerWidth - document.documentElement.clientWidth;
            body.style.overflow = "hidden";
            if (bar > 0) body.style.paddingRight = bar + "px";
        };

        const unlockScroll = () => {
            body.style.overflow = prevOverflow;
            body.style.paddingRight = prevPadRight;
        };

        const renderSound = () => {
            root.classList.toggle("is-muted", !soundOn);
            soundBtn.setAttribute("aria-pressed", soundOn ? "true" : "false");
            if (soundLabel) soundLabel.textContent = soundOn ? "SUARA NYALA" : "SUARA MATI";
        };

        const tickCount = (s) => {
            countEl.textContent = s;
            countEl.classList.remove("is-tick");
            void countEl.offsetWidth;
            countEl.classList.add("is-tick");
        };

        const stageM = document.createElement("div");
        stageM.className = "mascot mascot-stage";
        stageM.setAttribute("aria-hidden", "true");
        stageM.innerHTML = MASCOT_SVG + '<p class="mc-bubble"></p>';
        root.appendChild(stageM);
        const stageBubble = stageM.querySelector(".mc-bubble");

        const stageSay = (text) => {
            stageBubble.textContent = text.replace(/\{nama\}/gi, NAMA);
            stageBubble.classList.remove("is-on");
            void stageBubble.offsetWidth;
            stageBubble.classList.add("is-on");
        };

        const stageReset = () => {
            stageM.className = "mascot mascot-stage";
            stageBubble.classList.remove("is-on");
        };

        /* kru tirai (Bulan + Bintang kecil) dari js/mascot.js; kalau tidak termuat, maskot lama di bawah dipakai */
        const crewApi = () => {
            const A = window.ALPMascot;
            return (A && A.crew && typeof A.crew.supported === "function" && A.crew.supported()) ? A.crew : null;
        };
        let crewOn = false;

        /* saat hitung mundur: maskot muncul, bercanda, lalu "menarik" tirai */
        const stageIntro = () => {
            stageReset();
            void stageM.offsetWidth;
            stageM.classList.add("is-in");
            later(() => stageSay(isBulan
                ? "Psst, {nama}. Tirainya biar aku yang buka, ya."
                : "Halo, {nama}! Tirainya biar aku yang buka, ya."), 0.5);
            later(() => stageSay("Pegangan dulu. Ini agak megah, dan sedikit norak."), 1.45);
            later(() => {
                stageM.classList.add("is-pull");
                stageSay("Satu\u2026 dua\u2026 TARIK!");
            }, 2.2);
        };

        /* tirai terbuka: maskot terbang pamit ke bulan */
        const stageAway = () => {
            if (!stageM.classList.contains("is-in")) return;
            stageM.className = "mascot mascot-stage is-away";
            stageSay("Selamat menikmati, {nama}!");
            later(stageReset, 3.4);
        };

        const beamBox = root.querySelector(".cel-beams");
        if (beamBox) {
            [
                ["13%", "rgba(255,222,150,.85)", "-26deg", "24deg", "7.5s", "-2.5s"],
                ["43%", "rgba(255,170,190,.8)", "-20deg", "26deg", "9s", "-5.5s"],
                ["72%", "rgba(214,180,255,.8)", "-28deg", "18deg", "8s", "-1.5s"]
            ].forEach((b) => {
                const el = document.createElement("i");
                el.className = "beam is-bulan-beam";
                el.style.cssText = "--x:" + b[0] + ";--c:" + b[1] + ";--a0:" + b[2] + ";--a1:" + b[3] + ";--dur:" + b[4] + ";--del:" + b[5];
                beamBox.appendChild(el);
            });
        }

        if (subEl && subEl.parentNode) {
            const orn = document.createElement("p");
            orn.className = "cel-ornament";
            orn.setAttribute("aria-hidden", "true");
            orn.innerHTML = "<i>\u2726</i><b>\u263E</b><i>\u2726</i>";
            subEl.parentNode.insertBefore(orn, subEl);
        }

        function ignite() {
            if (!isOpen) return;
            lit = true;
            root.classList.add("is-lit");
            intro.classList.remove("is-on");
            nextShot = 4.2;
            nextFinale = 15;
            nextShooter = 0.8;
            perfWarm = 0;
            perfAcc = 0;
            perfN = 0;
            perfSlow = 0;
            sinceHeart = 0;
            recentShapes.length = 0;
            sinceCombo = 0;
            clapT = 1.5;
            lastNameAt = -1e9;
            bulanT = 0;
            nextLantern = 0.6;
            if (crewOn) {
                crewOn = false;
                const crew = crewApi();
                if (crew) crew.away();
            } else {
                stageAway();
            }
            flare();
            volley("opening");

            /* lagu baru dinyalakan sekarang (setelah keributan + hitung mundur); jam pesan menunggu lagunya berbunyi */
            vt = 0;
            lyricIdx = -2;
            lyricAt = 0;
            lyricHold = true;
            holdSince = performance.now();
            document.dispatchEvent(new CustomEvent("alp:celebration-start"));
        }

        function runIntro() {
            lit = false;
            root.classList.remove("is-lit");
            countEl.textContent = "";
            countEl.classList.remove("is-tick");
            intro.classList.add("is-on");

            if (reduced()) { ignite(); return; }

            const crew = crewApi();
            if (crew) {
                /* beberapa detik keributan kecil di balik tirai, baru "siap-siap" + hitung mundur, lalu tirai terbuka dan lagu menyala */
                crewOn = true;
                crew.start({ root, name: NAMA, bulan: isBulan });
                const C = crew.duration();
                later(() => {
                    if (introTxt) introTxt.textContent = isBulan ? "siap-siap senyum\u2026" : "siap-siap\u2026";
                    crew.ready();
                }, C);
                ["3", "2", "1"].forEach((s, n) => later(() => { tickCount(s); crew.tick(Number(s)); }, C + 0.8 + n * 0.9));
                later(() => crew.pull(), C + 2.95);
                later(ignite, C + 3.45);
                return;
            }

            stageIntro();

            ["3", "2", "1"].forEach((s, n) => later(() => tickCount(s), n * 0.9 + 0.35));
            later(ignite, 3 * 0.9 + 0.55);
        }

        function open() {
            if (isOpen) return;
            isOpen = true;
            lastFocus = document.activeElement;

            /* pasang nama + pilih lirik sesuai mode */
            applyName();
            if (buildRt()) {
                buildTimeline(timelineDur);
                if (SYNC) {
                    rt.forEach((l) => { l.t = null; });
                    buildTimeline(0);
                    syncIdx = 0;
                    renderSync();
                }
            }

            soundOn = true;
            renderSound();

            root.setAttribute("aria-hidden", "false");
            root.classList.add("is-open");
            body.classList.add("celebration-open");
            lockScroll();
            if (appEl) appEl.setAttribute("inert", "");

            /* sinyal ke js/audio.js (harus sinkron dalam klik agar lagu boleh berbunyi) */
            document.dispatchEvent(new CustomEvent("alp:celebration-open"));

            resize();
            vt = 0;
            lyricIdx = -2;
            stage.textContent = "";
            clockT = 0;
            startLoop();
            runIntro();

            setTimeout(() => {
                const target = SYNC && syncTapBtn ? syncTapBtn : closeBtn;
                target.focus({ preventScroll: true });
            }, 60);
        }

        function close() {
            if (!isOpen) return;
            isOpen = false;
            lit = false;
            clearTimers();

            stageReset();
            const crewC = crewApi();
            if (crewC) crewC.cancel();
            crewOn = false;
            lyricHold = false;
            root.classList.remove("is-open", "is-lit", "is-flare");
            root.setAttribute("aria-hidden", "true");
            intro.classList.remove("is-on");
            body.classList.remove("celebration-open");
            unlockScroll();
            if (appEl) appEl.removeAttribute("inert");

            document.dispatchEvent(new CustomEvent("alp:celebration-close"));

            /* bersihkan setelah pudar */
            setTimeout(() => {
                if (isOpen) return;
                stopLoop();
                particles.length = 0;
                rockets.length = 0;
                flashes.length = 0;
                confetti.length = 0;
                shooters.length = 0;
                lanterns.length = 0;
                stage.textContent = "";
                fx.clearRect(0, 0, W, H);
                bg.clearRect(0, 0, W, H);
                fxBusy = false;
            }, 950);

            const back = lastFocus && lastFocus.focus ? lastFocus : openBtn;
            lastFocus = null;
            setTimeout(() => back.focus({ preventScroll: true }), 60);
        }

        openBtn.addEventListener("click", (event) => {
            event.preventDefault();
            tryOpen();
        });

        closeBtn.addEventListener("click", (event) => {
            event.preventDefault();
            close();
        });

        soundBtn.addEventListener("click", (event) => {
            event.preventDefault();
            soundOn = !soundOn;
            renderSound();
            /* suara dinyalakan lagi: lagu disusulkan ke posisi pesan sekarang, supaya tidak mengulang dari awal */
            if (soundOn && lit) {
                const A = window.ALPAudio;
                if (A && typeof A.seek === "function") A.seek(vt);
            }
            document.dispatchEvent(new CustomEvent("alp:celebration-sound", { detail: { muted: !soundOn } }));
        });

        burstBtn.addEventListener("click", (event) => {
            event.preventDefault();
            if (!lit) return;
            const now = performance.now();
            if (now - lastBurst < 1100) return;
            lastBurst = now;
            const n = small ? 4 : tier === "tablet" ? 5 : 6;
            for (let i = 0; i < n; i++) {
                const x = W * ((i + 0.5) / n);
                later(() => launch(nextShape(), { x0: x + rand(-30, 30), tx: x + rand(-50, 50) }), i * 0.16);
            }
            addConfetti(small ? 30 : 60);
        });

        /* ketuk / klik di mana saja = satu kembang api ke arah titik itu */
        root.addEventListener("pointerdown", (event) => {
            if (!isOpen || !lit) return;
            if (event.target.closest && event.target.closest(".cel-bar, .cel-close, .cel-sync")) return;
            const now = performance.now();
            if (now - lastTap < 130) return;
            lastTap = now;
            applaudAt(event.clientX, event.clientY, 150);
            if (isBulan && !reduced()) { /* percikan emas kecil di titik ketukan */
                emit(event.clientX, event.clientY, circle(12, 1), 46, {
                    pal: pick([GOLD, ROSEGOLD, ICE, WHITE]), glint: true, life: [0.7, 1.1], size: [1.2, 1.9], drag: 0.93, grav: 0.004, tw: true
                });
            }
            launch(nextShape(), {
                x0: clamp(event.clientX + rand(-80, 80), W * 0.05, W * 0.95),
                tx: event.clientX,
                ty: clamp(event.clientY, H * 0.12, H * 0.78)
            });
        }, { passive: true });

        document.addEventListener("keydown", (event) => {
            if (!isOpen) return;

            if (event.key === "Escape") {
                event.preventDefault();
                close();
                return;
            }

            if (event.key === "Tab") {
                const list = Array.from(root.querySelectorAll("button")).filter((el) => {
                    return !el.disabled && el.offsetParent !== null || el === closeBtn;
                });
                if (!list.length) return;
                const first = list[0];
                const last = list[list.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });

        let resizeTimer = 0;
        const onResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => { if (isOpen) resize(); }, 140);
        };
        window.addEventListener("resize", onResize, { passive: true });
        window.addEventListener("orientationchange", onResize, { passive: true });

        window.addEventListener("pagehide", () => {
            if (isOpen) unlockScroll();
        });

        /* akses manual (konsol / tes): ALPCelebration.open() */
        window.ALPCelebration = {
            open: tryOpen,
            close,
            unlock: () => unlock(false),
            /* pratinjau jadwal pesan untuk lagu berdurasi D detik: ALPCelebration.plan(240, "bulan" | "other") */
            plan: (D, mode) => {
                const list = makeList(mode === "bulan" ? "bulan" : "other");
                const ts = planAuto(list, D || LY.FALLBACK);
                return list.map((l, i) => ({ t: ts[i], text: l.text, x: l.x, p: l.p })).filter((e) => e.t !== null).sort((a, b) => a.t - b.t);
            }
        };
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();