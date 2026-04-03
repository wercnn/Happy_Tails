import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Service.css";

const INITIAL_SERVICES = [
  { id: 1, name: "Dog Walking (30 min)", price: "£15", unit: "", enabled: true },
  { id: 2, name: "Dog Walking (60 min)", price: "£22", unit: "", enabled: true },
  { id: 3, name: "Overnight Boarding", price: "£35", unit: "/night", enabled: false },
];

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsMyServices() {
  const navigate = useNavigate();
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [activeNav, setActiveNav] = useState("services");

  const toggleService = (id) =>
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );

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
        navigate("/mindProfile");
        break;
      default:
        alert("Placeholder route");
        break;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ms-screen">
          <header className="ms-header">
            <button className="ms-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="ms-title">My Services</h1>
          </header>

          <div className="ms-scroll">
            <div className="ms-body">
              <div className="ms-list">
                {services.map((svc) => (
                  <div key={svc.id} className="ms-card">
                    <div className="ms-card-info">
                      <span className="ms-card-name">{svc.name}</span>
                      <span className="ms-card-price">
                        {svc.price}{svc.unit}
                      </span>
                    </div>
                    <div className="ms-card-controls">
                      <button
                        className={`ms-toggle${svc.enabled ? " ms-toggle--on" : ""}`}
                        onClick={() => toggleService(svc.id)}
                        aria-label={svc.enabled ? "Disable" : "Enable"}
                      >
                        <span className="ms-toggle-thumb" />
                      </button>
                      <button
                        className="ms-edit-btn"
                        onClick={() => alert(`Edit: ${svc.name}`)}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="ms-add-btn"
                onClick={() => alert("Add new service")}
              >
                + Add New Service
              </button>
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