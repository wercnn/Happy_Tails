import { useState } from "react";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <main className="login-screen">
      <section className="login-brand-area">
        <h1 className="login-brand-text">Happy Tails</h1>
      </section>

      <section className="login-form-panel">
        <h2 className="login-welcome">Welcome Back!</h2>

        <div className="login-field">
          <label className="login-label" htmlFor="email">Email</label>
          <input
            id="email"
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        <button
          className="login-forgot"
          onClick={() => alert("Navigate to Forgot Password")}
        >
          Forgot Password?
        </button>

        <div className="login-submit-row">
          <button
            className="login-submit-button"
            onClick={() => alert("Logging in…")}
          >
            LOG IN
          </button>
        </div>

        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">New to Happy Tails?</span>
          <span className="login-divider-line" />
        </div>

        <button
          className="login-create-button"
          onClick={() => alert("Navigate to Register")}
        >
          CREATE YOUR HAPPY TAIL ACCOUNT
        </button>
      </section>
    </main>
  );
}