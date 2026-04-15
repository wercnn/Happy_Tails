import { useEffect, useState, useCallback } from "react";
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

function getServiceEmoji(serviceName) {
  const lower = String(serviceName || "").toLowerCase();

  if (lower.includes("walk")) return "🚶";
  if (lower.includes("board")) return "🏠";
  if (lower.includes("daycare")) return "☀️";
  if (lower.includes("sit")) return "🐾";
  return "🐾";
}

export default function HappyTailsMyServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [activeNav, setActiveNav] = useState("services");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const meRes = await fetch(`${API_BASE}/api/minders/me`, {
        headers: getAuthHeaders(),
      });
      const me = await meRes.json().catch(() => null);

      if (!meRes.ok) {
        throw new Error(me?.error || `Failed to load minder profile (${meRes.status})`);
      }

      if (!me?.sitterID) {
        throw new Error("Minder profile missing sitterID.");
      }

      const svcRes = await fetch(`${API_BASE}/api/minders/${me.sitterID}`, {
        headers: getAuthHeaders(),
      });

      const svcData = await svcRes.json().catch(() => ({}));

      if (!svcRes.ok) {
        throw new Error(svcData?.error || `Failed to fetch services (${svcRes.status})`);
      }

      setServices(svcData.services || []);
    } catch (err) {
      setError(err.message || "Failed to load services.");
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

      if (!res.ok) {
        throw new Error(`Failed to update service (${res.status})`);
      }

      await fetchServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleEditService = (svc) => {
    navigate("/addService", {
      state: {
        mode: "edit",
        service: svc,
      },
    });
  };

  const handleNavClick = (id) => {
    setActiveNav(id);

    switch (id) {
      case "dashboard":
        navigate("/mindDash");
        break;
      case "services":
        navigate("/mindService");
        break;
      case "availability":
        navigate("/mindAvailability");
        break;
      case "requests":
        navigate("/mindRequests");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        break;
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
              <section className="ms-hero-card">
                <div className="ms-hero-copy">
                  <span className="ms-eyebrow">Service Management</span>
                  <h2 className="ms-hero-title">Manage what you offer</h2>
                  <p className="ms-hero-text">
                    Update pricing, switch services on or off, or add a new one for
                    pet owners to book.
                  </p>
                </div>

                <button
                  className="ms-add-btn"
                  onClick={() => navigate("/addService")}
                  type="button"
                >
                  + Add New Service
                </button>
              </section>

              {loading && <p className="ms-empty">Loading your services...</p>}
              {error && <p className="ms-empty">{error}</p>}

              {!loading && !error && (
                <div className="ms-list">
                  {services.length === 0 && (
                    <div className="ms-empty-card">
                      <p className="ms-empty">No services added yet.</p>
                    </div>
                  )}

                  {services.map((svc) => (
                    <article
                      key={svc.minderServiceID}
                      className={`ms-card${svc.isActive ? "" : " ms-card--inactive"}`}
                    >
                      <div className="ms-card-top">
                        <div className="ms-card-badge">
                          <span className="ms-card-emoji">{getServiceEmoji(svc.name)}</span>
                        </div>

                        <div className="ms-card-main">
                          <div className="ms-card-head">
                            <h3 className="ms-card-name">{svc.name}</h3>
                            <span
                              className={`ms-status-pill${
                                svc.isActive
                                  ? " ms-status-pill--active"
                                  : " ms-status-pill--inactive"
                              }`}
                            >
                              {svc.isActive ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="ms-card-price-row">
                            <span className="ms-card-price">£{Number(svc.customPrice || 0).toFixed(2)}</span>
                            {svc.duration ? (
                              <span className="ms-card-duration">{svc.duration}</span>
                            ) : null}
                          </div>

                          {svc.description ? (
                            <p className="ms-card-description">{svc.description}</p>
                          ) : (
                            <p className="ms-card-description ms-card-description--muted">
                              No description added yet.
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="ms-card-actions">
                        <button
                          className="ms-edit-btn"
                          onClick={() => handleEditService(svc)}
                          type="button"
                        >
                          Edit Service
                        </button>

                        <button
                          className={`ms-toggle${svc.isActive ? " ms-toggle--on" : ""}`}
                          onClick={() => toggleService(svc)}
                          aria-label={svc.isActive ? "Disable service" : "Enable service"}
                          type="button"
                        >
                          <span className="ms-toggle-thumb" />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <nav className="ms-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`ms-nav-item${activeNav === item.id ? " ms-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
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