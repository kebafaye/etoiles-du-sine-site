/**
 * main.js
 * - Navbar sticky shadow (on scroll)
 * - Menu mobile accessible (toggle + ESC + close on link click)
 * - Scroll reveal léger (IntersectionObserver)
 * - Filtres "Réalisations"
 * - Validation formulaire côté client (avec honeypot anti-spam)
 * - Année automatique footer
 *
 * Note: Pour l'envoi réel du formulaire, branchez un endpoint (API) ou un service
 * type Formspree/Netlify Forms. Ici on simule un envoi "success".
 */

const qs = (sel, parent = document) => parent.querySelector(sel);
const qsa = (sel, parent = document) => Array.from(parent.querySelectorAll(sel));

function setYear() {
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

function initHeaderShadow() {
  const header = qs(".site-header");
  if (!header) return;
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

function initMobileNav() {
  const toggle = qs(".nav__toggle");
  const menu = qs("#nav-menu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    setOpen(!isOpen);
  });

  // Close on link click
  qsa(".nav__link", menu).forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  // Close on ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  // Close on outside click
  document.addEventListener("click", (e) => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (!isOpen) return;
    if (menu.contains(e.target) || toggle.contains(e.target)) return;
    setOpen(false);
  });
}

function initReveal() {
  const items = qsa("[data-reveal]");
  if (!items.length) return;

  // Si l'utilisateur préfère réduire les animations, on rend tout visible (CSS gère aussi).
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      });
    },
    { root: null, rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
  );

  items.forEach((el) => io.observe(el));
}

function initProjectFilters() {
  const chips = qsa("[data-filter]");
  const cards = qsa(".project[data-category]");
  if (!chips.length || !cards.length) return;

  const setActive = (chip) => {
    chips.forEach((c) => {
      c.classList.toggle("is-active", c === chip);
      c.setAttribute("aria-selected", String(c === chip));
    });
  };

  const applyFilter = (filter) => {
    cards.forEach((card) => {
      const cat = card.getAttribute("data-category");
      const show = filter === "all" || cat === filter;
      card.classList.toggle("is-hidden", !show);
    });
  };

  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.getAttribute("data-filter") || "all";
      setActive(chip);
      applyFilter(filter);
    });
  });
}

function validateEmail(value) {
  // Validation légère, compatible emails standards
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value.trim());
}

function validatePhone(value) {
  // Autorise chiffres + espaces + + + tirets + parenthèses (validation "raisonnable")
  const v = value.trim();
  if (v.length < 7) return false;
  return /^[+()\-.\s0-9]+$/.test(v);
}

function showFieldError(fieldEl, message) {
  const err = fieldEl?.parentElement?.querySelector(".field__error");
  if (err) err.textContent = message || "";
  if (message) fieldEl?.setAttribute("aria-invalid", "true");
  else fieldEl?.removeAttribute("aria-invalid");
}

function initContactForm() {
  const form = qs("#contact-form");
  if (!form) return;

  const toast = qs(".form__toast", form);
  const hp = qs("#company", form); // honeypot

  const fields = {
    name: qs("#name", form),
    phone: qs("#phone", form),
    email: qs("#email", form),
    service: qs("#service", form),
    message: qs("#message", form),
  };

  const validate = () => {
    let ok = true;

    const name = fields.name.value.trim();
    if (name.length < 2) {
      showFieldError(fields.name, "Merci d’indiquer votre nom (min. 2 caractères).");
      ok = false;
    } else showFieldError(fields.name, "");

    const phone = fields.phone.value.trim();
    if (!validatePhone(phone)) {
      showFieldError(fields.phone, "Merci d’indiquer un numéro valide.");
      ok = false;
    } else showFieldError(fields.phone, "");

    const email = fields.email.value.trim();
    if (!validateEmail(email)) {
      showFieldError(fields.email, "Merci d’indiquer un email valide.");
      ok = false;
    } else showFieldError(fields.email, "");

    const service = fields.service.value.trim();
    if (!service) {
      showFieldError(fields.service, "Merci de sélectionner un service.");
      ok = false;
    } else showFieldError(fields.service, "");

    const message = fields.message.value.trim();
    if (message.length < 10) {
      showFieldError(fields.message, "Merci de décrire votre besoin (min. 10 caractères).");
      ok = false;
    } else showFieldError(fields.message, "");

    return ok;
  };

  // Validate on blur for better UX
  Object.values(fields).forEach((el) => {
    el.addEventListener("blur", () => validate());
    el.addEventListener("input", () => showFieldError(el, ""));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Anti-spam: si honeypot rempli, on fait semblant de succès sans rien faire
    if (hp && hp.value.trim()) {
      form.reset();
      return;
    }

    const ok = validate();
    if (!ok) {
      toast.hidden = false;
      toast.textContent = "Merci de corriger les champs signalés avant d’envoyer.";
      return;
    }

    // Simule un envoi (à remplacer par fetch() vers votre backend/service)
    toast.hidden = false;
    toast.textContent = "Envoi en cours…";

    try {
      await new Promise((r) => setTimeout(r, 700));
      toast.textContent = "Merci. Votre demande a été envoyée. Nous vous recontactons rapidement.";
      form.reset();
    } catch {
      toast.textContent = "Impossible d’envoyer pour le moment. Merci de réessayer ou de nous contacter sur WhatsApp.";
    }
  });
}

