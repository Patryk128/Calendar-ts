import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import ReactCalendar from "../src/Components/ReactCalendar/ReactCalendar.js";
import Login from "./Login";
import Register from "./Register";
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
