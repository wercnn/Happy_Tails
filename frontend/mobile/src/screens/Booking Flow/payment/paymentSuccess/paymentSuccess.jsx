import { useLocation, useNavigate } from "react-router-dom";
import "./PaymentSuccess.css";

function formatMoney(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

export default function HappyTailsPaymentSuccess() {
  const navigate = useNavigate();
  const location = useLocation();

  const total = Number(location.state?.total ?? 0);
  const paymentMethod = location.state?.paymentMethod || "Card payment";
  const minderName = location.state?.minderName || "";
  const serviceName = location.state?.serviceName || "";
  const petName = location.state?.petName || "";

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ps-screen">
          <header className="ps-header">
            <h1 className="ps-title">Payment Successful</h1>
          </header>

          <div className="ps-scroll">
            <div className="ps-body">
              <section className="ps-hero-card">
                <div className="ps-icon-wrap">
                  <div className="ps-icon">✓</div>
                </div>

                <span className="ps-eyebrow">Payment Confirmed</span>
                <h2 className="ps-amount">{formatMoney(total)}</h2>
                <p className="ps-subtext">
                  Your payment has been processed successfully.
                </p>
              </section>

              <section className="ps-card">
                <h2 className="ps-card-title">Payment Details</h2>

                <div className="ps-row">
                  <span className="ps-label">Amount Paid</span>
                  <span className="ps-value">{formatMoney(total)}</span>
                </div>

                <div className="ps-row ps-row--last">
                  <span className="ps-label">Payment Method</span>
                  <span className="ps-value">{paymentMethod}</span>
                </div>
              </section>

              <section className="ps-card">
                <h2 className="ps-card-title">Booking Summary</h2>

                <div className="ps-row">
                  <span className="ps-label">Service</span>
                  <span className="ps-value">{serviceName || "Booking request submitted"}</span>
                </div>

                <div className="ps-row">
                  <span className="ps-label">Minder</span>
                  <span className="ps-value">{minderName || "Assigned minder"}</span>
                </div>

                <div className="ps-row ps-row--last">
                  <span className="ps-label">Pet</span>
                  <span className="ps-value">{petName || "Pet profile selected"}</span>
                </div>
              </section>

              <section className="ps-card">
                <h2 className="ps-card-title">What Happens Next</h2>

                <div className="ps-step">
                  <span className="ps-step-number">1</span>
                  <p className="ps-step-text">
                    Your booking request and payment have been recorded.
                  </p>
                </div>

                <div className="ps-step">
                  <span className="ps-step-number">2</span>
                  <p className="ps-step-text">
                    You can track your booking status from your bookings page.
                  </p>
                </div>

                <div className="ps-step">
                  <span className="ps-step-number">3</span>
                  <p className="ps-step-text">
                    We will notify you when there is an update from your pet minder.
                  </p>
                </div>
              </section>
            </div>
          </div>

          <div className="ps-footer">
            <button
              type="button"
              className="ps-secondary-btn"
              onClick={() => navigate("/ownerBookings")}
            >
              VIEW BOOKINGS
            </button>

            <button
              type="button"
              className="ps-primary-btn"
              onClick={() => navigate("/ownerHome")}
            >
              DONE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}