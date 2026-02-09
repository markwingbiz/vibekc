// app/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Use ONLY ONE config (your newest project)
const firebaseConfig = {
  apiKey: "AIzaSyDXcYdUYw1o_liAhUBxb7_QXqcdlHIh7DU",
  authDomain: "outnabout1-c30ef.firebaseapp.com",
  projectId: "outnabout1-c30ef",
  storageBucket: "outnabout1-c30ef.firebasestorage.app",
  messagingSenderId: "602300237363",
  appId: "1:602300237363:web:a3c44f792e48d70e560546",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
