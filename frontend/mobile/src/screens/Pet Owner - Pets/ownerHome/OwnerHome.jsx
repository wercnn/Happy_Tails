import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHome.css";

const BOOKINGS = [
  { id: 1, emoji: "🚶", service: "Dog Walking", minder: "James W.", time: "Today, 2pm", status: "Confirmed" },
];

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

  useEffect(() => {
    const loadOwnerHomeData = async () => {
      const firstName = localStorage.getItem("firstName") || "";
      const lastName = localStorage.getItem("lastName") || "";
      const fullName = `${firstName} ${lastName}`.trim();
      setOwnerName(fullName || "Owner");

      try {
        const res = await fetch("http://localhost:3000/api/pets", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": localStorage.getItem("userID") || "",
            "x-user-role": localStorage.getItem("userRole") || "",
          },
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to load pets.");
          return;
        }

        setPets(data);
      } catch (err) {
        console.error("Failed to load owner home pets:", err);
        setError("Server error. Please try again.");
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
            <button className="home-bell-btn" onClick={() => alert("Notifications")}>
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
                {BOOKINGS.map((b) => (
                  <div key={b.id} className="home-booking-card">
                    <span className="home-booking-avatar">{b.emoji}</span>
                    <div className="home-booking-info">
                      <span className="home-booking-service">
                        {b.service}
                        <br />
                        with {b.minder}
                      </span>
                      <span className="home-booking-time">{b.time}</span>
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