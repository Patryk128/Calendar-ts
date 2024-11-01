import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "calendar-moment.firebaseapp.com",
  projectId: "calendar-moment",
  storageBucket: "calendar-moment.appspot.com",
  messagingSenderId: "504324729076",
  appId: "1:504324729076:web:ca0a96d787d889222456a1",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
