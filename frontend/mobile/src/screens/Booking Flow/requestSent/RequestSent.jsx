import "./RequestSent.css";

const MINDER = {
  name: "James Walker",
  responseTime: "2 hours",
};

export default function HappyTailsRequestSent() {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="rs-screen">

          <div className="rs-body">

            {/* Hourglass icon */}
            <div className="rs-icon-wrap">
              <span className="rs-icon">⏳</span>
            </div>

            {/* Heading */}
            <h1 className="rs-heading">Request Sent!</h1>
            <p className="rs-sub">
              Your booking request has been sent to{" "}
              <strong>{MINDER.name}</strong>. You'll be notified once they
              accept or decline.
            </p>

            {/* Response time callout */}
            <div className="rs-callout">
              <span className="rs-callout-icon">⚡</span>
              <span className="rs-callout-text">
                {MINDER.name.split(" ")[0]} typically responds within{" "}
                {MINDER.responseTime}
              </span>
            </div>

            {/* Actions */}
            <div className="rs-actions">
              <button
                className="rs-primary-btn"
                onClick={() => alert("Navigate to My Bookings")}
              >
                VIEW MY BOOKINGS
              </button>
              <button
                className="rs-secondary-btn"
                onClick={() => alert("Navigate to Home")}
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