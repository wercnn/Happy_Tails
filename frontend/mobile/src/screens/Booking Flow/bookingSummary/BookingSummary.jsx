import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookingSummary.css";

function formatMoney(value) {
  return `£${Number(value || 0).toFixed(2)}`;
}

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

function formatMeetAndGreetTime(isoStr) {
  if (!isoStr) return "Not arranged";
  const d = new Date(isoStr);

  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getServiceTypeId(service) {
  return (
    service?.serviceTypeID ||
    service?.serviceTypeId ||
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
    service.customPrice ??
    service.price ??
    service.basePrice ??
    service?.raw?.customPrice ??
    service?.raw?.price ??
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
  if (typeof locationState === "string" && locationState.trim()) {
    return locationState;
  }

  if (locationState && typeof locationState === "object") {
    const parts = [
      locationState.street,
      locationState.city,
      locationState.postcode,
      locationState.country,
    ].filter(Boolean);

    if (parts.length) return parts.join(", ");
  }

  const parts = [minder?.city, minder?.postcode].filter(Boolean);
  return parts.length ? parts.join(", ") : "Not provided";
}

function getLocationPayload(minder, locationState) {
  if (locationState && typeof locationState === "object") {
    return {
      postcode: locationState.postcode || minder?.postcode || "Unknown",
      street: locationState.street || null,
      city: locationState.city || minder?.city || null,
      county: locationState.county || null,
      country: locationState.country || "UK",
    };
  }

  return {
    postcode: minder?.postcode || "Unknown",
    street: null,
    city: minder?.city || null,
    county: null,
    country: "UK",
  };
}

function SummaryCard({ title, onEdit, children }) {
  return (
    <section className="bks-card">
      <div className="bks-card-head">
        <h2 className="bks-card-title">{title}</h2>
        {onEdit && (
          <button type="button" className="bks-edit-btn" onClick={onEdit}>
            Edit
          </button>
        )}
      </div>
      <div className="bks-card-body">{children}</div>
    </section>
  );
}

function SummaryRow({ label, value, stacked = false }) {
  return (
    <div className={`bks-row${stacked ? " bks-row--top" : ""}`}>
      <span className="bks-label">{label}</span>
      <div className={`bks-value${stacked ? " bks-value--stack" : ""}`}>
        {Array.isArray(value)
          ? value.map((item, index) => <span key={`${label}-${index}`}>{item}</span>)
          : <span>{value}</span>}
      </div>
    </div>
  );
}

export default function BookingSummary() {
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
  const meetAndGreet = location.state?.meetAndGreet || null;

  const [submitting, setSubmitting] = useState(false);

  const sharedState = {
    minder,
    service,
    pet,
    petData,
    notes,
    selectedTime,
    selectedDateKeys,
    selectedSlots,
    location: selectedLocation,
    meetAndGreet,
    returnToSummary: true,
  };

  const booking = useMemo(() => {
    const pricePerDay = getServicePrice(service);
    const dayCount = Math.max(selectedDateKeys.length, 1);
    const serviceCost = Number((pricePerDay * dayCount).toFixed(2));
    const platformFee = Number((serviceCost * 0.05).toFixed(2));
    const total = Number((serviceCost + platformFee).toFixed(2));

    return {
      service: getServiceName(service),
      minder: getMinderName(minder),
      pet: getPetName(petData, pet),
      dates: selectedDateKeys.map(formatDateLabel),
      time: selectedTime || "Not selected",
      location: getLocationLabel(minder, selectedLocation),
      notes: notes || "No notes added",
      meetAndGreet,
      dayCount,
      serviceCost,
      platformFee,
      total,
    };
  }, [service, minder, petData, pet, selectedDateKeys, selectedTime, selectedLocation, notes, meetAndGreet]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEditService = () => {
    navigate("/selectService", {
      state: sharedState,
    });
  };

  const handleEditDateTime = () => {
    navigate("/selectDates", {
      state: sharedState,
    });
  };

  const handleEditMeetAndGreet = () => {
    navigate("/meetAndGreet", {
      state: sharedState,
    });
  };

  const handleEditPetAndNotes = () => {
    navigate("/selectDates", {
      state: sharedState,
    });
  };

  const handleGoToPayment = async () => {
    try {
      setSubmitting(true);

      const serviceTypeID = getServiceTypeId(service);
      if (!minder?.sitterID) throw new Error("Missing minder.");
      if (!serviceTypeID) throw new Error("Missing service.");
      if (!petData?.petID) throw new Error("Missing pet.");
      if (!selectedSlots?.length) throw new Error("No dates selected.");
      if (!selectedTime) throw new Error("Missing selected time.");

      const locationPayload = getLocationPayload(minder, selectedLocation);

      navigate("/payment", {
        state: {
          payment: {
            subtotal: booking.serviceCost,
            serviceFee: booking.platformFee,
            tax: 0,
            total: booking.total,
          },
          bookingDraft: {
            minder,
            service,
            pet,
            petData,
            notes,
            selectedTime,
            selectedDateKeys,
            selectedSlots,
            selectedLocation,
            locationPayload,
            meetAndGreet,
            serviceTypeID,
          },
        },
      });
    } catch (err) {
      alert(err.message || "Could not continue to payment.");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisabled =
    submitting ||
    !minder?.sitterID ||
    !getServiceTypeId(service) ||
    !petData?.petID ||
    selectedDateKeys.length === 0 ||
    !selectedTime ||
    selectedSlots.length === 0;

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bks-screen">
          <header className="bks-header">
            <button className="bks-back" onClick={handleBack} type="button">
              ←
            </button>
            <h1 className="bks-title">Review Booking</h1>
          </header>

          <div className="bks-scroll">
            <div className="bks-body">
              <section className="bks-hero-card">
                <span className="bks-eyebrow">Before you pay</span>
                <h2 className="bks-hero-title">Check your booking details</h2>
                <p className="bks-hero-text">
                  You can update any section below without restarting the booking process.
                </p>
              </section>

              <SummaryCard title="Service" onEdit={handleEditService}>
                <SummaryRow label="Service" value={booking.service} />
                <SummaryRow label="Minder" value={booking.minder} />
              </SummaryCard>

              <SummaryCard title="Date & Time" onEdit={handleEditDateTime}>
                <SummaryRow
                  label="Dates"
                  value={booking.dates.length ? booking.dates : ["No dates selected"]}
                  stacked
                />
                <SummaryRow label="Chosen time" value={booking.time} />
                <SummaryRow label="Location" value={booking.location} />
              </SummaryCard>

              <SummaryCard title="Pet & Notes" onEdit={handleEditPetAndNotes}>
                <SummaryRow label="Pet" value={booking.pet} />
                <SummaryRow label="Notes" value={booking.notes} stacked />
              </SummaryCard>

              <SummaryCard title="Meet & Greet" onEdit={handleEditMeetAndGreet}>
                <SummaryRow
                  label="Included"
                  value={booking.meetAndGreet ? "Yes" : "No"}
                />
                {booking.meetAndGreet ? (
                  <>
                    <SummaryRow
                      label="Type"
                      value={booking.meetAndGreet.isVirtual ? "Virtual" : "In-person"}
                    />
                    <SummaryRow
                      label="When"
                      value={formatMeetAndGreetTime(booking.meetAndGreet.scheduledTime)}
                    />
                    <SummaryRow
                      label={booking.meetAndGreet.isVirtual ? "Link" : "Location"}
                      value={booking.meetAndGreet.meetingLinkOrLocation || "To be confirmed"}
                      stacked
                    />
                  </>
                ) : null}
              </SummaryCard>

              <SummaryCard title="Price Summary">
                <SummaryRow label="Days booked" value={booking.dayCount} />
                <SummaryRow label="Service subtotal" value={formatMoney(booking.serviceCost)} />
                <SummaryRow label="Platform fee (5%)" value={formatMoney(booking.platformFee)} />
                <div className="bks-total-row">
                  <span className="bks-total-label">Total</span>
                  <span className="bks-total-value">{formatMoney(booking.total)}</span>
                </div>
              </SummaryCard>
            </div>
          </div>

          <div className="bks-footer">
            <button
              className="bks-confirm-btn"
              onClick={handleGoToPayment}
              type="button"
              disabled={confirmDisabled}
            >
              {submitting ? "LOADING..." : "CONTINUE TO PAYMENT →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}