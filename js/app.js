import { firebaseConfig, vapidKey, isConfigured } from "./firebase-config.js";
import { showInstallModal, shouldAutoShow } from "./install.js";

const FB_VERSION = "10.13.2";
const card = document.getElementById("status-card");
const iconEl = document.getElementById("status-icon");
const eyebrow = document.getElementById("status-eyebrow");
const headline = document.getElementById("status-headline");
const detail = document.getElementById("status-detail");
const meta = document.getElementById("status-meta");
const notifyCard = document.querySelector(".notify-card");
const enableBtn = document.getElementById("enable-notifs");
const notifStatus = document.getElementById("notif-status");

// ---------- Status rendering --------------------------------------------------

const STATUS_LABELS = {
  open: "Open",
  closed: "Closed",
  delayed: "Delayed",
  info: "Notice",
};

const DEFAULT_STATE = {
  status: "open",
  headline: "Pool is open",
  detail: "Come on in! Enjoy your visit. 🌊",
  updatedAt: null,
};

function pickEmoji(status, headline) {
  const h = (headline || "").toLowerCase();
  if (/weather|lightning|thunder|storm|rain/.test(h)) return "⛈️";
  if (/maintenance|repair/.test(h)) return "🔧";
  if (/chemical|chlorine|balanc/.test(h)) return "🧪";
  if (/staff|lifeguard/.test(h)) return "👥";
  if (/event|private/.test(h)) return "🎉";
  if (status === "open") return "🏊";
  if (status === "delayed") return "⏰";
  if (status === "info") return "ℹ️";
  return "🚫";
}

function render(state) {
  const s = { ...DEFAULT_STATE, ...(state || {}) };
  card.classList.remove(
    "status-loading",
    "status-open",
    "status-closed",
    "status-delayed",
    "status-info",
  );
  card.classList.add(`status-${s.status}`);
  if (iconEl) iconEl.textContent = pickEmoji(s.status, s.headline);
  eyebrow.textContent = STATUS_LABELS[s.status] || "Status";
  headline.textContent = s.headline || DEFAULT_STATE.headline;
  detail.textContent = s.detail || "";
  meta.textContent = s.updatedAt ? `Updated ${formatTime(s.updatedAt)}` : "";
}

// The inline <script> block in index.html already rendered an initial state
// (cached if available, otherwise the default). We deliberately don't render
// again here — doing so would overwrite the cached value with the default and
// reintroduce the flash. The next render happens when Firestore delivers data.

const CACHE_KEY = "kfpool.status.cache";

function cacheStatus(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      status: data.status,
      headline: data.headline,
      detail: data.detail,
    }));
  } catch (e) {}
}

function formatTime(ts) {
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffMin = Math.round((now - d) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  return d.toLocaleString([], {
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ---------- Service worker ---------------------------------------------------

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("./sw.js");
  } catch (err) {
    console.warn("SW registration failed", err);
    return null;
  }
}

// ---------- Push opt-in ------------------------------------------------------

const NOTIF_KEY = "poolstatus.notif.optin";

function setNotifUI(state, msg) {
  notifStatus.textContent = msg || "";
  if (state === "on") {
    enableBtn.textContent = "On";
    enableBtn.disabled = true;
  } else if (state === "blocked") {
    enableBtn.textContent = "Blocked";
    enableBtn.disabled = true;
  } else if (state === "unsupported") {
    enableBtn.textContent = "Unsupported";
    enableBtn.disabled = true;
  } else if (state === "working") {
    enableBtn.disabled = true;
    enableBtn.textContent = "Working…";
  } else {
    enableBtn.disabled = false;
    enableBtn.textContent = "Turn on";
  }
}

async function detectPushSupport() {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { supported: false, reason: "Push not supported on this browser." };
  }
  // iOS only delivers web push to PWAs installed on the home screen.
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (isIOS && !isStandalone) {
    return {
      supported: false,
      reason: "On iPhone/iPad, install this app to your Home Screen first (see below).",
    };
  }
  return { supported: true };
}

async function setupNotifyButton(messagingInstance) {
  const support = await detectPushSupport();
  if (!support.supported) {
    // Browser can't deliver web push here (typically iPhone Safari before
    // the PWA is installed). Repurpose the notify-card button to open the
    // install modal, and auto-open it on first visit until the user defers.
    enableBtn.textContent = "Add to Home Screen";
    enableBtn.disabled = false;
    enableBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showInstallModal();
    });
    if (shouldAutoShow()) showInstallModal();
    return;
  }
  if (Notification.permission === "denied") {
    setNotifUI(
      "blocked",
      "Notifications are blocked. Enable them in your browser/site settings.",
    );
    return;
  }
  if (Notification.permission === "granted" && localStorage.getItem(NOTIF_KEY) === "1") {
    setNotifUI("on", "You'll be notified when the status changes.");
    refreshToken(messagingInstance).catch(() => {});
    return;
  }
  setNotifUI("idle", "");

  enableBtn.addEventListener("click", async () => {
    setNotifUI("working", "Requesting permission…");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNotifUI("blocked", "Permission was not granted.");
        return;
      }
      const ok = await refreshToken(messagingInstance);
      if (ok) {
        localStorage.setItem(NOTIF_KEY, "1");
        setNotifUI("on", "You're subscribed.");
      } else {
        setNotifUI("idle", "Couldn't register for push. Try again later.");
      }
    } catch (err) {
      console.error(err);
      setNotifUI("idle", "Something went wrong. Try again.");
    }
  });
}

async function refreshToken(messagingInstance) {
  if (!messagingInstance) return false;
  const { getToken } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-messaging.js`
  );
  const { getFirestore, doc, setDoc, serverTimestamp } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`
  );
  try {
    // Do not pass serviceWorkerRegistration here. FCM auto-registers
    // firebase-messaging-sw.js at /firebase-cloud-messaging-push-scope, which
    // is the worker that has the FCM SDK loaded and can handle push events.
    // Passing our app-shell sw.js (which lacks the FCM SDK) silently drops
    // every notification.
    const token = await getToken(messagingInstance, { vapidKey });
    if (!token) return false;
    const db = getFirestore();
    await setDoc(
      doc(db, "tokens", token),
      {
        token,
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        topic: "status",
      },
      { merge: true },
    );
    return true;
  } catch (err) {
    console.warn("FCM token error", err);
    return false;
  }
}

// ---------- Boot -------------------------------------------------------------

async function boot() {
  const swReg = await registerServiceWorker();

  if (!isConfigured()) {
    // Already showing default open state from the initial render() call above.
    setNotifUI("unsupported", "Notifications unavailable in demo mode.");
    return;
  }

  const { initializeApp } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app.js`
  );
  const { getFirestore, doc, onSnapshot } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`
  );
  const { getMessaging, onMessage, isSupported } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-messaging.js`
  );

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  onSnapshot(
    doc(db, "status", "current"),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        render(data);
        cacheStatus(data);
      } else {
        render(null);
      }
    },
    (err) => {
      // Keep showing whatever's already on screen (cached or last live data)
      // rather than flashing an error state that overwrites a perfectly good
      // status the user can already see.
      console.error("Firestore error", err);
    },
  );

  let messaging = null;
  if (await isSupported().catch(() => false)) {
    messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      // App is in foreground — show a lightweight inline indicator.
      const n = payload.notification;
      if (n) {
        notifStatus.textContent = `New: ${n.title}`;
        setTimeout(() => (notifStatus.textContent = ""), 6000);
      }
    });
  }

  await setupNotifyButton(messaging);
}

boot();
