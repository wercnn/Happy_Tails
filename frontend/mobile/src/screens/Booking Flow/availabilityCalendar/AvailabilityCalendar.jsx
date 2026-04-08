import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AvailabilityCalendar.css";

const MONTH_NAME = "April 2026";
const DAYS_IN_MONTH = 30;
const FIRST_DAY_OF_WEEK = 2; // April 1 2026 = Wednesday (Mo=0)

const UNAVAILABLE = new Set([5, 11, 12, 18, 19, 25, 26, 28]);

function isUnavailable(day) {
  return UNAVAILABLE.has(day);
}

function rangeIsValid(a, b) {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  for (let d = lo; d <= hi; d++) {
    if (UNAVAILABLE.has(d)) return false;
  }
  return true;
}

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function HappyTailsCalendar() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const service = location.state?.service || null;

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
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
    } else {
      if (day === start) {
        setStart(null);
      } else if (rangeIsValid(start, day)) {
        setEnd(day);
      } else {
        setStart(day);
        setEnd(null);
      }
    }

    setHovered(null);
  };

  const getCellClass = (day) => {
    if (isUnavailable(day)) return "cal-cell cal-cell--unavailable";

    const isEndpoint = day === lo || (day === hi && end !== null);
    const inRange = lo && hi && end !== null && day > lo && day < hi;
    const inPreview = prevLo && prevHi && day >= prevLo && day <= prevHi;

    if (isEndpoint) return "cal-cell cal-cell--available cal-cell--endpoint";
    if (inRange) return "cal-cell cal-cell--available cal-cell--in-range";
    if (inPreview) return "cal-cell cal-cell--available cal-cell--preview";

    return "cal-cell cal-cell--available";
  };

  const nightCount = start && end ? Math.abs(end - start) : 0;

  const selectionLabel = !start
    ? ""
    : !end
      ? `${start} Apr — tap end date`
      : `${Math.min(start, end)}–${Math.max(start, end)} Apr · ${nightCount} night${nightCount !== 1 ? "s" : ""}`;

  const cells = [];
  for (let i = 0; i < FIRST_DAY_OF_WEEK; i++) cells.push(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);

  const handleBack = () => {
    navigate("/selectDates", {
      state: {
        minder,
        service,
      },
    });
  };

  const handleConfirmDates = () => {
    if (!end) return;

    navigate("/bookingSummary", {
    state: {
      minder,
      service,
    },
    })
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cal-screen">
          <header className="cal-header">
            <button className="cal-back" onClick={handleBack}>←</button>
            <h1 className="cal-title">Availability Calendar</h1>
          </header>

          <div className="cal-body">
            <h2 className="cal-month">{MONTH_NAME}</h2>

            <p className="cal-instruction">
              {!start
                ? "Tap a start date"
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
                    onMouseEnter={() => start && !end && setHovered(day)}
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
                { key: "available", label: "Available" },
                { key: "unavailable", label: "Unavailable" },
                { key: "selected", label: "Selected" },
              ].map(({ key, label }) => (
                <span key={key} className="cal-legend-item">
                  <span className={`cal-legend-dot cal-legend-dot--${key}`} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="cal-footer">
            {start && (
              <button
                className="cal-clear-btn"
                onClick={() => {
                  setStart(null);
                  setEnd(null);
                }}
              >
                Clear
              </button>
            )}

            <button
              className={`cal-confirm-btn${!end ? " cal-confirm-btn--disabled" : ""}`}
              disabled={!end}
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