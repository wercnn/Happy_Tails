import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ProfileSettings.css";

const API_BASE = "http://localhost:3000";

const MENU_ITEMS = [
  { id: "edit",    emoji: "👤", label: "Edit Profile" },
  { id: "notifs",  emoji: "🔔", label: "Notifications Preferences" },
  { id: "payment", emoji: "💳", label: "Payment Methods" },
  { id: "privacy", emoji: "🔒", label: "Privacy & Security" },
  { id: "help",    emoji: "❓", label: "Help & Support" },
  { id: "terms",   emoji: "📄", label: "Terms & Privacy Policy" },
  { id: "logout",  emoji: "🚪", label: "Log Out", danger: true },
];

const OWNER_NAV_ITEMS = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

const MINDER_NAV_ITEMS = [
  { id: "dashboard",    emoji: "🏠", label: "Dashboard" },
  { id: "services",     emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests",     emoji: "📬", label: "Requests" },
  { id: "profile",      emoji: "👤", label: "Profile" },
];

const ROLE_LABEL = { owner: "Pet Owner", minder: "Pet Minder", support: "Support" };

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

export default function HappyTailsProfile() {
  const navigate = useNavigate();
  const role = localStorage.getItem("userRole");

  const navItems = role === "owner" ? OWNER_NAV_ITEMS : MINDER_NAV_ITEMS;
  const [activeNav, setActiveNav] = useState("profile");

  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    const userID = localStorage.getItem("userID");
    if (!userID) return;

    fetch(`${API_BASE}/api/users/${userID}`, { headers: getAuthHeaders() })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load profile (${res.status})`);
        return res.json();
      })
      .then((data) => setProfile(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleMenu = (id) => {
    if (id === "logout") {
      if (window.confirm("Are you sure you want to log out?")) {
        localStorage.removeItem("userID");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("username");
        localStorage.removeItem("firstName");
        localStorage.removeItem("lastName");
        navigate("/");
      }
    } else {
      alert(`Navigate to: ${id}`);
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);

    if (role === "owner") {
      switch (id) {
        case "home":     navigate("/ownerDash");    break;
        case "pets":     navigate("/ownerPets");    break;
        case "search":   navigate("/ownerSearch");  break;
        case "bookings": navigate("/ownerBooking"); break;
        case "profile":  navigate("/profile");      break;
        default: break;
      }
    } else {
      switch (id) {
        case "dashboard":    navigate("/mindDash");         break;
        case "services":     navigate("/mindService");      break;
        case "availability": navigate("/mindAvailability"); break;
        case "requests":     navigate("/mindRequests");     break;
        case "profile":      navigate("/profile");          break;
        default: break;
      }
    }
  };

  // Derive display values from fetched profile (fall back to localStorage while loading)
  const displayName = `${localStorage.getItem("firstName") || ""} ${localStorage.getItem("lastName") || ""}`.trim() || "—";



  const displayRole = profile
    ? ROLE_LABEL[profile.role] || profile.role
    : ROLE_LABEL[role] || role || "—";

  const displayCity = profile?.city || "";

  const displaySub = displayCity
    ? `${displayRole} · ${displayCity}`
    : displayRole;

  const isVerified = profile?.status === "Active";

  const minderStats = profile?.role === "minder" ? {
    rating:     profile.ratingAvg      != null ? profile.ratingAvg      : "—",
    experience: profile.experienceYears != null ? profile.experienceYears : "—",
  } : null;

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="prof-screen">
          <header className="prof-hero">
            <div className="prof-avatar">
              <span className="prof-avatar-icon">👤</span>
            </div>

            {loading && <h1 className="prof-name">Loading...</h1>}
            {error   && <h1 className="prof-name" style={{ fontSize: "0.9rem", color: "#ef4444" }}>{error}</h1>}

            {!loading && !error && (
              <>
                <h1 className="prof-name">{displayName}</h1>
                <p className="prof-sub">{displaySub}</p>

                {isVerified && (
                  <div className="prof-verified">
                    <span>✓</span>
                    <span>Verified Account</span>
                  </div>
                )}

                {minderStats && (
                  <div className="prof-stats-row">
                    <div className="prof-stat">
                      <span className="prof-stat-value">⭐ {minderStats.rating}</span>
                      <span className="prof-stat-label">Rating</span>
                    </div>
                    <div className="prof-stat">
                      <span className="prof-stat-value">{minderStats.experience} yrs</span>
                      <span className="prof-stat-label">Experience</span>
                    </div>
                  </div>
                )}
              </>
            )}
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
            {navItems.map((item) => (
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
