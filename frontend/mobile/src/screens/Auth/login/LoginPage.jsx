import { useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    const newErrors = {};

    if (!identifier.trim()) {
      newErrors.identifier = "Email or username is required.";
    }

    if (!password.trim()) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("http://localhost:3000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const message = data.error || "Login failed.";

        setErrors({
          identifier: " ",
          password: " ",
          submit: message,
        });
        return;
      }

      localStorage.setItem("userID", data.userID);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userEmail", data.profile?.email || "");
      localStorage.setItem("username", data.username || "");

      if (data.role === "minder") {
        navigate("/mindDash");
      } else if (data.role === "owner") {
        navigate("/ownerDash");
      } else if (data.role === "support") {
        navigate("/supportDash");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setErrors({
        submit: "Server error. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <main className="login-screen">
      <section className="login-brand-area">
        <h1 className="login-brand-text">Happy Tails</h1>
      </section>

      <section className="login-form-panel">
        <h2 className="login-welcome">Welcome Back!</h2>

        <div className="login-field">
          <label className="login-label" htmlFor="identifier">
            Email or Username
          </label>
          <input
            id="identifier"
            className={`login-input ${errors.identifier ? "login-input--error" : ""}`}
            type="text"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrors((prev) => ({
                ...prev,
                identifier: "",
                submit: "",
              }));
            }}
            onKeyDown={handleKeyDown}
            autoComplete="username"
          />
          {errors.identifier && errors.identifier.trim() && (
            <p className="login-error-text">{errors.identifier}</p>
          )}
        </div>

        <div className="login-field">
          <label className="login-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className={`login-input ${errors.password ? "login-input--error" : ""}`}
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({
                ...prev,
                password: "",
                submit: "",
              }));
            }}
            onKeyDown={handleKeyDown}
            autoComplete="current-password"
          />
          {errors.password && errors.password.trim() && (
            <p className="login-error-text">{errors.password}</p>
          )}
        </div>

        <button
          className="login-forgot"
          onClick={() => alert("Navigate to Forgot Password")}
          type="button"
        >
          Forgot Password?
        </button>

        {errors.submit && (
          <p className="login-error-text--submit">{errors.submit}</p>
        )}

        <div className="login-submit-row">
          <button
            className="login-submit-button"
            onClick={handleSubmit}
            type="button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "LOGGING IN..." : "LOG IN"}
          </button>
        </div>

        <div className="login-divider">
          <span className="login-divider-line" />
          <span className="login-divider-text">New to Happy Tails?</span>
          <span className="login-divider-line" />
        </div>

        <button
          className="login-create-button"
          onClick={() => navigate("/register")}
          type="button"
        >
          CREATE YOUR HAPPY TAIL ACCOUNT
        </button>
      </section>
    </main>
  );
}