# Kelly Farm Pool Status — Staff Guide

A short guide to publishing pool status updates and pushing notifications to
patrons.

---

## What this app does

- **Customer page** (`/`) — anyone can visit it. Shows the current pool
  status (Open / Closed / Delayed) with a short message. Patrons can
  optionally turn on push notifications so they're alerted whenever the
  status changes.
- **Staff page** (`/admin.html`) — sign-in required. One tap publishes a new
  status. Every publish:
  - Updates the customer page **immediately** (no refresh needed).
  - Sends a **push notification** to every subscribed patron within a few
    seconds.

You don't need to install anything. The whole thing runs in a web browser.

---

## URLs

| Page | URL |
|---|---|
| Customer status | https://kelly-farm-pool-status-6bd85.web.app |
| Staff sign-in | https://kelly-farm-pool-status-6bd85.web.app/admin.html |

> If a custom domain is set up later (e.g. `status.kellyfarmpool.com`), both
> URLs will move there. The pages and credentials work the same way.

---

## Signing in

1. Open the **staff page** on your phone or computer.
2. You'll see a sign-in card with **Email** and **Password** fields.
3. Enter the credentials your manager set up for you.
4. Tap **Sign in**.

If your sign-in works, the dashboard appears. If it doesn't:

- **"Email or password is incorrect"** → Double-check the email spelling and
  capitalization. Passwords are case-sensitive. If you're sure, ask your
  manager to reset it (see "Adding or resetting staff accounts" below).
- **"Too many attempts"** → Wait 5 minutes and try again.
- **"Network error"** → Check that your phone or computer has internet.

---

## What you see after signing in

The staff dashboard has three parts:

### 1. Currently published
Shows the status patrons see right now. If it says "Pool is open" — that's
what's live.

### 2. Quick statuses
A grid of one-tap buttons. Tap any to publish that status instantly.

| Button | Status | Message patrons see |
|---|---|---|
| 🏊 **Open** | Open | "Pool is open — Come on in! Enjoy your visit." |
| ⛈️ **Weather** | Closed | "Closed due to weather — We'll reopen once conditions are safe." |
| 🔧 **Maintenance** | Closed | "Closed for maintenance — Pool is closed for maintenance. Thanks for your patience." |
| 🧪 **Chemicals** | Closed | "Closed — chemical balancing — We're rebalancing the water. Reopening once levels are safe." |
| 👥 **Staffing** | Closed | "Closed — staffing — No lifeguard on duty. We'll reopen as soon as we're staffed." |
| ⏰ **Delayed open** | Delayed | "Opening delayed — We'll open later than usual today. Watch this page for the new time." |

### 3. Custom message
For situations the quick buttons don't cover. You pick a status type
(Closed / Delayed / Open / Info), write a short headline, and optionally add
detail text. Tap **Publish & notify** to send it.

### 4. Sign out
Bottom of the page. Sign out when you're done — especially if you're using a
shared computer.

---

## Publishing a status — start to finish

### Quick example: storm rolls in

1. Open the staff page on your phone.
2. Sign in (if not already).
3. Tap **⛈️ Weather**.
4. Done. Customers see the change immediately. Push notifications go out
   within a few seconds.

### Quick example: you're back open after the storm

1. Tap **🏊 Open**.
2. Done.

### Custom message: pool closed for a private event

1. Scroll down to **Custom message**.
2. **Status:** Closed
3. **Headline:** `Closed for private event`
4. **Details (optional):** `Reserved for the Smith family party until 4pm. Reopens at 4:30pm.`
5. Tap **Publish & notify**.

---

## What patrons see

- The customer page updates in real time (within a second or two).
- Patrons who turned on notifications get a push within 5–15 seconds. The
  push shows the headline and detail text.
- Each emoji on the customer status card is picked automatically based on
  keywords in the headline:
  - "weather", "lightning", "thunder", "storm", "rain" → ⛈️
  - "maintenance" or "repair" → 🔧
  - "chemical", "chlorine", "balanc(ing)" → 🧪
  - "staff" or "lifeguard" → 👥
  - "event" or "private" → 🎉
  - "delayed" → ⏰
  - Otherwise: 🏊 (open), 🚫 (closed), ℹ️ (info)

So if you write a custom headline like `Closed — power outage`, it'll show
the generic 🚫 emoji. If you write `Closed for chemical service`, it'll
auto-pick 🧪. Phrasing matters slightly for the icon — but message text is
what patrons read first.

---

## Fixing a mistake

There is no "undo" button. If you publish the wrong status:

1. Just publish the correct one.
2. Customer page updates immediately to the corrected status.
3. Patrons get a second notification with the corrected info.

