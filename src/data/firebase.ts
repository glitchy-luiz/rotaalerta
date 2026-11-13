import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore, initializeFirestore } from 'firebase/firestore';

const config = {
  apiKey: "AIzaSyBKT7V94Offs2ATMPB163_rsCqm_C-Wsqo",
  authDomain: "app-rotas-d5284.firebaseapp.com",
  projectId: "app-rotas-d5284",
  storageBucket: "app-rotas-d5284.firebasestorage.app",
  messagingSenderId: "1090638584793",
  appId: "1:1090638584793:web:09d86222f40296392cd7c8"
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId && config.appId);

let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config);
}

export function getDb(): Firestore {
  if (db) return db;
  const app = getFirebaseApp();
  try {
    // Long polling evita problemas de conexão do Firestore no React Native / Expo Go.
    db = initializeFirestore(app, { experimentalForceLongPolling: true, ignoreUndefinedProperties: true });
  } catch {
    // Fast Refresh: já foi inicializado.
    db = getFirestore(app);
  }
  return db;
}
