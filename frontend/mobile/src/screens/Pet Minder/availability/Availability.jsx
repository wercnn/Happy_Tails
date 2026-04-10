import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";

const API_BASE = "http://localhost:3000";

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const TIMES = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM",
];

const NAV = [
  { id: "dashboard",    emoji: "🏠", label: "Dashboard" },
  { id: "services",     emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests",     emoji: "📬", label: "Requests" },
  { id: "profile",      emoji: "👤", label: "Profile" },
];

// Build the 3 selectable months: current + next 2
const _base = new Date();
const MONTHS = [0, 1, 2].map((offset) => {
  const d = new Date(_base.getFullYear(), _base.getMonth() + offset, 1);
  return {
    year:      d.getFullYear(),
    month:     d.getMonth(),
    shortLabel: d.toLocaleDateString([], { month: "short" }),           // "Apr"
    fullLabel:  d.toLocaleDateString([], { month: "long", year: "numeric" }), // "April 2026"
  };
});

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function buildDatetime(date, timeLabel) {
  const [timePart, meridiem] = timeLabel.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
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
    weekday: "short", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function buildCalendarCells(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset         = (firstDayOfWeek + 6) % 7;
  const daysInMonth    = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}

export default function HappyTailsAvailability() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("availability");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Month tab state ─────────────────────────────────────────────────────
  const [monthTabIdx, setMonthTabIdx] = useState(0);
  const { year, month, fullLabel } = MONTHS[monthTabIdx];

  const switchTab = (idx) => {
    if (idx === monthTabIdx) return;
    setMonthTabIdx(idx);
    setSelectedDays(new Set());
    setSaveError("");
  };

  // ── Calendar state ──────────────────────────────────────────────────────
  const cells    = buildCalendarCells(year, month);
  const isCurrentMonth = monthTabIdx === 0;

  // A day is in the past only when we're viewing the current calendar month
  const isPastDay = (day) =>
    isCurrentMonth && new Date(year, month, day) < today;

  const [selectedDays, setSelectedDays] = useState(new Set());
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime,   setEndTime]   = useState("5:00 PM");

  const [slots,      setSlots]      = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [saveError,  setSaveError]  = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const toggleDay = (day) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
    setSaveError("");
  };

  const handleSaveAvailability = async () => {
    setSaveError("");
    if (selectedDays.size === 0) { setSaveError("Please select at least one day."); return; }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setSaveError("End time must be after start time."); return;
    }

    setSaving(true);
    const slotPayload = [...selectedDays].sort((a, b) => a - b).map((day) => ({
      startTime: buildDatetime(new Date(year, month, day), startTime),
      endTime:   buildDatetime(new Date(year, month, day), endTime),
    }));

    try {
      const res  = await fetch(`${API_BASE}/api/calendar`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ slots: slotPayload }),
      });
      const data = await res.json();
      if (!res.ok) setSaveError(data.error || "Failed to save availability.");
      else         setSlots(data);
    } catch {
      setSaveError("Server error. Please try again.");
    } finally {
      setSaving(false);
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
      case "dashboard":    navigate("/mindDash");         break;
      case "services":     navigate("/mindService");      break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests":     navigate("/mindRequests");     break;
      case "profile":      navigate("/profile");          break;
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

              {/* Month tab toggle */}
              <div className="av-month-tabs">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m.fullLabel}
                    className={`av-month-tab${monthTabIdx === idx ? " av-month-tab--active" : ""}`}
                    onClick={() => switchTab(idx)}
                  >
                    {m.shortLabel}
                  </button>
                ))}
              </div>

              {/* Calendar */}
              <section className="av-section">
                <h2 className="av-section-title">{fullLabel}</h2>

                <div className="av-cal-grid">
                  {WEEK_DAYS.map((d) => (
                    <div key={d} className="av-cal-weekday">{d}</div>
                  ))}

                  {cells.map((day, idx) => {
                    if (!day) return <div key={`b${idx}`} className="av-cal-cell av-cal-cell--blank" />;
                    if (isPastDay(day)) return (
                      <div key={day} className="av-cal-cell av-cal-cell--past">{day}</div>
                    );
                    return (
                      <button
                        key={day}
                        className={`av-cal-cell av-cal-cell--available${selectedDays.has(day) ? " av-cal-cell--selected" : ""}`}
                        onClick={() => toggleDay(day)}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="av-cal-legend">
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--available" />Available
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--past" />Past
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--selected" />Selected
                  </span>
                </div>
              </section>

              {/* Working Hours */}
              <section className="av-section">
                <h2 className="av-section-title">Working Hours</h2>
                <div className="av-hours-row">
                  <div className="av-time-col">
                    <label className="av-time-label">Start Time</label>
                    <div className="av-select-wrap">
                      <select className="av-select" value={startTime}
                        onChange={(e) => { setStartTime(e.target.value); setSaveError(""); }}>
                        {TIMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <span className="av-select-arrow">▼</span>
                    </div>
                  </div>
                  <div className="av-time-col">
                    <label className="av-time-label">End Time</label>
                    <div className="av-select-wrap">
                      <select className="av-select" value={endTime}
                        onChange={(e) => { setEndTime(e.target.value); setSaveError(""); }}>
                        {TIMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <span className="av-select-arrow">▼</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Created Slots */}
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
