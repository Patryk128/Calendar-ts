import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCu8LXLglw07HwsmI51fnWe44nivuJ1wy4",
  authDomain: "calendar-moment.firebaseapp.com",
  projectId: "calendar-moment",
  storageBucket: "calendar-moment.appspot.com",
  messagingSenderId: "504324729076",
  appId: "1:504324729076:web:ca0a96d787d889222456a1",
};

// Inicjalizacja Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Firebase Authentication
const auth = getAuth(app);

export { db, auth };
