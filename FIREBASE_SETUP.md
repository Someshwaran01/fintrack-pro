# Firebase Cloud Sync Setup Guide

## 🎯 Purpose
Enable family members to share financial data in real-time using Firebase Firestore (100% FREE tier).

## 📋 Step-by-Step Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Name it "somu-fin-tracker" (or any name)
4. Disable Google Analytics (optional)
5. Click "Create Project"

### 2. Enable Firestore Database
1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in **test mode**" (for easy setup)
4. Select your location (e.g., asia-south1 for India)
5. Click "Enable"

### 3. Get Firebase Configuration
1. Click the gear icon (⚙️) next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (`</>`) to add a web app
5. Register app name: "Somu Fin Tracker"
6. Copy the `firebaseConfig` object

### 4. Update Your App
1. Open `services/firebase.ts` in your project
2. Replace the placeholder values with your config:

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "somu-fin-tracker.firebaseapp.com",
  projectId: "somu-fin-tracker",
  storageBucket: "somu-fin-tracker.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

### 5. Set Firestore Security Rules
1. In Firebase Console, go to "Firestore Database"
2. Click "Rules" tab
3. Replace with these rules (allows all read/write):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

4. Click "Publish"

⚠️ **Note**: These rules allow anyone to read/write. For production, add authentication.

### 6. Enable Cloud Sync in App
1. Open your app
2. Click the **cloud icon** (☁️) in the top header
3. Click "Enable Cloud Sync"
4. Copy your **Family ID**
5. Share Family ID with family members

### 7. Join Family on Other Devices
1. Install app on other devices
2. Click cloud icon (☁️)
3. Paste the Family ID
4. Click "Update Family ID"
5. Click "Enable Cloud Sync"
6. Restart the app

## 🎉 Done!
All family members will now see the same data in real-time!

## 📊 Free Tier Limits (Generous!)
- **Storage**: 1 GB
- **Reads**: 50,000 per day
- **Writes**: 20,000 per day
- **Deletes**: 20,000 per day

This is MORE than enough for a family finance tracker!

## 🔒 Security Tips (Optional)
For better security, you can:
1. Enable Email Authentication in Firebase
2. Update security rules to require authentication
3. Use Firebase Authentication in the app

## 🆘 Troubleshooting
- **"Failed to sync"**: Check if firebase.ts has correct config
- **"Permission denied"**: Check Firestore security rules
- **Data not syncing**: Make sure cloud sync is enabled on all devices
- **Different Family ID**: All family members must use the SAME Family ID
