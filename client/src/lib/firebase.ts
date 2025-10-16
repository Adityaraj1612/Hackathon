// Firebase configuration and initialization
// Reference: firebase_barebones_javascript blueprint
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDnguObswpRQbeB_rZDS2MokRrmfyC6M9I",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "sarthi-e8175"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sarthi-e8175",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "sarthi-e8175"}.firebasestorage.app`,
  messagingSenderId: "376286301971",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:376286301971:web:30efeae757a609612814e6",
  measurementId: "G-SL08KY3NYM"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Auth Provider - Configured for popup authentication
// Sign-up/Sign-in uses signInWithPopup for desktop browsers
// Mobile devices automatically fallback to signInWithRedirect
export const googleProvider = new GoogleAuthProvider();
