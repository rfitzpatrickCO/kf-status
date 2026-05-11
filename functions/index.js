// Cloud Function: when status/current changes, send a push notification
// to every device token stored under tokens/{token}.
//
// Deploy with:
//   cd functions && npm install && cd ..
//   firebase deploy --only functions

const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

exports.notifyOnStatusChange = onDocumentWritten(
  "status/current",
  async (event) => {
    const after = event.data?.after?.data();
    const before = event.data?.before?.data();
    if (!after) {
      logger.info("No after-data; skipping");
      return;
    }

    if (
      before &&
      before.status === after.status &&
      before.headline === after.headline &&
      before.detail === after.detail
    ) {
      logger.info("Content unchanged (likely lastNotifiedAt self-write); skipping");
      return;
    }

    logger.info("Status changed", {
      status: after.status,
      headline: after.headline,
    });

    const db = getFirestore();
    const tokensSnap = await db.collection("tokens").get();
    logger.info(`Found ${tokensSnap.size} subscriber tokens`);
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((d) => d.id);
    const title = after.headline || "Kelly Farm Pool status update";
    const body = after.detail || "";

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
      // prevents FCM from auto-displaying a notification. Our service
      // worker's onBackgroundMessage handler reads title/body from `data`
      // and calls showNotification once, so we get exactly one alert
      // instead of two (one auto + one ours).
      const res = await messaging.sendEachForMulticast({
        tokens: chunk,
        data: {
          status: String(after.status || ""),
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

    await db.collection("status").doc("current").set(
      { lastNotifiedAt: FieldValue.serverTimestamp() },
      { merge: true },
    );
  },
);
