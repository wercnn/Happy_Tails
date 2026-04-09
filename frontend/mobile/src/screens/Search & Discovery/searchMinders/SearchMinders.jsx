import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./SearchMinders.css";

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
  const [minders, setMinders] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (location.state?.filters) {
      setAppliedFilters(location.state.filters);
    }
  }, [location.state]);

  useEffect(() => {
    const loadMinders = async () => {
      setIsLoading(true);
      setError("");

      try {
        const headers = {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userID") || "",
          "x-user-role": localStorage.getItem("userRole") || "",
        };

        const res = await fetch("http://localhost:3000/api/minders", {
          method: "GET",
          headers,
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load minders.");
          setIsLoading(false);
          return;
        }

        const detailedMinders = await Promise.all(
          data.map(async (minder) => {
            try {
              const detailRes = await fetch(
                `http://localhost:3000/api/minders/${minder.sitterID}`,
                {
                  method: "GET",
                  headers,
                }
              );

              const detailData = await detailRes.json();

              if (!detailRes.ok) {
                return {
                  ...minder,
                  id: minder.sitterID,
                  name: `${minder.firstName} ${minder.lastName}`,
                  services: "Services not available",
                  serviceList: [],
                  petTypes: [],
                  availability: [],
                  price: 0,
                  rate: "Price unavailable",
                  distance: `${minder.city || minder.postcode || "Local"}`,
                  rating: Number(minder.ratingAvg || 0),
                  ratingText: String(minder.ratingAvg || "0.0"),
                  reviews: 0,
                };
              }

              const activeServices = (detailData.services || []).filter(
                (service) => service.isActive
              );

              const servicePrices = activeServices
                .map((service) => Number(service.customPrice ?? service.basePrice ?? 0))
                .filter((price) => Number.isFinite(price) && price > 0);
              const startingPrice = servicePrices.length > 0 ? Math.min(...servicePrices) : 0;

              return {
                ...detailData,
                id: detailData.sitterID,
                name: `${detailData.firstName} ${detailData.lastName}`,
                services:
                  activeServices.length > 0
                    ? activeServices.map((s) => s.name).join(" · ")
                    : "No services listed",
                serviceList: activeServices.map((s) => s.name),
                petTypes: detailData.petTypes || [],
                availability: (detailData.slots || []).length > 0 ? ["Available"] : [],
                price: startingPrice,
                rate: startingPrice > 0 ? `From £${startingPrice}/hr` : "Price unavailable",
                distance: `${detailData.city || detailData.postcode || "Local"}`,
                rating: Number(detailData.ratingAvg || 0).toFixed(1),
                ratingText: String(Number(detailData.ratingAvg || 0).toFixed(1)|| "0.0"),
                reviews: (detailData.reviews || []).length,
              };
            } catch {
              return {
                ...minder,
                id: minder.sitterID,
                name: `${minder.firstName} ${minder.lastName}`,
                services: "Services not available",
                serviceList: [],
                petTypes: [],
                availability: [],
                price: 0,
                rate: "Price unavailable",
                distance: `${minder.city || minder.postcode || "Local"}`,
                rating: Number(minder.ratingAvg || 0).toFixed(1),
                ratingText: String(Number(minder.ratingAvg || 0).toFixed(1)|| "0.0"),
                reviews: 0,
              };
            }
          })
        );

        setMinders(detailedMinders);
      } catch (err) {
        console.error("Failed to load minders:", err);
        setError("Server error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMinders();
  }, []);

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
    let result = minders.filter((m) => {
      const matchesQuery =
        query.trim() === "" ||
        (m.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (m.services || "").toLowerCase().includes(query.toLowerCase()) ||
        (m.city || "").toLowerCase().includes(query.toLowerCase()) ||
        (m.postcode || "").toLowerCase().includes(query.toLowerCase());

      const matchesServiceFilters =
        appliedFilters.services.includes("All") ||
        appliedFilters.services.some((service) =>
          (m.serviceList || []).includes(service)
        );

      const matchesPetFilters =
        appliedFilters.pets.includes("All") ||
        (m.petTypes || []).length === 0 ||
        appliedFilters.pets.some((pet) => (m.petTypes || []).includes(pet));

      const matchesAvailability =
        appliedFilters.availability.includes("Any") ||
        (m.availability || []).length === 0 ||
        appliedFilters.availability.some((slot) =>
          (m.availability || []).includes(slot)
        );

      const matchesPrice =
        m.price === 0 || m.price <= appliedFilters.maxPrice;

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
  }, [query, appliedFilters, minders]);

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
                {isLoading && (
                  <p className="fm-empty">Loading minders...</p>
                )}

                {!isLoading && error && (
                  <p className="fm-empty">{error}</p>
                )}

                {!isLoading &&
                  !error &&
                  filtered.map((m) => (
                    <button
                      key={m.id}
                      className="fm-minder-card"
                      onClick={() => navigate("/viewMinders", { state: { minder: m } })}
                    >
                      <span className="fm-minder-avatar">🐾</span>
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

                {!isLoading && !error && filtered.length === 0 && (
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