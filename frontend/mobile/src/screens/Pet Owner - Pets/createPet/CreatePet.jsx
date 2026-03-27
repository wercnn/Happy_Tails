import { useState, useRef } from "react";
import "./CreatePet.css";

const SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Reptile", "Other"];

export default function HappyTailsCreatePet() {
  const [form, setForm] = useState({ name: "", species: "Dog", breed: "", age: "", notes: "" });
  const [photo, setPhoto] = useState(null);
  const fileRef = useRef(null);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/"))
      setPhoto(URL.createObjectURL(file));
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cpet-screen">

          {/* Header */}
          <header className="cpet-header">
            <button className="cpet-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="cpet-title">Create Pet Profile</h1>
          </header>

          {/* Scrollable body */}
          <div className="cpet-scroll">
            <div className="cpet-form">

              {/* Avatar upload */}
              <div className="cpet-avatar-wrap">
                <button
                  className="cpet-avatar-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  {photo
                    ? <img src={photo} alt="Pet" className="cpet-avatar-img" />
                    : <span className="cpet-avatar-paw">🐾</span>
                  }
                </button>
                <button
                  className="cpet-upload-label"
                  onClick={() => fileRef.current?.click()}
                >
                  Upload Photo
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              {/* Pet Name */}
              <div className="cpet-field">
                <label className="cpet-label" htmlFor="name">Pet Name</label>
                <input
                  id="name" name="name" className="cpet-input"
                  type="text" placeholder="e.g. Buddy"
                  value={form.name} onChange={handleChange}
                />
              </div>

              {/* Species */}
              <div className="cpet-field">
                <label className="cpet-label" htmlFor="species">Species</label>
                <div className="cpet-select-wrap">
                  <select
                    id="species" name="species" className="cpet-select"
                    value={form.species} onChange={handleChange}
                  >
                    {SPECIES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <span className="cpet-select-arrow">V</span>
                </div>
              </div>

              {/* Breed */}
              <div className="cpet-field">
                <label className="cpet-label" htmlFor="breed">Breed</label>
                <input
                  id="breed" name="breed" className="cpet-input"
                  type="text" placeholder="e.g. Golden Retriever"
                  value={form.breed} onChange={handleChange}
                />
              </div>

              {/* Age */}
              <div className="cpet-field">
                <label className="cpet-label" htmlFor="age">Age</label>
                <input
                  id="age" name="age" className="cpet-input"
                  type="text" placeholder="e.g. 3 years"
                  value={form.age} onChange={handleChange}
                />
              </div>

              {/* Daily Routines */}
              <div className="cpet-field">
                <label className="cpet-label" htmlFor="notes">Daily Routines / Notes</label>
                <textarea
                  id="notes" name="notes" className="cpet-textarea"
                  placeholder="Feeding times, walks, medication..."
                  value={form.notes} onChange={handleChange}
                />
              </div>

              {/* Save */}
              <button className="cpet-save" onClick={() => alert("Pet profile saved!")}>
                Save Pet Profile
              </button>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}