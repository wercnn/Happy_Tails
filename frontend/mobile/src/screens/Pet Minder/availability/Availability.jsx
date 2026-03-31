import { useState } from "react";
import "./Availability.css";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIMES = [
  "6:00 AM","6:30 AM","7:00 AM","7:30 AM","8:00 AM","8:30 AM",
  "9:00 AM","9:30 AM","10:00 AM","10:30 AM","11:00 AM","11:30 AM",
  "12:00 PM","12:30 PM","1:00 PM","1:30 PM","2:00 PM","2:30 PM",
  "3:00 PM","3:30 PM","4:00 PM","4:30 PM","5:00 PM","5:30 PM",
  "6:00 PM","6:30 PM","7:00 PM","7:30 PM","8:00 PM",
];

const NAV = [
  { id: "dashboard",    emoji: "🏠",  label: "Dashboard" },
  { id: "services",     emoji: "⚙️",  label: "Services" },
  { id: "availability", emoji: "📅",  label: "Availability" },
  { id: "requests",     emoji: "📬",  label: "Requests" },
  { id: "profile",      emoji: "👤",  label: "Profile" },
];

export default function HappyTailsAvailability() {
  const [activeDays, setActiveDays] = useState(["Mon","Tue","Wed","Thu","Fri"]);
  const [startTime, setStartTime] = useState("7:00 AM");
  const [endTime, setEndTime]     = useState("5:00 PM");
  const [blockDate, setBlockDate] = useState("");
  const [blockedDates, setBlockedDates] = useState([]);
  const [activeNav, setActiveNav] = useState("dashboard");

  const toggleDay = (day) =>
    setActiveDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );

  const addBlockDate = () => {
    if (blockDate && !blockedDates.includes(blockDate)) {
      setBlockedDates((prev) => [...prev, blockDate]);
      setBlockDate("");
    }
  };

  const removeBlockDate = (d) =>
    setBlockedDates((prev) => prev.filter((x) => x !== d));

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="av-screen">

          {/* Header */}
          <header className="av-header">
            <button className="av-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="av-title">Set Availability</h1>
          </header>

          {/* Scrollable body */}
          <div className="av-scroll">
            <div className="av-body">

              {/* Available Days */}
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

              {/* Working Hours */}
              <section className="av-section">
                <h2 className="av-section-title">Working Hours</h2>
                <div className="av-hours-row">
                  <div className="av-time-col">
                    <label className="av-time-label">Start Time</label>
                    <div className="av-select-wrap">
                      <select
                        className="av-select"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
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
                        onChange={(e) => setEndTime(e.target.value)}
                      >
                        {TIMES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                      <span className="av-select-arrow">▼</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Block Out Dates */}
              <section className="av-section">
                <h2 className="av-section-title">Block Out Dates</h2>
                <div className="av-block-card">
                  <div className="av-block-row">
                    <input
                      className="av-block-input"
                      type="text"
                      placeholder="dd/mm/yyyy"
                      value={blockDate}
                      onChange={(e) => setBlockDate(e.target.value)}
                    />
                    <button className="av-block-add" onClick={addBlockDate}>+</button>
                  </div>
                  {blockedDates.length > 0 && (
                    <div className="av-blocked-list">
                      {blockedDates.map((d) => (
                        <div key={d} className="av-blocked-chip">
                          <span>{d}</span>
                          <button className="av-blocked-remove" onClick={() => removeBlockDate(d)}>×</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Save */}
              <button className="av-save-btn" onClick={() => alert("Availability saved!")}>
                Save Availability
              </button>

            </div>
          </div>

          {/* Bottom Nav */}
          <nav className="av-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`av-nav-item${activeNav === item.id ? " av-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
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