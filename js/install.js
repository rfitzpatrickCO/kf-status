// PWA install onboarding for mobile users.
// Shows tailored instructions for iOS Safari, Android Chrome, and a generic
// fallback. Hidden when the app is already installed.

const card = document.getElementById("install-card");
const stepsEl = document.getElementById("install-steps");
const titleEl = document.getElementById("install-title");
const introEl = document.getElementById("install-intro");
const dismissBtn = document.getElementById("install-dismiss");

const DISMISS_KEY = "poolstatus.install.dismissed";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function platform() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

const SHARE_SVG = `
  <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M12 3v12m0-12-4 4m4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
          stroke="#42a5f5" stroke-width="2" stroke-linecap="round"
          stroke-linejoin="round"/>
  </svg>`;
const MENU_SVG = `
  <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="5" cy="12" r="1.6" fill="#42a5f5"/>
    <circle cx="12" cy="12" r="1.6" fill="#42a5f5"/>
    <circle cx="19" cy="12" r="1.6" fill="#42a5f5"/>
  </svg>`;
const PLUS_SVG = `
  <svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none"
       xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="#42a5f5" stroke-width="2"/>
    <path d="M12 8v8M8 12h8" stroke="#42a5f5" stroke-width="2" stroke-linecap="round"/>
  </svg>`;

const STEPS = {
  ios: [
    `Tap the Share icon ${SHARE_SVG} at the bottom of Safari.`,
    `Scroll down and tap <b>Add to Home Screen</b> ${PLUS_SVG}.`,
    `Tap <b>Add</b> in the top right.`,
    `Open the new <b>Pool Status</b> icon from your Home Screen and turn on notifications.`,
  ],
  android: [
    `Tap the menu ${MENU_SVG} in the top right of Chrome.`,
    `Tap <b>Install app</b> (or <b>Add to Home screen</b>).`,
    `Confirm <b>Install</b>.`,
    `Open <b>Pool Status</b> from your Home Screen and turn on notifications.`,
  ],
  other: [
    `Open this page on your phone in Safari (iPhone) or Chrome (Android).`,
    `Use your browser's share/menu and choose <b>Add to Home Screen</b>.`,
    `Open the installed app and turn on notifications.`,
  ],
};

const TITLES = {
  ios: "Add to your iPhone Home Screen",
  android: "Install on your Android phone",
  other: "Add to your phone's Home Screen",
};

function renderSteps() {
  const p = platform();
  titleEl.textContent = TITLES[p];
  stepsEl.innerHTML = "";
  STEPS[p].forEach((html, i) => {
    const row = document.createElement("div");
    row.className = "install-step";
    row.innerHTML = `<span class="num">${i + 1}</span><span>${html}</span>`;
    stepsEl.appendChild(row);
  });
}

function shouldShow() {
  if (isStandalone()) return false;
  if (localStorage.getItem(DISMISS_KEY) === "1") return false;
  // Only meaningful on mobile — on desktop, browsers handle install via address-bar prompts.
  const p = platform();
  return p === "ios" || p === "android";
}

if (shouldShow()) {
  renderSteps();
  card.classList.remove("hidden");
}

dismissBtn?.addEventListener("click", () => {
  localStorage.setItem(DISMISS_KEY, "1");
  card.classList.add("hidden");
});

// Capture Android's install prompt so we can offer a one-tap install where
// supported. iOS does not fire this event — those users follow the manual
// steps above.
let deferredPrompt = null;
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (!shouldShow()) return;
  // Inject a prominent install button at the top of the steps list.
  const btn = document.createElement("button");
  btn.className = "btn btn-primary btn-block";
  btn.textContent = "Install app";
  btn.style.marginBottom = "0.5rem";
  btn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    btn.remove();
  });
  stepsEl.parentNode.insertBefore(btn, stepsEl);
});

window.addEventListener("appinstalled", () => {
  card.classList.add("hidden");
  localStorage.setItem(DISMISS_KEY, "1");
});
