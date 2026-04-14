import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Availability.css";

const API_BASE = "http://localhost:3000";

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const TIMES = [
  "06:00","06:30","07:00","07:30","08:00","08:30",
  "09:00","09:30","10:00","10:30","11:00","11:30",
  "12:00","12:30","13:00","13:30","14:00","14:30",
  "15:00","15:30","16:00","16:30","17:00","17:30",
  "18:00","18:30","19:00","19:30","20:00",
];

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const _base = new Date();
const MONTHS = [0, 1, 2].map((offset) => {
  const d = new Date(_base.getFullYear(), _base.getMonth() + offset, 1);
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    shortLabel: d.toLocaleDateString([], { month: "short" }),
    fullLabel: d.toLocaleDateString([], { month: "long", year: "numeric" }),
  };
});

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function buildDatetime(date, timeLabel) {
  const [hours, minutes] = String(timeLabel).split(":").map(Number);

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
}

function timeToMinutes(timeLabel) {
  const [hours, minutes] = String(timeLabel).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatCardDate(isoStr) {
  const d = new Date(isoStr.replace(" ", "T"));
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(isoStr) {
  const d = new Date(isoStr.replace(" ", "T"));
  return d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function buildCalendarCells(year, month) {
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
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

  const [monthTabIdx, setMonthTabIdx] = useState(0);
  const { year, month, fullLabel } = MONTHS[monthTabIdx];

  const [selectedDays, setSelectedDays] = useState(new Set());
  const [deselectedExistingDays, setDeselectedExistingDays] = useState(new Set());

  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("17:00");
  const [startTimeOpen, setStartTimeOpen] = useState(false);
  const [endTimeOpen, setEndTimeOpen] = useState(false);

  const [existingSlots, setExistingSlots] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showSaveOverlay, setShowSaveOverlay] = useState(false);

  const switchTab = (idx) => {
    if (idx === monthTabIdx) return;
    setMonthTabIdx(idx);
    setSelectedDays(new Set());
    setDeselectedExistingDays(new Set());
    setSaveError("");
  };

  const cells = buildCalendarCells(year, month);
  const isCurrentMonth = monthTabIdx === 0;

  const isPastDay = (day) =>
    isCurrentMonth && new Date(year, month, day) < today;

  const refreshSlots = () => {
    fetch(`${API_BASE}/api/minders/me`, { headers: getAuthHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (!profile?.sitterID) return null;
        return fetch(`${API_BASE}/api/minders/${profile.sitterID}`, {
          headers: getAuthHeaders(),
        });
      })
      .then((res) => (res && res.ok ? res.json() : null))
      .then((data) => {
        if (data?.slots) setExistingSlots(data.slots);
      })
      .catch(() => {});
  };

  useEffect(() => {
    refreshSlots();
    const onFocus = () => refreshSlots();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    const unbookedSlots = existingSlots.filter((s) => !s?.isBooked);
    if (!unbookedSlots.length) return;

    const sorted = [...unbookedSlots].sort(
      (a, b) =>
        new Date(a.startTime.replace(" ", "T")) - new Date(b.startTime.replace(" ", "T"))
    );

    const detectedStart = formatTimeOnly(sorted[0].startTime);
    const detectedEnd = formatTimeOnly(sorted[0].endTime);

    if (detectedStart) setStartTime(detectedStart);
    if (detectedEnd) setEndTime(detectedEnd);
  }, [existingSlots]);

  const existingDaysInMonth = useMemo(() => {
    const set = new Set();

    existingSlots.forEach((s) => {
      if (s?.isBooked) return;
      const d = new Date(s.startTime.replace(" ", "T"));
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });

    return set;
  }, [existingSlots, year, month]);

  const bookedDaysInMonth = useMemo(() => {
    const set = new Set();

    existingSlots.forEach((s) => {
      if (!s?.isBooked) return;
      const d = new Date(s.startTime.replace(" ", "T"));
      if (d.getFullYear() === year && d.getMonth() === month) {
        set.add(d.getDate());
      }
    });

    return set;
  }, [existingSlots, year, month]);

  const slotsInViewedMonth = useMemo(() => {
    return existingSlots.filter((s) => {
      if (s?.isBooked) return false;
      const d = new Date(s.startTime.replace(" ", "T"));
      return d.getFullYear() === year && d.getMonth() === month;
    });
  }, [existingSlots, year, month]);

  const currentAvailabilityCardData = useMemo(() => {
    if (slotsInViewedMonth.length === 0) return null;

    const sortedSlots = [...slotsInViewedMonth].sort(
      (a, b) =>
        new Date(a.startTime.replace(" ", "T")) - new Date(b.startTime.replace(" ", "T"))
    );

    const uniqueDates = [];
    const seen = new Set();

    sortedSlots.forEach((slot) => {
      const key = slot.startTime.slice(0, 10);
      if (!seen.has(key)) {
        seen.add(key);
        uniqueDates.push(slot.startTime);
      }
    });

    return {
      dates: uniqueDates,
      startTime: formatTimeOnly(sortedSlots[0].startTime),
      endTime: formatTimeOnly(sortedSlots[0].endTime),
    };
  }, [slotsInViewedMonth]);

  const toggleDay = (day) => {
    setSaveError("");

    if (bookedDaysInMonth.has(day)) {
      setSaveError("That day is already booked and cannot be changed.");
      return;
    }

    if (existingDaysInMonth.has(day) && !deselectedExistingDays.has(day)) {
      setDeselectedExistingDays((prev) => {
        const n = new Set(prev);
        n.add(day);
        return n;
      });
      return;
    }

    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const handleSaveAvailability = async () => {
    setSaveError("");

    const hasNew = selectedDays.size > 0;
    const hasDeselected = deselectedExistingDays.size > 0;

    const allUnbookedExistingDays = existingSlots
      .filter((s) => !s?.isBooked)
      .map((s) => {
        const d = new Date(s.startTime.replace(" ", "T"));
        return {
          year: d.getFullYear(),
          month: d.getMonth(),
          day: d.getDate(),
        };
      });

    const uniqueAllUnbookedDays = [
      ...new Map(
        allUnbookedExistingDays.map((d) => [`${d.year}-${d.month}-${d.day}`, d])
      ).values(),
    ];

    const remainingAllDays = uniqueAllUnbookedDays.filter(
      (d) => !(d.year === year && d.month === month && deselectedExistingDays.has(d.day))
    );

    const currentUnbookedSlots = existingSlots.filter((s) => !s?.isBooked);

    const currentGlobalStartTime =
      currentUnbookedSlots.length > 0 ? formatTimeOnly(currentUnbookedSlots[0].startTime) : null;
    const currentGlobalEndTime =
      currentUnbookedSlots.length > 0 ? formatTimeOnly(currentUnbookedSlots[0].endTime) : null;

    const timeChangedGlobally =
      currentUnbookedSlots.length > 0 &&
      (startTime !== currentGlobalStartTime || endTime !== currentGlobalEndTime);

    if (!hasNew && !hasDeselected && !timeChangedGlobally) {
      setSaveError("No changes were made.");
      return;
    }

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setSaveError("End time must be after start time.");
      return;
    }

    setSaving(true);

    try {
      const bookedSlots = existingSlots.filter((s) => !!s.isBooked);

      if (hasDeselected || timeChangedGlobally) {
        const rebuiltAllUnbookedSlots = remainingAllDays.map((d) => ({
          startTime: buildDatetime(new Date(d.year, d.month, d.day), startTime),
          endTime: buildDatetime(new Date(d.year, d.month, d.day), endTime),
        }));

        const res = await fetch(`${API_BASE}/api/calendar`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            slots: rebuiltAllUnbookedSlots,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update availability.");

        setExistingSlots([...(data.slots || []), ...bookedSlots]);
        setDeselectedExistingDays(new Set());
      }

      if (hasNew) {
        const created = [];

        for (const day of [...selectedDays].sort((a, b) => a - b)) {
          const res = await fetch(`${API_BASE}/api/calendar`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({
              startTime: buildDatetime(new Date(year, month, day), startTime),
              endTime: buildDatetime(new Date(year, month, day), endTime),
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to save availability.");
          created.push(data);
        }

        setExistingSlots((prev) => [...prev, ...created]);
        setSelectedDays(new Set());
      }

      setShowSaveOverlay(true);
      setTimeout(() => {
        setShowSaveOverlay(false);
      }, 2200);
    } catch (err) {
      setSaveError(err.message || "Server error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);

    switch (id) {
      case "dashboard":
        navigate("/mindDash");
        break;
      case "services":
        navigate("/mindService");
        break;
      case "availability":
        navigate("/mindAvailability");
        break;
      case "requests":
        navigate("/mindRequests");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        break;
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
              <div className="av-month-tabs">
                {MONTHS.map((m, idx) => (
                  <button
                    key={m.fullLabel}
                    className={`av-month-tab${monthTabIdx === idx ? " av-month-tab--active" : ""}`}
                    onClick={() => switchTab(idx)}
                    type="button"
                  >
                    {m.shortLabel}
                  </button>
                ))}
              </div>

              <section className="av-section">
                <h2 className="av-section-title">{fullLabel}</h2>

                <div className="av-cal-grid">
                  {WEEK_DAYS.map((d) => (
                    <div key={d} className="av-cal-weekday">
                      {d}
                    </div>
                  ))}

                  {cells.map((day, idx) => {
                    if (!day) {
                      return (
                        <div
                          key={`b${idx}`}
                          className="av-cal-cell av-cal-cell--blank"
                        />
                      );
                    }

                    if (isPastDay(day)) {
                      return (
                        <div key={day} className="av-cal-cell av-cal-cell--past">
                          {day}
                        </div>
                      );
                    }

                    const isExisting =
                      existingDaysInMonth.has(day) && !deselectedExistingDays.has(day);
                    const isSelected = selectedDays.has(day);
                    const isDeselected = deselectedExistingDays.has(day);
                    const isBooked = bookedDaysInMonth.has(day);

                    let cls = "av-cal-cell";
                    if (isBooked) cls += " av-cal-cell--booked";
                    else if (isExisting) cls += " av-cal-cell--existing";
                    else if (isSelected) cls += " av-cal-cell--available av-cal-cell--selected";
                    else if (isDeselected) cls += " av-cal-cell--available";
                    else cls += " av-cal-cell--available";

                    return (
                      <button
                        key={day}
                        className={cls}
                        onClick={() => toggleDay(day)}
                        disabled={isBooked}
                        type="button"
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>

                <div className="av-cal-legend">
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--booked" />
                    Booked
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--available" />
                    Available to Set
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--past" />
                    Past
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--selected" />
                    Selected
                  </span>
                  <span className="av-cal-legend-item">
                    <span className="av-cal-dot av-cal-dot--existing" />
                    Already Set Availability
                  </span>
                </div>
              </section>

              <section className="av-section">
                <h2 className="av-section-title">Working Hours</h2>
                <div className="av-hours-row">
                  <div className="av-time-col">
                    <label className="av-time-label">Start Time</label>
                    <div className="av-select-wrap">
                      <button
                        type="button"
                        className="av-select-btn"
                        onClick={() => {
                          setStartTimeOpen((prev) => !prev);
                          setEndTimeOpen(false);
                        }}
                      >
                        <span>{startTime}</span>
                        <span className={`av-select-arrow${startTimeOpen ? " av-select-arrow--open" : ""}`}>▼</span>
                      </button>

                      {startTimeOpen && (
                        <div className="av-dropdown">
                          {TIMES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`av-dropdown-item${startTime === t ? " av-dropdown-item--active" : ""}`}
                              onClick={() => {
                                setStartTime(t);
                                setStartTimeOpen(false);
                                setSaveError("");
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="av-time-col">
                    <label className="av-time-label">End Time</label>
                    <div className="av-select-wrap">
                      <button
                        type="button"
                        className="av-select-btn"
                        onClick={() => {
                          setEndTimeOpen((prev) => !prev);
                          setStartTimeOpen(false);
                        }}
                      >
                        <span>{endTime}</span>
                        <span className={`av-select-arrow${endTimeOpen ? " av-select-arrow--open" : ""}`}>▼</span>
                      </button>

                      {endTimeOpen && (
                        <div className="av-dropdown">
                          {TIMES.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className={`av-dropdown-item${endTime === t ? " av-dropdown-item--active" : ""}`}
                              onClick={() => {
                                setEndTime(t);
                                setEndTimeOpen(false);
                                setSaveError("");
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {currentAvailabilityCardData && (
                <section className="av-section">
                  <h2 className="av-section-title">Current Availability</h2>

                  <div className="av-availability-card">
                    <div className="av-availability-row">
                      <span className="av-availability-label">Dates</span>
                      <div className="av-availability-value">
                        {currentAvailabilityCardData.dates.map((dateStr, index) => (
                          <div key={`${dateStr}-${index}`}>
                            {formatCardDate(dateStr)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="av-availability-row">
                      <span className="av-availability-label">Time</span>
                      <span className="av-availability-value">
                        {startTime} - {endTime}
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {saveError && <p className="av-error">{saveError}</p>}

              <button
                className="av-save-btn"
                onClick={handleSaveAvailability}
                disabled={saving}
                type="button"
              >
                {saving ? "Saving..." : "Save Availability"}
              </button>
            </div>
          </div>

          {showSaveOverlay && (
            <div className="av-save-overlay">
              <div className="av-save-toast">
                <span className="av-save-toast-icon">✓</span>
                <span className="av-save-toast-text">Availability saved</span>
              </div>
            </div>
          )}

          <nav className="av-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`av-nav-item${activeNav === item.id ? " av-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
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