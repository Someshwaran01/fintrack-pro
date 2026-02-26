// Firebase Configuration
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Replace these with your actual Firebase project credentials
// You can find them in your Firebase Console -> Project Settings -> General -> Your apps
const FIREBASE_CONFIG = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
};

// Check if actual config is provided instead of placeholders
export const isFirebaseConfigured = () => {
    return Boolean(
        FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
        FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.projectId !== "YOUR_PROJECT_ID"
    );
};

// Initialize Firebase
const app = initializeApp(FIREBASE_CONFIG);
export const db = getFirestore(app);
