# Step-by-Step Google Configuration Guide

Follow these steps exactly to "unlock" the automated syncing features in **FinTrack**.

### 🛠️ Phase 1: Enable the Gmail API
Google turns off all its "scanners" by default. You need to manually turn on the Gmail one.

1.  **Go to the Google Cloud Library:** [Click here](https://console.cloud.google.com/apis/library/gmail.googleapis.com)
2.  **Select your Project:** Ensure the project name at the top matches your Firebase project (e.g., `fintrackpro-b2481` as seen in your screenshot).
3.  **Click "Enable":** This allows FinTrack to talk to Google's mail servers.

---

### 🛡️ Phase 2: Configure the OAuth Consent Screen (Google Auth Platform)
Since your app is not yet "verified" by Google, you need to tell Google that it's safe for **you** to use it. In the new Google Cloud interface (Google Auth Platform), these settings are split into sidebar items.

1.  **Go to the Auth Platform:** [Click here](https://console.cloud.google.com/auth/overview) or use the "Google Auth Platform" menu.
2.  **Audience Section (Left Sidebar):**
    -   Click on **Audience** in the left sidebar.
    -   **User Type:** Select **External**.
    -   **Test Users (CRITICAL):** 
        -   Click **Add Users**.
        -   Enter your email address (the same one you'll use to log in to the app).
        -   Click **Add**.
        -   *Why?* If you don't do this, Google will give you a "403 Forbidden" error.
3.  **Branding Section (Left Sidebar):**
    -   Click on **Branding** in the left sidebar.
    -   **App Information:** 
        -   **App name:** `FinTrack Pro`
        -   **User support email:** (Your email address)
        -   **Developer contact info:** (Your email address again)
    -   Click **Save**.
4.  **Data Access Section (Left Sidebar):**
    -   Click on **Data Access**.
    -   **Scopes:** You can skip this part as we already defined them in the code. Just ensure it says "No restricted scopes" or similar.

---

### 📱 Phase 3: Firebase Fingerprints
Since we are building the app on **GitHub Actions**, the app is "signed" by GitHub's cloud. You need to tell Firebase that this signature is trusted.

1.  **Go to Project Settings:** [Click here](https://console.firebase.google.com/project/_/settings/general/)
2.  **Add Fingerprint:** Scroll down to your Android app and look for the "SHA certificate fingerprints" section.
3.  **The SHA-1:** You will need to get the **SHA-1** and **SHA-256** from your `ANDROID_SIGNING_KEY`. 
    -   *Note: If you haven't set up the signing key yet, let me know and we'll do it next.*

---

### ✅ Checklist for Completion
- [x] Gmail API Enabled?
- [x] "External" User Type selected in **Audience**?
- [x] Your email added as a "Test User" in **Audience**?
- [x] App Name and Support Email set in **Branding**?
- [ ] SHA-1 added to Firebase Project Settings?

**When you've finished these steps, your build should pass and sync will work!**
