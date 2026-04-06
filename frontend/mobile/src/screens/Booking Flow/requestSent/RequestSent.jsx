import { useLocation, useNavigate } from "react-router-dom";
import "./RequestSent.css";

const DEFAULT_RESPONSE_TIME = "2 hours";

export default function HappyTailsRequestSent() {
  const navigate = useNavigate();
  const location = useLocation();

  const minderName = location.state?.minderName || "your minder";

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="rs-screen">
          <div className="rs-body">
            <div className="rs-icon-wrap">
              <span className="rs-icon">⏳</span>
            </div>

            <h1 className="rs-heading">Request Sent!</h1>
            <p className="rs-sub">
              Your booking request has been sent to{" "}
              <strong>{minderName}</strong>. You'll be notified once they
              accept or decline.
            </p>

            <div className="rs-callout">
              <span className="rs-callout-icon">⚡</span>
              <span className="rs-callout-text">
                {minderName.split(" ")[0]} typically responds within{" "}
                {DEFAULT_RESPONSE_TIME}
              </span>
            </div>

            <div className="rs-actions">
              <button
                className="rs-primary-btn"
                onClick={() => navigate("/ownerBooking")}
              >
                VIEW MY BOOKINGS
              </button>
              <button
                className="rs-secondary-btn"
                onClick={() => navigate("/ownerDash")}
              >
                GO HOME
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}