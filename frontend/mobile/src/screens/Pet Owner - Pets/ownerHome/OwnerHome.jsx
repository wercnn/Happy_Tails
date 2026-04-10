import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHome.css";

const API_BASE = "http://localhost:3000";

const SERVICE_NAMES = {
  "st-walk":    "Dog Walking",
  "st-board":   "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const SERVICE_EMOJI = {
  "st-walk":    "🚶",
  "st-board":   "🏠",
  "st-daycare": "🌞",
};

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id":   localStorage.getItem("userID")   || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function formatBookingTime(dateStr) {
  const date = new Date(dateStr.replace(" ", "T"));
  const now  = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth()    === now.getMonth()    &&
    date.getDate()     === now.getDate();

  const timeStr = date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${timeStr}`;

  return date.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" }) + `, ${timeStr}`;
}

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsHome() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("home");
  const [pets, setPets] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [error, setError] = useState("");
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  useEffect(() => {
    const loadOwnerHomeData = async () => {
      const firstName = localStorage.getItem("firstName") || "";
      const lastName  = localStorage.getItem("lastName")  || "";
      setOwnerName(`${firstName} ${lastName}`.trim() || "Owner");

      // Fetch pets
      try {
        const res  = await fetch(`${API_BASE}/api/pets`, {
          method: "GET",
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Failed to load pets.");
        } else {
          setPets(data);
        }
      } catch (err) {
        console.error("Failed to load pets:", err);
        setError("Server error. Please try again.");
      }

      // Fetch bookings — GET /api/bookings (owner role returns own bookings)
      try {
        const res  = await fetch(`${API_BASE}/api/bookings`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          const filtered = data.filter((b) =>
            ["rejected", "completed", "cancelled"].includes(b.status)
          );
          const sorted = filtered.sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
          );
          setBookings(sorted.slice(0, 3));
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setBookingsLoading(false);
      }
    };

    loadOwnerHomeData();
  }, []);

  const getPetEmoji = (species) => {
    switch ((species || "").toLowerCase()) {
      case "dog":
        return "🐶";
      case "cat":
        return "🐱";
      case "rabbit":
        return "🐰";
      case "bird":
        return "🐦";
      case "reptile":
        return "🦎";
      default:
        return "🐾";
    }
  };

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

  const visiblePets = pets.slice(0, 3);
  const hasMoreThanThreePets = pets.length > 3;

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="home-screen">
          <header className="home-header">
            <div className="home-greeting-block">
              <h1 className="home-greeting">Good morning 👋</h1>
              <p className="home-name">{ownerName}</p>
            </div>
            <button className="home-bell-btn" onClick={() => navigate("/notifications")}>
              🔔
            </button>
          </header>

          <div className="home-scroll">
            <div className="home-banner">
              <h2 className="home-banner-title">Find a Minder Today</h2>
              <p className="home-banner-sub">Browse trusted pet carers near you</p>
              <button className="home-banner-btn" onClick={() => navigate("/ownerSearch")}>
                Search Now →
              </button>
            </div>

            <section className="home-section">
              <div className="home-section-head">
                <h3 className="home-section-title">My Pets</h3>
              </div>

              <div className="home-pet-list">
                {error ? (
                  <p className="home-empty-pets">{error}</p>
                ) : pets.length > 0 ? (
                  <>
                    {visiblePets.map((pet) => (
                      <button
                        key={pet.petID || pet.id}
                        className="home-pet-card"
                        onClick={() => navigate("/ownerPets")}
                      >
                        <span className="home-pet-avatar">
                          {pet.photo ? (
                            <img
                              src={pet.photo}
                              alt={pet.name}
                              className="home-pet-avatar-img"
                            />
                          ) : (
                            getPetEmoji(pet.species)
                          )}
                        </span>

                        <div className="home-pet-info">
                          <span className="home-pet-name">{pet.name}</span>
                          <span className="home-pet-meta">
                            {pet.breed} · {pet.age}
                          </span>
                        </div>

                        <span className="home-pet-chevron">›</span>
                      </button>
                    ))}

                    {hasMoreThanThreePets && (
                      <button
                        className="home-view-all-pets"
                        onClick={() => navigate("/ownerPets")}
                      >
                        View all pets here →
                      </button>
                    )}
                  </>
                ) : (
                  <p className="home-empty-pets">No pets added yet</p>
                )}
              </div>

              <button
                className="home-add-pet"
                onClick={() => navigate("/addPet")}
              >
                + Add a Pet
              </button>
            </section>

            <section className="home-section">
              <h3 className="home-section-title">Recent Bookings</h3>
              <div className="home-booking-list">
                {bookingsLoading && (
                  <p className="home-empty-pets">Loading...</p>
                )}
                {!bookingsLoading && bookings.length === 0 && (
                  <p className="home-empty-pets">No bookings yet</p>
                )}
                {!bookingsLoading && bookings.map((b) => (
                  <div key={b.bookingID} className="home-booking-card">
                    <span className="home-booking-avatar">
                      {SERVICE_EMOJI[b.serviceTypeID] || "🐾"}
                    </span>
                    <div className="home-booking-info">
                      <span className="home-booking-service">
                        {SERVICE_NAMES[b.serviceTypeID] || b.serviceTypeID}
                      </span>
                      <span className="home-booking-time">
                        {formatBookingTime(b.startTime)}
                      </span>
                    </div>
                    <span className={`home-booking-badge home-booking-badge--${b.status.toLowerCase()}`}>
                      {b.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <div className="home-scroll-pad" />
          </div>

          <nav className="home-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`home-nav-item${activeNav === item.id ? " home-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="home-nav-emoji">{item.emoji}</span>
                <span className="home-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}