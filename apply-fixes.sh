#!/bin/bash
# ============================================================
#  FinTrack Pro — Push all fixes to GitHub
#  No local npm install — GitHub CI handles everything
#  Run from INSIDE your fintrack-pro/ folder:
#    cd /e/New\ folder/fintrack-pro
#    bash apply-fixes.sh
# ============================================================
set -e

echo "========================================"
echo "  FinTrack Pro — Applying Code Fixes    "
echo "========================================"

if [ ! -f "package.json" ] || ! grep -q "fintrack-pro" package.json; then
  echo "ERROR: Run this from inside your fintrack-pro/ folder!"
  exit 1
fi
echo "OK: Project root confirmed"

CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: ${CURRENT_BRANCH}"
if [ "$CURRENT_BRANCH" != "Playstore" ]; then
  git checkout Playstore
fi

# 1. Fix package.json version
echo ""
echo "[1/5] Fixing package.json plugin version..."
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.dependencies['@codetrix-studio/capacitor-google-auth'] = '3.4.0-rc.4';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('Fixed: @codetrix-studio/capacitor-google-auth -> 3.4.0-rc.4');
"
echo "OK: package.json fixed"

# 2. Update .gitignore
echo ""
echo "[2/5] Updating .gitignore..."
if ! grep -q "google-services.json" .gitignore; then
  printf '\n# Firebase / Google Services - NEVER commit (use GitHub Secrets)\ngoogle-services.json\nandroid/app/google-services.json\nGoogleService-Info.plist\n' >> .gitignore
  echo "OK: .gitignore updated"
else
  echo "OK: Already has google-services.json entry"
fi

# 3. Update capacitor.config.ts
echo ""
echo "[3/5] Updating capacitor.config.ts..."
cat > capacitor.config.ts << 'EOF'
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fintrack.pro',
  appName: 'Fin - Tracker',
  webDir: 'dist',
  server: { androidScheme: 'https' },
  android: {
    allowMixedContent: true,
    buildOptions: { keystorePath: undefined, keystoreAlias: undefined }
  },
  plugins: {
    StatusBar: { overlaysWebView: false, style: 'DARK', backgroundColor: '#ffffff' },
    GoogleAuth: {
      scopes: ['profile', 'email', 'https://www.googleapis.com/auth/gmail.readonly'],
      serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
      forceCodeForRefreshToken: true
    }
  }
};
export default config;
EOF
echo "OK: capacitor.config.ts updated"

# 4. Create service files
echo ""
echo "[4/5] Creating service files..."
mkdir -p src/services

cat > src/services/gmailAuthService.ts << 'EOF'
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { getAuth, signInWithCredential, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuth();
  if (Capacitor.isNativePlatform()) {
    await GoogleAuth.initialize();
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;
    if (!idToken) throw new Error('No ID token received from Google');
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    return result.user;
  } else {
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    const result = await signInWithPopup(auth, provider);
    return result.user;
  }
}

export async function signOutGoogle(): Promise<void> {
  if (Capacitor.isNativePlatform()) await GoogleAuth.signOut();
  await signOut(getAuth());
}

export function getCurrentUser(): User | null { return getAuth().currentUser; }
EOF

cat > src/services/smsPermissionService.ts << 'EOF'
import { Capacitor } from '@capacitor/core';

export async function requestSmsPermissions(): Promise<{ allGranted: boolean }> {
  if (!Capacitor.isNativePlatform()) return { allGranted: false };
  try {
    const { SmsReader } = await import('@solimanware/capacitor-sms-reader');
    const result = await (SmsReader as any).requestPermission();
    const granted = result?.granted === true || result?.status === 'granted' || result === true;
    return { allGranted: granted };
  } catch (e: any) {
    console.error('SMS permission failed:', e.message);
    return { allGranted: false };
  }
}

export async function readFinancialSms(): Promise<any[]> {
  const { allGranted } = await requestSmsPermissions();
  if (!allGranted) throw new Error('SMS permissions not granted.');
  const { SmsReader } = await import('@solimanware/capacitor-sms-reader');
  const result = await (SmsReader as any).getSMS({ filter: { box: 'inbox', indexFrom: 0, maxCount: 200 } });
  const messages = result?.sms ?? result?.messages ?? [];
  const keywords = ['debited','credited','payment','INR','Rs.','UPI','NEFT','IMPS','ATM','EMI','bank'];
  return messages.filter((msg: any) =>
    keywords.some(kw => (msg.body || msg.message || '').toLowerCase().includes(kw.toLowerCase()))
  );
}
EOF
echo "OK: Service files created"

