// Install onboarding modal — shown when push notifications aren't supported
// in the current browser context (typically iPhone Safari before the PWA is
// installed to the Home Screen). Exposes showInstallModal() / hideInstallModal()
// for app.js to call. The modal can be closed for the current page view but
// is not persistently dismissed.

const modal = document.getElementById("install-modal");
const stepsEl = document.getElementById("install-modal-steps");
const titleEl = document.getElementById("install-modal-title");

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
    `Open <b>Kelly Farm Pool</b> from your Home Screen and turn on notifications.`,
  ],
  android: [
    `Tap the menu ${MENU_SVG} in the top right of Chrome.`,
    `Tap <b>Install app</b> (or <b>Add to Home screen</b>).`,
    `Confirm <b>Install</b>.`,
    `Open <b>Kelly Farm Pool</b> from your Home Screen and turn on notifications.`,
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
  if (titleEl) titleEl.textContent = TITLES[p];
  if (!stepsEl) return;
  stepsEl.innerHTML = "";
  STEPS[p].forEach((html, i) => {
    const row = document.createElement("div");
    row.className = "install-step";
    row.innerHTML = `<span class="num">${i + 1}</span><span>${html}</span>`;
    stepsEl.appendChild(row);
  });
}

const DISMISS_KEY = "kfpool.install.dismissed";

export function showInstallModal() {
  if (!modal) return;
  if (isStandalone()) return;
  renderSteps();
  modal.classList.remove("hidden");
}

export function hideInstallModal() {
  if (!modal) return;
  modal.classList.add("hidden");
}

// Whether the install modal should auto-open on page load. Returns false if
// already standalone or if the user dismissed the modal earlier this session.
// Explicit `showInstallModal()` calls (e.g. from the notify-card link) ignore
// this and always open.
export function shouldAutoShow() {
  if (isStandalone()) return false;
  try {
    return sessionStorage.getItem(DISMISS_KEY) !== "1";
  } catch {
    return true;
  }
}

function dismiss() {
  try {
    sessionStorage.setItem(DISMISS_KEY, "1");
  } catch {}
  hideInstallModal();
}

modal?.addEventListener("click", (e) => {
  if (e.target.matches("[data-close]")) dismiss();
});

window.addEventListener("appinstalled", hideInstallModal);
