import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SelectDates.css";

function buildTimeSlots() {
  const slots = [];
  const startMinutes = 6 * 60; // 06:00
  const endMinutes = 19 * 60 + 30; // 19:30

  for (let mins = startMinutes; mins <= endMinutes; mins += 30) {
    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;
    slots.push(`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`);
  }

  return slots;
}

function toDate(value) {
  return new Date(String(value).replace(" ", "T"));
}

function formatTimeLabel(dateStr) {
  const date = toDate(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const hours = date.getHours();
  const minutes = date.getMinutes();

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function normalizePetTypeLabel(value) {
  const raw = String(value || "").trim().toLowerCase();

  if (!raw) return "";
  if (raw.includes("dog")) return "dogs";
  if (raw.includes("cat")) return "cats";
  if (raw.includes("rabbit") || raw.includes("bunny")) return "rabbits";
  if (raw.includes("bird")) return "birds";
  if (raw.includes("reptile") || raw.includes("lizard") || raw.includes("snake") || raw.includes("tortoise")) {
    return "reptiles";
  }

  return "other";
}

function getSupportedPetTypes(service) {
  const raw =
    service?.selectedPetTypes ??
    service?.supportedPetTypes ??
    service?.petTypes ??
    service?.raw?.selectedPetTypes ??
    service?.raw?.supportedPetTypes ??
    service?.raw?.petTypes ??
    [];

  if (Array.isArray(raw)) {
    return raw.map(normalizePetTypeLabel).filter(Boolean);
  }

  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((item) => normalizePetTypeLabel(item))
      .filter(Boolean);
  }

  return [];
}

const TIME_SLOTS = buildTimeSlots();

export default function HappyTailsDateTime() {
  const navigate = useNavigate();
  const location = useLocation();

  const minder = location.state?.minder || null;
  const selectedService = location.state?.service || null;
  const returnToSummary = Boolean(location.state?.returnToSummary);

  const supportedPetTypes = useMemo(
    () => getSupportedPetTypes(selectedService),
    [selectedService]
  );

  const [timeSlot, setTimeSlot] = useState(location.state?.selectedTime || location.state?.timeSlot || "");
  const [timeOpen, setTimeOpen] = useState(false);
  const [pets, setPets] = useState([]);
  const [pet, setPet] = useState(location.state?.pet || "");
  const [petOpen, setPetOpen] = useState(false);
  const [notes, setNotes] = useState(location.state?.notes || "");
  const [error, setError] = useState("");
  const [isLoadingPets, setIsLoadingPets] = useState(true);
  const [minderTimeRanges, setMinderTimeRanges] = useState([]);
  const [isLoadingTimes, setIsLoadingTimes] = useState(true);

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

        const filteredPets =
          supportedPetTypes.length === 0
            ? formattedPets
            : formattedPets.filter((p) =>
                supportedPetTypes.includes(
                  normalizePetTypeLabel(p.raw?.species || p.raw?.type || "")
                )
              );

        setPets(filteredPets);

        if (filteredPets.length > 0) {
          if (location.state?.pet) {
            const matchedPet = filteredPets.find((p) => p.label === location.state.pet);
            if (matchedPet) {
              setPet(matchedPet.label);
            } else {
              setPet(filteredPets[0].label);
            }
          } else {
            setPet(filteredPets[0].label);
          }
        } else {
          setPet("");
          setPetOpen(false);
        }
      } catch (err) {
        console.error("Failed to load pets:", err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoadingPets(false);
      }
    };

    loadPets();
  }, [location.state, supportedPetTypes]);

  useEffect(() => {
    const loadMinderTimeRanges = async () => {
      if (!minder?.sitterID) {
        setMinderTimeRanges([]);
        setIsLoadingTimes(false);
        return;
      }

      setIsLoadingTimes(true);

      try {
        const res = await fetch(`http://localhost:3000/api/minders/${minder.sitterID}/slots`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          console.error("Failed to load minder slots:", data);
          setMinderTimeRanges([]);
          return;
        }

        const uniqueRanges = [];
        const seen = new Set();

        (Array.isArray(data) ? data : []).forEach((slot) => {
          const startLabel = formatTimeLabel(slot.startTime);
          const endLabel = formatTimeLabel(slot.endTime);
          const rangeKey = `${startLabel}-${endLabel}`;

          if (startLabel && endLabel && !seen.has(rangeKey)) {
            seen.add(rangeKey);
            uniqueRanges.push({
              start: startLabel,
              end: endLabel,
            });
          }
        });

        setMinderTimeRanges(uniqueRanges);
      } catch (err) {
        console.error("Failed to load minder time ranges:", err);
        setMinderTimeRanges([]);
      } finally {
        setIsLoadingTimes(false);
      }
    };

    loadMinderTimeRanges();
  }, [minder?.sitterID]);

  const handleBack = () => {
    if (returnToSummary) {
      navigate("/bookingSummary", {
        state: {
          ...location.state,
          minder,
          service: selectedService,
          pet,
          notes,
          selectedTime: timeSlot,
          timeSlot,
        },
      });
      return;
    }

    navigate("/selectService", {
      state: {
        minder,
        service: selectedService,
      },
    });
  };

  const handleCheckAvailability = () => {
    const selectedPet = pets.find((p) => p.label === pet);

    if (returnToSummary) {
      navigate("/bookingSummary", {
        state: {
          ...location.state,
          minder,
          service: selectedService,
          timeSlot,
          selectedTime: timeSlot,
          pet,
          petData: selectedPet?.raw || null,
          notes,
        },
      });
      return;
    }

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

                <div className="dt-minder-hours">
                  <p className="dt-minder-hours-title">Minder working hours</p>

                  {isLoadingTimes ? (
                    <p className="dt-minder-hours-text">Loading working hours...</p>
                  ) : minderTimeRanges.length > 0 ? (
                    <div className="dt-minder-hours-list">
                      {minderTimeRanges.map((range, index) => (
                        <p
                          key={`${range.start}-${range.end}-${index}`}
                          className="dt-minder-hours-text"
                        >
                          {range.start} - {range.end}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="dt-minder-hours-text">No working hours added yet.</p>
                  )}
                </div>

                <div className="dt-select-wrap">
                  <button
                    type="button"
                    className="dt-select-btn"
                    onClick={() => setTimeOpen((prev) => !prev)}
                  >
                    <span>{timeSlot || "Choose a time"}</span>
                    <span className={`dt-arrow${timeOpen ? " dt-arrow--open" : ""}`}>▼</span>
                  </button>

                  {timeOpen && (
                    <div className="dt-dropdown">
                      {TIME_SLOTS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={`dt-dropdown-item${timeSlot === t ? " dt-dropdown-item--active" : ""}`}
                          onClick={() => {
                            setTimeSlot(t);
                            setTimeOpen(false);
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="dt-field">
                <label className="dt-label">Select Your Pet</label>

                {isLoadingPets ? (
                  <p>Loading pets...</p>
                ) : error ? (
                  <p>{error}</p>
                ) : pets.length === 0 ? (
                <p className="dt-empty-box">
                  No pets match this service&apos;s accepted pet types. Please add a matching pet or choose another service.
                </p>
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
              {returnToSummary ? "SAVE CHANGES →" : "CHECK AVAILABILITY →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}