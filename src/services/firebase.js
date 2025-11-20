// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0uNerHR8ydHhkA6rrq1gUJXZ9Dd_uSVs",
  authDomain: "outlier-tasks-a3b50.firebaseapp.com",
  projectId: "outlier-tasks-a3b50",
  storageBucket: "outlier-tasks-a3b50.firebasestorage.app",
  messagingSenderId: "423623709538",
  appId: "1:423623709538:web:2db34260f843dad5a6923b",
  measurementId: "G-9RK5Q61P1B"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);