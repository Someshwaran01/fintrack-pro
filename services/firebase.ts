import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDp8kW-0oOo4UfS8_tCtIjklC7iyn0slXk",
    authDomain: "somu-devi-fin-tracker-dc50f.firebaseapp.com",
    projectId: "somu-devi-fin-tracker-dc50f",
    storageBucket: "somu-devi-fin-tracker-dc50f.firebasestorage.app",
    messagingSenderId: "663994844166",
    appId: "1:663994844166:web:aa91bc8ac090be7bf16f87"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
