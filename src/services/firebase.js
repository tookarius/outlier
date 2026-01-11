// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your AI-TRAINING-TASKS DB
 const firebaseConfig = {
 apiKey: "AIzaSyB5pnaqoqeiyWTmjq5EYb7Rh8EoNJplCuI",
  authDomain: "outleir-a9ab1.firebaseapp.com",
  projectId: "outleir-a9ab1",
  storageBucket: "outleir-a9ab1.firebasestorage.app",
  messagingSenderId: "1091033714142",
  appId: "1:1091033714142:web:191a2cda8566a175fe614f",
  measurementId: "G-BMMVVHBDS2"
 };


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
