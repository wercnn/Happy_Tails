import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectDates.css";

const TIME_SLOTS = ["7:00 AM", "9:00 AM", "12:00 PM", "3:00 PM", "5:00 PM", "7:00 PM"];
const PETS = ["Buddy (Golden Retriever)", "Luna (British Shorthair)"];

export default function HappyTailsDateTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const selectedService = location.state?.service || null;

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(null);
  const [pet, setPet] = useState(PETS[0]);
  const [petOpen, setPetOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const handleBack = () => {
    navigate("/selectService", {
      state: {
        minder,
        service: selectedService,
      },
    });
  };

  const handleCheckAvailability = () => {
    navigate("/availabilityCalendar", {
    state: {
      minder,
      service: selectedService,
    },
  })
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="dt-screen">
          <header className="dt-header">
            <button className="dt-back" onClick={handleBack}>←</button>
            <h1 className="dt-title">Select Dates &amp; Times</h1>
          </header>

          <div className="dt-scroll">
            <div className="dt-body">
              <div className="dt-field">
                <label className="dt-label">Start Date</label>
                <input
                  className="dt-input"
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="dt-field">
                <label className="dt-label">End Date (optional)</label>
                <input
                  className="dt-input"
                  type="text"
                  placeholder="dd/mm/yyyy"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="dt-field">
                <label className="dt-label">Preferred Time</label>
                <div className="dt-time-grid">
                  {TIME_SLOTS.map((t) => (
                    <button
                      key={t}
                      className={`dt-time-chip${timeSlot === t ? " dt-time-chip--active" : ""}`}
                      onClick={() => setTimeSlot(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dt-field">
                <label className="dt-label">Select Your Pet</label>
                <div className="dt-select-wrap">
                  <button
                    className="dt-select-btn"
                    onClick={() => setPetOpen((o) => !o)}
                  >
                    <span>{pet}</span>
                    <span className={`dt-arrow${petOpen ? " dt-arrow--open" : ""}`}>▼</span>
                  </button>
                  {petOpen && (
                    <div className="dt-dropdown">
                      {PETS.map((p) => (
                        <button
                          key={p}
                          className={`dt-dropdown-item${pet === p ? " dt-dropdown-item--active" : ""}`}
                          onClick={() => {
                            setPet(p);
                            setPetOpen(false);
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="dt-field">
                <label className="dt-label">Additional Notes for Minder</label>
                <textarea
                  className="dt-textarea"
                  placeholder="Any special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="dt-footer">
            <button className="dt-check-btn" onClick={handleCheckAvailability}>
              CHECK AVAILABILITY →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}