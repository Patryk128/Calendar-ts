import { useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../src/firebaseConfig.js";
import ReactCalendar from "../src/Components/ReactCalendar/ReactCalendar.js";
import Login from "./Login.tsx";
import Register from "./Register.tsx";

export default function App() {
  const [user, setUser] = useState<any>(null); // Przechowywanie stanu zalogowanego użytkownika
  const [showRegister, setShowRegister] = useState(false); // Dodany stan do przełączania widoku

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  const toggleView = () => {
    setShowRegister(!showRegister); // Zmiana stanu widoku
  };

  return (
    <div style={{ height: "95vh" }}>
      {user ? (
        <>
          <button onClick={handleLogout}>Logout</button>
          <ReactCalendar />
        </>
      ) : (
        <>
          <h1>Welcome! Please log in or register.</h1>
          {showRegister ? (
            <>
              <Register />
              <button onClick={toggleView}>Back to Login</button>
            </>
          ) : (
            <>
              <Login />
              <button onClick={toggleView}>Go to Register</button>
            </>
          )}
        </>
      )}
    </div>
  );
}
