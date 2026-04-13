import { useState } from "react";
import { C } from "../dashboard/constants.js";
import "./LoginPage.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, password }),
      });
      const data = await res.json();
      console.log("Login response:", { email, password });
      if (!res.ok) {
        setError(data.error || "Incorrect email or password. Please try again.");
        setLoading(false);
        return;
      }
      if (data.role !== "support") {
        setError("Access denied. Admin support accounts only.");
        setLoading(false);
        return;
      }
      onLogin({
        userID: data.userID,
        role: data.role,
        name: `${data.profile.firstName} ${data.profile.lastName}`,
        email: data.profile.email,
      });
    } catch {
      setError("Unable to connect to server. Is the backend running?");
      setLoading(false);
    }
  }

  const containerStyle = {
    "--login-bg": `linear-gradient(135deg, ${C.navy} 0%, #243557 60%, #1e3a6e 100%)`,
    "--login-white": C.white,
    "--login-orange": C.orange,
    "--login-navy": C.navy,
    "--login-mid": C.mid,
    "--login-dark": C.dark,
    "--login-border": error ? C.red : C.border,
    "--login-border-default": C.border,
    "--login-border-focus": C.orange,
    "--login-red": C.red,
    "--login-red-light": C.redLight,
    "--login-light": C.light,
    "--login-blue": C.blue,
    "--login-blue-light": C.blueLight,
    "--login-button-bg": loading ? C.mid : C.orange,
    "--login-button-shadow": loading ? "none" : "0 4px 14px rgba(245,147,30,0.4)",
  };

  const pawPositions = [
    "10%,15%",
    "80%,10%",
    "20%,70%",
    "75%,75%",
    "50%,40%",
    "90%,50%",
    "5%,50%",
  ];

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap"
        rel="stylesheet"
      />

      <div className="login-page" style={containerStyle}>
        <div className="login-page__background" aria-hidden="true">
          {pawPositions.map((pos, i) => {
            const [left, top] = pos.split(",");
            return (
              <span
                key={i}
                className="login-page__paw"
                style={{
                  left,
                  top,
                  transform: `rotate(${i * 30}deg)`,
                }}
              >
                🐾
              </span>
            );
          })}
        </div>

        <div className="login-card">
          <div className="login-card__branding">
            <div className="login-card__logo">🐾</div>
            <div className="login-card__brand-name">Happy Tails</div>
            <div className="login-card__brand-subtitle">Admin Dashboard</div>
          </div>

          <h2 className="login-card__title">Welcome back</h2>
          <p className="login-card__subtitle">Sign in to your admin account</p>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <div className="login-form__group">
              <label className="login-form__label">Email address</label>
              <div className="login-form__input-wrapper">
                <span className="login-form__icon">✉️</span>
                <input
                  className={`login-form__input ${error ? "login-form__input--error" : ""}`}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@happytails.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-form__group login-form__group--password">
              <label className="login-form__label">Password</label>
              <div className="login-form__input-wrapper">
                <span className="login-form__icon">🔒</span>
                <input
                  className={`login-form__input login-form__input--with-toggle ${
                    error ? "login-form__input--error" : ""
                  }`}
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-form__toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-form__error">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div
              className={`login-form__actions ${
                error ? "login-form__actions--with-error" : ""
              }`}
            >
              <button type="button" className="login-form__forgot-password">
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="login-form__submit"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="login-card__demo">
            Demo credentials — Email:{" "}
            <span className="login-card__demo-strong">admin@happytails.com</span>
            &nbsp; Password:{" "}
            <span className="login-card__demo-strong">admin123</span>
          </div>
        </div>
      </div>
    </>
  );
}