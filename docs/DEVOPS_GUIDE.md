# 🏦 FinTrack Pro: Play Store DevOps Guide

This guide outlines how to use the automated infrastructure to launch and update your app on the Google Play Store.

## 1. 🔑 Generate Production Keystore ✅
I have successfully generated your keystore: `release-key.keystore`

**Details for GitHub Secrets:**
- **File Name:** `release-key.keystore` (located in your project root)
- **Alias:** `fintrack-alias`
- **Password:** `fintrack2026`

**Specific Keytool Path (if needed again):**
`C:\Users\DeviGanesan\.antigravity\extensions\redhat.java-1.12.0-win32-x64\jre\17.0.4.1-win32-x86_64\bin\keytool.exe`

## 2. 🛡️ Configure GitHub Secrets
To make the automated build work, go to **GitHub > Settings > Secrets and variables > Actions** and add:

| Secret Name | Description |
|---|---|
| `ANDROID_SIGNING_KEY` | Base64 encoded content of your `.keystore` file |
| `ANDROID_ALIAS` | The alias you used (e.g., `fintrack-alias`) |
| `ANDROID_KEYSTORE_PASSWORD` | The keystore password |
| `ANDROID_KEY_PASSWORD` | The key password (usually same as keystore) |
| `GEMINI_API_KEY` | Your Google Gemini API key |

> **To get the Base64 string:**
> `[Convert]::ToBase64String([IO.File]::ReadAllBytes("release-key.keystore"))`

## 3. 🚀 How to Release a New Version
1. Go to **GitHub Actions** tab.
2. Select **Play Store Release Build**.
3. Click **Run workflow**.
4. Choose version bump (`patch`, `minor`, `major`).
5. Once finished, a new **Signed AAB** will be available in the GitHub Releases section!

## 4. 📲 Upload to Play Console
1. Go to your [Google Play Console](https://play.google.com/console).
2. Create/Select your App.
3. **Fill Store Listing:** Use the content I generated in `STORE_LISTING.md`.
4. **Privacy Policy:** Upload `PRIVACY_POLICY.md` to a public URL (like GitHub Pages) and link it in the console.
5. Go to **Production** > **Create new release**.
6. Upload the `.aab` file downloaded from GitHub.
7. Submit for review!

---
*Maintained by Antigravity DevOps*
