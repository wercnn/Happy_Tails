import { useState } from "react";
import "./OwnerHome.css";

const PETS = [
  { id: 1, emoji: "🐶", name: "Buddy",  breed: "Golden Retriever", age: "3 yrs" },
  { id: 2, emoji: "🐱", name: "Luna",   breed: "British Shorthair", age: "2 yrs" },
];

const BOOKINGS = [
  { id: 1, emoji: "🚶", service: "Dog Walking", minder: "James W.", time: "Today, 2pm", status: "Confirmed" },
];

const NAV = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

export default function HappyTailsHome() {
  const [activeNav, setActiveNav] = useState("home");

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="home-screen">

          {/* ── Orange Header ── */}
          <header className="home-header">
            <div className="home-greeting-block">
              <h1 className="home-greeting">Good morning 👋</h1>
              <p className="home-name">Sarah Johnson</p>
            </div>
            <button className="home-bell-btn" onClick={() => alert("Notifications")}>
              🔔
            </button>
          </header>

          {/* ── Scrollable Body ── */}
          <div className="home-scroll">

            {/* Find a Minder banner */}
            <div className="home-banner">
              <h2 className="home-banner-title">Find a Minder Today</h2>
              <p className="home-banner-sub">Browse trusted pet carers near you</p>
              <button className="home-banner-btn" onClick={() => alert("Search minders")}>
                Search Now →
              </button>
            </div>

            {/* My Pets */}
            <section className="home-section">
              <h3 className="home-section-title">My Pets</h3>
              <div className="home-pet-list">
                {PETS.map((pet) => (
                  <button key={pet.id} className="home-pet-card" onClick={() => alert(`View ${pet.name}`)}>
                    <span className="home-pet-avatar">{pet.emoji}</span>
                    <div className="home-pet-info">
                      <span className="home-pet-name">{pet.name}</span>
                      <span className="home-pet-meta">{pet.breed} · {pet.age}</span>
                    </div>
                    <span className="home-pet-chevron">›</span>
                  </button>
                ))}
              </div>
              <button className="home-add-pet" onClick={() => alert("Add a pet")}>
                + Add a Pet
              </button>
            </section>

            {/* Recent Bookings */}
            <section className="home-section">
              <h3 className="home-section-title">Recent Bookings</h3>
              <div className="home-booking-list">
                {BOOKINGS.map((b) => (
                  <div key={b.id} className="home-booking-card">
                    <span className="home-booking-avatar">{b.emoji}</span>
                    <div className="home-booking-info">
                      <span className="home-booking-service">{b.service}<br />with {b.minder}</span>
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

          {/* ── Bottom Nav ── */}
          <nav className="home-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`home-nav-item${activeNav === item.id ? " home-nav-item--active" : ""}`}
                onClick={() => setActiveNav(item.id)}
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