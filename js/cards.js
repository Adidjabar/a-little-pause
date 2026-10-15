document.addEventListener("DOMContentLoaded", () => {

    /* cards: buka / tutup kartu "Hal-hal kecil", satu aktif sekaligus (keyboard, Escape, klik di luar); reveal ditangani main.js */

    const cards = document.querySelectorAll(".thing-card");

    if (!cards.length) {
        return;
    }

    let activeCard = null;

    /* Sinkronkan aria-expanded dengan keadaan visual, beri label dari data-title */

    cards.forEach((card) => {
        card.setAttribute(
            "aria-expanded",
            card.classList.contains("is-open") ? "true" : "false"
        );

        const title = card.dataset.title;

        if (title && !card.hasAttribute("aria-label")) {
            card.setAttribute("aria-label", `Buka kartu ${title}`);
        }
    });

    /* Buka / tutup */

    const closeCard = (card) => {
        if (!card) {
            return;
        }

        card.classList.remove("is-open");
        card.setAttribute("aria-expanded", "false");

        if (activeCard === card) {
            activeCard = null;
        }
    };

    const closeAllCards = () => {
        cards.forEach(closeCard);
    };

    const openCard = (card) => {
        if (!card) {
            return;
        }

        cards.forEach((otherCard) => {
            if (otherCard !== card) {
                closeCard(otherCard);
            }
        });

        card.classList.add("is-open");
        card.setAttribute("aria-expanded", "true");
        activeCard = card;
    };

    const toggleCard = (card) => {
        if (card.classList.contains("is-open")) {
            closeCard(card);
            return;
        }

        openCard(card);
    };

    /* klik kartu: propagation sengaja tidak dihentikan agar easter-egg.js tetap mendeteksi klik kartu kopi (.egg-trigger) */

    cards.forEach((card) => {
        card.addEventListener("click", () => {
            toggleCard(card);
        });
    });

    /* Enter dan Space sudah ditangani <button>. Di sini hanya Escape. */

    cards.forEach((card) => {
        card.addEventListener("keydown", (event) => {
            if (event.key === "Escape" && card.classList.contains("is-open")) {
                event.preventDefault();
                closeCard(card);
            }
        });
    });

    /* Klik di luar kartu menutup kartu aktif */

    document.addEventListener("click", (event) => {
        if (!activeCard) {
            return;
        }

        if (event.target.closest(".thing-card")) {
            return;
        }

        closeAllCards();
    });

    /* Escape menutup kartu aktif; easter egg punya handler Escape sendiri, keduanya berdampingan */

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && activeCard) {
            closeAllCards();
        }
    });

    /* fokus tidak dipindahkan saat kartu dibuka, dan kartu tidak menutup hanya karena fokus berpindah */

    /* Bila HTML awal punya lebih dari satu kartu terbuka, sisakan yang pertama */

    const initiallyOpen = Array.from(cards).filter((card) => card.classList.contains("is-open"));

    if (initiallyOpen.length > 0) {
        const firstOpen = initiallyOpen[0];

        initiallyOpen.slice(1).forEach(closeCard);

        activeCard = firstOpen;
        firstOpen.setAttribute("aria-expanded", "true");
    }

    /* penanda untuk CSS; reveal kartu ditangani main.js, jangan buat IntersectionObserver kedua */

    const littleThings = document.getElementById("little-things");

    if (littleThings) {
        littleThings.classList.add("cards-ready");
    }

    /* Reduced motion: tanpa animation loop, motion tetap ditangani CSS */

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const syncReducedMotion = () => {
        document.documentElement.classList.toggle("reduced-motion", reducedMotion.matches);
    };

    syncReducedMotion();

    if (typeof reducedMotion.addEventListener === "function") {
        reducedMotion.addEventListener("change", syncReducedMotion);
    }

});