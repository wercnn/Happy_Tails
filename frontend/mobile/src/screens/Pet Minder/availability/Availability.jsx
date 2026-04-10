import { useEffect, useMemo, useState } from "react";
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
    shortLabel: d.toLocaleDateString([], { month: "short" }),
    fullLabel:  d.toLocaleDateString([], { month: "long", year: "numeric" }),
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
    setDeselectedExistingDays(new Set());
    setSaveError("");
  };

  // ── Calendar state ──────────────────────────────────────────────────────
  const cells         = buildCalendarCells(year, month);
  const isCurrentMonth = monthTabIdx === 0;

  const isPastDay = (day) =>
    isCurrentMonth && new Date(year, month, day) < today;

  const [selectedDays,          setSelectedDays]          = useState(new Set());
  // Days that were already saved (blue) but the user clicked to deselect
  const [deselectedExistingDays, setDeselectedExistingDays] = useState(new Set());
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime,   setEndTime]   = useState("5:00 PM");

  const [existingSlots, setExistingSlots] = useState([]);
  const [saving,        setSaving]        = useState(false);
  const [saveError,     setSaveError]     = useState("");
  const [deletingId,    setDeletingId]    = useState(null);

  useEffect(() => {
    // Step 1: get this minder's sitterID
    fetch(`${API_BASE}/api/minders/me`, { headers: getAuthHeaders() })
      .then((res) => res.ok ? res.json() : null)
      .then((profile) => {
        if (!profile?.sitterID) return;
        // Step 2: fetch their full profile which includes the slots array
        return fetch(`${API_BASE}/api/minders/${profile.sitterID}`, { headers: getAuthHeaders() });
      })
      .then((res) => res && res.ok ? res.json() : null)
      .then((data) => { if (data?.slots) setExistingSlots(data.slots); })
      .catch(() => {});
  }, []);

  // Day numbers in the viewed month that already have saved slots (and not deselected by the user)
  const existingDaysInMonth = useMemo(() => {
    const set = new Set();
    existingSlots.forEach((s) => {
      const d = new Date(s.startTime.replace(" ", "T"));
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });
    return set;
  }, [existingSlots, year, month]);

  // Three-state toggle:
  //   blue (existing, not deselected) → click → available  (add to deselectedExistingDays)
  //   available → click → selected   (add to selectedDays)
  //   selected → click → available   (remove from selectedDays)
  const toggleDay = (day) => {
    setSaveError("");
    if (existingDaysInMonth.has(day) && !deselectedExistingDays.has(day)) {
      // Deselect an already-saved day
      setDeselectedExistingDays((prev) => { const n = new Set(prev); n.add(day); return n; });
      return;
    }
    // Toggle in selectedDays (covers both plain-available and formerly-existing-now-deselected days)
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day); else next.add(day);
      return next;
    });
  };

  const handleSaveAvailability = async () => {
    setSaveError("");
    const hasNew        = selectedDays.size > 0;
    const hasDeselected = deselectedExistingDays.size > 0;

    if (!hasNew && !hasDeselected) {
      setSaveError("Please select at least one day or deselect a saved day to remove it.");
      return;
    }
    if (hasNew && timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setSaveError("End time must be after start time.");
      return;
    }

    setSaving(true);
    try {
      // ── 1. Delete deselected existing slots ──
      if (hasDeselected) {
        const toDelete = existingSlots.filter((s) => {
          const d = new Date(s.startTime.replace(" ", "T"));
          return d.getFullYear() === year && d.getMonth() === month
            && deselectedExistingDays.has(d.getDate());
        });
        for (const s of toDelete) {
          const res = await fetch(`${API_BASE}/api/calendar/${s.slotID}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error || `Failed to delete slot (${res.status})`);
          }
        }
        setExistingSlots((prev) => prev.filter((s) => {
          const d = new Date(s.startTime.replace(" ", "T"));
          return !(d.getFullYear() === year && d.getMonth() === month
            && deselectedExistingDays.has(d.getDate()));
        }));
        setDeselectedExistingDays(new Set());
      }

      // ── 2. POST new slots one by one (preserves other months' slots) ──
      if (hasNew) {
        const created = [];
        for (const day of [...selectedDays].sort((a, b) => a - b)) {
          const res = await fetch(`${API_BASE}/api/calendar`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              startTime: buildDatetime(new Date(year, month, day), startTime),
              endTime:   buildDatetime(new Date(year, month, day), endTime),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to save availability.");
          created.push(data);
        }
        setExistingSlots((prev) => [...prev, ...created]);
        setSelectedDays(new Set());
      }
    } catch (err) {
      setSaveError(err.message || "Server error. Please try again.");
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
      setExistingSlots((prev) => prev.filter((s) => s.slotID !== slotID));
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Slots saved in the currently viewed month (for the "Saved Slots" list)
  const slotsInViewedMonth = existingSlots.filter((s) => {
    const d = new Date(s.startTime.replace(" ", "T"));
    return d.getFullYear() === year && d.getMonth() === month;
  });

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

                    const isExisting   = existingDaysInMonth.has(day) && !deselectedExistingDays.has(day);
                    const isSelected   = selectedDays.has(day);
                    const isDeselected = deselectedExistingDays.has(day);

                    let cls = "av-cal-cell";
                    if (isExisting)        cls += " av-cal-cell--existing";
                    else if (isSelected)   cls += " av-cal-cell--available av-cal-cell--selected";
                    else if (isDeselected) cls += " av-cal-cell--available";
                    else                   cls += " av-cal-cell--available";

                    return (
                      <button
                        key={day}
                        className={cls}
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
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--existing" />Already Set
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

              {/* Saved Slots for this month */}
              {slotsInViewedMonth.length > 0 && (
                <section className="av-section">
                  <h2 className="av-section-title">Saved Slots</h2>
                  <div className="av-blocked-list">
                    {slotsInViewedMonth.map((s) => (
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
