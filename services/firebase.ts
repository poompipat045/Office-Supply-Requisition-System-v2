
// Import functions from SDKs (using import map from index.html)
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Config from user provided data
const firebaseConfig = {
  apiKey: "AIzaSyDVnEDVWaS_faXdrERwSXRXvbZaBa6Hq1Q",
  authDomain: "supply-app-52426.firebaseapp.com",
  projectId: "supply-app-52426",
  storageBucket: "supply-app-52426.firebasestorage.app",
  messagingSenderId: "559026983636",
  appId: "1:559026983636:web:7e7a5975b6a52d162fe141",
  measurementId: "G-YPWV88DG19"
};

// Initialize only if config is valid to prevent errors in demo
let app;
let db: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase config is missing or placeholder. Using LocalStorage.");
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

export { db };
