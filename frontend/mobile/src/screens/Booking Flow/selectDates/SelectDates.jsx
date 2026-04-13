import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectDates.css";

function buildTimeSlots() {
  const slots = [];
  const startMinutes = 6 * 60; // 6:00 AM
  const endMinutes = 19 * 60 + 30; // 7:30 PM

  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    let hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    const meridiem = hours >= 12 ? "PM" : "AM";

    if (hours === 0) hours = 12;
    else if (hours > 12) hours -= 12;

    slots.push(`${hours}:${String(minutes).padStart(2, "0")} ${meridiem}`);
  }

  return slots;
}

const TIME_SLOTS = buildTimeSlots();

export default function HappyTailsDateTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const selectedService = location.state?.service || null;

  const [timeSlot, setTimeSlot] = useState("");
  const [pets, setPets] = useState([]);
  const [pet, setPet] = useState("");
  const [petOpen, setPetOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [isLoadingPets, setIsLoadingPets] = useState(true);

  useEffect(() => {
    const loadPets = async () => {
      setIsLoadingPets(true);
      setError("");

      try {
        const res = await fetch("http://localhost:3000/api/pets", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load pets.");
          return;
        }

        const formattedPets = data.map((p) => ({
          id: p.petID,
          label: `${p.name} (${p.breed || "Unknown Breed"}) : ${p.species || "Pet"}`,
          raw: p,
        }));

        setPets(formattedPets);

        if (formattedPets.length > 0) {
          setPet(formattedPets[0].label);
        }
      } catch (err) {
        console.error("Failed to load pets:", err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoadingPets(false);
      }
    };

    loadPets();
  }, []);

  const handleBack = () => {
    navigate("/selectService", {
      state: {
        minder,
        service: selectedService,
      },
    });
  };

  const handleCheckAvailability = () => {
    const selectedPet = pets.find((p) => p.label === pet);

    navigate("/availabilityCalendar", {
      state: {
        minder,
        service: selectedService,
        timeSlot,
        pet,
        petData: selectedPet?.raw || null,
        notes,
      },
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="dt-screen">
          <header className="dt-header">
            <button className="dt-back" onClick={handleBack} type="button">
              ←
            </button>
            <h1 className="dt-title">Select Date &amp; Time</h1>
          </header>

          <div className="dt-scroll">
            <div className="dt-body">
              <div className="dt-field">
                <label className="dt-label">Preferred Time</label>
                <div className="dt-select-wrap">
                  <select
                    className="dt-select"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                  >
                    <option value="">Choose a time</option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <span className="dt-arrow">▼</span>
                </div>
              </div>

              <div className="dt-field">
                <label className="dt-label">Select Your Pet</label>
                {isLoadingPets ? (
                  <p>Loading pets...</p>
                ) : error ? (
                  <p>{error}</p>
                ) : pets.length === 0 ? (
                  <p>No pets found. Please add a pet first.</p>
                ) : (
                  <div className="dt-select-wrap">
                    <button
                      type="button"
                      className="dt-select-btn"
                      onClick={() => setPetOpen((o) => !o)}
                    >
                      <span>{pet || "Choose a pet"}</span>
                      <span className={`dt-arrow${petOpen ? " dt-arrow--open" : ""}`}>▼</span>
                    </button>
                    {petOpen && (
                      <div className="dt-dropdown">
                        {pets.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            className={`dt-dropdown-item${pet === p.label ? " dt-dropdown-item--active" : ""}`}
                            onClick={() => {
                              setPet(p.label);
                              setPetOpen(false);
                            }}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
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
            <button
              className="dt-check-btn"
              onClick={handleCheckAvailability}
              type="button"
              disabled={!timeSlot || !pet || pets.length === 0}
            >
              CHECK AVAILABILITY →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}