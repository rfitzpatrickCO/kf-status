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

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyD_spm6KjI7zV3Z0NjZVdNNp7AsroqGmSk",
  authDomain: "kelly-farm-pool-status-6bd85.firebaseapp.com",
  projectId: "kelly-farm-pool-status-6bd85",
  storageBucket: "kelly-farm-pool-status-6bd85.firebasestorage.app",
  messagingSenderId: "412302688419",
  appId: "1:412302688419:web:36a94ee13680a19012ff16",
  measurementId: "G-BLF3XZXY4D"
};

export const vapidKey = "BN7CcBWi-mwgxLj8e5mGBVdnF5lJQiJeW5j2NjuYIX24jy6fc-CC24eFTLMD0SIijFa8GH4uKmubEgxRecHPcwA";

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
