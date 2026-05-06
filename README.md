# Pool Status

A simple PWA for posting pool closures (lightning, maintenance, staffing,
etc.) and pushing the alert to subscribed patrons.

- **Customer page** (`index.html`) — shows the current status, lets visitors
  opt in to push notifications, and walks them through adding the app to their
  home screen.
- **Staff page** (`admin.html`) — sign in with email/password, then publish a
  status with one tap or a custom message. Each publish triggers a push.

## Stack

- Static HTML/CSS/JS (no build step) — Firebase JS SDK loaded from the
  Google CDN as ES modules.
- Firebase **Auth** (staff sign-in), **Firestore** (status doc + device
  tokens), **Cloud Messaging** (push), **Hosting**, and a single
  **Cloud Function** that fans the push out when the status changes.

> Firebase's free Spark plan covers Auth, Firestore, FCM, and Hosting at the
> volumes a pool will see. Cloud Functions require the **Blaze (pay-as-you-go)
> plan**, but the free monthly quota (2M invocations, 400k GB-seconds) is far
> beyond what a few status changes per day will use — expect a $0 bill.

## One-time setup

### 1. Create a Firebase project

1. Go to <https://console.firebase.google.com> and create a new project.
2. In **Project Settings → General → Your apps**, click the `</>` (web) icon
   and register an app. Copy the `firebaseConfig` object.
3. Paste those values into both files:
   - `js/firebase-config.js`
   - `firebase-messaging-sw.js` (the values inside `firebase.initializeApp`)

### 2. Generate a VAPID web push key

1. **Project Settings → Cloud Messaging → Web configuration → Generate key
   pair**.
2. Copy the public key into `js/firebase-config.js` as `vapidKey`.

### 3. Enable services

In the Firebase console:

- **Authentication → Sign-in method**: enable **Email/Password**.
- **Authentication → Users**: add an account for each staff member who should
  be able to publish.
- **Firestore Database**: create a database in production mode (the rules in
  `firestore.rules` lock it down).
- **Upgrade to the Blaze plan** (required to deploy Cloud Functions). Set a
  budget alert (e.g. $1) for peace of mind.

### 4. Install the Firebase CLI and deploy

```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project, alias it as "default"
cd functions && npm install && cd ..

firebase deploy --only firestore:rules
firebase deploy --only functions
firebase deploy --only hosting
```

After the first deploy, your site is live at `https://<project>.web.app`.

### 5. Test it

1. Visit the hosted URL on your phone.
2. Tap **Staff** → sign in → publish a status.
3. From a second device (or the same one in another browser), tap **Turn on**
   to subscribe to push, then publish a different status from staff. The push
   should arrive within a few seconds.

## Development

You can serve the static files with anything that talks HTTP — service workers
require a real origin (or `localhost`), not `file://`:

```bash
# from the repo root
python3 -m http.server 5173
# open http://localhost:5173
```

Until you fill in `js/firebase-config.js`, the customer page runs in **demo
mode** and shows a placeholder card so you can see the layout.

## Customizing

- **Brand colors** — edit the CSS variables at the top of `css/styles.css`.
  Defaults: primary `#124057`, accent `#42a5f5`, accent-light `#e6f9ff`,
  neutral `#eaeeef`.
- **Quick-status buttons** — edit the `<button class="status-btn" …>` rows in
  `admin.html`. Each button has `data-status` (`open` / `closed` / `delayed` /
  `info`), `data-headline`, and `data-detail`.
- **Pool name / app name** — change the `<title>`, the `<h1>` text, and the
  `name` / `short_name` in `manifest.webmanifest`.
- **Icons** — replace the PNGs in `icons/`. Keep the same sizes (192, 512,
  maskable 512, apple-touch 180, favicon 32).

## How push works on iPhone

iOS only delivers web push to PWAs that have been **added to the Home Screen**
(iOS 16.4 or newer, on iPhone). The customer page detects this and:

- On iPhone Safari (in the browser), it shows step-by-step **Add to Home
  Screen** instructions and disables the **Turn on** button until the user
  opens the installed app.
- Inside the installed app, **Turn on** prompts for notification permission,
  registers with FCM, and stores the token in Firestore. The Cloud Function
  picks up the next status change and sends a push.

Android Chrome supports push without installing, but the install prompt is
still offered for one-tap home-screen access.

## File map

```
index.html                  customer-facing page
admin.html                  staff publishing UI
manifest.webmanifest        PWA manifest
sw.js                       app-shell service worker (offline cache)
firebase-messaging-sw.js    FCM background message handler (must be at root)
css/styles.css              all styling, brand colors as CSS vars
js/firebase-config.js       Firebase config + VAPID key (your values)
js/app.js                   customer page logic (Firestore listener + FCM opt-in)
js/admin.js                 staff page logic (auth + publish)
js/install.js               iOS/Android home-screen onboarding
icons/                      PWA icons
functions/index.js          Cloud Function: fan-out push on status change
functions/package.json      function dependencies
firestore.rules             security rules
firebase.json               Firebase deploy config
```

## Troubleshooting

- **"Notifications unavailable in demo mode"** on the customer page — fill in
  the Firebase config in `js/firebase-config.js`.
- **Push permission requested but no notification arrives** — check
  `functions:log` (`firebase functions:log`). Common causes: VAPID key not
  pasted into `firebase-config.js`, Cloud Function not deployed, or the
  notification permission was granted in Safari (browser) rather than in the
  installed PWA on iPhone.
- **iPhone "Turn on" button stays disabled** — that's by design until the user
  installs the PWA to the Home Screen. Open the installed app and try again.
- **Firestore "Missing or insufficient permissions"** — deploy the rules file
  (`firebase deploy --only firestore:rules`).
