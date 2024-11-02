import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import ReactCalendar from "../src/Components/ReactCalendar/ReactCalendar.js";
import Login from "./Login.js";
import Register from "./Register.js";
import "./Components/ReactCalendar/reset.css";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const toggleView = () => {
    setShowRegister(!showRegister);
  };

  return (
    <div>
      {user ? (
        <>
          <ReactCalendar />
        </>
      ) : (
        <>
          {showRegister ? (
            <Register toggleView={toggleView} />
          ) : (
            <Login toggleView={toggleView} />
          )}
        </>
      )}
    </div>
  );
}
