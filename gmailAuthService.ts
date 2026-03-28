/**
 * gmailAuthService.ts
 *
 * Native Google Sign-In for Android using @codetrix-studio/capacitor-google-auth
 * Replaces the web signInWithPopup() method which fails on Android.
 *
 * Place this file in: src/services/gmailAuthService.ts
 */

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

// ─── Initialize GoogleAuth once (call this in your main App.tsx on mount) ───
export const initGoogleAuth = () => {
  GoogleAuth.initialize({
    clientId: 'YOUR_WEB_CLIENT_ID_FROM_FIREBASE.apps.googleusercontent.com', // ← Replace this
    scopes: [
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly'
    ],
    grantOfflineAccess: true
  });
};

// ─── Sign In ─────────────────────────────────────────────────────────────────
export const signInWithGoogle = async (): Promise<User> => {
  try {
    const auth = getAuth();

    if (Capacitor.isNativePlatform()) {
      // ✅ Native Android path — no popup, works reliably on all Android devices
      const googleUser = await GoogleAuth.signIn();
      const idToken = googleUser.authentication.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google Sign-In');
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);
      return result.user;

    } else {
      // Web fallback — only used in browser/PWA, not on Android
      const { signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }

  } catch (error: any) {
    console.error('Google Sign-In failed:', error);

    // Friendly error messages
    if (error.code === '12501' || error.message?.includes('cancelled')) {
      throw new Error('Sign-in was cancelled. Please try again.');
    }
    if (error.message?.includes('network')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('Authentication failed. Please try again.');
  }
};

// ─── Sign Out ────────────────────────────────────────────────────────────────
export const signOutGoogle = async (): Promise<void> => {
  const auth = getAuth();
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out failed:', error);
    throw error;
  }
};
