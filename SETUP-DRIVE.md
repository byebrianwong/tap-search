# Enabling Google Drive sync

Tap Search ships with Drive sync code but **disabled by default**. When the flag is off, the saved-words page only shows local Export/Import. Flip the flag and follow the steps below to also offer "Backup to Drive" / "Restore from Drive".

## Why it's gated

Drive sync requires:

1. A **stable extension ID** — only guaranteed once the extension is published to the Chrome Web Store.
2. A **Google Cloud OAuth client** registered to that exact ID.
3. Manifest changes (`identity` permission + `oauth2` block) that need Web Store re-review.

So the sequence is: ship 1.0.0 first → publish → set up OAuth → ship 1.1.0 with Drive enabled.

---

## Step 1 — Publish 1.0.0 (no Drive)

Follow [`store-listing.md`](store-listing.md). Once approved, copy the **assigned Extension ID** from the developer dashboard (`chrome://extensions` will also show it after install). It looks like `abcdefghijklmnopabcdefghijklmnop` (32 lowercase letters).

## Step 2 — Set up OAuth in Google Cloud Console

1. Go to [console.cloud.google.com](https://console.cloud.google.com/) and create a new project (e.g. "Tap Search").
2. **APIs & Services → Library**: search for **Google Drive API** and click **Enable**.
3. **APIs & Services → OAuth consent screen**:
   - User Type: **External**
   - App name: `Tap Search`, support email + dev contact email: yours
   - Scopes: add `https://www.googleapis.com/auth/drive.appdata` (note: **appdata only**, not full Drive — this gives access to a private app folder, not the user's whole Drive)
   - Publishing status: **Testing** is fine while unlisted; add your own Google account as a test user. Move to **In production** later if you list publicly.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Chrome extension**
   - Name: `Tap Search`
   - Application ID: paste the extension ID from Step 1
5. Copy the resulting **Client ID** (looks like `123456789-abcdef.apps.googleusercontent.com`).

## Step 3 — Update `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "Tap Search",
  "version": "1.1.0",
  "permissions": ["storage", "contextMenus", "identity"],
  "oauth2": {
    "client_id": "PASTE_YOUR_CLIENT_ID_HERE.apps.googleusercontent.com",
    "scopes": ["https://www.googleapis.com/auth/drive.appdata"]
  },
  ...
}
```

Add `"identity"` to permissions, add the `"oauth2"` block, bump `"version"` to `1.1.0` (or whatever's next).

## Step 4 — Flip the flag

In `background/service-worker.js`:

```js
const DRIVE_SYNC_ENABLED = true;
```

(One-line change near the "Google Drive sync" section.)

## Step 5 — Test in dev mode

1. `chrome://extensions` → Reload Tap Search.
2. Open the Saved Words page. The toolbar should now show **Backup to Drive** and **Restore from Drive** next to Export/Import.
3. Click **Backup to Drive** → Google sign-in popup → grant access → status reads "Saved N words to Drive".
4. The file lives in your Drive's hidden `appDataFolder`. It does NOT appear in the user's normal Drive view, only the extension can see it. (You can verify via the [API explorer](https://developers.google.com/drive/api/reference/rest/v3/files/list) with `spaces=appDataFolder`.)
5. On a different machine: install the same extension, sign in to the same Google account, click **Restore from Drive** → words appear.

## Step 6 — Re-publish

1. Re-zip the extension (excluding `.git`, `*.md`, `.DS_Store`).
2. Chrome Web Store dev console → upload the new zip.
3. Update the listing — the **identity** permission warrants a one-line privacy-practice note: "Used to authenticate with Google Drive for optional backup/restore of your saved-words list. Data is stored only in the extension's private app folder and is never accessed by the developer."
4. Update the privacy policy ([`PRIVACY.md`](PRIVACY.md)) to mention Drive.
5. Submit for review.

## Updated `PRIVACY.md` snippet

Add this to the "What we do not do" section's preceding text:

> **Optional Google Drive backup.** If you click "Backup to Drive", Tap Search uses Chrome's identity API to obtain a short-lived OAuth token scoped to `drive.appdata`. The token is used to upload a single JSON file (your saved-words list) to a private application folder in your own Google Drive that only Tap Search can read. The token is not transmitted to the developer; the developer cannot read your Drive files. You can revoke access at any time at [myaccount.google.com/permissions](https://myaccount.google.com/permissions).

## Troubleshooting

- **"Drive sign-in cancelled"** — user closed the OAuth popup. No action needed.
- **`OAuth2 not granted or revoked`** — the user revoked the token. Trying again triggers a fresh interactive sign-in.
- **`bad client id: …`** — the OAuth client ID in the manifest doesn't match the extension ID. Double-check Step 2.
- **`Drive list failed: 403`** — Drive API isn't enabled for the project, or the user account isn't a listed test user (while consent screen is in Testing).
- **Token caching** — Chrome caches tokens. To force re-auth during dev: open the OAuth popup → grant → if you change scopes, `chrome.identity.removeCachedAuthToken({ token })` or sign out of the Google account in Chrome.

## File format on Drive

The file uploaded to `appDataFolder` is the same JSON shape as the local Export — interchangeable. So a user can export to a file, edit it, and upload manually via the [Drive API explorer](https://developers.google.com/drive/api/reference/rest/v3/files) if they want to. They can also download the file with **Restore from Drive** and then re-export it locally to migrate elsewhere.
