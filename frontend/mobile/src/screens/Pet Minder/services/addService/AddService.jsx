import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddService.css";

const API_BASE = "http://localhost:3000";

// These IDs must match the SERVICE_TYPE rows in the database.
const SERVICE_TYPES = [
  { id: "st-walk",    name: "Dog Walking" },
  { id: "st-board",   name: "Pet Boarding" },
  { id: "st-daycare", name: "Dog Daycare" },
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

  const handleSave = async () => {
    const newErrors = {};
    const parsedPrice = parseFloat(price);

    if (!price.trim()) {
      newErrors.price = "Price is required.";
    } else if (isNaN(parsedPrice) || parsedPrice < 0) {
      newErrors.price = "Please enter a valid price.";
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
            <button className="as-back" onClick={() => navigate("/mindService")}>
              ←
            </button>
            <h1 className="as-title">Add New Service</h1>
          </header>

          <div className="as-scroll">
            <div className="as-form">
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
                    <span className="as-custom-select-arrow">{serviceOpen ? "⌃" : "⌄"}</span>
                  </button>

                  {serviceOpen && (
                    <div className="as-custom-select-menu">
                      {SERVICE_TYPES.map((svc) => (
                        <button
                          key={svc.id}
                          type="button"
                          className={`as-custom-select-option${serviceType.id === svc.id ? " as-custom-select-option--selected" : ""}`}
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

              <button
                className="as-save-btn"
                onClick={handleSave}
                disabled={submitting}
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
