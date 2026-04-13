import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AvailabilityCalendar.css";

const API_BASE = "http://localhost:3000";

const WEEK_DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

// Build the 3 selectable months: current + next 2
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

function parseSlotDate(dateStr) {
  return new Date(dateStr.replace(" ", "T"));
}

function toDateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildCells(year, month) {
  const firstDow = new Date(year, month, 1).getDay();
  const offset = (firstDow + 6) % 7;
  const total = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

function timeLabelToMinutes(label) {
  if (!label) return null;

  const [timePart, meridiem] = label.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function dateToMinutes(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function formatSelectedDates(dateKeys) {
  return [...dateKeys]
    .sort()
    .map((key) => {
      const [year, month, day] = key.split("-").map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    })
    .join(", ");
}

export default function HappyTailsCalendar() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const service = location.state?.service || null;
  const timeSlot = location.state?.timeSlot || null;
  const pet = location.state?.pet || "";
  const petData = location.state?.petData || null;
  const notes = location.state?.notes || "";

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [monthTabIdx, setMonthTabIdx] = useState(0);
  const { year: viewYear, month: viewMonth, fullLabel } = MONTHS[monthTabIdx];

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDateKeys, setSelectedDateKeys] = useState(new Set());

  const selectedTimeMinutes = useMemo(() => timeLabelToMinutes(timeSlot), [timeSlot]);

  useEffect(() => {
    if (!minder?.sitterID) {
      setError("No minder selected.");
      setLoading(false);
      return;
    }

    if (!timeSlot) {
      setError("No preferred time selected.");
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
      .then((data) => setSlots(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [minder?.sitterID, timeSlot]);

  // Dates are available only if the chosen owner time falls inside at least one minder slot
  const availableDateKeys = useMemo(() => {
    const set = new Set();

    slots.forEach((s) => {
      const start = parseSlotDate(s.startTime);
      const end = parseSlotDate(s.endTime);

      const startMinutes = dateToMinutes(start);
      const endMinutes = dateToMinutes(end);

      if (
        selectedTimeMinutes != null &&
        selectedTimeMinutes >= startMinutes &&
        selectedTimeMinutes <= endMinutes
      ) {
        set.add(toDateKey(start.getFullYear(), start.getMonth(), start.getDate()));
      }
    });

    return set;
  }, [slots, selectedTimeMinutes]);

  const isUnavailable = (day) => {
    const cellDate = new Date(viewYear, viewMonth, day);
    if (cellDate < today) return true;
    return !availableDateKeys.has(toDateKey(viewYear, viewMonth, day));
  };

  const getSlotsForSelectedDates = () => {
    return slots.filter((s) => {
      const slotStart = parseSlotDate(s.startTime);
      const slotEnd = parseSlotDate(s.endTime);

      const slotKey = toDateKey(
        slotStart.getFullYear(),
        slotStart.getMonth(),
        slotStart.getDate()
      );

      const slotStartMinutes = dateToMinutes(slotStart);
      const slotEndMinutes = dateToMinutes(slotEnd);

      const timeMatches =
        selectedTimeMinutes != null &&
        selectedTimeMinutes >= slotStartMinutes &&
        selectedTimeMinutes <= slotEndMinutes;

      return selectedDateKeys.has(slotKey) && timeMatches;
    });
  };

  const switchTab = (idx) => {
    if (idx === monthTabIdx) return;
    setMonthTabIdx(idx);
  };

  const handleDay = (day) => {
    if (isUnavailable(day)) return;

    const key = toDateKey(viewYear, viewMonth, day);

    setSelectedDateKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getCellClass = (day) => {
    if (isUnavailable(day)) return "cal-cell cal-cell--unavailable";

    const key = toDateKey(viewYear, viewMonth, day);
    const isSelected = selectedDateKeys.has(key);

    if (isSelected) return "cal-cell cal-cell--available cal-cell--endpoint";
    return "cal-cell cal-cell--available";
  };

  const cells = buildCells(viewYear, viewMonth);
  const selectedCount = selectedDateKeys.size;

  const selectionLabel =
    selectedCount === 0
      ? ""
      : `${selectedCount} date${selectedCount !== 1 ? "s" : ""} selected: ${formatSelectedDates(selectedDateKeys)}`;

  const handleBack = () =>
    navigate("/selectDates", {
      state: {
        minder,
        service,
        timeSlot,
        pet,
        petData,
        notes,
      },
    });

  const handleConfirmDates = () => {
    if (selectedDateKeys.size === 0) return;

    const selectedSlots = getSlotsForSelectedDates();
    const sortedKeys = [...selectedDateKeys].sort();

    navigate("/meetAndGreet", {
      state: {
        minder,
        service,
        selectedSlots,
        selectedTime: timeSlot,
        selectedDateKeys: sortedKeys,
        pet,
        petData,
        notes,
      },
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cal-screen">
          <header className="cal-header">
            <button className="cal-back" onClick={handleBack} type="button">←</button>
            <h1 className="cal-title">Availability Calendar</h1>
          </header>

          <div className="cal-body">
            <div className="cal-month-tabs">
              {MONTHS.map((m, idx) => (
                <button
                  key={m.fullLabel}
                  className={`cal-month-tab${monthTabIdx === idx ? " cal-month-tab--active" : ""}`}
                  onClick={() => switchTab(idx)}
                  type="button"
                >
                  {m.shortLabel}
                </button>
              ))}
            </div>

            <h2 className="cal-month">{fullLabel}</h2>

            {!loading && !error && timeSlot && (
              <p className="cal-selected-time">
                Preferred time: <strong>{timeSlot}</strong>
              </p>
            )}

            {loading && <p className="cal-status">Loading availability…</p>}
            {error && <p className="cal-status cal-status--error">{error}</p>}

            {!loading && !error && (
              <>
                <p className="cal-instruction">
                  {selectedDateKeys.size === 0
                    ? "Tap any available dates to select them"
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
                        disabled={isUnavailable(day)}
                        type="button"
                      >
                        {day}
                      </button>
                    )
                  )}
                </div>

                <div className="cal-legend">
                  {[
                    { key: "available", label: "Matches selected time" },
                    { key: "unavailable", label: "Unavailable" },
                    { key: "selected", label: "Selected" },
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
            {selectedDateKeys.size > 0 && (
              <button
                className="cal-clear-btn"
                onClick={() => setSelectedDateKeys(new Set())}
                type="button"
              >
                Clear
              </button>
            )}

            <button
              className={`cal-confirm-btn${selectedDateKeys.size === 0 ? " cal-confirm-btn--disabled" : ""}`}
              disabled={selectedDateKeys.size === 0}
              onClick={handleConfirmDates}
              type="button"
            >
              CONFIRM DATES →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}