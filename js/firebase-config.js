// ============================================================================
// Firebase configuration
// ----------------------------------------------------------------------------
// Replace the placeholder values below with your own Firebase project's
// settings. You can find them in the Firebase Console under
// Project Settings → General → Your apps → Web app config.
//
// The VAPID key is required for FCM web push. Generate one in the Firebase
// Console under Project Settings → Cloud Messaging → Web configuration.
// ============================================================================

export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

export const vapidKey = "YOUR_VAPID_PUBLIC_KEY";

// Returns true once real values have been pasted in. The app uses this to
// degrade gracefully (showing a "demo mode" notice) when running against the
// placeholder config.
export function isConfigured() {
  return (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith("YOUR_") &&
    firebaseConfig.projectId &&
    !firebaseConfig.projectId.startsWith("YOUR_")
  );
}
