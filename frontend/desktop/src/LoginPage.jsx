import { useState } from "react";
import { C } from "./dashboard/constants.js";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    // Simulate auth — replace with real API call when backend is ready
    setTimeout(() => {
      if (email === "admin@happytails.com" && password === "admin123") {
        onLogin({ name: "Support Team", email, role: "Customer Support" });
      } else {
        setError("Incorrect email or password. Please try again.");
        setLoading(false);
      }
    }, 800);
  }

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

      <div
        style={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${C.navy} 0%, #243557 60%, #1e3a6e 100%)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'Nunito', sans-serif",
          padding: 16,
        }}
      >
        {/* Background paw prints */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            overflow: "hidden",
            pointerEvents: "none",
            zIndex: 0,
            opacity: 0.04,
            fontSize: 80,
            userSelect: "none",
          }}
        >
          {["10%,15%", "80%,10%", "20%,70%", "75%,75%", "50%,40%", "90%,50%", "5%,50%"].map(
            (pos, i) => {
              const [left, top] = pos.split(",");
              return (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left,
                    top,
                    transform: `rotate(${i * 30}deg)`,
                  }}
                >
                  🐾
                </span>
              );
            }
          )}
        </div>

        {/* Card */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            background: C.white,
            borderRadius: 20,
            padding: "44px 40px 40px",
            width: "100%",
            maxWidth: 420,
            boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                background: C.orange,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 30,
                marginBottom: 14,
                boxShadow: `0 8px 20px rgba(245,147,30,0.35)`,
              }}
            >
              🐾
            </div>
            <div
              style={{
                fontFamily: "'Dancing Script', cursive",
                fontSize: 30,
                fontWeight: 700,
                color: C.navy,
                lineHeight: 1,
              }}
            >
              Happy Tails
            </div>
            <div
              style={{
                color: C.mid,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginTop: 4,
              }}
            >
              Admin Dashboard
            </div>
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              color: C.navy,
              fontSize: 20,
              fontWeight: 800,
            }}
          >
            Welcome back
          </h2>
          <p style={{ margin: "0 0 28px", color: C.mid, fontSize: 13, fontWeight: 600 }}>
            Sign in to your admin account
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 6,
                  letterSpacing: 0.3,
                }}
              >
                Email address
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    pointerEvents: "none",
                  }}
                >
                  ✉️
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@happytails.com"
                  autoComplete="email"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 12px 11px 40px",
                    borderRadius: 10,
                    border: `1.5px solid ${error ? C.red : C.border}`,
                    fontSize: 13,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    color: C.dark,
                    background: C.light,
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.orange)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = error ? C.red : C.border)
                  }
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 8 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 6,
                  letterSpacing: 0.3,
                }}
              >
                Password
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 16,
                    pointerEvents: "none",
                  }}
                >
                  🔒
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "11px 44px 11px 40px",
                    borderRadius: 10,
                    border: `1.5px solid ${error ? C.red : C.border}`,
                    fontSize: 13,
                    fontFamily: "inherit",
                    fontWeight: 600,
                    color: C.dark,
                    background: C.light,
                    outline: "none",
                    transition: "border-color 0.15s",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = C.orange)}
                  onBlur={(e) =>
                    (e.target.style.borderColor = error ? C.red : C.border)
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: "absolute",
                    right: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 15,
                    color: C.mid,
                    padding: 4,
                    lineHeight: 1,
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div
                style={{
                  background: C.redLight,
                  color: C.red,
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Forgot password */}
            <div style={{ textAlign: "right", marginBottom: 20, marginTop: error ? 0 : 8 }}>
              <button
                type="button"
                style={{
                  background: "none",
                  border: "none",
                  color: C.orange,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                }}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "13px",
                borderRadius: 12,
                border: "none",
                background: loading ? C.mid : C.orange,
                color: C.white,
                fontSize: 14,
                fontWeight: 800,
                fontFamily: "inherit",
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s, transform 0.1s",
                boxShadow: loading ? "none" : `0 4px 14px rgba(245,147,30,0.4)`,
                letterSpacing: 0.3,
              }}
              onMouseEnter={(e) => {
                if (!loading) e.target.style.background = "#e0831a";
              }}
              onMouseLeave={(e) => {
                if (!loading) e.target.style.background = C.orange;
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {/* Demo hint */}
          <div
            style={{
              marginTop: 24,
              padding: "10px 14px",
              background: C.blueLight,
              borderRadius: 10,
              fontSize: 11,
              color: C.blue,
              fontWeight: 700,
              lineHeight: 1.5,
            }}
          >
            Demo credentials — Email: <span style={{ fontWeight: 900 }}>admin@happytails.com</span>
            &nbsp; Password: <span style={{ fontWeight: 900 }}>admin123</span>
          </div>
        </div>
      </div>
    </>
  );
}
