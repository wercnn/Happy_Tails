import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddHealth.css";

const MAX_MEDICAL_DOCS = 3;

const EMPTY_FORM = {
  dietaryNeeds: "",
  allergies: "",
  vaccinated: false,
  vaccinationInfo: "",
  requiresMedication: false,
  medications: "",
  medicalNotes: "",
};

export default function HappyTailsHealthData() {
  const navigate = useNavigate();
  const location = useLocation();
  const pet = location.state?.pet || null;

  const [form, setForm] = useState(EMPTY_FORM);
  const [medicalDocuments, setMedicalDocuments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const medicalDocRef = useRef(null);

  const petID = pet?.petID || pet?.id;

  useEffect(() => {
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

        if (res.ok && data) {
          setForm({
            dietaryNeeds: data.dietaryNeeds || "",
            allergies: data.allergies || "",
            vaccinated: !!data.vaccinated,
            vaccinationInfo: data.vaccinationInfo || "",
            requiresMedication: !!data.requiresMedication,
            medications: data.medications || "",
            medicalNotes: data.medicalNotes || "",
          });

          setMedicalDocuments(
            Array.isArray(data.medicalDocuments)
              ? data.medicalDocuments.map((doc, index) => ({
                  id:
                    doc.id ||
                    doc.docID ||
                    `${doc.name || doc.fileName || "document"}-${index}`,
                  name: doc.name || doc.fileName || "Medical Document.pdf",
                  size: doc.size || 0,
                  uploadedAt: doc.uploadedAt || null,
                  url: doc.url || doc.fileURL || "",
                }))
              : []
          );
        }
      } catch (err) {
        console.error("Failed to load health data:", err);
      }
    };

    load();
  }, [petID]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setError("");
    setSuccess(false);
  };

  const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const isPdfFile = (file) => {
    if (!file) return false;
    const fileName = String(file.name || "").toLowerCase();
    return file.type === "application/pdf" || fileName.endsWith(".pdf");
  };

  const handleMedicalDocuments = async (files) => {
    const pickedFiles = Array.from(files || []);
    if (pickedFiles.length === 0) return;

    setError("");
    setSuccess(false);

    const invalidFiles = pickedFiles.filter((file) => !isPdfFile(file));
    if (invalidFiles.length > 0) {
      setError("Only PDF medical documents are allowed.");
      return;
    }

    const remainingSlots = MAX_MEDICAL_DOCS - medicalDocuments.length;

    if (remainingSlots <= 0) {
      setError(`You can upload up to ${MAX_MEDICAL_DOCS} medical documents only.`);
      return;
    }

    if (pickedFiles.length > remainingSlots) {
      setError(
        `You can only add ${remainingSlots} more medical document${
          remainingSlots === 1 ? "" : "s"
        }.`
      );
    }

    const filesToUpload = pickedFiles.slice(0, remainingSlots);

    try {
      const uploadedDocs = await Promise.all(
        filesToUpload.map(async (file) => {
          const fileUrl = await fileToDataUrl(file);

          return {
            id: `${file.name}-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            name: file.name,
            size: file.size || 0,
            uploadedAt: new Date().toISOString(),
            url: fileUrl,
          };
        })
      );

      setMedicalDocuments((prev) => [...prev, ...uploadedDocs]);
    } catch (uploadErr) {
      console.error("Medical document upload failed:", uploadErr);
      setError("Failed to upload medical document.");
    }
  };

  const handleRemoveMedicalDocument = (docId) => {
    setMedicalDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    setError("");
    setSuccess(false);
  };

  const formatFileSize = (bytes) => {
    const size = Number(bytes || 0);
    if (!size) return "";
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async () => {
    if (!petID) {
      setError("No pet selected. Please go back and try again.");
      return;
    }

    if (medicalDocuments.length > MAX_MEDICAL_DOCS) {
      setError(`You can upload up to ${MAX_MEDICAL_DOCS} medical documents only.`);
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        ...form,
        medicalDocuments,
      };

      const res = await fetch(`http://localhost:3000/api/pets/${petID}/health`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userID") || "",
          "x-user-role": localStorage.getItem("userRole") || "",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save health data.");
        return;
      }

      setMedicalDocuments(
        Array.isArray(data.medicalDocuments)
          ? data.medicalDocuments.map((doc, index) => ({
              id:
                doc.id ||
                doc.docID ||
                `${doc.name || doc.fileName || "document"}-${index}`,
              name: doc.name || doc.fileName || "Medical Document.pdf",
              size: doc.size || 0,
              uploadedAt: doc.uploadedAt || null,
              url: doc.url || doc.fileURL || "",
            }))
          : medicalDocuments
      );

      setSuccess(true);

      setTimeout(() => {
        navigate("/petProfile", { state: { pet } });
      }, 1000);
    } catch (err) {
      console.error("Health save failed:", err);
      setError("Server error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (pet) {
      navigate("/petProfile", { state: { pet } });
      return;
    }

    navigate("/ownerPets");
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="hd-screen">
          <header className="hd-header">
            <button className="hd-back" onClick={handleBack} type="button">
              ←
            </button>
            <h1 className="hd-title">
              {pet ? `${pet.name}'s Health` : "Health Data"}
            </h1>
          </header>

          <div className="hd-scroll">
            <div className="hd-form">
              <div className="hd-field">
                <label className="hd-label" htmlFor="dietaryNeeds">
                  Dietary Needs
                </label>
                <textarea
                  id="dietaryNeeds"
                  name="dietaryNeeds"
                  className="hd-textarea"
                  placeholder="e.g. grain-free diet, 2 meals a day..."
                  value={form.dietaryNeeds}
                  onChange={handleChange}
                />
              </div>

              <div className="hd-field">
                <label className="hd-label" htmlFor="allergies">
                  Allergies
                </label>
                <textarea
                  id="allergies"
                  name="allergies"
                  className="hd-textarea"
                  placeholder="e.g. pollen, certain proteins..."
                  value={form.allergies}
                  onChange={handleChange}
                />
              </div>

              <div className="hd-field hd-field--toggle">
                <span className="hd-label">Vaccinated?</span>
                <label className="hd-toggle">
                  <input
                    type="checkbox"
                    name="vaccinated"
                    checked={form.vaccinated}
                    onChange={handleChange}
                  />
                  <span className="hd-toggle-track">
                    <span className="hd-toggle-thumb" />
                  </span>
                </label>
              </div>

              {form.vaccinated && (
                <div className="hd-field">
                  <label className="hd-label" htmlFor="vaccinationInfo">
                    Vaccination Info
                  </label>
                  <textarea
                    id="vaccinationInfo"
                    name="vaccinationInfo"
                    className="hd-textarea"
                    placeholder="e.g. Rabies — Jan 2024, Kennel Cough — Mar 2024..."
                    value={form.vaccinationInfo}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="hd-field hd-field--toggle">
                <span className="hd-label">Requires Medication?</span>
                <label className="hd-toggle">
                  <input
                    type="checkbox"
                    name="requiresMedication"
                    checked={form.requiresMedication}
                    onChange={handleChange}
                  />
                  <span className="hd-toggle-track">
                    <span className="hd-toggle-thumb" />
                  </span>
                </label>
              </div>

              {form.requiresMedication && (
                <div className="hd-field">
                  <label className="hd-label" htmlFor="medications">
                    Medications
                  </label>
                  <textarea
                    id="medications"
                    name="medications"
                    className="hd-textarea"
                    placeholder="e.g. Apoquel 16mg — once daily with food..."
                    value={form.medications}
                    onChange={handleChange}
                  />
                </div>
              )}

              <div className="hd-field">
                <label className="hd-label" htmlFor="medicalNotes">
                  Medical Notes
                </label>
                <textarea
                  id="medicalNotes"
                  name="medicalNotes"
                  className="hd-textarea"
                  placeholder="Any additional health information..."
                  value={form.medicalNotes}
                  onChange={handleChange}
                />
              </div>

              <div className="hd-field">
                <label className="hd-label">Medical Documents</label>

                <button
                  type="button"
                  className="hd-doc-upload-btn"
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
                  accept=".pdf,application/pdf"
                  multiple
                  style={{ display: "none" }}
                  onChange={(e) => {
                    handleMedicalDocuments(e.target.files);
                    e.target.value = "";
                  }}
                />

                <p className="hd-doc-limit">
                  {medicalDocuments.length}/{MAX_MEDICAL_DOCS} documents uploaded
                </p>

                {medicalDocuments.length > 0 && (
                  <div className="hd-doc-list">
                    {medicalDocuments.map((doc) => (
                      <div
                        key={doc.id || doc.name || doc.url}
                        className="hd-doc-item"
                      >
                        <div className="hd-doc-info">
                          <span className="hd-doc-name">{doc.name}</span>
                          {formatFileSize(doc.size) ? (
                            <span className="hd-doc-meta">
                              {formatFileSize(doc.size)}
                            </span>
                          ) : null}
                        </div>

                        <div className="hd-doc-actions">
                          {doc.url ? (
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="hd-doc-link"
                            >
                              View
                            </a>
                          ) : null}

                          <button
                            type="button"
                            className="hd-doc-remove"
                            onClick={() => handleRemoveMedicalDocument(doc.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && <p className="hd-error">{error}</p>}
              {success && <p className="hd-success">Health record saved!</p>}

              <button
                className="hd-save"
                onClick={handleSubmit}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? "Saving..." : "Save Health Record"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}