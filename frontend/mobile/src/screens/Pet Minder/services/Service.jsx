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
      const userID = localStorage.getItem("userID");
      const res = await fetch(`${API_BASE}/api/users/${userID}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch services (${res.status})`);
      const data = await res.json();
      setServices(data.services || []);
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
    const newPriceStr = prompt(
      `New price for "${svc.name}" (current: £${svc.customPrice}):`,
      svc.customPrice
    );
    if (newPriceStr === null) return;
    const newPrice = parseFloat(newPriceStr);
    if (isNaN(newPrice) || newPrice < 0) {
      alert("Please enter a valid price.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/services/${svc.minderServiceID}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ customPrice: newPrice }),
      });
      if (!res.ok) throw new Error(`Failed to update price (${res.status})`);
      await fetchServices();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
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
