document.addEventListener("DOMContentLoaded", () => {
    /* main: landing, scroll reveal, teks napas, bintang ambient, reduced motion */

    /* 01. ELEMEN */
    const body = document.body;
    const enterButton = document.getElementById("enterButton");
    const pauseSection = document.getElementById("pause");
    const landing = document.getElementById("landing");
    const breathingLabel = document.getElementById("breathingLabel");
    const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    /* 02. TOMBOL MASUK */
    if (enterButton && pauseSection) {
        enterButton.addEventListener("click", () => {
            pauseSection.scrollIntoView({
                behavior: reducedMotionQuery.matches ? "auto" : "smooth",
                block: "start"
            });
        });
    }

    /* 03. SCROLL REVEAL (elemen konten, bukan section besar) */
    const revealTargets = document.querySelectorAll([
        ".pause-content",
        ".little-things-content",
        ".thing-card",
        ".canvas-content",
        ".canvas-workspace",
        ".hidden-note-content",
        ".ending-content"
    ].join(", "));

    let revealObserver = null;

    const showAllRevealTargets = () => {
        revealTargets.forEach((element) => {
            element.classList.add("scroll-reveal", "is-visible");
        });
    };

    const createRevealObserver = () => {
        if (typeof IntersectionObserver !== "function") {
            showAllRevealTargets();
            return;
        }

        if (revealObserver) {
            revealObserver.disconnect();
        }

        revealTargets.forEach((element) => {
            element.classList.add("scroll-reveal");
        });

        revealObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    entry.target.classList.toggle("is-visible", entry.isIntersecting);
                });
            },
            {
                /* threshold harus 0: blok >2000px di HP tidak terdeteksi kalau 0.12 */
                threshold: 0,
                rootMargin: "0px 0px -10% 0px"
            }
        );

        revealTargets.forEach((element) => {
            revealObserver.observe(element);
        });
    };

    if (revealTargets.length) {
        if (reducedMotionQuery.matches) {
            showAllRevealTargets();
        } else {
            createRevealObserver();
        }
    }

    /* 04. TEKS NAPAS (interval, bukan animation loop) */
    const breathingTexts = [
        "Breathe in",
        "Tahan, sebentar aja",
        "Breathe out, pelan-pelan"
    ];

    let breathingIndex = 0;
    let breathingInterval = null;
    let breathingFadeTimeout = null;

    const setBreathingText = (text) => {
        if (breathingLabel) {
            breathingLabel.textContent = text;
        }
    };

    const changeBreathingText = () => {
        if (!breathingLabel || document.hidden || reducedMotionQuery.matches) {
            return;
        }

        breathingLabel.style.opacity = "0";

        if (breathingFadeTimeout) {
            clearTimeout(breathingFadeTimeout);
        }

        breathingFadeTimeout = window.setTimeout(() => {
            if (!breathingLabel || document.hidden || reducedMotionQuery.matches) {
                return;
            }

            setBreathingText(breathingTexts[breathingIndex]);
            breathingLabel.style.opacity = "1";
            breathingIndex = (breathingIndex + 1) % breathingTexts.length;
        }, 280);
    };

    const startBreathing = () => {
        if (!breathingLabel || reducedMotionQuery.matches || document.hidden) {
            return;
        }

        if (breathingInterval) {
            return;
        }

        breathingInterval = window.setInterval(changeBreathingText, 3200);
    };

    const stopBreathing = () => {
        if (breathingInterval) {
            clearInterval(breathingInterval);
            breathingInterval = null;
        }

        if (breathingFadeTimeout) {
            clearTimeout(breathingFadeTimeout);
            breathingFadeTimeout = null;
        }

        if (breathingLabel) {
            breathingLabel.style.opacity = "1";
        }
    };

    if (breathingLabel) {
        setBreathingText(breathingTexts[0]);
        breathingIndex = 1;

        if (reducedMotionQuery.matches) {
            breathingLabel.style.opacity = "1";
        } else {
            startBreathing();
        }
    }

    /* 05. BINTANG AMBIENT LANDING (bergeser mengikuti pointer fine, mati saat reduced motion) */
    const ambientStars = document.querySelectorAll(".ambient-star");
    const finePointerQuery = window.matchMedia("(pointer: fine)");
    const influenceRadius = 170;

    let starsInteractive = false;

    const resetStars = () => {
        ambientStars.forEach((star) => {
            star.style.transform = "";
        });
    };

    const updateStarInteraction = () => {
        starsInteractive = Boolean(
            landing &&
            ambientStars.length &&
            finePointerQuery.matches &&
            !reducedMotionQuery.matches
        );

        if (!starsInteractive) {
            resetStars();
        }
    };

    updateStarInteraction();

    if (landing && ambientStars.length) {
        landing.addEventListener("pointermove", (event) => {
            if (!starsInteractive || document.hidden) {
                return;
            }

            const rect = landing.getBoundingClientRect();
            const pointerX = event.clientX - rect.left;
            const pointerY = event.clientY - rect.top;

            ambientStars.forEach((star) => {
                /* egg dikelola easter-egg.js: kilaunya menghindar, area klik tetap diam */
                if (star.classList.contains("egg-trigger")) {
                    return;
                }

                const starRect = star.getBoundingClientRect();
                const deltaX = pointerX - (starRect.left - rect.left + starRect.width / 2);
                const deltaY = pointerY - (starRect.top - rect.top + starRect.height / 2);
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance > influenceRadius) {
                    star.style.transform = "";
                    return;
                }

                const strength = (influenceRadius - distance) / influenceRadius;
                const moveX = (deltaX / influenceRadius) * strength * -10;
                const moveY = (deltaY / influenceRadius) * strength * -10;

                star.style.transform =
                    `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
            });
        }, { passive: true });

        landing.addEventListener("pointerleave", resetStars, { passive: true });
    }

    /* 06. TAB DITINGGALKAN / KEMBALI */
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            stopBreathing();
            resetStars();
            return;
        }

        if (!reducedMotionQuery.matches) {
            startBreathing();
        }
    });

    /* 07. REDUCED MOTION (berlaku tanpa reload) */
    const handleReducedMotionChange = (event) => {
        if (event.matches) {
            stopBreathing();
            showAllRevealTargets();
            resetStars();
            return;
        }

        if (revealTargets.length) {
            createRevealObserver();
        }

        if (breathingLabel) {
            breathingIndex = 1;
            setBreathingText(breathingTexts[0]);
        }

        updateStarInteraction();

        if (!document.hidden) {
            startBreathing();
        }
    };

    const onMediaChange = (query, handler) => {
        if (typeof query.addEventListener === "function") {
            query.addEventListener("change", handler);
        } else if (typeof query.addListener === "function") {
            query.addListener(handler); /* browser lama */
        }
    };

    onMediaChange(reducedMotionQuery, handleReducedMotionChange);
    onMediaChange(finePointerQuery, updateStarInteraction);

    /* 08. STATUS HALAMAN SIAP */
    requestAnimationFrame(() => {
        body.classList.add("page-ready");
    });

    /* 09. CLEANUP */
    window.addEventListener("pagehide", () => {
        stopBreathing();
        resetStars();

        if (revealObserver) {
            revealObserver.disconnect();
            revealObserver = null;
        }
    }, { once: true });

});