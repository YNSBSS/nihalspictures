// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Import Firestore
import { getAuth } from "firebase/auth"; // Import Firebase Authentication (if needed)
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBEUKfCfNsqapk4MtsYgMkYhQmZrO9K2F8",
  authDomain: "nihalspictures-2a873.firebaseapp.com",
  projectId: "nihalspictures-2a873",
  storageBucket: "nihalspictures-2a873.firebasestorage.app",
  messagingSenderId: "709018193809",
  appId: "1:709018193809:web:18ab041b6130ad41659430",
  measurementId: "G-21ZVEV760C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialize Firestore
const auth = getAuth(app); // Initialize Firebase Authentication (if needed)

export { app, analytics, db , auth };