function initHeroSlideshow() {
  const a = qs("#hero-bg-a");
  const b = qs("#hero-bg-b");
  if (!a || !b) return;

  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const candidates = [
    "assets/img/project-1.svg",
    "assets/img/project-2.svg",
    "assets/img/project-3.svg",
  ];

  const placeholder = "assets/img/hero-placeholder.svg";

  const preload = (src) =>
    new Promise((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.onload = () => resolve({ src, ok: true });
      img.onerror = () => resolve({ src, ok: false });
      img.src = src;
    });

  Promise.all(candidates.map(preload)).then((results) => {
    const images = results.filter((r) => r.ok).map((r) => r.src);

    // Init (au moins 1 image, sinon placeholder)
    let index = 0;
    const first = images[0] || placeholder;
    a.src = first;
    a.classList.add("is-active");
    b.classList.remove("is-active");
    b.src = images[1] || first;

    // On ne lance le slider que si au moins 2 images sont chargées
    if (reduce || images.length < 2) return;

    let front = a;
    let back = b;

    const stepMs = 6500; // tempo premium, non agressif
    window.setInterval(() => {
      index = (index + 1) % images.length;
      const next = images[(index + 1) % images.length];

      // Le "back" devient visible
      back.classList.add("is-active");
      front.classList.remove("is-active");

      // Swap refs
      const tmp = front;
      front = back;
      back = tmp;

      // Prépare le prochain visuel dans le calque caché
      back.src = next;
    }, stepMs);
  });
}

function initThemeToggle() {
  const btn = qs(".theme-toggle");
  if (!btn) return;

  const icon = qs("i", btn);
  const key = "eds-theme";
  const saved = localStorage.getItem(key);
  if (saved === "light") document.body.setAttribute("data-theme", "light");

  const syncLabel = () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    btn.setAttribute("aria-label", isLight ? "Activer le thème sombre" : "Activer le thème clair");
    btn.title = isLight ? "Passer au thème sombre" : "Passer au thème clair";
    if (icon) icon.className = isLight ? "fa-solid fa-sun" : "fa-solid fa-moon";
  };

  syncLabel();

  btn.addEventListener("click", () => {
    const isLight = document.body.getAttribute("data-theme") === "light";
    if (isLight) {
      document.body.removeAttribute("data-theme");
      localStorage.setItem(key, "dark");
    } else {
      document.body.setAttribute("data-theme", "light");
      localStorage.setItem(key, "light");
    }
    syncLabel();
  });
}

function initSpotlightBackground() {
  const bg = qs(".bg-spotlight");
  if (!bg) return;
  window.addEventListener(
    "pointermove",
    (e) => {
      const x = `${Math.round((e.clientX / window.innerWidth) * 100)}%`;
      const y = `${Math.round((e.clientY / window.innerHeight) * 100)}%`;
      document.body.style.setProperty("--mx", x);
      document.body.style.setProperty("--my", y);
    },
    { passive: true }
  );
}

function initCounters() {
  const counters = qsa("[data-counter]");
  if (!counters.length) return;

  const animate = (el) => {
    const target = Number(el.getAttribute("data-counter"));
    if (!Number.isFinite(target)) return;
    const duration = 1200;
    const start = performance.now();
    const suffix = el.textContent.includes("%") ? "%" : el.textContent.includes("/7") ? "/7" : "";

    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - p) ** 3;
      const value = Math.round(target * eased);
      el.textContent = `${value}${suffix}`;
      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animate(entry.target);
        io.unobserve(entry.target);
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((el) => io.observe(el));
}

function initTiltCards() {
  const cards = qsa(".innovation-card");
  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rotX = (0.5 - y) * 8;
      const rotY = (x - 0.5) * 10;
      card.style.transform = `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    });
    card.addEventListener("pointerleave", () => {
      card.style.transform = "none";
    });
  });
}

function initHeroCanvas() {
  const canvas = qs("#hero-canvas");
  if (!canvas) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  if (reduce) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const particles = [];
  const count = 55;
  let rafId = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const randomParticle = () => ({
    x: Math.random() * canvas.clientWidth,
    y: Math.random() * canvas.clientHeight,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1 + Math.random() * 2.2,
  });

  const init = () => {
    particles.length = 0;
    for (let i = 0; i < count; i += 1) particles.push(randomParticle());
  };

  const draw = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 120) continue;
        const alpha = (1 - dist / 120) * 0.3;
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }

    rafId = requestAnimationFrame(draw);
  };

  resize();
  init();
  draw();
  window.addEventListener("resize", () => {
    resize();
    init();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) cancelAnimationFrame(rafId);
    else draw();
  });
}

function initPwa() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.documentElement.classList.add("js");
  setYear();
  initHeaderShadow();
  initMobileNav();
  initReveal();
  initProjectFilters();
  initContactForm();
  initHeroSlideshow();
  initThemeToggle();
  initSpotlightBackground();
  initCounters();
  initTiltCards();
  initHeroCanvas();
  initPwa();
});

