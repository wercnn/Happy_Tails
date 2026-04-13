import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Summary.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function formatDateLabel(dateKey) {
  if (!dateKey) return "Not selected";
  const [year, month, day] = String(dateKey).split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function formatMeetAndGreetTime(isoStr) {
  if (!isoStr) return "";
  const d = new Date(isoStr);
  return d.toLocaleString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatPrice(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

function getServiceTypeId(service) {
  return (
    service?.serviceTypeID  ||
    service?.serviceTypeId  ||
    service?.raw?.serviceTypeID ||
    service?.raw?.serviceTypeId ||
    service?.id ||
    null
  );
}

function getServiceName(service) {
  return (
    service?.name ||
    service?.description ||
    service?.title ||
    service?.raw?.name ||
    "Service not selected"
  );
}

function getServicePrice(service) {
  if (!service) return 0;
  const raw =
    service.customPrice   ??
    service.price         ??
    service.basePrice     ??
    service?.raw?.customPrice ??
    service?.raw?.price   ??
    service?.raw?.basePrice ??
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
  if (typeof locationState === "string" && locationState.trim()) return locationState;
  if (locationState && typeof locationState === "object") {
    const parts = [locationState.street, locationState.city, locationState.postcode, locationState.country].filter(Boolean);
    if (parts.length) return parts.join(", ");
  }
  const parts = [minder?.city, minder?.postcode].filter(Boolean);
  return parts.length ? parts.join(", ") : "Not provided";
}

function getLocationPayload(minder, locationState) {
  if (locationState && typeof locationState === "object") {
    return {
      postcode: locationState.postcode || minder?.postcode || "Unknown",
      street:   locationState.street   || null,
      city:     locationState.city     || minder?.city || null,
      county:   locationState.county   || null,
      country:  locationState.country  || "UK",
    };
  }
  return {
    postcode: minder?.postcode || "Unknown",
    street:   null,
    city:     minder?.city || null,
    county:   null,
    country:  "UK",
  };
}

function MeetAndGreetCard({ mag }) {
  return (
    <div className="bs-card">
      <h2 className="bs-card-title">Meet &amp; Greet</h2>

      <div className="bs-row">
        <span className="bs-label">Type</span>
        <span className="bs-value">{mag.isVirtual ? "💻 Virtual" : "🏠 In-Person"}</span>
      </div>

      <div className="bs-row">
        <span className="bs-label">Date &amp; Time</span>
        <span className="bs-value">{formatMeetAndGreetTime(mag.scheduledTime)}</span>
      </div>

      {mag.meetingLinkOrLocation && (
        <div className="bs-row">
          <span className="bs-label">{mag.isVirtual ? "Link" : "Location"}</span>
          <span className="bs-value bs-value--wrap">{mag.meetingLinkOrLocation}</span>
        </div>
      )}

      {mag.note && (
        <div className="bs-row bs-row--last bs-row--top">
          <span className="bs-label">Note</span>
          <span className="bs-value bs-value--wrap">{mag.note}</span>
        </div>
      )}

      {!mag.meetingLinkOrLocation && !mag.note && (
        <div className="bs-row bs-row--last">
          <span className="bs-label">Details</span>
          <span className="bs-value">To be confirmed</span>
        </div>
      )}
    </div>
  );
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
                <span key={`${dateLabel}-${i}`} className="bs-value bs-date-item">{dateLabel}</span>
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

        <div className="bs-row">
          <span className="bs-label">Location</span>
          <span className="bs-value">{booking.location}</span>
        </div>

        <div className="bs-row bs-row--last">
          <span className="bs-label">Meet &amp; Greet</span>
          <span className="bs-value">{booking.meetAndGreet ? "✅ Yes" : "—"}</span>
        </div>

        {booking.notes ? (
          <div className="bs-row bs-row--last" style={{ borderTop: "1px solid rgba(238,139,40,0.1)", marginTop: 0 }}>
            <span className="bs-label">Notes</span>
            <span className="bs-value">{booking.notes}</span>
          </div>
        ) : null}
      </div>

      {booking.meetAndGreet && <MeetAndGreetCard mag={booking.meetAndGreet} />}

      <div className="bs-card">
        <h2 className="bs-card-title">Cost Breakdown</h2>

        <div className="bs-cost-row">
          <span className="bs-cost-label">
            {booking.service}
            {booking.dayCount > 1 ? ` × ${booking.dayCount} days` : ""}
          </span>
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
  const navigate  = useNavigate();
  const location  = useLocation();

  const minder           = location.state?.minder           || null;
  const service          = location.state?.service          || null;
  const pet              = location.state?.pet              || "";
  const petData          = location.state?.petData          || null;
  const notes            = location.state?.notes            || "";
  const selectedTime     = location.state?.selectedTime     || location.state?.timeSlot || "";
  const selectedDateKeys = location.state?.selectedDateKeys || [];
  const selectedSlots    = location.state?.selectedSlots    || [];
  const selectedLocation = location.state?.location         || null;
  const meetAndGreet     = location.state?.meetAndGreet     || null;

  const [submitting, setSubmitting] = useState(false);

  const booking = useMemo(() => {
    const pricePerDay  = getServicePrice(service);
    const dayCount     = Math.max(selectedDateKeys.length, 1);
    const serviceCost  = Number((pricePerDay * dayCount).toFixed(2));
    const platformFee  = Number((serviceCost * 0.05).toFixed(2));
    const total        = Number((serviceCost + platformFee).toFixed(2));

    return {
      service:      getServiceName(service),
      minder:       getMinderName(minder),
      pet:          getPetName(petData, pet),
      dates:        selectedDateKeys.map(formatDateLabel),
      time:         selectedTime || "Not selected",
      location:     getLocationLabel(minder, selectedLocation),
      notes,
      meetAndGreet,
      dayCount,
      serviceCost,
      platformFee,
      total,
    };
  }, [service, minder, petData, pet, selectedDateKeys, selectedTime, selectedLocation, notes, meetAndGreet]);

  const handleBack = () => {
    navigate("/meetAndGreet", {
      state: { minder, service, selectedSlots, selectedTime, selectedDateKeys, pet, petData, notes },
    });
  };

  const handleConfirmBooking = async () => {
    try {
      setSubmitting(true);

      const serviceTypeID   = getServiceTypeId(service);
      if (!minder?.sitterID)     throw new Error("Missing minder.");
      if (!serviceTypeID)        throw new Error("Missing service.");
      if (!petData?.petID)       throw new Error("Missing pet.");
      if (!selectedSlots?.length) throw new Error("No dates selected.");
      if (!selectedTime)         throw new Error("Missing selected time.");

      const locationPayload = getLocationPayload(minder, selectedLocation);

      const uniqueSlots = [
        ...new Map(
          selectedSlots
            .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
            .map((slot) => [String(slot.startTime).slice(0, 10), slot])
        ).values(),
      ];

      let firstBookingID = null;

      for (const slot of uniqueSlots) {
        const res = await fetch(`${API_BASE}/api/bookings`, {
          method:  "POST",
          headers: getAuthHeaders(),
          body:    JSON.stringify({
            sitterID:     minder.sitterID,
            petID:        petData.petID,
            slotID:       slot.slotID,
            serviceTypeID,
            location:     locationPayload,
            ownerNotes:   notes || "",
            selectedTime: selectedTime || "",
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to send booking request.");
        if (!firstBookingID) firstBookingID = data.bookingID;
      }

      // Save meet & greet linked to the first booking
      if (meetAndGreet && firstBookingID) {
        const magRes = await fetch(`${API_BASE}/api/bookings/${firstBookingID}/meet-and-greet`, {
          method:  "POST",
          headers: getAuthHeaders(),
          body:    JSON.stringify({
            scheduledTime:        meetAndGreet.scheduledTime,
            isVirtual:            meetAndGreet.isVirtual,
            meetingLinkOrLocation: meetAndGreet.meetingLinkOrLocation || null,
            note:                 meetAndGreet.note || null,
          }),
        });
        if (!magRes.ok) {
          const err = await magRes.json().catch(() => ({}));
          console.warn("Meet & greet save failed:", err.error);
        }
      }

      navigate("/requestSent", {
        state: {
          minderName: booking.minder,
          serviceName: booking.service,
          petName:     booking.pet,
          dates:       booking.dates,
          time:        booking.time,
          location:    booking.location,
          total:       booking.total,
        },
      });
    } catch (err) {
      alert(err.message || "Could not send booking request.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisabled =
    submitting                  ||
    !minder?.sitterID           ||
    !getServiceTypeId(service)  ||
    !petData?.petID             ||
    selectedDateKeys.length === 0 ||
    !selectedTime               ||
    selectedSlots.length === 0;

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
              disabled={confirmDisabled}
            >
              {submitting ? "SENDING..." : "CONFIRM BOOKING →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
