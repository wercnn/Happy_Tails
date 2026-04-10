import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";

// NOTE: There is currently no GET endpoint accessible to the minder role that
// returns their own calendar slots. GET /api/minders/:id requires owner role.
// Slots created in this session are shown below; pre-existing slots are not loaded.

const API_BASE = "http://localhost:3000";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Maps day label → JS getDay() value (0 = Sunday)
const DAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

const TIMES = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM",
];

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

// Converts a Date object and a time label ("9:00 AM") → "YYYY-MM-DD HH:MM:SS"
function buildDatetime(date, timeLabel) {
  const [timePart, meridiem] = timeLabel.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function timeToMinutes(timeLabel) {
  const [timePart, meridiem] = timeLabel.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return hours * 60 + minutes;
}

function formatSlotDisplay(isoStr) {
  const d = new Date(isoStr.replace(" ", "T"));
  return d.toLocaleString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Returns the next 7 dates (from tomorrow) whose day-of-week is in selectedDayIndices.
function getUpcomingDates(selectedDayIndices) {
  const dates = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    if (selectedDayIndices.includes(d.getDay())) {
      dates.push(d);
    }
  }
  return dates;
}

export default function HappyTailsAvailability() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("availability");

  const [activeDays, setActiveDays] = useState(["Mon", "Tue", "Wed", "Thu", "Fri"]);
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime, setEndTime] = useState("5:00 PM");

  const [slots, setSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const toggleDay = (day) =>
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const handleSaveAvailability = async () => {
    setSaveError("");

    if (activeDays.length === 0) {
      setSaveError("Please select at least one available day.");
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setSaveError("End time must be after start time.");
      return;
    }

    const selectedIndices = activeDays.map((d) => DAY_INDEX[d]);
    const upcomingDates = getUpcomingDates(selectedIndices);

    if (upcomingDates.length === 0) {
      setSaveError("No upcoming dates found for the selected days.");
      return;
    }

    setSaving(true);
    const created = [];
    const errors = [];

    for (const date of upcomingDates) {
      try {
        const res = await fetch(`${API_BASE}/api/calendar`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            startTime: buildDatetime(date, startTime),
            endTime: buildDatetime(date, endTime),
          }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          errors.push(body.error || `Failed for ${date.toDateString()}`);
        } else {
          const slot = await res.json();
          created.push(slot);
        }
      } catch (err) {
        errors.push(err.message);
      }
    }

    setSlots((prev) => [...prev, ...created]);
    setSaving(false);

    if (errors.length > 0) {
      setSaveError(`Some slots could not be saved: ${errors.join(", ")}`);
    }
  };

  const handleDeleteSlot = async (slotID) => {
    setDeletingId(slotID);
    try {
      const res = await fetch(`${API_BASE}/api/calendar/${slotID}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      setSlots((prev) => prev.filter((s) => s.slotID !== slotID));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard": navigate("/mindDash"); break;
      case "services": navigate("/mindService"); break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests": navigate("/mindRequests"); break;
      case "profile": navigate("/profile"); break;
      default: break;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="av-screen">
          <header className="av-header">
            <h1 className="av-title">Set Availability</h1>
          </header>

          <div className="av-scroll">
            <div className="av-body">

              <section className="av-section">
                <h2 className="av-section-title">Available Days</h2>
                <div className="av-days-grid">
                  {DAYS.map((day) => (
                    <button
                      key={day}
                      className={`av-day-btn${activeDays.includes(day) ? " av-day-btn--active" : ""}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </section>

              <section className="av-section">
                <h2 className="av-section-title">Working Hours</h2>
                <div className="av-hours-row">
                  <div className="av-time-col">
                    <label className="av-time-label">Start Time</label>
                    <div className="av-select-wrap">
                      <select
                        className="av-select"
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          setSaveError("");
                        }}
                      >
                        {TIMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <span className="av-select-arrow">▼</span>
                    </div>
                  </div>
                  <div className="av-time-col">
                    <label className="av-time-label">End Time</label>
                    <div className="av-select-wrap">
                      <select
                        className="av-select"
                        value={endTime}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          setSaveError("");
                        }}
                      >
                        {TIMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <span className="av-select-arrow">▼</span>
                    </div>
                  </div>
                </div>
              </section>

              {slots.length > 0 && (
                <section className="av-section">
                  <h2 className="av-section-title">Created Slots</h2>
                  <div className="av-blocked-list">
                    {slots.map((s) => (
                      <div key={s.slotID} className="av-blocked-chip">
                        <span>{formatSlotDisplay(s.startTime)}</span>
                        <button
                          className="av-blocked-remove"
                          onClick={() => handleDeleteSlot(s.slotID)}
                          disabled={deletingId === s.slotID}
                          aria-label="Remove slot"
                        >
                          {deletingId === s.slotID ? "…" : "×"}
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {saveError && <p className="av-error">{saveError}</p>}

              <button
                className="av-save-btn"
                onClick={handleSaveAvailability}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Availability"}
              </button>

            </div>
          </div>

          <nav className="av-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`av-nav-item${activeNav === item.id ? " av-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="av-nav-emoji">{item.emoji}</span>
                <span className="av-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
