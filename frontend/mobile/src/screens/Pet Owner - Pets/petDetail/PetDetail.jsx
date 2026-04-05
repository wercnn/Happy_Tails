import { useLocation, useNavigate } from "react-router-dom";
import "./PetDetail.css";

export default function HappyTailsPetProfile() {
  const navigate = useNavigate();
  const location = useLocation();
  const pet = location.state?.pet;

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
                onClick={() => navigate("/addPet", { state: { pet } })}
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
                <p className="pp-notes-text">{pet.notes || "No notes added."}</p>
              </div>

              <button
                className="pp-health-btn"
                onClick={() => alert("Add health data")}
              >
                + Add Health Data
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}