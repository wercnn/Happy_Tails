import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSettings.css";

const MENU_ITEMS = [
  { id: "edit", emoji: "👤", label: "Edit Profile", color: "#1a1a1a" },
  { id: "notifs", emoji: "🔔", label: "Notifications Preferences", color: "#1a1a1a" },
  { id: "payment", emoji: "💳", label: "Payment Methods", color: "#1a1a1a" },
  { id: "privacy", emoji: "🔒", label: "Privacy & Security", color: "#1a1a1a" },
  { id: "help", emoji: "❓", label: "Help & Support", color: "#1a1a1a" },
  { id: "terms", emoji: "📄", label: "Terms & Privacy Policy", color: "#1a1a1a" },
  { id: "logout", emoji: "🚪", label: "Log Out", color: "#ef4444", danger: true },
];

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsProfile() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("profile");

  const handleMenu = (id) => {
    if (id === "logout") {
      if (window.confirm("Are you sure you want to log out?")) {
        alert("Logged out.");
      }
    } else {
      alert(`Navigate to: ${id}`);
    }
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
        alert("Placeholder route");
        break;
    }
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="prof-screen">
          <header className="prof-hero">
            <div className="prof-avatar">
              <span className="prof-avatar-icon">👤</span>
            </div>
            <h1 className="prof-name">Sarah Johnson</h1>
            <p className="prof-sub">Pet Owner · Luton</p>
            <div className="prof-verified">
              <span>✓</span>
              <span>Verified Account</span>
            </div>
          </header>

          <div className="prof-scroll">
            <div className="prof-menu">
              {MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  className={`prof-menu-item${item.danger ? " prof-menu-item--danger" : ""}`}
                  onClick={() => handleMenu(item.id)}
                >
                  <span className="prof-menu-emoji">{item.emoji}</span>
                  <span className="prof-menu-label">{item.label}</span>
                  {!item.danger && <span className="prof-menu-chevron">›</span>}
                </button>
              ))}
            </div>
          </div>

          <nav className="prof-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`prof-nav-item${activeNav === item.id ? " prof-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="prof-nav-emoji">{item.emoji}</span>
                <span className="prof-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}