import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddHealth.css";

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const petID = pet?.petID || pet?.id;

  // Load existing health data on mount
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
        }
      } catch (err) {
        console.error("Failed to load health data:", err);
      }
    };

    load();
  }, [petID]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!petID) {
      setError("No pet selected. Please go back and try again.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`http://localhost:3000/api/pets/${petID}/health`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userID") || "",
          "x-user-role": localStorage.getItem("userRole") || "",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save health data.");
        return;
      }

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
            <button className="hd-back" onClick={handleBack}>←</button>
            <h1 className="hd-title">
              {pet ? `${pet.name}'s Health` : "Health Data"}
            </h1>
          </header>

          <div className="hd-scroll">
            <div className="hd-form">

              {/* Dietary Needs */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="dietaryNeeds">Dietary Needs</label>
                <textarea
                  id="dietaryNeeds" name="dietaryNeeds" className="hd-textarea"
                  placeholder="e.g. grain-free diet, 2 meals a day..."
                  value={form.dietaryNeeds} onChange={handleChange}
                />
              </div>

              {/* Allergies */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="allergies">Allergies</label>
                <textarea
                  id="allergies" name="allergies" className="hd-textarea"
                  placeholder="e.g. pollen, certain proteins..."
                  value={form.allergies} onChange={handleChange}
                />
              </div>

              {/* Vaccinated toggle */}
              <div className="hd-field hd-field--toggle">
                <span className="hd-label">Vaccinated?</span>
                <label className="hd-toggle">
                  <input
                    type="checkbox" name="vaccinated"
                    checked={form.vaccinated} onChange={handleChange}
                  />
                  <span className="hd-toggle-track">
                    <span className="hd-toggle-thumb" />
                  </span>
                </label>
              </div>

              {/* Vaccination Info — shown when vaccinated */}
              {form.vaccinated && (
                <div className="hd-field">
                  <label className="hd-label" htmlFor="vaccinationInfo">Vaccination Info</label>
                  <textarea
                    id="vaccinationInfo" name="vaccinationInfo" className="hd-textarea"
                    placeholder="e.g. Rabies — Jan 2024, Kennel Cough — Mar 2024..."
                    value={form.vaccinationInfo} onChange={handleChange}
                  />
                </div>
              )}

              {/* Requires Medication toggle */}
              <div className="hd-field hd-field--toggle">
                <span className="hd-label">Requires Medication?</span>
                <label className="hd-toggle">
                  <input
                    type="checkbox" name="requiresMedication"
                    checked={form.requiresMedication} onChange={handleChange}
                  />
                  <span className="hd-toggle-track">
                    <span className="hd-toggle-thumb" />
                  </span>
                </label>
              </div>

              {/* Medications — shown when requiresMedication */}
              {form.requiresMedication && (
                <div className="hd-field">
                  <label className="hd-label" htmlFor="medications">Medications</label>
                  <textarea
                    id="medications" name="medications" className="hd-textarea"
                    placeholder="e.g. Apoquel 16mg — once daily with food..."
                    value={form.medications} onChange={handleChange}
                  />
                </div>
              )}

              {/* Medical Notes */}
              <div className="hd-field">
                <label className="hd-label" htmlFor="medicalNotes">Medical Notes</label>
                <textarea
                  id="medicalNotes" name="medicalNotes" className="hd-textarea"
                  placeholder="Any additional health information..."
                  value={form.medicalNotes} onChange={handleChange}
                />
              </div>

              {error && <p className="hd-error">{error}</p>}
              {success && <p className="hd-success">Health record saved!</p>}

              <button
                className="hd-save"
                onClick={handleSubmit}
                disabled={isSubmitting}
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
