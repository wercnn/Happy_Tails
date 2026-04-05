import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CreatePet.css";

const SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Reptile", "Other"];

export default function HappyTailsCreatePet() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    species: "Dog",
    breed: "",
    age: "",
    notes: "",
  });
  const [photo, setPhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const nextValue = name === "notes" ? value.slice(0, 200) : value;

    setForm((f) => ({ ...f, [name]: nextValue }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setPhoto(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Pet name is required.";
    }

    if (!form.species.trim()) {
      newErrors.species = "Species is required.";
    }

    if (!form.breed.trim()) {
      newErrors.breed = "Breed is required.";
    }

    if (!form.age.trim()) {
      newErrors.age = "Age is required.";
    }

    if (!form.notes.trim()) {
      newErrors.notes = "Daily routines / notes are required.";
    }

    return newErrors;
  };

  const getPetEmoji = (species) => {
    switch (species.toLowerCase()) {
      case "dog":
        return "🐶";
      case "cat":
        return "🐱";
      case "rabbit":
        return "🐰";
      case "bird":
        return "🐦";
      case "reptile":
        return "🦎";
      default:
        return "🐾";
    }
  };

  const handleSubmit = () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const newPet = {
      id: Date.now(),
      emoji: getPetEmoji(form.species),
      name: form.name.trim(),
      breed: form.breed.trim(),
      age: form.age.trim(),
      species: form.species,
      notes: form.notes.trim(),
      photo: photo || null,
    };

    const existingPets = JSON.parse(localStorage.getItem("ownerPets") || "[]");
    const updatedPets = [...existingPets, newPet];

    localStorage.setItem("ownerPets", JSON.stringify(updatedPets));

    alert("Pet profile saved!");
    navigate("/ownerPets");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cpet-screen">
          <header className="cpet-header">
            <button className="cpet-back" onClick={() => navigate("/ownerPets")}>←</button>
            <h1 className="cpet-title">Create Pet Profile</h1>
          </header>

          <div className="cpet-scroll">
            <div className="cpet-form">
              <div className="cpet-avatar-wrap">
                <button
                  type="button"
                  className="cpet-avatar-btn"
                  onClick={() => fileRef.current?.click()}
                >
                  {photo ? (
                    <img src={photo} alt="Pet" className="cpet-avatar-img" />
                  ) : (
                    <span className="cpet-avatar-paw">🐾</span>
                  )}
                </button>

                <button
                  type="button"
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

              <div className="cpet-field">
                <label className="cpet-label" htmlFor="name">Pet Name</label>
                <input
                  id="name"
                  name="name"
                  className={`cpet-input ${errors.name ? "cpet-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. Buddy"
                  value={form.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="cpet-error-text">{errors.name}</p>}
              </div>

              <div className="cpet-field">
                <label className="cpet-label" htmlFor="species">Species</label>
                <div className="cpet-select-wrap">
                  <select
                    id="species"
                    name="species"
                    className={`cpet-select ${errors.species ? "cpet-input--error" : ""}`}
                    value={form.species}
                    onChange={handleChange}
                  >
                    {SPECIES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <span className="cpet-select-arrow">V</span>
                </div>
                {errors.species && <p className="cpet-error-text">{errors.species}</p>}
              </div>

              <div className="cpet-field">
                <label className="cpet-label" htmlFor="breed">Breed</label>
                <input
                  id="breed"
                  name="breed"
                  className={`cpet-input ${errors.breed ? "cpet-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. Golden Retriever"
                  value={form.breed}
                  onChange={handleChange}
                />
                {errors.breed && <p className="cpet-error-text">{errors.breed}</p>}
              </div>

              <div className="cpet-field">
                <label className="cpet-label" htmlFor="age">Age</label>
                <input
                  id="age"
                  name="age"
                  className={`cpet-input ${errors.age ? "cpet-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. 3 years"
                  value={form.age}
                  onChange={handleChange}
                />
                {errors.age && <p className="cpet-error-text">{errors.age}</p>}
              </div>

              <div className="cpet-field">
                <label className="cpet-label" htmlFor="notes">Daily Routines / Notes</label>
                <textarea
                  id="notes"
                  name="notes"
                  className={`cpet-textarea ${errors.notes ? "cpet-input--error" : ""}`}
                  placeholder="Feeding times, walks, medication..."
                  value={form.notes}
                  onChange={handleChange}
                  maxLength={200}
                />
                <p className="cpet-character-count">{form.notes.length}/200</p>
                {errors.notes && <p className="cpet-error-text">{errors.notes}</p>}
              </div>

              <button className="cpet-save" onClick={handleSubmit}>
                Save Pet Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}