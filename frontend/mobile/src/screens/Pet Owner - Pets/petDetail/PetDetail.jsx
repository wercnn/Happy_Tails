import "./PetDetail.css";

const PET = {
  emoji: "🐶",
  name: "Buddy",
  breed: "Golden Retriever",
  age: "3 years old",
  details: [
    { label: "Species",    value: "Dog" },
    { label: "Breed",      value: "Golden Retriever" },
    { label: "Age",        value: "3 years" },
    { label: "Weight",     value: "28 kg" },
    { label: "Vaccinated", value: "Yes - up to date" },
  ],
  notes: "Fed twice daily at 8am and 6pm. Walks at 7am and 5pm. Loves playing fetch. Allergic to chicken-based food",
};

export default function HappyTailsPetProfile() {
  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="pp-screen">

          {/* ── Orange Header ── */}
          <header className="pp-header">
            <div className="pp-header-top">
              <button className="pp-back" onClick={() => alert("Go back")}>← Pet Profile</button>
              <button className="pp-edit" onClick={() => alert("Edit pet")}>Edit</button>
            </div>
            <span className="pp-avatar">{PET.emoji}</span>
            <h1 className="pp-name">{PET.name}</h1>
            <p className="pp-subtitle">{PET.breed} · {PET.age}</p>
          </header>

          {/* ── Scrollable Body ── */}
          <div className="pp-scroll">
            <div className="pp-body">

              {/* Info rows */}
              <div className="pp-info-list">
                {PET.details.map((d) => (
                  <div key={d.label} className="pp-info-row">
                    <span className="pp-info-label">{d.label}</span>
                    <span className="pp-info-value">{d.value}</span>
                  </div>
                ))}
              </div>

              {/* Routines & Notes */}
              <h2 className="pp-notes-title">Routines &amp; Notes</h2>
              <div className="pp-notes-box">
                <p className="pp-notes-text">{PET.notes}</p>
              </div>

              {/* Add Health Data */}
              <button className="pp-health-btn" onClick={() => alert("Add health data")}>
                + Add Health Data
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}