import { firebaseConfig, isConfigured } from "./firebase-config.js";

const FB_VERSION = "10.13.2";

const authCard = document.getElementById("auth-card");
const staffPanel = document.getElementById("staff-panel");
const authForm = document.getElementById("auth-form");
const authError = document.getElementById("auth-error");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const signOutBtn = document.getElementById("sign-out");
const publishStatus = document.getElementById("publish-status");
const currentHeadline = document.getElementById("current-headline");
const currentDetail = document.getElementById("current-detail");
const customForm = document.getElementById("custom-form");
const customStatus = document.getElementById("custom-status");
const customHeadline = document.getElementById("custom-headline");
const customDetail = document.getElementById("custom-detail");
const announceForm = document.getElementById("announce-form");
const announceTitle = document.getElementById("announce-title");
const announceBody = document.getElementById("announce-body");
const buttons = document.querySelectorAll(".status-btn");

if (!isConfigured()) {
  authCard.innerHTML = `
    <h2>Setup needed</h2>
    <p class="muted">Add your Firebase project config in
      <code>js/firebase-config.js</code> before signing in.</p>
    <p class="muted small">See README.md for setup steps.</p>
  `;
} else {
  boot();
}

async function boot() {
  const { initializeApp } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-app.js`
  );
  const {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
  } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-auth.js`
  );
  const {
    getFirestore,
    doc,
    onSnapshot,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
  } = await import(
    `https://www.gstatic.com/firebasejs/${FB_VERSION}/firebase-firestore.js`
  );

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      authCard.classList.add("hidden");
      staffPanel.classList.remove("hidden");
      subscribeCurrent();
    } else {
      staffPanel.classList.add("hidden");
      authCard.classList.remove("hidden");
    }
  });

  authForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    authError.textContent = "";
    try {
      await signInWithEmailAndPassword(
        auth,
        emailInput.value.trim(),
        passwordInput.value,
      );
      passwordInput.value = "";
    } catch (err) {
      authError.textContent = friendlyAuthError(err);
    }
  });

  signOutBtn.addEventListener("click", () => signOut(auth));

  let unsubscribe = null;
  function subscribeCurrent() {
    if (unsubscribe) unsubscribe();
    unsubscribe = onSnapshot(doc(db, "status", "current"), (snap) => {
      if (!snap.exists()) {
        currentHeadline.textContent = "No status published yet";
        currentDetail.textContent = "Tap a button below to publish one.";
        return;
      }
      const data = snap.data();
      currentHeadline.textContent = data.headline || "—";
      currentDetail.textContent = data.detail || "";
    });
  }

  // Quick-status buttons: publish a status change.
  buttons.forEach((btn) => {
    btn.addEventListener("click", () =>
      publishStatusChange(db, auth, {
        status: btn.dataset.status,
        headline: btn.dataset.headline,
        detail: btn.dataset.detail || "",
      }),
    );
  });

  // Custom message form: same as quick buttons but with user-entered text.
  customForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await publishStatusChange(db, auth, {
      status: customStatus.value,
      headline: customHeadline.value.trim(),
      detail: customDetail.value.trim(),
    });
    customHeadline.value = "";
    customDetail.value = "";
  });

  // General announcement form: doesn't change the live status, only adds to
  // the announcements feed (and triggers a push).
  announceForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await publishAnnouncement(db, auth, {
      title: announceTitle.value.trim(),
      body: announceBody.value.trim(),
    });
    announceTitle.value = "";
    announceBody.value = "";
  });

  // Writes to status/current (live status card) AND announcements/ (feed +
  // push trigger). One user action → one push, since only the announcement
  // create triggers the Cloud Function.
  async function publishStatusChange(db, auth, payload) {
    if (!payload.headline) return;
    publishStatus.textContent = "Publishing…";
    try {
      const user = auth.currentUser;
      const publishedBy = user ? user.email || user.uid : "unknown";

      await setDoc(doc(db, "status", "current"), {
        ...payload,
        updatedAt: serverTimestamp(),
        updatedBy: publishedBy,
      });

      await addDoc(collection(db, "announcements"), {
        title: payload.headline,
        body: payload.detail || "",
        type: "status",
        status: payload.status,
        createdAt: serverTimestamp(),
        publishedBy,
      });

      publishStatus.textContent = "Published. Patrons will be notified shortly.";
      setTimeout(() => (publishStatus.textContent = ""), 4000);
    } catch (err) {
      console.error(err);
      publishStatus.textContent = `Couldn't publish: ${err.message}`;
    }
  }

  // Writes only to announcements/ — does NOT change the live status card.
  async function publishAnnouncement(db, auth, { title, body }) {
    if (!title) return;
    publishStatus.textContent = "Publishing…";
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, "announcements"), {
        title,
        body: body || "",
        type: "announcement",
        createdAt: serverTimestamp(),
        publishedBy: user ? user.email || user.uid : "unknown",
      });
      publishStatus.textContent = "Announcement published.";
      setTimeout(() => (publishStatus.textContent = ""), 4000);
    } catch (err) {
      console.error(err);
      publishStatus.textContent = `Couldn't publish: ${err.message}`;
    }
  }
}

function friendlyAuthError(err) {
  const code = err && err.code;
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email or password is incorrect.";
  }
  if (code === "auth/too-many-requests") {
    return "Too many attempts. Try again in a few minutes.";
  }
  if (code === "auth/network-request-failed") {
    return "Network error. Check your connection.";
  }
  return "Sign-in failed. Please try again.";
}
