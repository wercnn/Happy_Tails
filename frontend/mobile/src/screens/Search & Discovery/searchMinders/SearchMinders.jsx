import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchMinders.css";

const FILTERS = ["Dog Walking", "Boarding", "Pet Sitting", "Day Care"];

const MINDERS = [
  {
    id: 1,
    emoji: "🐕",
    name: "James Walker",
    verified: true,
    services: "Dog Walking · Boarding",
    rate: "£15/hr",
    distance: "0.8 mi",
    rating: "4.9",
  },
  {
    id: 2,
    emoji: "🐶",
    name: "Priya Patel",
    verified: false,
    services: "Pet Sitting · Day Care",
    rate: "£12/hr",
    distance: "1.2 mi",
    rating: "4.7",
  },
  {
    id: 3,
    emoji: "🐕",
    name: "Tom Hughes",
    verified: true,
    services: "Dog Walking",
    rate: "£14/hr",
    distance: "1.5 mi",
    rating: "4.8",
  },
];

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsFindMinder() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);
  const [activeNav, setActiveNav] = useState("search");

  const toggleFilter = (f) =>
    setActiveFilters((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );

  const handleNavClick = (id) => {
    setActiveNav(id);

    switch (id) {
      case "home":
        navigate("/ownerDash");
        break;
      case "pets":
        navigate("/ownerPets");
        break;
      case "search":
        navigate("/ownerSearch");
        break;
      case "bookings":
        navigate("/ownerBooking");
        break;
      case "profile":
        navigate("/profile");
        break;
      default:
        alert("Placeholder route");
        break;
    }
  };

  const filtered = MINDERS.filter((m) => {
    const matchesQuery =
      query === "" ||
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.services.toLowerCase().includes(query.toLowerCase());

    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((f) =>
        m.services.toLowerCase().includes(f.toLowerCase())
      );

    return matchesQuery && matchesFilters;
  });

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="fm-screen">
          <header className="fm-header">
            <button className="fm-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="fm-title">Find a Minder</h1>
          </header>

          <div className="fm-scroll">
            <div className="fm-body">
              <div className="fm-search-row">
                <div className="fm-search-box">
                  <span className="fm-search-icon">🔍</span>
                  <input
                    className="fm-search-input"
                    type="text"
                    placeholder="Search by name or location..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <button className="fm-filter-btn" onClick={() => alert("Open filters")}>
                  ⚙️
                </button>
              </div>

              <div className="fm-filters">
                {FILTERS.map((f) => (
                  <button
                    key={f}
                    className={`fm-filter-chip${activeFilters.includes(f) ? " fm-filter-chip--active" : ""}`}
                    onClick={() => toggleFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="fm-minder-list">
                {filtered.map((m) => (
                  <button
                    key={m.id}
                    className="fm-minder-card"
                    onClick={() => alert(`View ${m.name}'s profile`)}
                  >
                    <span className="fm-minder-avatar">{m.emoji}</span>
                    <div className="fm-minder-info">
                      <div className="fm-minder-name-row">
                        <span className="fm-minder-name">{m.name}</span>
                        {m.verified && <span className="fm-verified">✔</span>}
                      </div>
                      <span className="fm-minder-services">{m.services}</span>
                      <div className="fm-minder-meta">
                        <span className="fm-rate">{m.rate}</span>
                        <span className="fm-dot-sep">📍</span>
                        <span className="fm-distance">{m.distance}</span>
                        <span className="fm-star">⭐</span>
                        <span className="fm-rating">{m.rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="fm-empty">No minders found. Try adjusting your search.</p>
                )}
              </div>
            </div>
          </div>

          <nav className="fm-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`fm-nav-item${activeNav === item.id ? " fm-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="fm-nav-emoji">{item.emoji}</span>
                <span className="fm-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}