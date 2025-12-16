// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// 1. IMPORT initializeFirestore INSTEAD OF getFirestore
import { initializeFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDfDTjY6qOP8_Ayr19oSEfOyFjMDeWNW0w",
  authDomain: "studysync-1da06.firebaseapp.com",
  projectId: "studysync-1da06",
  storageBucket: "studysync-1da06.firebasestorage.app",
  messagingSenderId: "104472249791",
  appId: "1:104472249791:web:587b1302aab8f49fdf8d0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);

// 2. Use initializeFirestore and explicitly disable the local disk cache.
// This permanently fixes the 'INTERNAL ASSERTION FAILED: Unexpected state' error.
const db = initializeFirestore(app, {
  localCache: {
    persistent: false
  }
});

export { auth, db };