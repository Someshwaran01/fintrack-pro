# Firebase Cloud Sync Setup Guide

## 🎯 Purpose
Enable family members to share financial data in real-time using Firebase Firestore (100% FREE tier).

## 📋 Step-by-Step Setup

### 1. Create Firebase Account & Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. **Sign in** with your Google account (create one if needed)
3. You'll see a page with existing projects (or empty if first time)
4. Click the **"Add project"** or **"Create a project"** button (big tile/card)
5. **Step 1 of 3**: Enter project name "somu-fin-tracker" → Click "Continue"
6. **Step 2 of 3**: Disable "Enable Google Analytics" (toggle OFF) → Click "Continue"
7. **Step 3 of 3**: Click "Create project"
8. Wait 30 seconds for project creation
9. Click "Continue" when done
10. You should now see **"Project Overview"** at the top left

### 2. Enable Firestore Database
1. Look at the **left sidebar menu** (if not visible, click hamburger ☰ icon)
2. Find and click **"Firestore Database"** or **"Cloud Firestore"**
   - If you see "Build" section, expand it to find Firestore
3. Click the big **"Create database"** button in the center
4. **Step 1 of 2**: Choose **"Start in test mode"** (radio button) → Click "Next"
5. **Step 2 of 2**: Select location:
   - **For India**: Choose "asia-south1 (Mumbai)"
   - **For USA**: Choose "us-central1"
   - Click "Enable"
6. Wait 1-2 minutes for database creation
7. You should see an empty database with "Start collection" option

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

### Can't Find "Create Database" Button?
- **Make sure you created a project first** (see Step 1)
- Click "Firestore Database" or "Cloud Firestore" in the left menu
- If you see "Realtime Database" - that's different! Look for "Firestore" or "Cloud Firestore"
- Try refreshing the page (Ctrl + F5)

### Can't See "Project Overview"?
- You might be on the Firebase homepage, not inside a project
- Make sure you completed project creation (Step 1)
- Look for your project name at the top of the page
- If you see a list of projects, click on your project to enter it

### Left Sidebar Not Showing?
- Click the **hamburger menu** (☰) icon at the top left
- The sidebar should expand showing all options

### Still Stuck?
1. **Alternative URL**: After creating project, go directly to:
   `https://console.firebase.google.com/project/YOUR-PROJECT-ID/firestore`
   (Replace YOUR-PROJECT-ID with your actual project ID)

2. **Video Tutorial**: Search YouTube for "Firebase Firestore setup 2025"

3. **Use Test Credentials**: You can skip Firebase setup for now and test locally
   - The app works fine with local storage only
   - Enable cloud sync later when ready

### "Failed to sync" Error?
- Check if firebase.ts has correct config
- Make sure Firestore database is created
- Check browser console (F12) for error details

### "Permission denied" Error?
- Go to Firestore → Rules tab
- Make sure rules allow read/write (see Step 5 in setup)
- Click "Publish" after updating rules
