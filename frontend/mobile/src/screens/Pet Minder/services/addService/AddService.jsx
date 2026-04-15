import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./AddService.css";

const API_BASE = "http://localhost:3000";

const SERVICE_TYPES = [
  { id: "st-walk", name: "Dog Walking" },
  { id: "st-board", name: "Pet Boarding" },
  { id: "st-daycare", name: "Dog Daycare" },
];

const PET_TYPES = [
  { id: "Dogs", label: "Dogs", emoji: "🐶" },
  { id: "Cats", label: "Cats", emoji: "🐱" },
  { id: "Rabbits", label: "Rabbits", emoji: "🐰" },
  { id: "Birds", label: "Birds", emoji: "🐦" },
  { id: "Reptiles", label: "Reptiles", emoji: "🦎" },
  { id: "Other", label: "Other", emoji: "🐾" }
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
  const location = useLocation();

  const editingService = location.state?.service || null;
  const isEditMode = Boolean(editingService?.minderServiceID);

  const initialServiceType =
    SERVICE_TYPES.find((svc) => svc.id === editingService?.serviceTypeID) ||
    SERVICE_TYPES[0];

  const [serviceType, setServiceType] = useState(initialServiceType);
  const [price, setPrice] = useState(
    editingService?.customPrice != null ? String(editingService.customPrice) : ""
  );
  const [selectedPetTypes, setSelectedPetTypes] = useState(
    Array.isArray(editingService?.selectedPetTypes) && editingService.selectedPetTypes.length
      ? editingService.selectedPetTypes
      : ["Dogs"]
  );
  const [existingServiceTypeIDs, setExistingServiceTypeIDs] = useState([]);
  const [errors, setErrors] = useState({});
  const [serviceOpen, setServiceOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  useEffect(() => {
    const loadExistingServices = async () => {
      if (isEditMode) return;

      try {
        const meRes = await fetch(`${API_BASE}/api/minders/me`, {
          headers: getAuthHeaders(),
        });

        const meData = await meRes.json().catch(() => null);
        if (!meRes.ok || !meData?.sitterID) return;

        const minderRes = await fetch(`${API_BASE}/api/minders/${meData.sitterID}`, {
          headers: getAuthHeaders(),
        });

        const minderData = await minderRes.json().catch(() => null);
        if (!minderRes.ok || !minderData?.services) return;

        const ids = minderData.services
          .map((service) => service.serviceTypeID)
          .filter(Boolean);

        setExistingServiceTypeIDs(ids);
      } catch {
        // ignore
      }
    };

    loadExistingServices();
  }, [isEditMode]);

  const togglePetType = (petType) => {
    setSelectedPetTypes((prev) => {
      if (prev.includes(petType)) {
        return prev.filter((item) => item !== petType);
      }
      return [...prev, petType];
    });

    setErrors((prev) => ({ ...prev, petTypes: "" }));
    setSubmitMessage("");
  };

  const validateForm = () => {
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

    if (!isEditMode && existingServiceTypeIDs.includes(serviceType.id)) {
      newErrors.serviceType = "You already added this service.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const parsedPrice = parseFloat(price);
    setSubmitting(true);
    setSubmitMessage("");

    try {
      const url = isEditMode
        ? `${API_BASE}/api/services/${editingService.minderServiceID}`
        : `${API_BASE}/api/services`;

      const method = isEditMode ? "PATCH" : "POST";

      const bodyPayload = isEditMode
        ? {
            customPrice: parsedPrice,
            selectedPetTypes,
          }
        : {
            serviceTypeID: serviceType.id,
            customPrice: parsedPrice,
            isActive: true,
            selectedPetTypes,
          };

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(bodyPayload),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          body.error || (isEditMode ? "Could not update service." : "Could not save service.")
        );
      }

      navigate("/mindService");
    } catch (err) {
      setSubmitMessage(
        err.message || (isEditMode ? "Could not update service." : "Could not save service.")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    if (!isEditMode || deleting || submitting) return;
    setShowDeleteConfirm(true);
    setSubmitMessage("");
  };

  const handleDeleteCancel = () => {
    if (deleting) return;
    setShowDeleteConfirm(false);
  };

  const handleDeleteConfirm = async () => {
    if (!isEditMode) return;

    setDeleting(true);
    setSubmitMessage("");

    try {
      const res = await fetch(
        `${API_BASE}/api/services/${editingService.minderServiceID}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.error || "Could not delete service.");
      }

      navigate("/mindService");
    } catch (err) {
      setSubmitMessage(err.message || "Could not delete service.");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
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
            <h1 className="as-title">
              {isEditMode ? "Edit Service" : "Add New Service"}
            </h1>
          </header>

          <div className="as-scroll">
            <div className="as-form">
              <section className="as-card as-card--intro">
                <p className="as-eyebrow">Service Setup</p>
                <h2 className="as-section-title">
                  {isEditMode ? "Update your service" : "Create a service listing"}
                </h2>
                <p className="as-helper">
                  {isEditMode
                    ? "Change the price and accepted pet types for this service."
                    : "Choose the service, set your price, and select which pet types you want to accept for this listing."}
                </p>
              </section>

              <section className="as-card">
                <div className="as-field">
                  <label className="as-label" htmlFor="serviceType">
                    Service Type
                  </label>

                  {isEditMode ? (
                    <div className="as-custom-select as-custom-select--locked">
                      <button
                        type="button"
                        id="serviceType"
                        className="as-custom-select-trigger as-custom-select-trigger--disabled"
                        disabled
                      >
                        <span className="as-custom-select-value">{serviceType.name}</span>
                      </button>
                    </div>
                  ) : (
                    <div
                      ref={serviceDropdownRef}
                      className={`as-custom-select${serviceOpen ? " as-custom-select--open" : ""}`}
                    >
                      <button
                        type="button"
                        id="serviceType"
                        className="as-custom-select-trigger"
                        onClick={() => {
                          setServiceOpen((prev) => !prev);
                          setSubmitMessage("");
                          setErrors((prev) => ({ ...prev, serviceType: "" }));
                        }}
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
                                setSubmitMessage("");
                                setErrors((prev) => ({ ...prev, serviceType: "" }));
                              }}
                            >
                              {svc.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {errors.serviceType && (
                    <p className="as-error-text">{errors.serviceType}</p>
                  )}
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
                      setSubmitMessage("");
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
                          <span
                            className={`as-pet-type-check${
                              checked ? " as-pet-type-check--active" : ""
                            }`}
                          >
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

              {submitMessage && <p className="as-error-text">{submitMessage}</p>}

              <button
                className="as-save-btn"
                onClick={handleSave}
                disabled={submitting || deleting}
                type="button"
              >
                {submitting
                  ? (isEditMode ? "Saving Changes..." : "Saving...")
                  : (isEditMode ? "Save Changes" : "Save Service")}
              </button>

              {isEditMode && (
                <button
                  className="as-delete-btn"
                  onClick={handleDeleteClick}
                  disabled={submitting || deleting}
                  type="button"
                >
                  {deleting ? "Deleting..." : "Delete Service"}
                </button>
              )}
            </div>
          </div>

          {showDeleteConfirm && (
            <div className="as-delete-overlay">
              <div className="as-delete-modal">
                <h3 className="as-delete-title">Delete service?</h3>
                <p className="as-delete-text">
                  Are you sure you want to delete this service? This action cannot be undone.
                </p>

                <div className="as-delete-actions">
                  <button
                    type="button"
                    className="as-delete-cancel"
                    onClick={handleDeleteCancel}
                    disabled={deleting}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    className="as-delete-confirm"
                    onClick={handleDeleteConfirm}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Yes, Delete"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}