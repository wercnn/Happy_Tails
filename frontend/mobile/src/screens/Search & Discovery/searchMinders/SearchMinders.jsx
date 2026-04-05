import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SearchMinders.css";

const MINDERS = [
  {
    id: 1,
    emoji: "🐕",
    name: "James Walker",
    services: "Dog Walking · Boarding",
    serviceList: ["Dog Walking", "Boarding"],
    petTypes: ["Dogs"],
    availability: ["Today", "This Week"],
    price: 15,
    rate: "£15/hr",
    distance: "0.8 mi",
    rating: 4.9,
    ratingText: "4.9",
    reviews: 24,
  },
  {
    id: 2,
    emoji: "🐶",
    name: "Priya Patel",
    services: "Pet Sitting · Day Care",
    serviceList: ["Pet Sitting", "Day Care"],
    petTypes: ["Dogs", "Cats"],
    availability: ["This Week", "Weekends Only"],
    price: 12,
    rate: "£12/hr",
    distance: "1.2 mi",
    rating: 4.7,
    ratingText: "4.7",
    reviews: 18,
  },
  {
    id: 3,
    emoji: "🐕",
    name: "Tom Hughes",
    services: "Dog Walking",
    serviceList: ["Dog Walking"],
    petTypes: ["Dogs", "Rabbits"],
    availability: ["Today", "Weekends Only"],
    price: 14,
    rate: "£14/hr",
    distance: "1.5 mi",
    rating: 4.8,
    ratingText: "4.8",
    reviews: 31,
  },
];

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const DEFAULT_FILTERS = {
  services: ["All"],
  pets: ["All"],
  availability: ["Any"],
  maxPrice: 25,
  sortBy: "Nearest First",
};

export default function HappyTailsFindMinder() {
  const navigate = useNavigate();
  const location = useLocation();

  const [query, setQuery] = useState("");
  const [activeNav, setActiveNav] = useState("search");
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS);

  useEffect(() => {
    if (location.state?.filters) {
      setAppliedFilters(location.state.filters);
    }
  }, [location.state]);

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

  const filtered = useMemo(() => {
    let result = MINDERS.filter((m) => {
      const matchesQuery =
        query.trim() === "" ||
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.services.toLowerCase().includes(query.toLowerCase());

      const matchesServiceFilters =
        appliedFilters.services.includes("All") ||
        appliedFilters.services.some((service) =>
          m.serviceList.includes(service)
        );

      const matchesPetFilters =
        appliedFilters.pets.includes("All") ||
        appliedFilters.pets.some((pet) => m.petTypes.includes(pet));

      const matchesAvailability =
        appliedFilters.availability.includes("Any") ||
        appliedFilters.availability.some((slot) =>
          m.availability.includes(slot)
        );

      const matchesPrice = m.price <= appliedFilters.maxPrice;

      return (
        matchesQuery &&
        matchesServiceFilters &&
        matchesPetFilters &&
        matchesAvailability &&
        matchesPrice
      );
    });

    switch (appliedFilters.sortBy) {
      case "Highest Rated":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "Lowest Price":
        result.sort((a, b) => a.price - b.price);
        break;
      case "Most Reviews":
        result.sort((a, b) => b.reviews - a.reviews);
        break;
      case "Nearest First":
      default:
        break;
    }

    return result;
  }, [query, appliedFilters]);

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="fm-screen">
          <header className="fm-header">
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
                <button
                  className="fm-filter-btn"
                  onClick={() =>
                    navigate("/searchFilters", {
                      state: { filters: appliedFilters },
                    })
                  }
                >
                  ☰
                </button>
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
                      </div>
                      <span className="fm-minder-services">{m.services}</span>
                      <div className="fm-minder-meta">
                        <span className="fm-rate">{m.rate}</span>
                        <span className="fm-dot-sep">📍</span>
                        <span className="fm-distance">{m.distance}</span>
                        <span className="fm-star">⭐</span>
                        <span className="fm-rating">{m.ratingText}</span>
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