import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebaseConfig.js";
import "../ReactCalendar/styles/register.css";

interface RegisterProps {
  toggleView: () => void;
}

export default function Register({ toggleView }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");

    let isValid = true;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setEmailError("Invalid email address.");
      isValid = false;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      isValid = false;
    }

    if (!isValid) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      console.log("User registered:", userCredential.user);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setEmailError("This email is already in use.");
      } else {
        setPasswordError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="register-container">
      <h2>Register</h2>
      <form className="register-form" onSubmit={handleRegister} noValidate>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleRegister(e)}
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
            onKeyPress={(e) => e.key === "Enter" && handleRegister(e)}
          />
          {passwordError && (
            <p className="error-message" style={{ color: "red" }}>
              {passwordError}
            </p>
          )}
        </div>
        <div className="auth-buttons">
          <button className="register-login-button" onClick={toggleView}>
            Back to Login
          </button>
          <button className="register-button" type="submit">
            Register
          </button>
        </div>
      </form>
    </div>
  );
}
