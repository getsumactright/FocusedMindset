// --- Live Shopify product sync ---------------------------------------
// Pulls current price / sale / stock status from the public, unauthenticated
// products.json endpoint on the live Shopify store and overwrites the
// hand-authored fallback values already baked into the HTML. If the fetch
// fails (offline, store down, endpoint changed) the static fallback content
// just stays as-is - visitors never see a broken price.
const SHOP_DOMAIN = "https://focusedmindset.shop";

function formatPrice(amount) {
  const num = Number(amount);
  if (!Number.isFinite(num) || num <= 0) return null;
  return Number.isInteger(num) ? `$${num}` : `$${num.toFixed(2)}`;
}

function getProductHandle(card) {
  const link = card.querySelector(".product-link, .product-media");
  const href = link && link.getAttribute("href");
  if (!href) return null;
  try {
    const { pathname } = new URL(href, SHOP_DOMAIN);
    const segments = pathname.split("/").filter(Boolean);
    const productsIndex = segments.indexOf("products");
    return productsIndex >= 0 ? segments[productsIndex + 1] : null;
  } catch (e) {
    return null;
  }
}

function applyLiveProductData(card, info) {
  const priceEl = card.querySelector(".product-price");
  // Any badge except the static "Wholesale" one, which isn't price-driven.
  const badgeEl = card.querySelector(".badge:not(.badge-wholesale)");
  const inStock = info.available && info.price > 0;

  if (!inStock) {
    card.classList.add("is-soldout");
    if (priceEl) {
      priceEl.classList.add("product-price-muted");
      priceEl.textContent = "Notify me";
    }
    if (badgeEl) {
      badgeEl.className = "badge badge-soldout";
      badgeEl.textContent = "Restocking soon";
      badgeEl.hidden = false;
    }
    return;
  }

  card.classList.remove("is-soldout");

  const nowText = formatPrice(info.price);
  if (!nowText) return; // malformed price data - leave fallback content alone

  const onSale = info.compareAtPrice && info.compareAtPrice > info.price;

  if (priceEl) {
    priceEl.classList.remove("product-price-muted");
    priceEl.innerHTML = onSale
      ? `<span class="was">${formatPrice(info.compareAtPrice)}</span> <span class="now">${nowText}</span>`
      : `<span class="now">${nowText}</span>`;
  }

  if (badgeEl) {
    if (onSale) {
      badgeEl.className = "badge badge-sale";
      badgeEl.textContent = "Sale";
      badgeEl.hidden = false;
    } else {
      badgeEl.hidden = true;
    }
  }
}

function syncLiveProductData() {
  const cards = document.querySelectorAll(".product-card");
  if (!cards.length) return;

  fetch(`${SHOP_DOMAIN}/products.json?limit=250`)
    .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
    .then((data) => {
      const byHandle = new Map();

      (data.products || []).forEach((product) => {
        const variants = product.variants || [];
        const prices = variants.map((v) => Number(v.price)).filter((p) => p > 0);
        const compareAtPrices = variants
          .map((v) => Number(v.compare_at_price))
          .filter((p) => p > 0);

        byHandle.set(product.handle, {
          price: prices.length ? Math.min(...prices) : 0,
          compareAtPrice: compareAtPrices.length ? Math.max(...compareAtPrices) : null,
          available: variants.some((v) => v.available),
        });
      });

      cards.forEach((card) => {
        const handle = getProductHandle(card);
        if (!handle || !byHandle.has(handle)) return;
        applyLiveProductData(card, byHandle.get(handle));
      });
    })
    .catch(() => {
      // Network/CORS/store-down failure: keep the static fallback content
      // already in the HTML rather than showing a broken state.
    });
}

syncLiveProductData();

const joinForm = document.getElementById("joinForm");
const formMessage = document.getElementById("formMessage");
const introOverlay = document.getElementById("introOverlay");
const introVideo = document.getElementById("introVideo");
const introSkip = document.getElementById("introSkip");
const INTRO_STORAGE_KEY = "focusedMindset.introSeen";

function hasSeenIntro() {
  try {
    return window.localStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch (e) {
    return false;
  }
}

function markIntroSeen() {
  try {
    window.localStorage.setItem(INTRO_STORAGE_KEY, "1");
  } catch (e) {
    // localStorage unavailable (private browsing, etc.) - intro will just replay next visit
  }
}

function hideIntro() {
  if (!introOverlay || introOverlay.classList.contains("is-hidden")) {
    return;
  }

  introOverlay.classList.add("is-hidden");
  document.body.classList.remove("is-loading");
  markIntroSeen();
}

if (introOverlay) {
  if (hasSeenIntro()) {
    // Returning visitor: skip straight past the intro, no video, no delay.
    introOverlay.classList.add("is-hidden");
  } else {
    document.body.classList.add("is-loading");

    const fallbackTimer = window.setTimeout(hideIntro, 6000);

    if (introVideo) {
      introVideo.addEventListener("ended", () => {
        window.clearTimeout(fallbackTimer);
        hideIntro();
      });

      introVideo.addEventListener("error", () => {
        window.clearTimeout(fallbackTimer);
        hideIntro();
      });
    }

    if (introSkip) {
      introSkip.addEventListener("click", () => {
        window.clearTimeout(fallbackTimer);
        hideIntro();
      });
    }
  }
}

// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const navLinks = document.getElementById("navLinks");

if (navToggle && navLinks) {
  const closeNav = () => {
    navToggle.classList.remove("is-active");
    navToggle.setAttribute("aria-expanded", "false");
    navLinks.classList.remove("is-open");
  };

  const openNav = () => {
    navToggle.classList.add("is-active");
    navToggle.setAttribute("aria-expanded", "true");
    navLinks.classList.add("is-open");
  };

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.contains("is-open");
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("is-open") &&
      !navLinks.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeNav();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && navLinks.classList.contains("is-open")) {
      closeNav();
      navToggle.focus();
    }
  });
}

if (joinForm && formMessage) {
  const hiddenIframe = document.getElementById("hiddenIframe");
  const emailInput = document.getElementById("email");
  let awaitingSubmit = false;

  joinForm.addEventListener("submit", (event) => {
    const email = String(emailInput.value || "").trim();

    if (!email.includes("@")) {
      event.preventDefault();
      formMessage.textContent = "Please enter a valid email address.";
      return;
    }

    // Real submit: posts to Shopify's customer/newsletter endpoint in the
    // hidden iframe so the visitor never leaves this page. Confirmation
    // below fires once that iframe finishes loading.
    awaitingSubmit = true;
    formMessage.textContent = "Submitting...";
  });

  if (hiddenIframe) {
    hiddenIframe.addEventListener("load", () => {
      if (!awaitingSubmit) {
        // Ignore the iframe's initial blank load on page load.
        return;
      }
      awaitingSubmit = false;
      formMessage.textContent = "You're in! Watch your inbox for your 10% code.";
      joinForm.reset();
    });
  }
}
