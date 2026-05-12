// Cloud Function: when a new announcement is created in Firestore, send a
// push notification to every device token stored under tokens/{token}.
//
// Both status changes and general announcements write to the announcements/
// collection, so a single trigger covers all cases. The status/current doc
// is updated separately by the client for the live status card on the
// customer page — it does not trigger pushes itself.
//
// Deploy with:
//   cd functions && npm install && cd ..
//   firebase deploy --only functions

const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.notifyOnAnnouncement = onDocumentCreated(
  "announcements/{id}",
  async (event) => {
    const data = event.data?.data();
    if (!data) {
      logger.info("No data; skipping");
      return;
    }

    logger.info("Announcement created", {
      title: data.title,
      type: data.type,
      status: data.status,
    });

    const db = getFirestore();
    const tokensSnap = await db.collection("tokens").get();
    logger.info(`Found ${tokensSnap.size} subscriber tokens`);
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((d) => d.id);
    const title = data.title || "Kelly Farm Pool update";
    const body = data.body || "";

    const messaging = getMessaging();
    const chunks = [];
    for (let i = 0; i < tokens.length; i += 500) {
      chunks.push(tokens.slice(i, i + 500));
    }

    let totalSuccess = 0;
    let totalFailure = 0;
    const errorCounts = {};
    const stale = [];

    for (const chunk of chunks) {
      // Data-only payload: omitting the top-level `notification` field
      // prevents FCM from auto-displaying a notification. The client SW's
      // onBackgroundMessage handler reads title/body from `data` and calls
      // showNotification once.
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        data: {
          type: String(data.type || "announcement"),
          status: String(data.status || ""),
          title,
          body,
        },
      });
      totalSuccess += res.successCount;
      totalFailure += res.failureCount;
      res.responses.forEach((r, idx) => {
        if (!r.success) {
          const code = (r.error && r.error.code) || "unknown";
          errorCounts[code] = (errorCounts[code] || 0) + 1;
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

    logger.info("FCM send complete", {
      success: totalSuccess,
      failure: totalFailure,
      errorCounts,
      staleCount: stale.length,
    });

    if (stale.length) {
      await Promise.all(
        stale.map((t) => db.collection("tokens").doc(t).delete().catch(() => {})),
      );
      logger.info(`Cleaned up ${stale.length} stale tokens`);
    }
  },
);
