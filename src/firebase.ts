// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC0b5Q3ZV98oixdcyHUMvqdV9nyTZ7Nr9Y",
  authDomain: "smartability-d90e1.firebaseapp.com",
  projectId: "smartability-d90e1",
  storageBucket: "smartability-d90e1.firebasestorage.app",
  messagingSenderId: "940955467207",
  appId: "1:940955467207:web:a127c76687f894003eede2",
  measurementId: "G-SHNV2YT6L6",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
