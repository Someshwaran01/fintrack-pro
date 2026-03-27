# 📧 Gmail Sync: Detailed Android Setup Guide

If you're seeing **"Authentication failed or was cancelled"** when clicking Gmail Sync on your Android app, follow these 3 steps exactly.

---

### Step 1: Add your Android App to Firebase
Firebase needs to know your specific Android app is allowed to request data.

1.  **Go to Firebase Console:** [Project Settings](https://console.firebase.google.com/project/_/settings/general/)
2.  **Scroll down to "Your apps":** 
3.  **Click "Add app"** and select the **Android** icon.
4.  **Android package name:** Type `com.fintrack.pro` (this must match your `capacitor.config.ts`).
5.  **App nickname:** `FinTrack Android`
6.  **SHA-1 certificate fingerprint (CRITICAL):**
    -   You must add your **SHA-1** here. To get it, run this command in your project terminal:
        ```powershell
        ./android/gradlew signingReport
        ```
    -   Look for the `SHA1` value under `variant: debug`.
7.  **Click "Register app"** and then **"Download google-services.json"**. 
8.  **Move the file:** Put `google-services.json` into `android/app/`.

---

### Step 2: Whitelist Your Auth Domain
Google won't let your app talk to it unless the domain is "authorized."

1.  **Go to Firebase Authentication:** [Settings Tab](https://console.firebase.google.com/project/_/authentication/settings)
2.  **Authorized Domains:** Ensure your `your-project-id.firebaseapp.com` is in the list.
3.  **Google Cloud Console:** [Authorized Domains](https://console.cloud.google.com/apis/credentials/consent)
    -   Make sure `firebaseapp.com` is listed under **Authorized Domains**.

---

### Step 3: Add test users (if in "Testing" mode)
Google blocks login for "unverified" apps unless the email is a registered test user.

1.  **Go to Google Auth Platform:** [Audience Section](https://console.cloud.google.com/auth/audience)
2.  **Test Users:** 
    -   Click **Add Users**.
    -   Enter the Gmail address you use on your phone.
    -   Click **Add**.

---

### 💡 Pro Tip: Why does "Authentication failed" happen?
Most andoid devices block the **Popup** method we use on the web. If the steps above don't work, we'll need to install a **Native Google Auth plugin** which is much more reliable for mobile apps.

**When you've finished these steps, rebuild the app and try Gmail Sync again!**
