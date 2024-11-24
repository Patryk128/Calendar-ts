import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import "../ReactCalendar/styles/login.css";

interface LoginProps {
  toggleView: () => void;
}

export default function Login({ toggleView }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let isValid = true;

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setEmailError("Invalid email address.");
      isValid = false;
    }
    if (password.length === 0) {
      setPasswordError("Password is required.");
      isValid = false;
    }

    if (!isValid) return;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("User logged in");
    } catch (err: any) {
      if (err.code === "auth/invalid-email") {
        setEmailError("Invalid email address.");
      } else if (err.code === "auth/wrong-password") {
        setPasswordError("Incorrect password.");
      } else {
        setPasswordError("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <form className="login-form" onSubmit={handleLogin} noValidate>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
          />
          {emailError && (
            <p className="error-message" style={{ color: "red" }}>
              {emailError}
            </p>
          )}
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLogin(e)}
          />
          {passwordError && (
            <p className="error-message" style={{ color: "red" }}>
              {passwordError}
            </p>
          )}
        </div>
        <div className="auth-buttons">
          <button className="login-register-button" onClick={toggleView}>
            Go to Register
          </button>
          <button className="login-button" type="submit">
            Login
          </button>
        </div>
      </form>
    </div>
  );
}
