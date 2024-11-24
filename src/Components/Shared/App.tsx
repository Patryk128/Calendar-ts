import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../Authentication/firebaseConfig.js";
import ReactCalendar from "../ReactCalendar/ReactCalendar.js";
import Login from "../Authentication/Login.js";
import Register from "../Authentication/Register.js";
import "../ReactCalendar/styles/reset.css";

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
