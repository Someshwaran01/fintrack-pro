// src/services/gmailAuthService.ts
// Fixes: "Authentication failed or was cancelled" on Android
// Uses native Capacitor Google Auth instead of web popup

import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import {
  getAuth,
  signInWithCredential,
  GoogleAuthProvider,
  signOut,
  User
} from 'firebase/auth';
import { Capacitor } from '@capacitor/core';

export async function signInWithGoogle(): Promise<User | null> {
  const auth = getAuth();

  if (Capacitor.isNativePlatform()) {
    // NATIVE PATH - works reliably on Android without popup issues
    await GoogleAuth.initialize();
    const googleUser = await GoogleAuth.signIn();
    const idToken = googleUser.authentication.idToken;
    if (!idToken) throw new Error('No ID token received from Google');
    
    // Log the current origin to help debug "unauthorized-domain" error
    console.log('Current application origin (for Firebase Auth):', window.location.origin);
    
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    console.log('Gmail Auth success (native):', result.user.email);
    return result.user;
  } else {
    // WEB FALLBACK - popup works fine in browsers
    const { signInWithPopup } = await import('firebase/auth');
    const provider = new GoogleAuthProvider();
    provider.addScope('https://www.googleapis.com/auth/gmail.readonly');
    const result = await signInWithPopup(auth, provider);
    console.log('Gmail Auth success (web):', result.user.email);
    return result.user;
  }
}

export async function signOutGoogle(): Promise<void> {
  if (Capacitor.isNativePlatform()) await GoogleAuth.signOut();
  await signOut(getAuth());
}

export function getCurrentUser(): User | null {
  return getAuth().currentUser;
}
