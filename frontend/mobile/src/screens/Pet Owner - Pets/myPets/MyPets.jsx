import { useState } from "react";
import "./MyPets.css";

const INITIAL_PETS = [
  { id: 1, emoji: "🐶", name: "Buddy", breed: "Golden Retriever", age: "3 yrs" },
  { id: 2, emoji: "🐱", name: "Luna",  breed: "British Shorthair", age: "2 yrs" },
];

const NAV = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

export default function HappyTailsMyPets() {
  const [pets] = useState(INITIAL_PETS);
  const [activeNav, setActiveNav] = useState("home");

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="mypets-screen">

          {/* ── Header ── */}
          <header className="mypets-header">
            <button className="mypets-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="mypets-title">My Pets</h1>
          </header>

          {/* ── Scrollable body ── */}
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

          {/* ── Bottom Nav ── */}
          <nav className="mypets-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`mypets-nav-item${activeNav === item.id ? " mypets-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
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