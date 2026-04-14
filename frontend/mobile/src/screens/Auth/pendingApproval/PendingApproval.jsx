import { useNavigate } from "react-router-dom";
import "./PendingApproval.css";

export default function PendingApproval() {
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole") || "user";
  const email = localStorage.getItem("userEmail") || "";

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="pa-screen">
          <header className="pa-header">
            <h1 className="pa-title">Account pending approval</h1>
            <p className="pa-subtitle">
              Your {role} account has been created, but it’s not active yet.
            </p>
          </header>

          <div className="pa-body">
            <div className="pa-card">
              <p className="pa-text">
                Customer Support will review your details and activate your account.
              </p>
              {email && (
                <p className="pa-muted">
                  Signed in as <strong>{email}</strong>
                </p>
              )}
            </div>

            <button
              className="pa-btn"
              type="button"
              onClick={() => {
                localStorage.removeItem("userID");
                localStorage.removeItem("userRole");
                localStorage.removeItem("userEmail");
                localStorage.removeItem("username");
                localStorage.removeItem("firstName");
                localStorage.removeItem("lastName");
                localStorage.removeItem("userStatus");
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