So if you accidentally tap **Maintenance** instead of **Weather**, just tap
**Weather** right after. Patrons will see two notifications back-to-back
("Closed for maintenance" then "Closed due to weather") — annoying but not
harmful.

To minimize this: pause for a beat before tapping the button, especially on
mobile where buttons are close together.

---

## Putting the staff page on your phone's home screen

For one-tap access without signing in every time, install the app:

### iPhone (Safari)
1. Open the staff page in **Safari** (not Chrome — Safari is required for
   the install to work).
2. Tap the **Share** icon (square with up arrow) at the bottom of the screen.
3. Scroll down and tap **Add to Home Screen**.
4. Tap **Add** in the top right.
5. The Kelly Farm Pool icon now appears on your home screen.
6. Open the installed app, sign in once, and your sign-in is remembered.

### Android (Chrome)
1. Open the staff page in **Chrome**.
2. Tap the **⋮** menu in the top right.
3. Tap **Install app** (or **Add to Home screen**).
4. Confirm.
5. Open the installed app, sign in once.

### Once installed
- Tap the icon → you're on the staff page.
- After your first sign-in, the app remembers you. You'll only need to sign
  in again if you sign out manually or if a long time passes.
- Both the customer view and admin link still work the same way inside the
  installed app.

---

## Adding or resetting staff accounts (manager only)

New staff need accounts created in the Firebase Console. Patrons can't sign
up — only people you add can sign in.

### Add a new staff member
1. Open https://console.firebase.google.com
2. Sign in with the project owner's Google account (`kellyfarmpool@gmail.com`).
3. Pick the **kelly-farm-pool-status-6bd85** project.
4. Left sidebar → **Build → Authentication → Users** tab.
5. Click **Add user**.
6. Enter the staff member's email (their personal email is fine, or a shared
   pool one) and a temporary password.
7. Click **Add user**.
8. Send the staff member their email + temporary password. They sign in once
   and can keep using it, or change it (see "reset password" below).

### Reset a staff password
1. Same path: Authentication → Users.
2. Find the user, click the **⋮** menu on their row.
3. Click **Reset password**.
4. They get an email with a reset link.

### Remove a staff member
1. Same path. Click ⋮ → **Delete account**.
2. They can no longer sign in. Any past status updates they published stay
   in place.

---

## Troubleshooting

### "I tapped a status but customers don't see it"
- Refresh the customer page in another browser tab. If it updated → all good,
  the customer was looking at a stale tab. The page auto-updates only while
  it's open.
- If it didn't update either → check the staff page's "Currently published"
  section. If that doesn't match what you tapped, the publish failed. Try
  again.

### "Patrons say they didn't get a notification"
Most common reasons (in order of frequency):
1. **They never turned on notifications.** Push only goes to patrons who
   tapped "Turn on" on the customer page. Ask them to visit the page and
   subscribe.
2. **iPhone patrons didn't install the app.** iPhones only deliver push
   notifications to apps installed on the home screen. The customer page
   shows them how (popup with steps).
3. **They have notifications turned off in their phone's settings** (System
   Settings → Notifications → Kelly Farm Pool → Allow Notifications).
4. **Their phone is on Do Not Disturb / Focus mode.** Notifications still
   arrive but are silent.

### "I can't sign in"
- Wrong email? Try copy-pasting from the email your manager sent.
- Wrong password? Ask your manager to reset (see above).
- Browser issues? Try a different browser or "private/incognito" window.

### "I see 'Demo mode' on the customer page"
That means the app is running with placeholder configuration — only happens
in local development, not on the real site. If you see this on the live URL,
something is broken; contact whoever set the app up.

### "I see a status I didn't publish"
Check the **Currently published** section to see what's live. If something
was published incorrectly, just publish the correct one and it overwrites.

---

## Day-to-day best practices

- **Open the app first thing** when you arrive. Confirm the current status
  is correct before patrons start showing up.
- **Update promptly** when conditions change. Patrons rely on push to know
  whether to come.
- **Use the quick buttons** when they fit — they're faster and the messages
  are already polished.
- **Keep custom messages short.** Headlines should be under ~50 characters,
  details under ~150. Long messages get cut off in some notifications.
- **Don't announce reopening time precisely** unless you're sure. "Reopens
  at 3pm" is bad if you reopen at 3:15. "Will reopen once conditions clear"
  is safer.
- **Sign out on shared devices.** Anyone signed in can publish.

---

## Need help?

If something is broken or unclear:

- For sign-in or account issues, contact: **[manager name and contact]**
- For app bugs or technical issues, contact: **[developer name and contact]**

This guide lives in the project repo at `STAFF_GUIDE.md`. Keep it updated as
the app changes.
