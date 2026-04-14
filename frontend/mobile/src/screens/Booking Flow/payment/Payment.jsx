import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Payment.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function formatMoney(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function getMinderName(minder) {
  if (!minder) return "";
  return (
    minder.name ||
    [minder.firstName, minder.lastName].filter(Boolean).join(" ") ||
    ""
  );
}

function getServiceName(service) {
  if (!service) return "";
  return (
    service.name ||
    service.description ||
    service.title ||
    service?.raw?.name ||
    ""
  );
}

export default function HappyTailsPayment() {
  const navigate = useNavigate();
  const location = useLocation();

  const paymentInfo = location.state?.payment || {};
  const bookingDraft = location.state?.bookingDraft || null;

  const subtotal = Number(paymentInfo.subtotal ?? paymentInfo.amount ?? 0);
  const serviceFee = Number(paymentInfo.serviceFee ?? subtotal * 0.05);
  const total = Number(paymentInfo.total ?? subtotal + serviceFee);

  const [form, setForm] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    postcode: "",
  });

  const [errors, setErrors] = useState({});
  const [isPaying, setIsPaying] = useState(false);

  const paymentBreakdown = useMemo(
    () => [
      { label: "Booking subtotal", value: subtotal },
      { label: "Service fee", value: serviceFee },
    ],
    [subtotal, serviceFee]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    let nextValue = value;

    if (name === "cardNumber") nextValue = formatCardNumber(value);
    if (name === "expiry") nextValue = formatExpiry(value);
    if (name === "cvv") nextValue = value.replace(/\D/g, "").slice(0, 4);

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.cardName.trim()) nextErrors.cardName = "Cardholder name is required.";

    if (form.cardNumber.replace(/\s/g, "").length !== 16) {
      nextErrors.cardNumber = "Enter a valid 16-digit card number.";
    }

    if (!/^\d{2}\/\d{2}$/.test(form.expiry)) {
      nextErrors.expiry = "Enter expiry as MM/YY.";
    }

    if (!/^\d{3,4}$/.test(form.cvv)) {
      nextErrors.cvv = "Enter a valid CVV.";
    }

    if (!form.postcode.trim()) {
      nextErrors.postcode = "Billing postcode is required.";
    }

    if (!bookingDraft) {
      nextErrors.submit = "Missing booking details.";
    }

    return nextErrors;
  };

  const handlePay = async () => {
    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsPaying(true);

      const {
        minder,
        service,
        pet,
        petData,
        notes,
        selectedTime,
        selectedSlots,
        locationPayload,
        meetAndGreet,
        serviceTypeID,
      } = bookingDraft;

      const uniqueSlots = [
        ...new Map(
          (selectedSlots || [])
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .map((slot) => [String(slot.startTime).slice(0, 10), slot])
        ).values(),
      ];

      if (!minder?.sitterID) throw new Error("Missing minder.");
      if (!petData?.petID) throw new Error("Missing pet.");
      if (!serviceTypeID) throw new Error("Missing service.");
      if (!uniqueSlots.length) throw new Error("No booking dates selected.");

      const createdBookings = [];

      for (const slot of uniqueSlots) {
        const bookingRes = await fetch(`${API_BASE}/api/bookings`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            sitterID: minder.sitterID,
            petID: petData.petID,
            slotID: slot.slotID,
            serviceTypeID,
            location: locationPayload,
            ownerNotes: notes || "",
            selectedTime: selectedTime || "",
          }),
        });

        const bookingData = await bookingRes.json();

        if (!bookingRes.ok) {
          throw new Error(bookingData.error || "Failed to create booking.");
        }

        createdBookings.push(bookingData);
      }

      const firstBookingID = createdBookings[0]?.bookingID;

      if (meetAndGreet && firstBookingID) {
        const magRes = await fetch(`${API_BASE}/api/bookings/${firstBookingID}/meet-and-greet`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            scheduledTime: meetAndGreet.scheduledTime,
            isVirtual: meetAndGreet.isVirtual,
            meetingLinkOrLocation: meetAndGreet.meetingLinkOrLocation || null,
            note: meetAndGreet.note || null,
          }),
        });

        if (!magRes.ok) {
          const magErr = await magRes.json().catch(() => ({}));
          console.warn("Meet & greet save failed:", magErr.error);
        }
      }

      const last4 = form.cardNumber.replace(/\s/g, "").slice(-4);
      const maskedPaymentMethod = `card ending ${last4}`;

      for (const booking of createdBookings) {
        const paymentRes = await fetch(`${API_BASE}/api/payments`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            bookingID: booking.bookingID,
            paymentMethod: maskedPaymentMethod,
            platformFeeRate: 0.05,
          }),
        });

        const paymentData = await paymentRes.json();

        if (!paymentRes.ok) {
          throw new Error(paymentData.error || "Failed to save payment.");
        }
      }

      navigate("/paymentSuccess", {
        state: {
          total,
          paymentMethod: `**** **** **** ${last4}`,
          minderName: getMinderName(bookingDraft?.minder),
          serviceName: getServiceName(bookingDraft?.service),
          petName: bookingDraft?.petData?.name || bookingDraft?.pet || "",
        },
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        submit: error.message || "Payment failed. Please try again.",
      }));
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="pay-screen">
          <header className="pay-header">
            <button className="pay-back" type="button" onClick={() => navigate(-1)}>
              ←
            </button>
            <h1 className="pay-title">Payment</h1>
          </header>

          <div className="pay-scroll">
            <div className="pay-body">
              <section className="pay-hero-card">
                <span className="pay-eyebrow">Amount Due</span>
                <h2 className="pay-amount">{formatMoney(total)}</h2>
                <p className="pay-subtext">Complete your payment securely below.</p>
              </section>

              <section className="pay-card">
                <h3 className="pay-card-title">Payment Breakdown</h3>

                {paymentBreakdown.map((item) => (
                  <div className="pay-row" key={item.label}>
                    <span className="pay-label">{item.label}</span>
                    <span className="pay-value">{formatMoney(item.value)}</span>
                  </div>
                ))}

                <div className="pay-row pay-row--total">
                  <span className="pay-label">Total to pay</span>
                  <span className="pay-value">{formatMoney(total)}</span>
                </div>
              </section>

              <section className="pay-card">
                <h3 className="pay-card-title">Card Details</h3>

                <div className="pay-field">
                  <label className="pay-field-label" htmlFor="cardName">
                    Cardholder Name
                  </label>
                  <input
                    id="cardName"
                    name="cardName"
                    type="text"
                    className={`pay-input ${errors.cardName ? "pay-input--error" : ""}`}
                    placeholder="e.g. Sarah Jones"
                    value={form.cardName}
                    onChange={handleChange}
                  />
                  {errors.cardName && <p className="pay-error">{errors.cardName}</p>}
                </div>

                <div className="pay-field">
                  <label className="pay-field-label" htmlFor="cardNumber">
                    Card Number
                  </label>
                  <input
                    id="cardNumber"
                    name="cardNumber"
                    type="text"
                    inputMode="numeric"
                    className={`pay-input ${errors.cardNumber ? "pay-input--error" : ""}`}
                    placeholder="1234 5678 9012 3456"
                    value={form.cardNumber}
                    onChange={handleChange}
                  />
                  {errors.cardNumber && <p className="pay-error">{errors.cardNumber}</p>}
                </div>

                <div className="pay-inline-fields">
                  <div className="pay-field">
                    <label className="pay-field-label" htmlFor="expiry">
                      Expiry
                    </label>
                    <input
                      id="expiry"
                      name="expiry"
                      type="text"
                      inputMode="numeric"
                      className={`pay-input ${errors.expiry ? "pay-input--error" : ""}`}
                      placeholder="MM/YY"
                      value={form.expiry}
                      onChange={handleChange}
                    />
                    {errors.expiry && <p className="pay-error">{errors.expiry}</p>}
                  </div>

                  <div className="pay-field">
                    <label className="pay-field-label" htmlFor="cvv">
                      CVV
                    </label>
                    <input
                      id="cvv"
                      name="cvv"
                      type="password"
                      inputMode="numeric"
                      className={`pay-input ${errors.cvv ? "pay-input--error" : ""}`}
                      placeholder="123"
                      value={form.cvv}
                      onChange={handleChange}
                    />
                    {errors.cvv && <p className="pay-error">{errors.cvv}</p>}
                  </div>
                </div>

                <div className="pay-field">
                  <label className="pay-field-label" htmlFor="postcode">
                    Billing Postcode
                  </label>
                  <input
                    id="postcode"
                    name="postcode"
                    type="text"
                    className={`pay-input ${errors.postcode ? "pay-input--error" : ""}`}
                    placeholder="e.g. SW1A 1AA"
                    value={form.postcode}
                    onChange={handleChange}
                  />
                  {errors.postcode && <p className="pay-error">{errors.postcode}</p>}
                </div>
              </section>

              {errors.submit && <p className="pay-error pay-error--submit">{errors.submit}</p>}
            </div>
          </div>

          <div className="pay-footer">
            <button
              type="button"
              className="pay-button"
              onClick={handlePay}
              disabled={isPaying}
            >
              {isPaying ? "PROCESSING..." : `PAY ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}