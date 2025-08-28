// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAuth } from "firebase/auth"; // Import Firebase Authentication (if needed)
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyABTMaKXkn8r3-7AZdAJLENFkTSlX-syUE",
  authDomain: "naira-60349.firebaseapp.com",
  projectId: "naira-60349",
  storageBucket: "naira-60349.firebasestorage.app",
  messagingSenderId: "649910294806",
  appId: "1:649910294806:web:ff4f56f7699193f38f5837",
  measurementId: "G-Q0F6Z851PR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Firebase Authentication (if needed)

export { app, analytics, db , auth };