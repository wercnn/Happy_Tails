import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreatePet.css";

const SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Reptile", "Other"];

const EMPTY_FORM = {
  name: "",
  species: "Dog",
  breed: "",
  age: "",
  notes: "",
};

export default function HappyTailsCreatePet() {
  const navigate = useNavigate();
  const location = useLocation();
  const editingPet = location.state?.pet || null;
  const returnTo = location.state?.returnTo || null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [photo, setPhoto] = useState(null);       // preview URL
  const [photoFile, setPhotoFile] = useState(null); // actual File object
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (editingPet) {
      setForm({
        name: editingPet.name || "",
        species: editingPet.species || "Dog",
        breed: editingPet.breed || "",
        age: editingPet.age != null ? String(editingPet.age) : "",
        notes: editingPet.routines || editingPet.notes || "",
      });
      setPhoto(editingPet.photo || null);
    }
  }, [editingPet]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === "notes" ? value.slice(0, 200) : value;

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({
      ...prev,
      [name]: "",
      submit: "",
    }));
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setPhoto(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const normalizedAge = String(form.age ?? "").trim();

    if (!form.name.trim()) newErrors.name = "Pet name is required.";
    if (!form.species.trim()) newErrors.species = "Species is required.";
    if (!form.breed.trim()) newErrors.breed = "Breed is required.";
    if (!normalizedAge) newErrors.age = "Age is required.";
    if (!form.notes.trim()) newErrors.notes = "Daily routines / notes are required.";

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    let photoURL = null;
    if (photoFile) {
      photoURL = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(photoFile);
      });
    }

    const payload = {
      name: form.name.trim(),
      species: form.species,
      breed: form.breed.trim(),
      age: String(form.age ?? "").trim(),
      routines: form.notes.trim(),
      weight: null,
      neutered: false,
      ...(photoURL && { photoURL }),
    };

    try {
      const url = editingPet
        ? `http://localhost:3000/api/pets/${editingPet.petID || editingPet.id}`
        : "http://localhost:3000/api/pets";

      const method = editingPet ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userID") || "",
          "x-user-role": localStorage.getItem("userRole") || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors((prev) => ({
          ...prev,
          submit: data.error || "Failed to save pet profile.",
        }));
        return;
      }

      if (editingPet && returnTo === "petDetail") {
        navigate("/petProfile", { state: { pet: data } });
        return;
      }

      navigate("/ownerPets");
    } catch (error) {
      console.error("Pet save failed:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Server error. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (editingPet && returnTo === "petDetail") {
      navigate("/petProfile", { state: { pet: editingPet } });
      return;
    }

    navigate("/ownerPets");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="cpet-screen">
          <header className="cpet-header">
            <button className="cpet-back" onClick={handleBack} type="button">
              ←
            </button>
            <h1 className="cpet-title">
              {editingPet ? "Edit Pet Profile" : "Create Pet Profile"}
            </h1>
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
                      <option key={s} value={s}>
                        {s}
                      </option>
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

              {errors.submit && <p className="cpet-error-text">{errors.submit}</p>}

              <button
                className="cpet-save"
                onClick={handleSubmit}
                type="button"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Saving..."
                  : editingPet
                  ? "Update Pet Profile"
                  : "Save Pet Profile"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}