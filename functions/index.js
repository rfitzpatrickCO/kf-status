// Cloud Function: when status/current changes, send a push notification
// to every device token stored under tokens/{token}.
//
// Deploy with:
//   cd functions && npm install && cd ..
//   firebase deploy --only functions

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.notifyOnStatusChange = onDocumentWritten(
  "status/current",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after) return;

    // Skip if nothing meaningful changed (e.g. metadata-only writes).
    if (
      before &&
      before.status === after.status &&
      before.headline === after.headline &&
      before.detail === after.detail
    ) {
      return;
    }

    const db = getFirestore();
    const tokensSnap = await db.collection("tokens").get();
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((d) => d.id);
    const title = after.headline || "Pool status updated";
    const body = after.detail || "";

    // sendEachForMulticast handles >500 in chunks for us in newer SDKs; we still
    // chunk explicitly to stay defensive.
    const messaging = getMessaging();
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500));
    }

    const stale = [];
    for (const chunk of chunks) {
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        notification: { title, body },
        data: {
          status: String(after.status || ""),
          url: "/index.html",
        },
        webpush: {
          notification: {
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            tag: "pool-status",
            renotify: true,
          },
          fcmOptions: { link: "/index.html" },
        },
      });
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = r.error?.code || "";
          if (
            code.includes("registration-token-not-registered") ||
            code.includes("invalid-argument") ||
            code.includes("invalid-registration-token")
          ) {
            stale.push(chunk[idx]);
          }
        }
      });
    }

    // Clean out tokens FCM has rejected so the list stays small.
    await Promise.all(
      stale.map((t) => db.collection("tokens").doc(t).delete().catch(() => {})),
    );

    await db.collection("status").doc("current").set(
      { lastNotifiedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  },
);
