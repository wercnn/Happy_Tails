import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyPets.css";

const INITIAL_PETS = [
  {
    id: 1,
    emoji: "🐶",
    name: "Buddy",
    breed: "Golden Retriever",
    age: "3",
    species: "Dog",
    notes: "2 walks a day, fed at 8am and 6pm",
  },
  {
    id: 2,
    emoji: "🐱",
    name: "Luna",
    breed: "British Shorthair",
    age: "2",
    species: "Cat",
    notes: "Indoor cat, fed twice daily",
  },
];

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsMyPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState(INITIAL_PETS);
  const [activeNav, setActiveNav] = useState("pets");
  const [openPetId, setOpenPetId] = useState(null);

  useEffect(() => {
    const savedPets = JSON.parse(localStorage.getItem("ownerPets") || "[]");
    setPets([...INITIAL_PETS, ...savedPets]);
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

  const togglePetSummary = (petId) => {
    setOpenPetId((prev) => (prev === petId ? null : petId));
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mypets-screen">
          <header className="mypets-header">
            <h1 className="mypets-title">My Pets</h1>
          </header>

          <div className="mypets-scroll">
            <div className="mypets-list">
              {pets.map((pet) => (
                <div key={pet.id} className="mypets-card">
                  <button
                    className="mypets-edit-icon"
                    onClick={() => alert(`Edit ${pet.name}`)}
                    aria-label={`Edit ${pet.name}`}
                  >
                    ✎
                  </button>

                  <div className="mypets-card-top">
                    <span className="mypets-avatar">
                      {pet.photo ? (
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="mypets-avatar-img"
                        />
                      ) : (
                        pet.emoji
                      )}
                    </span>

                    <div className="mypets-info">
                      <span className="mypets-name">{pet.name}</span>
                      <span className="mypets-meta">{pet.breed} · {pet.age} yrs</span>
                    </div>
                  </div>

                  <button
                    className="mypets-summary-toggle"
                    onClick={() => togglePetSummary(pet.id)}
                  >
                    <span>Quick Summary</span>
                    <span className={`mypets-summary-arrow${openPetId === pet.id ? " mypets-summary-arrow--open" : ""}`}>
                      ⌄
                    </span>
                  </button>

                  {openPetId === pet.id && (
                    <div className="mypets-summary">
                      <div className="mypets-summary-row">
                        <span className="mypets-summary-label">Species:</span>
                        <span className="mypets-summary-value">{pet.species || "Not added"}</span>
                      </div>
                      <div className="mypets-summary-row">
                        <span className="mypets-summary-label">Breed:</span>
                        <span className="mypets-summary-value">{pet.breed}</span>
                      </div>
                      <div className="mypets-summary-row">
                        <span className="mypets-summary-label">Age:</span>
                        <span className="mypets-summary-value">{pet.age} yrs</span>
                      </div>
                      <div className="mypets-summary-row mypets-summary-row--notes">
                        <span className="mypets-summary-label">Notes:</span>
                        <span className="mypets-summary-value">{pet.notes || "No notes added"}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                className="mypets-add-btn"
                onClick={() => navigate("/addPet")}
              >
                + Add New Pet
              </button>
            </div>
          </div>

          <nav className="mypets-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`mypets-nav-item${activeNav === item.id ? " mypets-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="mypets-nav-emoji">{item.emoji}</span>
                <span className="mypets-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}