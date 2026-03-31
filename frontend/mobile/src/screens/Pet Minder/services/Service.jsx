import { useState } from "react";
import "./Service.css";

const INITIAL_SERVICES = [
  { id: 1, name: "Dog Walking (30 min)", price: "£15",        unit: "",       enabled: true },
  { id: 2, name: "Dog Walking (60 min)", price: "£22",        unit: "",       enabled: true },
  { id: 3, name: "Overnight Boarding",  price: "£35",        unit: "/night", enabled: false },
];

const NAV = [
  { id: "dashboard",    emoji: "🏠",  label: "Dashboard" },
  { id: "services",     emoji: "⚙️",  label: "Services" },
  { id: "availability", emoji: "📅",  label: "Availability" },
  { id: "requests",     emoji: "📬",  label: "Requests" },
  { id: "profile",      emoji: "👤",  label: "Profile" },
];

export default function HappyTailsMyServices() {
  const [services, setServices] = useState(INITIAL_SERVICES);
  const [activeNav, setActiveNav] = useState("dashboard");

  const toggleService = (id) =>
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s))
    );

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ms-screen">

          {/* Header */}
          <header className="ms-header">
            <button className="ms-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="ms-title">My Services</h1>
          </header>

          {/* Scrollable body */}
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

          {/* Bottom Nav */}
          <nav className="ms-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`ms-nav-item${activeNav === item.id ? " ms-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
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