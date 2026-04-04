import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyPets.css";

const INITIAL_PETS = [
  { id: 1, emoji: "🐶", name: "Buddy", breed: "Golden Retriever", age: "3 yrs" },
  { id: 2, emoji: "🐱", name: "Luna", breed: "British Shorthair", age: "2 yrs" },
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
  const [pets] = useState(INITIAL_PETS);
  const [activeNav, setActiveNav] = useState("pets");

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

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mypets-screen">
          <header className="mypets-header">
            <button className="mypets-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="mypets-title">My Pets</h1>
          </header>

          <div className="mypets-scroll">
            <div className="mypets-list">
              {pets.map((pet) => (
                <div key={pet.id} className="mypets-card">
                  <div className="mypets-card-top">
                    <span className="mypets-avatar">{pet.emoji}</span>
                    <div className="mypets-info">
                      <span className="mypets-name">{pet.name}</span>
                      <span className="mypets-meta">{pet.breed} · {pet.age}</span>
                    </div>
                  </div>
                  <button
                    className="mypets-edit-btn"
                    onClick={() => alert(`Edit ${pet.name}`)}
                  >
                    Edit
                  </button>
                </div>
              ))}

              <button
                className="mypets-add-btn"
                onClick={() => alert("Add new pet")}
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