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
    "https://scontent.fdkr7-1.fna.fbcdn.net/v/t39.30808-6/476838674_940483591550896_4367177843902797452_n.jpg?_nc_cat=102&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeGMWKILsKWeW1N65CI8UfaZ88uKWntT4f3zy4pae1Ph_UZ5wGcr4Qyh7w5h9ehGxIn0U5QLTz4WNwX7m3k6ExCp&_nc_ohc=Be8Uk_xr0DwQ7kNvwHO_68V&_nc_oc=AdkqW5YkcrEz-V4d4NppT6vfejml3ZkhPGwxhF_jnhxuxcDHs3cLiSZQxY3b33SLNQM&_nc_zt=23&_nc_ht=scontent.fdkr7-1.fna&_nc_gid=ridk_NS6CmsQdu8l_lsh0w&oh=00_AfoNBuwyJTqGy8S8WOq6oFP_nt9RVL2H3rtDzlCCxM8wFQ&oe=6977D4ED",
    "https://scontent.fdkr6-1.fna.fbcdn.net/v/t39.30808-6/480676895_649978704139133_2425968390186212160_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=cc71e4&_nc_eui2=AeHzMgcLtR1nBRMIgx_TWDJwPwyClneszvU_DIKWd6zO9aQtiP_6trbczA90NQAhR8i_SjsqhfgJk9g6EWquBC-t&_nc_ohc=hJfhlsdR_HoQ7kNvwHz-4No&_nc_oc=AdldsCVV6xJHWSWvDwXKZCXHh_mmzhf9ZVVKmVrjxjxTlX38UiKYJQB2KhNoVdh2u7s&_nc_zt=23&_nc_ht=scontent.fdkr6-1.fna&_nc_gid=wZR5mxp3r1geF-5Jx8oETw&oh=00_AfogYENeXY92Z3i2xRbnyU9q56oLW06HJSUc_gLudUZPVg&oe=6977F6C1",
    "https://scontent.fdkr5-1.fna.fbcdn.net/v/t39.30808-6/528142317_774267498376919_8993634135189694578_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=a5f93a&_nc_eui2=AeEN9tB4NJkdE8_92g0Bhc_pWgfx8VXz9hJaB_HxVfP2El5rJeTLfqO2siQAMVDdoNOQqa9jXkFLzMlVIzt_ulnM&_nc_ohc=4zZcmx9Kws4Q7kNvwHQgVsW&_nc_oc=AdnjDxEGJOagkd7D87KTHcHJNtieORy9FQaE7yVVrhvjJ-NtPHZRH0iFIuamP85BYBw&_nc_zt=23&_nc_ht=scontent.fdkr5-1.fna&_nc_gid=D7i5AHjLhmP9TOhK4e0QwA&oh=00_AfquGgikLVSsbmSirtBOKEN18sVeJ0pNUPfG7x1EQph4cg&oe=6977D428",
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

document.addEventListener("DOMContentLoaded", () => {
  setYear();
  initHeaderShadow();
  initMobileNav();
  initReveal();
  initProjectFilters();
  initContactForm();
  initHeroSlideshow();
});

