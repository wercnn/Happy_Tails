import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./PetDetail.css";

export default function HappyTailsPetProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const pet = location.state?.pet;

  const [health, setHealth] = useState(null);

  useEffect(() => {
    const petID = pet?.petID || pet?.id;
    if (!petID) return;

    const load = async () => {
      try {
        const res = await fetch(`http://localhost:3000/api/pets/${petID}/health`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });
        const data = await res.json();
        if (res.ok && data) setHealth(data);
      } catch (err) {
        console.error("Failed to load health data:", err);
      }
    };

    load();
  }, [pet]);

  if (!pet) {
    return (
      <div className="mobile-stage">
        <div className="mobile-frame">
          <div className="pp-screen">
            <header className="pp-header">
              <div className="pp-header-top">
                <button className="pp-back" onClick={() => navigate("/ownerPets")}>
                  ←
                </button>
                <span className="pp-header-label">Pet Profile</span>
                <span className="pp-header-spacer" />
              </div>
              <h1 className="pp-name">Pet not found</h1>
              <p className="pp-subtitle">Please go back and select a pet again.</p>
            </header>
          </div>
        </div>
      </div>
    );
  }

  const details = [
    { label: "Species", value: pet.species || "Not added" },
    { label: "Breed", value: pet.breed || "Not added" },
    { label: "Age", value: pet.age ? `${pet.age} yrs` : "Not added" },
  ];

  const hasHealth = !!health;

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="pp-screen">
          <header className="pp-header">
            <div className="pp-header-top">
              <button className="pp-back" onClick={() => navigate("/ownerPets")}>
                ←
              </button>
              <span className="pp-header-label">Pet Profile</span>
              <button
                className="pp-edit"
                onClick={() => navigate("/addPet", { state: { pet, returnTo: "petDetail" } })}
              >
                Edit
              </button>
            </div>

            <span className="pp-avatar">
              {pet.photo ? (
                <img src={pet.photo} alt={pet.name} className="pp-avatar-img" />
              ) : (
                pet.emoji || "🐾"
              )}
            </span>

            <h1 className="pp-name">{pet.name}</h1>
            <p className="pp-subtitle">
              {pet.breed} · {pet.age} yrs
            </p>
          </header>

          <div className="pp-scroll">
            <div className="pp-body">
              <div className="pp-info-list">
                {details.map((d) => (
                  <div key={d.label} className="pp-info-row">
                    <span className="pp-info-label">{d.label}</span>
                    <span className="pp-info-value">{d.value}</span>
                  </div>
                ))}
              </div>

              <h2 className="pp-notes-title">Routines &amp; Notes</h2>
              <div className="pp-notes-box">
                <p className="pp-notes-text">{pet.routines || "No notes added."}</p>
              </div>

              {/* Health Data — only shown if health record exists */}
              {hasHealth && (
                <>
                  <h2 className="pp-notes-title">Health Data</h2>

                  <div className="pp-health-list">
                    {/* Vaccinated badge */}
                    <div className="pp-health-row">
                      <span className="pp-info-label">Vaccinated</span>
                      <span className={`pp-health-badge ${health.vaccinated ? "pp-health-badge--yes" : "pp-health-badge--no"}`}>
                        {health.vaccinated ? "Yes" : "No"}
                      </span>
                    </div>

                    {health.vaccinationInfo && (
                      <div className="pp-health-row pp-health-row--block">
                        <span className="pp-info-label">Vaccination Info</span>
                        <p className="pp-health-text">{health.vaccinationInfo}</p>
                      </div>
                    )}

                    {/* Requires Medication badge */}
                    <div className="pp-health-row">
                      <span className="pp-info-label">Requires Medication</span>
                      <span className={`pp-health-badge ${health.requiresMedication ? "pp-health-badge--yes" : "pp-health-badge--no"}`}>
                        {health.requiresMedication ? "Yes" : "No"}
                      </span>
                    </div>

                    {health.medications && (
                      <div className="pp-health-row pp-health-row--block">
                        <span className="pp-info-label">Medications</span>
                        <p className="pp-health-text">{health.medications}</p>
                      </div>
                    )}

                    {health.allergies && (
                      <div className="pp-health-row pp-health-row--block">
                        <span className="pp-info-label">Allergies</span>
                        <p className="pp-health-text">{health.allergies}</p>
                      </div>
                    )}

                    {health.dietaryNeeds && (
                      <div className="pp-health-row pp-health-row--block">
                        <span className="pp-info-label">Dietary Needs</span>
                        <p className="pp-health-text">{health.dietaryNeeds}</p>
                      </div>
                    )}

                    {health.medicalNotes && (
                      <div className="pp-health-row pp-health-row--block">
                        <span className="pp-info-label">Medical Notes</span>
                        <p className="pp-health-text">{health.medicalNotes}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              <button
                className="pp-health-btn"
                onClick={() => navigate("/addHealth", { state: { pet, returnTo: "petDetail" } })}
              >
                {hasHealth ? "✎ Edit Health Data" : "+ Add Health Data"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
