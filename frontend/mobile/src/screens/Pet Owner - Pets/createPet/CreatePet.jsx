import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./CreatePet.css";

const SPECIES = ["Dog", "Cat", "Rabbit", "Bird", "Reptile", "Other"];
const MAX_MEDICAL_DOCS = 3;

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
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileRef = useRef(null);
  const medicalDocRef = useRef(null);

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
      setMedicalDocuments(
        Array.isArray(editingPet.medicalDocuments) ? editingPet.medicalDocuments : []
      );
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
      medicalDocuments: "",
    }));
  };

  const handlePhotoFile = (file) => {
    if (file && file.type.startsWith("image/")) {
      setPhoto(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleMedicalDocuments = async (files) => {
    const pickedFiles = Array.from(files || []);
    if (pickedFiles.length === 0) return;

    const remainingSlots = MAX_MEDICAL_DOCS - medicalDocuments.length;

    if (remainingSlots <= 0) {
      setErrors((prev) => ({
        ...prev,
        medicalDocuments: `You can upload up to ${MAX_MEDICAL_DOCS} medical documents only.`,
      }));
      return;
    }

    if (pickedFiles.length > remainingSlots) {
      setErrors((prev) => ({
        ...prev,
        medicalDocuments: `You can only add ${remainingSlots} more medical document${remainingSlots === 1 ? "" : "s"}.`,
      }));
    } else {
      setErrors((prev) => ({
        ...prev,
        medicalDocuments: "",
        submit: "",
      }));
    }

    const filesToUpload = pickedFiles.slice(0, remainingSlots);

    try {
      const uploadedDocs = await Promise.all(
        filesToUpload.map(async (file) => {
          const fileUrl = await fileToDataUrl(file);

          return {
            id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            name: file.name,
            type: file.type || "application/octet-stream",
            size: file.size || 0,
            uploadedAt: new Date().toISOString(),
            url: fileUrl,
          };
        })
      );

      setMedicalDocuments((prev) => [...prev, ...uploadedDocs]);
    } catch (error) {
      console.error("Medical document upload failed:", error);
      setErrors((prev) => ({
        ...prev,
        medicalDocuments: "Failed to upload medical document.",
      }));
    }
  };

  const handleRemoveMedicalDocument = (docId) => {
    setMedicalDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setErrors((prev) => ({
      ...prev,
      medicalDocuments: "",
    }));
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateForm = () => {
    const newErrors = {};
    const normalizedAge = String(form.age ?? "").trim();

    if (!form.name.trim()) newErrors.name = "Pet name is required.";
    if (!form.species.trim()) newErrors.species = "Species is required.";
    if (!form.breed.trim()) newErrors.breed = "Breed is required.";
    if (!normalizedAge) newErrors.age = "Age is required.";
    if (!form.notes.trim()) newErrors.notes = "Daily routines / notes are required.";
    if (medicalDocuments.length > MAX_MEDICAL_DOCS) {
      newErrors.medicalDocuments = `Only ${MAX_MEDICAL_DOCS} medical documents are allowed.`;
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      let photoURL = null;

      if (photoFile) {
        photoURL = await fileToDataUrl(photoFile);
      }

      const payload = {
        name: form.name.trim(),
        species: form.species,
        breed: form.breed.trim(),
        age: String(form.age ?? "").trim(),
        routines: form.notes.trim(),
        weight: null,
        neutered: false,
        medicalDocuments,
        ...(photoURL && { photoURL }),
      };

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
                  onChange={(e) => handlePhotoFile(e.target.files?.[0])}
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

              <div className="cpet-field">
                <label className="cpet-label">Medical Documents</label>

                <button
                  type="button"
                  className="cpet-doc-upload-btn"
                  onClick={() => medicalDocRef.current?.click()}
                  disabled={medicalDocuments.length >= MAX_MEDICAL_DOCS}
                >
                  {medicalDocuments.length >= MAX_MEDICAL_DOCS
                    ? `Maximum ${MAX_MEDICAL_DOCS} Documents Reached`
                    : "+ Add Medical Document"}
                </button>

                <input
                  ref={medicalDocRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handleMedicalDocuments(e.target.files);
                    e.target.value = "";
                  }}
                />

                <p className="cpet-doc-limit">
                  {medicalDocuments.length}/{MAX_MEDICAL_DOCS} documents uploaded
                </p>

                {medicalDocuments.length > 0 ? (
                  <div className="cpet-doc-list">
                    {medicalDocuments.map((doc) => (
                      <div key={doc.id} className="cpet-doc-item">
                        <div className="cpet-doc-info">
                          <span className="cpet-doc-name">{doc.name}</span>
                          <span className="cpet-doc-meta">{formatFileSize(doc.size)}</span>
                        </div>

                        <div className="cpet-doc-actions">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="cpet-doc-link"
                            >
                              View
                            </a>
                          ) : null}

                          <button
                            type="button"
                            className="cpet-doc-remove"
                            onClick={() => handleRemoveMedicalDocument(doc.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="cpet-doc-empty">No medical documents uploaded yet.</p>
                )}

                {errors.medicalDocuments && (
                  <p className="cpet-error-text">{errors.medicalDocuments}</p>
                )}
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