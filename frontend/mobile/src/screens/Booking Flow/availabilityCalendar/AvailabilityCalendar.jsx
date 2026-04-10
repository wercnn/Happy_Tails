import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AvailabilityCalendar.css";

const API_BASE = "http://localhost:3000";

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

// "2026-06-01 09:00:00" → Date object
function parseSlotDate(dateStr) {
  return new Date(dateStr.replace(" ", "T"));
}

// year, month (0-based), day → "YYYY-MM-DD"
function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Build blank padding cells + day numbers for a given month
function buildCells(year, month) {
  const firstDow = new Date(year, month, 1).getDay();       // 0 = Sun
  const offset   = (firstDow + 6) % 7;                      // convert to Mo-first
  const total    = new Date(year, month + 1, 0).getDate();   // days in month
  const cells    = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export default function HappyTailsCalendar() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder  = location.state?.minder  || null;
  const service = location.state?.service || null;

  // ── Calendar view state ──────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // ── Slot data ────────────────────────────────────────────────────────────
  const [slots,   setSlots]   = useState([]);   // [{ slotID, startTime, endTime }]
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!minder?.sitterID) {
      setError("No minder selected.");
      setLoading(false);
      return;
    }
    fetch(`${API_BASE}/api/minders/${minder.sitterID}/slots`, {
      headers: getAuthHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load slots (${res.status})`);
        return res.json();
      })
      .then((data) => setSlots(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [minder?.sitterID]);

  // Set of "YYYY-MM-DD" strings that have at least one available slot
  const availableDateKeys = useMemo(() => {
    const set = new Set();
    slots.forEach((s) => {
      const d = parseSlotDate(s.startTime);
      set.add(toDateKey(d.getFullYear(), d.getMonth(), d.getDate()));
    });
    return set;
  }, [slots]);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const isUnavailable = (day) => {
    const cellDate = new Date(viewYear, viewMonth, day);
    if (cellDate < today) return true;                                 // past date
    return !availableDateKeys.has(toDateKey(viewYear, viewMonth, day)); // no slot
  };

  const rangeIsValid = (a, b) => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    for (let d = lo; d <= hi; d++) {
      if (isUnavailable(d)) return false;
    }
    return true;
  };

  // Return all slots whose date falls in [startDay, endDay] for the viewed month
  const getSlotsForRange = (startDay, endDay) => {
    const lo = Math.min(startDay, endDay);
    const hi = Math.max(startDay, endDay);
    return slots.filter((s) => {
      const d = parseSlotDate(s.startTime);
      if (d.getFullYear() !== viewYear || d.getMonth() !== viewMonth) return false;
      return d.getDate() >= lo && d.getDate() <= hi;
    });
  };

  // ── Selection state ──────────────────────────────────────────────────────
  const [start,   setStart]   = useState(null);
  const [end,     setEnd]     = useState(null);
  const [hovered, setHovered] = useState(null);

  const lo = start && end ? Math.min(start, end) : start;
  const hi = start && end ? Math.max(start, end) : start;

  const prevLo = start && !end && hovered ? Math.min(start, hovered) : null;
  const prevHi = start && !end && hovered ? Math.max(start, hovered) : null;

  const handleDay = (day) => {
    if (isUnavailable(day)) return;

    if (!start || (start && end)) {
      setStart(day);
      setEnd(null);
    } else if (day === start) {
      setStart(null);
    } else if (rangeIsValid(start, day)) {
      setEnd(day);
    } else {
      setStart(day);
      setEnd(null);
    }
    setHovered(null);
  };

  const getCellClass = (day) => {
    if (isUnavailable(day)) return "cal-cell cal-cell--unavailable";

    const isEndpoint = day === lo || (day === hi && end !== null);
    const inRange    = lo && hi && end !== null && day > lo && day < hi;
    const inPreview  = prevLo && prevHi && day >= prevLo && day <= prevHi;

    if (isEndpoint) return "cal-cell cal-cell--available cal-cell--endpoint";
    if (inRange)    return "cal-cell cal-cell--available cal-cell--in-range";
    if (inPreview)  return "cal-cell cal-cell--available cal-cell--preview";
    return "cal-cell cal-cell--available";
  };

  // ── Month navigation ─────────────────────────────────────────────────────
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString([], {
    month: "long",
    year:  "numeric",
  });

  const goToPrevMonth = () => {
    setStart(null); setEnd(null);
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };

  const goToNextMonth = () => {
    setStart(null); setEnd(null);
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };

  // Disable "previous" if we're already at the current month
  const isCurrentMonth =
    viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const cells      = buildCells(viewYear, viewMonth);
  const nightCount = start && end ? Math.abs(end - start) : 0;

  const shortMonth = new Date(viewYear, viewMonth, 1).toLocaleDateString([], { month: "short" });

  const selectionLabel = !start
    ? ""
    : !end
      ? `${start} ${shortMonth} — tap end date`
      : `${Math.min(start, end)}–${Math.max(start, end)} ${shortMonth} · ${nightCount} night${nightCount !== 1 ? "s" : ""}`;

  // ── Navigation ───────────────────────────────────────────────────────────
  const handleBack = () =>
    navigate("/selectDates", { state: { minder, service } });

  const handleConfirmDates = () => {
    if (!start) return;

    const endDay = end ?? start;
    const selectedSlots = getSlotsForRange(start, endDay);

    navigate("/bookingSummary", {
      state: {
        minder,
        service,
        selectedSlots,
        startDay:   Math.min(start, endDay),
        endDay:     Math.max(start, endDay),
        viewYear,
        viewMonth,
      },
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cal-screen">
          <header className="cal-header">
            <button className="cal-back" onClick={handleBack}>←</button>
            <h1 className="cal-title">Availability Calendar</h1>
          </header>

          <div className="cal-body">
            {/* Month header with navigation */}
            <div className="cal-month-nav">
              <button
                className="cal-month-arrow"
                onClick={goToPrevMonth}
                disabled={isCurrentMonth}
                aria-label="Previous month"
              >
                ‹
              </button>
              <h2 className="cal-month">{monthLabel}</h2>
              <button
                className="cal-month-arrow"
                onClick={goToNextMonth}
                aria-label="Next month"
              >
                ›
              </button>
            </div>

            {loading && <p className="cal-status">Loading availability…</p>}
            {error   && <p className="cal-status cal-status--error">{error}</p>}

            {!loading && !error && (
              <>
                <p className="cal-instruction">
                  {!start
                    ? "Tap an available date to start"
                    : !end
                      ? "Now tap an end date"
                      : selectionLabel}
                </p>

                <div className="cal-grid">
                  {WEEK_DAYS.map((d) => (
                    <div key={d} className="cal-weekday">{d}</div>
                  ))}

                  {cells.map((day, idx) =>
                    !day ? (
                      <div key={`b${idx}`} className="cal-cell cal-cell--blank" />
                    ) : (
                      <button
                        key={day}
                        className={getCellClass(day)}
                        onClick={() => handleDay(day)}
                        onMouseEnter={() => start && !end && !isUnavailable(day) && setHovered(day)}
                        onMouseLeave={() => setHovered(null)}
                        disabled={isUnavailable(day)}
                      >
                        {day}
                      </button>
                    )
                  )}
                </div>

                <div className="cal-legend">
                  {[
                    { key: "available",   label: "Available" },
                    { key: "unavailable", label: "Unavailable" },
                    { key: "selected",    label: "Selected" },
                  ].map(({ key, label }) => (
                    <span key={key} className="cal-legend-item">
                      <span className={`cal-legend-dot cal-legend-dot--${key}`} />
                      {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="cal-footer">
            {start && (
              <button
                className="cal-clear-btn"
                onClick={() => { setStart(null); setEnd(null); }}
              >
                Clear
              </button>
            )}
            <button
              className={`cal-confirm-btn${!start ? " cal-confirm-btn--disabled" : ""}`}
              disabled={!start}
              onClick={handleConfirmDates}
            >
              CONFIRM DATES →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
