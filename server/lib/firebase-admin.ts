// Firebase Admin SDK configuration
// This file was missing and is needed for server-side Firebase operations

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp;
try {
  if (getApps().length === 0) {
    // In production, use service account key
    // For development, we'll use the default credentials or skip admin features
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      });
    } else {
      console.warn('Firebase Admin SDK not configured - some features may not work');
      adminApp = null;
    }
  } else {
    adminApp = getApps()[0];
  }
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  adminApp = null;
}

export const adminDb = adminApp ? getFirestore(adminApp) : null;
export { adminApp };