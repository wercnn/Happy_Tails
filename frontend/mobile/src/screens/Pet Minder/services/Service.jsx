import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Service.css";

const API_BASE = "http://localhost:3000";

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

export default function HappyTailsMyServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [activeNav, setActiveNav] = useState("services");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meRes = await fetch(`${API_BASE}/api/minders/me`, { headers: getAuthHeaders() });
      const me = await meRes.json().catch(() => null);
      if (!meRes.ok) throw new Error(me?.error || `Failed to load minder profile (${meRes.status})`);
      if (!me?.sitterID) throw new Error("Minder profile missing sitterID.");

      const [svcRes, ptRes] = await Promise.all([
        fetch(`${API_BASE}/api/minders/${me.sitterID}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/api/minders/me/pet-types`, { headers: getAuthHeaders() }),
      ]);

      const svcData = await svcRes.json().catch(() => ({}));
      const ptData = await ptRes.json().catch(() => []);

      if (!svcRes.ok) throw new Error(svcData?.error || `Failed to fetch services (${svcRes.status})`);
      if (!ptRes.ok) throw new Error(ptData?.error || `Failed to fetch pet types (${ptRes.status})`);

      setServices(svcData.services || []);
      setPetTypes(Array.isArray(ptData) ? ptData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const toggleService = async (svc) => {
    try {
      const res = await fetch(`${API_BASE}/api/services/${svc.minderServiceID}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ isActive: !svc.isActive }),
      });
      if (!res.ok) throw new Error(`Failed to update service (${res.status})`);
      await fetchServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const editService = async (svc) => {
    setEditingService(svc);
  };

  const PET_TYPE_OPTIONS = useMemo(
    () => ["Dogs", "Cats", "Rabbits", "Birds", "Reptiles", "Small mammals", "Other"],
    []
  );

  const [editingService, setEditingService] = useState(null);
  const [editForm, setEditForm] = useState({
    customPrice: "",
    duration: "",
    description: "",
    petTypes: [],
  });
  const [editErrors, setEditErrors] = useState({});
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    if (!editingService) return;
    setEditErrors({});
    setSavingEdit(false);
    setEditForm({
      customPrice:
        editingService.customPrice == null ? "" : String(editingService.customPrice),
      duration: editingService.duration || "",
      description: editingService.description || "",
      petTypes: Array.isArray(petTypes) ? petTypes : [],
    });
  }, [editingService, petTypes]);

  const validateEdit = () => {
    const nextErrors = {};

    const priceNum = Number(editForm.customPrice);
    if (editForm.customPrice === "" || Number.isNaN(priceNum) || priceNum < 0) {
      nextErrors.customPrice = "Enter a valid price (0 or more).";
    }

    if (editForm.description && String(editForm.description).length > 250) {
      nextErrors.description = "Description must be 250 characters or fewer.";
    }

    if (!Array.isArray(editForm.petTypes) || editForm.petTypes.length === 0) {
      nextErrors.petTypes = "Select at least one supported pet type.";
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveEdit = async () => {
    if (!editingService) return;
    if (!validateEdit()) return;

    setSavingEdit(true);
    try {
      const svcRes = await fetch(`${API_BASE}/api/services/${editingService.minderServiceID}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          customPrice: Number(editForm.customPrice),
          duration: editForm.duration || null,
          description: editForm.description || null,
        }),
      });
      const svcBody = await svcRes.json().catch(() => ({}));
      if (!svcRes.ok) throw new Error(svcBody?.error || `Failed to save service (${svcRes.status})`);

      const ptRes = await fetch(`${API_BASE}/api/minders/me/pet-types`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ petTypes: editForm.petTypes }),
      });
      const ptBody = await ptRes.json().catch(() => ({}));
      if (!ptRes.ok) throw new Error(ptBody?.error || `Failed to save pet types (${ptRes.status})`);

      setEditingService(null);
      await fetchServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSavingEdit(false);
    }
  };

  const closeEdit = () => {
    if (savingEdit) return;
    setEditingService(null);
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard": navigate("/mindDash"); break;
      case "services": navigate("/mindService"); break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests": navigate("/mindRequests"); break;
      case "profile": navigate("/profile"); break;
      default: break;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ms-screen">
          <header className="ms-header">
            <h1 className="ms-title">My Services</h1>
          </header>

          <div className="ms-scroll">
            <div className="ms-body">
              <button
                className="ms-add-btn"
                onClick={() => navigate("/addService")}
              >
                + Add New Service
              </button>

              {loading && <p className="ms-empty">Loading...</p>}
              {error && <p className="ms-empty">{error}</p>}

              {!loading && !error && (
                <div className="ms-list">
                  {services.length === 0 && (
                    <p className="ms-empty">No services added yet.</p>
                  )}
                  {services.map((svc) => (
                    <div key={svc.minderServiceID} className="ms-card">
                      <div className="ms-card-info">
                        <span className="ms-card-name">{svc.name}</span>
                        <span className="ms-card-price">£{svc.customPrice}</span>
                      </div>
                      <div className="ms-card-controls">
                        <button
                          className={`ms-toggle${svc.isActive ? " ms-toggle--on" : ""}`}
                          onClick={() => toggleService(svc)}
                          aria-label={svc.isActive ? "Disable" : "Enable"}
                        >
                          <span className="ms-toggle-thumb" />
                        </button>
                        <button
                          className="ms-edit-btn"
                          onClick={() => editService(svc)}
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {editingService && (
            <div className="ms-modal-backdrop" role="dialog" aria-modal="true">
              <div className="ms-modal">
                <div className="ms-modal-header">
                  <h2 className="ms-modal-title">Edit Service</h2>
                  <button className="ms-modal-close" onClick={closeEdit} type="button">
                    ✕
                  </button>
                </div>

                <div className="ms-form">
                  <div className="ms-field">
                    <label className="ms-label">Service type</label>
                    <input className="ms-input" value={editingService.name} disabled />
                  </div>

                  <div className="ms-field">
                    <label className="ms-label">Price (£)</label>
                    <input
                      className={`ms-input${editErrors.customPrice ? " ms-input--error" : ""}`}
                      value={editForm.customPrice}
                      onChange={(e) => setEditForm((p) => ({ ...p, customPrice: e.target.value }))}
                      inputMode="decimal"
                      placeholder="e.g. 15"
                    />
                    {editErrors.customPrice && <div className="ms-error">{editErrors.customPrice}</div>}
                  </div>

                  <div className="ms-field">
                    <label className="ms-label">Duration</label>
                    <input
                      className="ms-input"
                      value={editForm.duration}
                      onChange={(e) => setEditForm((p) => ({ ...p, duration: e.target.value }))}
                      placeholder='e.g. "30 mins"'
                    />
                  </div>

                  <div className="ms-field">
                    <label className="ms-label">Description</label>
                    <textarea
                      className={`ms-textarea${editErrors.description ? " ms-input--error" : ""}`}
                      value={editForm.description}
                      onChange={(e) => setEditForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Short description (max 250 chars)"
                      rows={4}
                    />
                    <div className="ms-hint">
                      {String(editForm.description || "").length}/250
                    </div>
                    {editErrors.description && <div className="ms-error">{editErrors.description}</div>}
                  </div>

                  <div className="ms-field">
                    <label className="ms-label">Supported pet types</label>
                    <div className={`ms-checkbox-grid${editErrors.petTypes ? " ms-checkbox-grid--error" : ""}`}>
                      {PET_TYPE_OPTIONS.map((pt) => {
                        const checked = editForm.petTypes.includes(pt);
                        return (
                          <label key={pt} className="ms-check">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const on = e.target.checked;
                                setEditForm((p) => {
                                  const next = new Set(p.petTypes);
                                  if (on) next.add(pt);
                                  else next.delete(pt);
                                  return { ...p, petTypes: [...next] };
                                });
                              }}
                            />
                            <span>{pt}</span>
                          </label>
                        );
                      })}
                    </div>
                    {editErrors.petTypes && <div className="ms-error">{editErrors.petTypes}</div>}
                  </div>
                </div>

                <div className="ms-modal-actions">
                  <button className="ms-secondary" onClick={closeEdit} type="button" disabled={savingEdit}>
                    Cancel
                  </button>
                  <button className="ms-primary" onClick={saveEdit} type="button" disabled={savingEdit}>
                    {savingEdit ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <nav className="ms-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`ms-nav-item${activeNav === item.id ? " ms-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="ms-nav-emoji">{item.emoji}</span>
                <span className="ms-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
