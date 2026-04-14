import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./Details.css";

const API_BASE = "http://localhost:3000";

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatDate(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateShort(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr) {
  if (!dateStr) return "Not scheduled";
  return toDate(dateStr).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toBoolean(value) {
  if (value === true || value === 1 || value === "1") return true;
  if (typeof value === "string") {
    const lowered = value.toLowerCase();
    if (lowered === "true" || lowered === "yes") return true;
  }
  return false;
}

function getMeetAndGreetFromItem(item) {
  if (!item) return null;

  if (item.meetAndGreet && typeof item.meetAndGreet === "object") {
    return item.meetAndGreet;
  }

  const hasMeetFields =
    item.meetID ||
    item.scheduledTime ||
    item.meetingLinkOrLocation ||
    item.meetAndGreetStatus ||
    item.meetStatus ||
    item.isVirtual !== undefined;

  if (!hasMeetFields) return null;

  return {
    meetID: item.meetID || null,
    scheduledTime: item.scheduledTime || null,
    isVirtual: toBoolean(item.isVirtual),
    meetingLinkOrLocation: item.meetingLinkOrLocation || null,
    status: item.meetAndGreetStatus || item.meetStatus || "Scheduled",
    note: item.meetAndGreetNote || item.note || null,
  };
}

function getMeetAndGreetStatusLabel(meetAndGreet) {
  if (!meetAndGreet) return "Not scheduled";
  return meetAndGreet.status || "Scheduled";
}

function getOwnerName(item) {
  const full = [item?.ownerFirstName, item?.ownerLastName].filter(Boolean).join(" ").trim();
  return full || item?.ownerName || "Pet owner";
}

function getPetName(item) {
  return item?.petName || item?.pet || item?.name || "Pet";
}

function getServiceName(item) {
  return item?.serviceName || item?.serviceTypeID || "Service";
}

function getStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Pending";
  if (s === "accepted") return "Accepted";
  if (s === "completed") return "Completed";
  if (s === "cancelled") return "Cancelled";
  if (s === "rejected") return "Rejected";
  return status || "Unknown";
}

function getLocationText(item) {
  const parts = [
    item?.street,
    item?.city,
    item?.postcode,
    item?.country,
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Not provided";
}

function getUniqueDates(bookings) {
  const seen = new Set();

  return bookings
    .map((b) => b.startTime)
    .filter((startTime) => {
      const key = String(startTime).slice(0, 10);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => toDate(a) - toDate(b));
}

function getPetProfileFromSources(primary, stateGroup, stateBooking) {
  const pet =
    primary?.petProfile ||
    stateGroup?.petProfile ||
    stateBooking?.petProfile ||
    primary?.pet ||
    stateGroup?.pet ||
    stateBooking?.pet ||
    null;

  return {
    name: pet?.name || primary?.petName || primary?.pet || "Pet",
    species: pet?.species || primary?.petSpecies || primary?.species || "Not provided",
    breed: pet?.breed || primary?.petBreed || primary?.breed || "Not provided",
    age:
      pet?.age !== undefined && pet?.age !== null && String(pet.age).trim() !== ""
        ? String(pet.age)
        : primary?.petAge !== undefined && primary?.petAge !== null && String(primary.petAge).trim() !== ""
        ? String(primary.petAge)
        : primary?.age !== undefined && primary?.age !== null && String(primary.age).trim() !== ""
        ? String(primary.age)
        : "Not provided",
    routines:
      pet?.routines ||
      pet?.notes ||
      primary?.petRoutines ||
      primary?.routines ||
      primary?.petNotes ||
      "No pet notes provided",
    photo:
      pet?.photoURL ||
      pet?.photo ||
      primary?.photoURL ||
      primary?.photo ||
      null,
    medicalDocuments:
      (Array.isArray(pet?.medicalDocuments) && pet.medicalDocuments) ||
      (Array.isArray(primary?.medicalDocuments) && primary.medicalDocuments) ||
      (Array.isArray(stateGroup?.medicalDocuments) && stateGroup.medicalDocuments) ||
      (Array.isArray(stateBooking?.medicalDocuments) && stateBooking.medicalDocuments) ||
      [],
  };
}

export default function HappyTailsRequestDetails() {
  const navigate = useNavigate();
  const location = useLocation();

  const stateGroup = location.state?.requestGroup;
  const stateBookings = location.state?.bookings;
  const stateBooking = location.state?.booking;

  const bookings = useMemo(() => {
    if (Array.isArray(stateGroup?.bookings) && stateGroup.bookings.length > 0) {
      return [...stateGroup.bookings].sort((a, b) => toDate(a.startTime) - toDate(b.startTime));
    }
    if (Array.isArray(stateBookings) && stateBookings.length > 0) {
      return [...stateBookings].sort((a, b) => toDate(a.startTime) - toDate(b.startTime));
    }
    if (stateBooking) {
      return [stateBooking];
    }
    return [];
  }, [stateGroup, stateBookings, stateBooking]);

  const [submitting, setSubmitting] = useState(false);
  const [isRoutinesOpen, setIsRoutinesOpen] = useState(false);

  const primary = bookings[0] || null;
  const uniqueDates = getUniqueDates(bookings);

  const ownerName = getOwnerName(primary);
  const petName = getPetName(primary);
  const serviceName = getServiceName(primary);
  const statusLabel = getStatusLabel(primary?.status);
  const startTimeLabel = primary?.startTime ? formatTime(primary.startTime) : "Not provided";
  const endTimeLabel = primary?.endTime ? formatTime(primary.endTime) : "Not provided";
  const locationText = getLocationText(primary);
  const notes = primary?.ownerNotes || "No notes provided";
  const totalCost = bookings.reduce((sum, b) => sum + Number(b.totalCost || 0), 0);
  const meetAndGreet =
    getMeetAndGreetFromItem(stateGroup) ||
    bookings.map(getMeetAndGreetFromItem).find(Boolean) ||
    null;

  const petProfile = useMemo(
    () => getPetProfileFromSources(primary, stateGroup, stateBooking),
    [primary, stateGroup, stateBooking]
  );

  const handleBack = () => {
    navigate(-1);
  };

  const handleAction = async (action) => {
    if (!primary) return;

    const endpoint = action === "accept" ? "accept" : "reject";
    const bookingID = primary.bookingID;

    if (!bookingID) {
      alert("Missing booking ID.");
      return;
    }

    try {
      setSubmitting(true);

      const res = await fetch(
        `${API_BASE}/api/bookings/${bookingID}/${endpoint}`,
        {
          method: "PATCH",
          headers: getAuthHeaders(),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action} booking.`);
      }

      navigate("/mindRequests");
    } catch (err) {
      alert(err.message || `Could not ${action} booking.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (!primary) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="rd-screen">
            <header className="rd-header">
              <button className="rd-back" onClick={handleBack} type="button">
                ←
              </button>
              <h1 className="rd-title">Request Details</h1>
            </header>

            <div className="rd-body">
              <div className="rd-empty-card">
                <p className="rd-empty-text">No booking details were provided.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="rd-screen">
          <header className="rd-header">
            <button className="rd-back" onClick={() => navigate("/mindRequests")} type="button">
              ←
            </button>
            <h1 className="rd-title">Request Details</h1>
          </header>

          <div className="rd-scroll">
            <div className="rd-body">
              <section className="rd-hero-card">
                <div className="rd-hero-top">
                  <div>
                    <span className="rd-eyebrow">Incoming Request</span>
                    <h2 className="rd-hero-title">{serviceName}</h2>
                  </div>
                  <span className={`rd-status rd-status--${String(primary.status || "").toLowerCase()}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="rd-hero-meta">
                  <div className="rd-chip">Owner: {ownerName}</div>
                  <div className="rd-chip">Pet: {petName}</div>
                  <div className="rd-chip">Start: {startTimeLabel}</div>
                  <div className="rd-chip">End: {endTimeLabel}</div>
                </div>
              </section>

              <section className="rd-card">
                <h3 className="rd-card-title">Pet Information</h3>

                <div className="rd-row">
                  <span className="rd-label">Pet Name</span>
                  <span className="rd-value">{petProfile.name}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Species</span>
                  <span className="rd-value">{petProfile.species}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Breed</span>
                  <span className="rd-value">{petProfile.breed}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Age</span>
                  <span className="rd-value">{petProfile.age}</span>
                </div>

                <div className="rd-row rd-row--top">
                  <span className="rd-label">Routines / Notes</span>

                  <div className="rd-value rd-routines-wrap">
                    <button
                      type="button"
                      className="rd-dropdown-toggle rd-dropdown-toggle--plain"
                      onClick={() => setIsRoutinesOpen((prev) => !prev)}
                      aria-expanded={isRoutinesOpen}
                    >
                      <span
                        className={`rd-dropdown-arrow ${isRoutinesOpen ? "rd-dropdown-arrow--open" : ""}`}
                        aria-hidden="true"
                      >
                        ▼
                      </span>
                    </button>

                    {isRoutinesOpen && (
                      <div className="rd-dropdown-content rd-dropdown-content--plain">
                        <p className="rd-routines-text">{petProfile.routines}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rd-row rd-row--top">
                  <span className="rd-label">Medical Documents</span>
                  <div className="rd-value rd-value--stack">
                    {petProfile.medicalDocuments.length > 0 ? (
                      petProfile.medicalDocuments.map((doc, index) => (
                        <div
                          key={doc.id || doc.docID || doc.url || `${doc.name}-${index}`}
                          className="rd-doc-row"
                        >
                          <span className="rd-doc-name">
                            {doc.name || doc.fileName || `Document ${index + 1}`}
                          </span>

                          {(doc.url || doc.fileURL) ? (
                            <a
                              href={doc.url || doc.fileURL}
                              target="_blank"
                              rel="noreferrer"
                              className="rd-link-btn"
                            >
                              View
                            </a>
                          ) : (
                            <span className="rd-doc-unavailable">Unavailable</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span>No medical documents shared.</span>
                    )}
                  </div>
                </div>
              </section>

              <section className="rd-card">
                <h3 className="rd-card-title">Booking Information</h3>

                <div className="rd-row">
                  <span className="rd-label">Service</span>
                  <span className="rd-value">{serviceName}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Owner</span>
                  <span className="rd-value">{ownerName}</span>
                </div>

                <div className="rd-row rd-row--top">
                  <span className="rd-label">Dates</span>
                  <div className="rd-value rd-value--stack">
                    {uniqueDates.map((dateStr) => (
                      <span key={dateStr}>{formatDate(dateStr)}</span>
                    ))}
                  </div>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Start Time</span>
                  <span className="rd-value">{startTimeLabel}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">End Time</span>
                  <span className="rd-value">{endTimeLabel}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Location</span>
                  <span className="rd-value">{locationText}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Status</span>
                  <span className="rd-value">{statusLabel}</span>
                </div>
              </section>

              <section className="rd-card">
                <h3 className="rd-card-title">Owner Notes</h3>
                <p className="rd-notes">{notes}</p>
              </section>

              <section className="rd-card">
                <h3 className="rd-card-title">Meet &amp; Greet</h3>

                <div className="rd-row">
                  <span className="rd-label">Status</span>
                  <span className="rd-value">{getMeetAndGreetStatusLabel(meetAndGreet)}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Scheduled time</span>
                  <span className="rd-value">{formatDateTime(meetAndGreet?.scheduledTime)}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Type</span>
                  <span className="rd-value">
                    {!meetAndGreet ? "Not set" : meetAndGreet.isVirtual ? "Virtual" : "In-person"}
                  </span>
                </div>

                <div className="rd-row rd-row--top">
                  <span className="rd-label">Link / Location</span>
                  <span className="rd-value">{meetAndGreet?.meetingLinkOrLocation || "Not provided"}</span>
                </div>

                {meetAndGreet?.note && (
                  <div className="rd-row rd-row--top">
                    <span className="rd-label">Notes</span>
                    <span className="rd-value">{meetAndGreet.note}</span>
                  </div>
                )}
              </section>

              <section className="rd-card">
                <h3 className="rd-card-title">Request Summary</h3>

                <div className="rd-row">
                  <span className="rd-label">Dates requested</span>
                  <span className="rd-value">{uniqueDates.length}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Start Time</span>
                  <span className="rd-value">{startTimeLabel}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">End Time</span>
                  <span className="rd-value">{endTimeLabel}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Total amount</span>
                  <span className="rd-value">£{totalCost.toFixed(2)}</span>
                </div>

                <div className="rd-row">
                  <span className="rd-label">Meet &amp; Greet</span>
                  <span className="rd-value">{meetAndGreet ? "Included" : "Not requested"}</span>
                </div>

                <div className="rd-row rd-row--top">
                  <span className="rd-label">Requested dates</span>
                  <div className="rd-value rd-value--stack">
                    {uniqueDates.map((dateStr) => (
                      <span key={`summary-${dateStr}`}>{formatDateShort(dateStr)}</span>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="rd-report-section">
            <button
              className="rd-report-btn"
              onClick={() => navigate("/reportIncident", { state: { booking: primary, bookings } })}
              type="button"
            >
              ⚠ Report an Incident
            </button>
          </div>

          <div className="rd-footer">
            <button
              className="rd-reject-btn"
              onClick={() => handleAction("reject")}
              disabled={submitting || String(primary.status).toLowerCase() !== "pending"}
              type="button"
            >
              {submitting ? "WORKING..." : "Reject"}
            </button>

            <button
              className="rd-accept-btn"
              onClick={() => handleAction("accept")}
              disabled={submitting || String(primary.status).toLowerCase() !== "pending"}
              type="button"
            >
              {submitting ? "WORKING..." : "Accept"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}