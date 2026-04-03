import { useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const handleSubmit = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = "Enter a valid email address.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    alert("Logging in…");
  };

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
            className={`login-input ${errors.email ? "login-input--error" : ""}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            autoComplete="email"
          />
          {errors.email && <p className="login-error-text">{errors.email}</p>}
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">Password</label>
          <input
            id="password"
            className={`login-input ${errors.password ? "login-input--error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            autoComplete="current-password"
          />
          {errors.password && <p className="login-error-text">{errors.password}</p>}
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
            onClick={handleSubmit}
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
          onClick={() => navigate('/register')}
        >
          CREATE YOUR HAPPY TAIL ACCOUNT
        </button>
      </section>
    </main>
  );
}