# 5. Replace ALL workflow files with single combined workflow
echo ""
echo "[5/5] Replacing workflow files with combined workflow..."
mkdir -p .github/workflows
rm -f .github/workflows/deploy.yml
rm -f .github/workflows/playstore_release.yml
rm -f .github/workflows/build-android.yml

cat > .github/workflows/fintrack-build-deploy.yml << 'WORKFLOW_EOF'
name: FinTrack Pro — Build & Deploy

on:
  push:
    branches: [Playstore, main, master]
  workflow_dispatch:
    inputs:
      job:
        description: 'Which job to run?'
        required: true
        default: 'playstore'
        type: choice
        options:
          - playstore
          - pages
          - both
      version:
        description: 'Version bump (Play Store only)'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major

permissions:
  contents: write
  pages: write
  id-token: write

concurrency:
  group: "fintrack-build-${{ github.ref }}"
  cancel-in-progress: false

env:
  NODE_VERSION: "20"

jobs:

  # ═══════════════════════════════════════════════
  #  JOB 1 — PLAY STORE RELEASE (AAB)
  #  push to Playstore branch OR manual dispatch
  # ═══════════════════════════════════════════════
  playstore_release:
    name: "🤖 Play Store Release Build"
    runs-on: ubuntu-latest
    if: |
      github.ref == 'refs/heads/Playstore' ||
      (github.event_name == 'workflow_dispatch' &&
        (github.event.inputs.job == 'playstore' || github.event.inputs.job == 'both'))

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Get current version
        id: pkg_version
        run: |
          VERSION=$(node -p "require('./package.json').version")
          echo "version=$VERSION" >> $GITHUB_OUTPUT

      - name: Bump version (manual dispatch only)
        id: version_bump
        if: github.event_name == 'workflow_dispatch'
        run: |
          npm version ${{ github.event.inputs.version }} --no-git-tag-version
          NEW_VERSION=$(node -p "require('./package.json').version")
          echo "version=$NEW_VERSION" >> $GITHUB_OUTPUT

      - name: Set release version
        id: release_version
        run: |
          if [ "${{ steps.version_bump.outputs.version }}" != "" ]; then
            echo "version=${{ steps.version_bump.outputs.version }}" >> $GITHUB_OUTPUT
          else
            echo "version=${{ steps.pkg_version.outputs.version }}" >> $GITHUB_OUTPUT
          fi

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build web application
        run: npm run build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_GROQ_API_KEY: ${{ secrets.VITE_GROQ_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Initialize & sync Capacitor Android
        run: |
          if [ ! -d "android" ]; then npx cap add android; fi
          npx cap sync android

      - name: Inject google-services.json
        run: |
          echo "${{ secrets.GOOGLE_SERVICES_JSON }}" | base64 --decode > android/app/google-services.json
          echo "google-services.json injected"

      - name: Inject SMS & Phone permissions into AndroidManifest
        run: |
          MANIFEST="android/app/src/main/AndroidManifest.xml"
          if [ -f "$MANIFEST" ] && ! grep -q "READ_PHONE_STATE" "$MANIFEST"; then
            sed -i '/<uses-permission android:name="android.permission.INTERNET"/a \    <uses-permission android:name="android.permission.READ_SMS" \/>\n    <uses-permission android:name="android.permission.RECEIVE_SMS" \/>\n    <uses-permission android:name="android.permission.READ_PHONE_STATE" \/>' "$MANIFEST"
            echo "SMS + READ_PHONE_STATE permissions injected"
          fi

      - name: Generate App Icons
        run: |
          npm i -D @capacitor/assets
          mkdir -p assets
          cp playstore_assets/fintrack_app_icon_fixed.png assets/icon.png
          cp playstore_assets/fintrack_app_icon_fixed.png assets/splash.png
          npx @capacitor/assets generate --android

      - name: Update Target SDK to 35
        run: |
          if [ -f "android/variables.gradle" ]; then
            sed -i 's/targetSdkVersion = 34/targetSdkVersion = 35/g' android/variables.gradle
            sed -i 's/compileSdkVersion = 34/compileSdkVersion = 35/g' android/variables.gradle
          fi

      - name: Update version code & name
        run: |
          if [ -f "android/app/build.gradle" ]; then
            sed -i "s/versionCode 1/versionCode ${{ github.run_number }}/g" android/app/build.gradle
            sed -i "s/versionName \"1.0\"/versionName \"${{ steps.release_version.outputs.version }}\"/g" android/app/build.gradle
          fi

      - name: Build Android Bundle (AAB)
        run: |
          cd android
          chmod +x gradlew
          ./gradlew bundleRelease --no-daemon

      - name: Sign AAB
        id: sign_app
        uses: r0adkll/sign-android-release@v1
        with:
          releaseDirectory: android/app/build/outputs/bundle/release
          signingKeyBase64: ${{ secrets.ANDROID_SIGNING_KEY }}
          alias: ${{ secrets.ANDROID_ALIAS }}
          keyStorePassword: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          keyPassword: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - name: Upload AAB artifact
        uses: actions/upload-artifact@v4
        with:
          name: release-aab-v${{ steps.release_version.outputs.version }}-build${{ github.run_number }}
          path: ${{ steps.sign_app.outputs.signedReleaseFile }}
          retention-days: 30

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: ${{ steps.sign_app.outputs.signedReleaseFile }}
          tag_name: v${{ steps.release_version.outputs.version }}-build-${{ github.run_number }}
          name: Release v${{ steps.release_version.outputs.version }} (Build ${{ github.run_number }})
          generate_release_notes: true
          draft: false
          prerelease: false
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}


  # ═══════════════════════════════════════════════
  #  JOB 2 — GITHUB PAGES BUILD (Web PWA)
  #  push to main/master OR manual dispatch
  # ═══════════════════════════════════════════════
  pages_build:
    name: "🌐 Build for GitHub Pages"
    runs-on: ubuntu-latest
    if: |
      github.ref == 'refs/heads/main' ||
      github.ref == 'refs/heads/master' ||
      (github.event_name == 'workflow_dispatch' &&
        (github.event.inputs.job == 'pages' || github.event.inputs.job == 'both'))

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci --legacy-peer-deps

      - name: Build for GitHub Pages
        run: npm run build
        env:
          GITHUB_PAGES: "true"
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
          VITE_GROQ_API_KEY: ${{ secrets.VITE_GROQ_API_KEY }}
          VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
          VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
          VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
          VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
          VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
          VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "./dist"

  pages_deploy:
    name: "🚀 Deploy to GitHub Pages"
    runs-on: ubuntu-latest
    needs: pages_build
    if: always() && needs.pages_build.result == 'success'
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
WORKFLOW_EOF
echo "OK: Combined workflow created"

# Git add, commit, push
echo ""
echo "========================================"
echo "  Committing and Pushing to GitHub      "
echo "========================================"

git add package.json
git add .gitignore
git add capacitor.config.ts
git add src/services/gmailAuthService.ts
git add src/services/smsPermissionService.ts
git add .github/workflows/fintrack-build-deploy.yml
git rm --cached .github/workflows/deploy.yml 2>/dev/null || true
git rm --cached .github/workflows/playstore_release.yml 2>/dev/null || true
git rm --cached .github/workflows/build-android.yml 2>/dev/null || true

git commit -m "fix: combine workflows + Gmail native auth + SMS permissions

- Merge deploy.yml + playstore_release.yml into fintrack-build-deploy.yml
- Playstore branch push -> Play Store AAB build auto-triggers
- main/master branch push -> GitHub Pages deploy auto-triggers
- Manual dispatch -> choose playstore/pages/both + version bump
- Fix @codetrix-studio/capacitor-google-auth version to 3.4.0-rc.4
- Add native Google Auth to capacitor.config.ts (fixes popup auth failure)
- Add gmailAuthService.ts and smsPermissionService.ts
- Inject READ_PHONE_STATE + READ_SMS + RECEIVE_SMS in CI
- Inject google-services.json from GitHub Secret in CI
- Add --legacy-peer-deps for Capacitor 6 compatibility
- Protect google-services.json in .gitignore"

git push origin Playstore

echo ""
echo "========================================"
echo "  ALL DONE! Pushed to GitHub Playstore  "
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "  1. Add GOOGLE_SERVICES_JSON secret:"
echo "     https://github.com/Someshwaran01/fintrack-pro/settings/secrets/actions"
echo "     Value = output of: base64 -w 0 google-services.json"
echo ""
echo "  2. Replace YOUR_WEB_CLIENT_ID in capacitor.config.ts"
echo "     Firebase Console > Project Settings > Web App > OAuth 2.0 Client ID"
echo ""
