import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddService.css";

const API_BASE = "http://localhost:3000";

// These IDs must match the SERVICE_TYPE rows in the database.
const SERVICE_TYPES = [
  { id: "st-walk", name: "Dog Walking" },
  { id: "st-board", name: "Pet Boarding" },
  { id: "st-daycare", name: "Dog Daycare" },
];

const PET_TYPES = [
  { id: "Dogs", label: "Dogs", emoji: "🐶" },
  { id: "Cats", label: "Cats", emoji: "🐱" },
  { id: "Birds", label: "Birds", emoji: "🐦" },
  { id: "Reptiles", label: "Reptiles", emoji: "🦎" },
  { id: "Small Pets", label: "Small Pets", emoji: "🐹" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

export default function HappyTailsAddService() {
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [price, setPrice] = useState("");
  const [selectedPetTypes, setSelectedPetTypes] = useState(["Dogs"]);
  const [errors, setErrors] = useState({});
  const [serviceOpen, setServiceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const serviceDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!serviceDropdownRef.current?.contains(event.target)) {
        setServiceOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePetType = (petType) => {
    setSelectedPetTypes((prev) => {
      if (prev.includes(petType)) {
        return prev.filter((item) => item !== petType);
      }
      return [...prev, petType];
    });

    setErrors((prev) => ({ ...prev, petTypes: "" }));
  };

  const handleSave = async () => {
    const newErrors = {};
    const parsedPrice = parseFloat(price);

    if (!price.trim()) {
      newErrors.price = "Price is required.";
    } else if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      newErrors.price = "Please enter a valid price.";
    }

    if (selectedPetTypes.length === 0) {
      newErrors.petTypes = "Please select at least one pet type.";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/api/services`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          serviceTypeID: serviceType.id,
          customPrice: parsedPrice,
          isActive: true,
          selectedPetTypes,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }

      navigate("/mindService");
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="as-screen">
          <header className="as-header">
            <button
              className="as-back"
              onClick={() => navigate("/mindService")}
              type="button"
            >
              ←
            </button>
            <h1 className="as-title">Add New Service</h1>
          </header>

          <div className="as-scroll">
            <div className="as-form">
              <section className="as-card as-card--intro">
                <p className="as-eyebrow">Service Setup</p>
                <h2 className="as-section-title">Create a service listing</h2>
                <p className="as-helper">
                  Choose the service, set your price, and select which pet types
                  you want to accept for this listing.
                </p>
              </section>

              <section className="as-card">
                <div className="as-field">
                  <label className="as-label" htmlFor="serviceType">
                    Service Type
                  </label>

                  <div
                    ref={serviceDropdownRef}
                    className={`as-custom-select${serviceOpen ? " as-custom-select--open" : ""}`}
                  >
                    <button
                      type="button"
                      id="serviceType"
                      className="as-custom-select-trigger"
                      onClick={() => setServiceOpen((prev) => !prev)}
                    >
                      <span className="as-custom-select-value">{serviceType.name}</span>
                      <span className="as-custom-select-arrow">
                        {serviceOpen ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {serviceOpen && (
                      <div className="as-custom-select-menu">
                        {SERVICE_TYPES.map((svc) => (
                          <button
                            key={svc.id}
                            type="button"
                            className={`as-custom-select-option${
                              serviceType.id === svc.id
                                ? " as-custom-select-option--selected"
                                : ""
                            }`}
                            onClick={() => {
                              setServiceType(svc);
                              setServiceOpen(false);
                            }}
                          >
                            {svc.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="as-field">
                  <label className="as-label" htmlFor="price">
                    Your Price (£)
                  </label>
                  <input
                    id="price"
                    className={`as-input ${errors.price ? "as-input--error" : ""}`}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g. 20.00"
                    value={price}
                    onChange={(e) => {
                      setPrice(e.target.value);
                      setErrors((prev) => ({ ...prev, price: "" }));
                    }}
                  />
                  {errors.price && <p className="as-error-text">{errors.price}</p>}
                </div>
              </section>

              <section className="as-card">
                <div className="as-field">
                  <label className="as-label">Pet Types Accepted</label>
                  <p className="as-helper as-helper--small">
                    Select all pet types you are happy to provide this service for.
                  </p>

                  <div className="as-pet-type-grid">
                    {PET_TYPES.map((petType) => {
                      const checked = selectedPetTypes.includes(petType.id);

                      return (
                        <button
                          key={petType.id}
                          type="button"
                          className={`as-pet-type-card${
                            checked ? " as-pet-type-card--active" : ""
                          }`}
                          onClick={() => togglePetType(petType.id)}
                        >
                          <span className="as-pet-type-emoji">{petType.emoji}</span>
                          <span className="as-pet-type-label">{petType.label}</span>
                          <span className={`as-pet-type-check${checked ? " as-pet-type-check--active" : ""}`}>
                            {checked ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errors.petTypes && (
                    <p className="as-error-text">{errors.petTypes}</p>
                  )}
                </div>
              </section>

              <button
                className="as-save-btn"
                onClick={handleSave}
                disabled={submitting}
                type="button"
              >
                {submitting ? "Saving..." : "Save Service"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}