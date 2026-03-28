// src/services/gmailAuthService.ts
// ✅ Uses native Google Auth (Capacitor) instead of web popup
// This fixes "Authentication failed or was cancelled" on Android

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

/**
 * Sign in with Google.
 * - On Android/iOS: uses native Capacitor Google Auth (no popup)
 * - On Web: falls back to standard Firebase popup
 */
export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuth();

  if (Capacitor.isNativePlatform()) {
    // ✅ NATIVE PATH — works on Android without popup issues
    try {
      await GoogleAuth.initialize(); // safe to call multiple times
      const googleUser = await GoogleAuth.signIn();

      const idToken = googleUser.authentication.idToken;
      if (!idToken) throw new Error('No ID token received from Google');

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(auth, credential);

      console.log('✅ Gmail Auth success (native):', result.user.email);
      return result.user;
    } catch (error: any) {
      console.error('❌ Native Google Auth failed:', error.message);
      throw error;
    }
  } else {
    // 🌐 WEB FALLBACK — popup works fine in browsers
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');

    try {
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Gmail Auth success (web popup):', result.user.email);
      return result.user;
    } catch (error: any) {
      console.error('❌ Web popup Google Auth failed:', error.message);
      throw error;
    }
  }
}

/**
 * Sign out from Google + Firebase
 */
export async function signOutGoogle(): Promise<void> {
  const auth = getAuth();
  try {
    if (Capacitor.isNativePlatform()) {
      await GoogleAuth.signOut();
    }
    await signOut(auth);
    console.log('✅ Signed out successfully');
  } catch (error: any) {
    console.error('❌ Sign out failed:', error.message);
    throw error;
  }
}

/**
 * Get the current Firebase Auth user
 */
export function getCurrentUser(): User | null {
  return getAuth().currentUser;
}
