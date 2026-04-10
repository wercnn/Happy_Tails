import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Summary.css";

function formatDateLabel(dateKey) {
  if (!dateKey) return "Not selected";

  const [year, month, day] = String(dateKey).split("-").map(Number);
  const d = new Date(year, month - 1, day);

  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatPrice(value) {
  const num = Number(value || 0);
  return `£${num.toFixed(2)}`;
}

function getServicePrice(service) {
  if (!service) return 0;

  const raw =
    service.customPrice ??
    service.price ??
    service.basePrice ??
    0;

  if (typeof raw === "number") return raw;

  return Number(String(raw).replace(/[^\d.]/g, "")) || 0;
}

function getMinderName(minder) {
  if (!minder) return "Unknown minder";

  return (
    minder.name ||
    [minder.firstName, minder.lastName].filter(Boolean).join(" ") ||
    "Unknown minder"
  );
}

function getPetName(petData, pet) {
  if (petData?.name) return petData.name;
  if (pet) return pet;
  return "Not selected";
}

function getLocationLabel(minder, locationState) {
  if (locationState) return locationState;

  const parts = [
    minder?.city,
    minder?.postcode,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Not provided";
}

function BookingSummaryCard({ booking }) {
  return (
    <div className="bs-summary">
      <div className="bs-card">
        <h2 className="bs-card-title">Booking Details</h2>

        <div className="bs-row">
          <span className="bs-label">Service</span>
          <span className="bs-value">{booking.service}</span>
        </div>

        <div className="bs-row">
          <span className="bs-label">Minder</span>
          <span className="bs-value">{booking.minder}</span>
        </div>

        <div className="bs-row">
          <span className="bs-label">Pet</span>
          <span className="bs-value">{booking.pet}</span>
        </div>

        <div className="bs-row bs-row--top">
          <span className="bs-label">Dates</span>
          <div className="bs-dates-list">
            {booking.dates.length > 0 ? (
              booking.dates.map((dateLabel, i) => (
                <span key={`${dateLabel}-${i}`} className="bs-value bs-date-item">
                  {dateLabel}
                </span>
              ))
            ) : (
              <span className="bs-value">No dates selected</span>
            )}
          </div>
        </div>

        <div className="bs-row">
          <span className="bs-label">Time</span>
          <span className="bs-value">{booking.time || "Not selected"}</span>
        </div>

        <div className="bs-row bs-row--last">
          <span className="bs-label">Location</span>
          <span className="bs-value">{booking.location}</span>
        </div>

        {booking.notes ? (
          <div className="bs-row bs-row--last">
            <span className="bs-label">Notes</span>
            <span className="bs-value">{booking.notes}</span>
          </div>
        ) : null}
      </div>

      <div className="bs-card">
        <h2 className="bs-card-title">Cost Breakdown</h2>

        <div className="bs-cost-row">
          <span className="bs-cost-label">{booking.service}</span>
          <span className="bs-cost-value">{formatPrice(booking.serviceCost)}</span>
        </div>

        <div className="bs-cost-row">
          <span className="bs-cost-label">Platform Fee (5%)</span>
          <span className="bs-cost-value">{formatPrice(booking.platformFee)}</span>
        </div>

        <div className="bs-cost-row bs-cost-row--total">
          <span className="bs-total-label">Total</span>
          <span className="bs-total-value">{formatPrice(booking.total)}</span>
        </div>
      </div>
    </div>
  );
}

export default function HappyTailsBookingSummary() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const service = location.state?.service || null;
  const pet = location.state?.pet || "";
  const petData = location.state?.petData || null;
  const notes = location.state?.notes || "";
  const selectedTime = location.state?.selectedTime || location.state?.timeSlot || "";
  const selectedDateKeys = location.state?.selectedDateKeys || [];
  const selectedSlots = location.state?.selectedSlots || [];
  const selectedLocation = location.state?.location || null;

  const booking = useMemo(() => {
    const serviceCost = getServicePrice(service);
    const platformFee = Number((serviceCost * 0.05).toFixed(2));
    const total = Number((serviceCost + platformFee).toFixed(2));

    return {
      service: service?.name || service?.description || "Service not selected",
      minder: getMinderName(minder),
      pet: getPetName(petData, pet),
      dates: selectedDateKeys.map(formatDateLabel),
      time: selectedTime || "Not selected",
      location: getLocationLabel(minder, selectedLocation),
      notes,
      serviceCost,
      platformFee,
      total,
      selectedSlots,
    };
  }, [service, minder, pet, petData, selectedDateKeys, selectedTime, selectedLocation, notes, selectedSlots]);

  const handleBack = () => {
    navigate("/availabilityCalendar", {
      state: {
        minder,
        service,
        pet,
        petData,
        notes,
        timeSlot: selectedTime,
      },
    });
  };

  const handleConfirmBooking = () => {
    navigate("/requestSent", {
      state: {
        minderName: booking.minder,
        serviceName: booking.service,
        petName: booking.pet,
        dates: booking.dates,
        time: booking.time,
        location: booking.location,
        total: booking.total,
        selectedSlots,
      },
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bs-screen">
          <header className="bs-header">
            <button className="bs-back" onClick={handleBack} type="button">←</button>
            <h1 className="bs-title">Booking Summary</h1>
          </header>

          <div className="bs-scroll">
            <div className="bs-body">
              <BookingSummaryCard booking={booking} />
            </div>
          </div>

          <div className="bs-footer">
            <button
              className="bs-confirm-btn"
              onClick={handleConfirmBooking}
              type="button"
              disabled={!service || !minder || selectedDateKeys.length === 0 || !selectedTime}
            >
              CONFIRM BOOKING →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}