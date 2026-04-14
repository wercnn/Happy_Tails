import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AccountBlocked.css";

export default function AccountBlocked() {
  const navigate = useNavigate();
  const status = String(localStorage.getItem("userStatus") || "");
  const deletionRequested = localStorage.getItem("deletionRequested") === "true";
  const email = localStorage.getItem("userEmail") || "";

  const title = useMemo(() => {
    if (deletionRequested) return "Account deletion requested";
    if (status.toLowerCase() === "suspended") return "Account suspended";
    return "Account not available";
  }, [deletionRequested, status]);

  const message = useMemo(() => {
    if (deletionRequested) {
      return "Your account is temporarily suspended while Customer Support reviews your deletion request.";
    }
    if (status.toLowerCase() === "suspended") {
      return "Your account has been suspended. Please contact Customer Support if you believe this is a mistake.";
    }
    return "Your account is currently not available.";
  }, [deletionRequested, status]);

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ab-screen">
          <header className="ab-header">
            <h1 className="ab-title">{title}</h1>
            <p className="ab-sub">{message}</p>
          </header>

          <div className="ab-body">
            {email && (
              <div className="ab-card">
                Signed in as <strong>{email}</strong>
              </div>
            )}

            <button
              className="ab-btn"
              type="button"
              onClick={() => {
                [
                  "userID",
                  "userRole",
                  "userEmail",
                  "username",
                  "firstName",
                  "lastName",
                  "userStatus",
                  "deletionRequested",
                ].forEach((k) => localStorage.removeItem(k));
                navigate("/login");
              }}
            >
              Log out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

