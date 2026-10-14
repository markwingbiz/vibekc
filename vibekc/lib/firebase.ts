// lib/firebase.ts
// Firebase config comes from environment variables, NOT from committed code.
// Copy .env.example to .env (same directory) and fill in your project's values
// from Firebase console -> Project settings -> Your apps.
// .env is gitignored and never committed. Expo inlines EXPO_PUBLIC_* vars
// into the bundle at build/start time.
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const REQUIRED_VARS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

function getEnv(name: RequiredVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[firebase] Missing env var ${name}. ` +
        `Copy .env.example to .env in this directory and fill in your ` +
        `Firebase project values (Firebase console -> Project settings).`
    );
  }
  return value;
}

const firebaseConfig = {
  apiKey: getEnv("EXPO_PUBLIC_FIREBASE_API_KEY"),
  authDomain: getEnv("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("EXPO_PUBLIC_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("EXPO_PUBLIC_FIREBASE_APP_ID"),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
