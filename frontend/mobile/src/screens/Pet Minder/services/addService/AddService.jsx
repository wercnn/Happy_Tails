import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AddService.css";

const SERVICE_TYPES = [
  "Dog Walking",
  "Pet Sitting",
  "Boarding",
  "Day Care",
  "Feeding",
  "Grooming",
];

export default function HappyTailsAddService() {
  const navigate = useNavigate();

  const [serviceType, setServiceType] = useState("Dog Walking");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({});
  const [serviceOpen, setServiceOpen] = useState(false);

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

  const handleSave = () => {
    const newErrors = {};

    if (!serviceType.trim()) newErrors.serviceType = "Service type is required.";
    if (!duration.trim()) newErrors.duration = "Duration is required.";
    if (!price.trim()) newErrors.price = "Price is required.";
    if (!description.trim()) newErrors.description = "Description is required.";

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const newService = {
      id: Date.now(),
      serviceType,
      duration: duration.trim(),
      price: price.trim(),
      description: description.trim(),
    };

    const existingServices = JSON.parse(localStorage.getItem("minderServices") || "[]");
    const updatedServices = [...existingServices, newService];
    localStorage.setItem("minderServices", JSON.stringify(updatedServices));

    navigate("/mindService", { state: { refresh: Date.now() } });
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
                <label className="as-label" htmlFor="serviceType">Service Type</label>

                <div
                  ref={serviceDropdownRef}
                  className={`as-custom-select${serviceOpen ? " as-custom-select--open" : ""}`}
                >
                  <button
                    type="button"
                    id="serviceType"
                    className={`as-custom-select-trigger ${errors.serviceType ? "as-input--error" : ""}`}
                    onClick={() => setServiceOpen((prev) => !prev)}
                  >
                    <span className="as-custom-select-value">{serviceType}</span>
                    <span className="as-custom-select-arrow">{serviceOpen ? "⌃" : "⌄"}</span>
                  </button>

                  {serviceOpen && (
                    <div className="as-custom-select-menu">
                      {SERVICE_TYPES.map((service) => (
                        <button
                          key={service}
                          type="button"
                          className={`as-custom-select-option${serviceType === service ? " as-custom-select-option--selected" : ""}`}
                          onClick={() => {
                            setServiceType(service);
                            setServiceOpen(false);
                            setErrors((prev) => ({ ...prev, serviceType: "" }));
                          }}
                        >
                          {service}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {errors.serviceType && <p className="as-error-text">{errors.serviceType}</p>}
              </div>

              <div className="as-field">
                <label className="as-label" htmlFor="duration">Duration</label>
                <input
                  id="duration"
                  className={`as-input ${errors.duration ? "as-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. 30 mins, 1 hour, per night"
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    setErrors((prev) => ({ ...prev, duration: "" }));
                  }}
                />
                {errors.duration && <p className="as-error-text">{errors.duration}</p>}
              </div>

              <div className="as-field">
                <label className="as-label" htmlFor="price">Price</label>
                <input
                  id="price"
                  className={`as-input ${errors.price ? "as-input--error" : ""}`}
                  type="text"
                  placeholder="e.g. £15"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setErrors((prev) => ({ ...prev, price: "" }));
                  }}
                />
                {errors.price && <p className="as-error-text">{errors.price}</p>}
              </div>

              <div className="as-field">
                <label className="as-label" htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className={`as-textarea ${errors.description ? "as-input--error" : ""}`}
                  placeholder="Describe what is included in this service..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setErrors((prev) => ({ ...prev, description: "" }));
                  }}
                  maxLength={250}
                />
                <p className="as-character-count">{description.length}/250</p>
                {errors.description && <p className="as-error-text">{errors.description}</p>}
              </div>

              <button className="as-save-btn" onClick={handleSave}>
                Save Service
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}