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
  joinForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(joinForm);
    const email = String(formData.get("email") || "").trim();

    if (!email.includes("@")) {
      formMessage.textContent = "Please enter a valid email address.";
      return;
    }

    formMessage.textContent = `You're in, ${email}. Watch your inbox for your 10% code.`;
    joinForm.reset();
  });
}
