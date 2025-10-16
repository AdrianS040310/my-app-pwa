// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDtL-K5aZiuBua5XvGFg1TsN1RPE2R9-D4',
  authDomain: 'pwa-notificaciones-5be22.firebaseapp.com',
  projectId: 'pwa-notificaciones-5be22',
  storageBucket: 'pwa-notificaciones-5be22.firebasestorage.app',
  messagingSenderId: '124985123243',
  appId: '1:124985123243:web:49bdb479143ab9dfc9f2ee',
  measurementId: 'G-DSMR30S7VD',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Analytics (lazy initialization)
let analyticsInstance: any = null;
export const getAnalyticsInstance = () => {
  if (!analyticsInstance) {
    analyticsInstance = getAnalytics(app);
  }
  return analyticsInstance;
};

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = getMessaging(app);

// VAPID key for FCM (obtenida desde Firebase Console > Project Settings > Cloud Messaging)
export const VAPID_KEY =
  'BAfAfo8S1VCekA-e4-wDIFvC20LZzWnHkRkSXw0EKqMILCcvuqF1S_hm6HW7DvM_h2hMNdlrR6x_eiI7pDFBM_Q';

export default app;
