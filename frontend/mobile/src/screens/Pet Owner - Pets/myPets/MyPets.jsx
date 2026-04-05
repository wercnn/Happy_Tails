import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyPets.css";

const PET_FILTERS = ["All", "Dog", "Cat", "Rabbit", "Bird", "Reptile", "Other"];

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

export default function HappyTailsMyPets() {
  const navigate = useNavigate();
  const [pets, setPets] = useState([]);
  const [activeNav, setActiveNav] = useState("pets");
  const [openPetId, setOpenPetId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [deletePetId, setDeletePetId] = useState(null);

  useEffect(() => {
    const savedPets = JSON.parse(localStorage.getItem("ownerPets") || "[]");
    setPets(savedPets);
  }, []);

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pet.species || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "All" || pet.species === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [pets, searchQuery, activeFilter]);

  const petToDelete = pets.find((pet) => pet.id === deletePetId) || null;

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

  const confirmDeletePet = (petId) => {
    setDeletePetId(petId);
  };

  const handleDeletePet = () => {
    const updatedPets = pets.filter((pet) => pet.id !== deletePetId);
    setPets(updatedPets);
    localStorage.setItem("ownerPets", JSON.stringify(updatedPets));

    if (openPetId === deletePetId) {
      setOpenPetId(null);
    }

    setDeletePetId(null);
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
              <button
                className="mypets-add-btn mypets-add-btn--top"
                onClick={() => navigate("/addPet")}
              >
                + Add New Pet
              </button>

              <div className="mypets-search-row">
                <div className="mypets-search-box">
                  <span className="mypets-search-icon">🔍</span>
                  <input
                    className="mypets-search-input"
                    type="text"
                    placeholder="Search pets by name, breed or species..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="mypets-filters">
                {PET_FILTERS.map((filter) => (
                  <button
                    key={filter}
                    className={`mypets-filter-chip${activeFilter === filter ? " mypets-filter-chip--active" : ""}`}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {filteredPets.map((pet) => (
                <div key={pet.id} className="mypets-card">
                  <div className="mypets-card-actions-top">
                    <button
                      className="mypets-edit-icon"
                      onClick={() => navigate("/addPet", { state: { pet } })}
                      aria-label={`Edit ${pet.name}`}
                    >
                      ✎
                    </button>

                    <button
                      className="mypets-delete-icon"
                      onClick={() => confirmDeletePet(pet.id)}
                      aria-label={`Delete ${pet.name}`}
                    >
                      🗑
                    </button>
                  </div>

                  <div className="mypets-card-top">
                    <span className="mypets-avatar">
                      {pet.photo ? (
                        <img
                          src={pet.photo}
                          alt={pet.name}
                          className="mypets-avatar-img"
                        />
                      ) : (
                        pet.emoji || "🐾"
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

              {filteredPets.length === 0 && (
                <p className="mypets-empty">No pets match your search or filter.</p>
              )}
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

          {deletePetId && (
            <div className="mypets-delete-overlay">
              <div className="mypets-delete-modal">
                <h2 className="mypets-delete-title">Delete Pet?</h2>
                <p className="mypets-delete-text">
                  Are you sure you want to remove {petToDelete?.name || "this pet"}?
                </p>

                <div className="mypets-delete-actions">
                  <button
                    className="mypets-delete-cancel"
                    onClick={() => setDeletePetId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="mypets-delete-confirm"
                    onClick={handleDeletePet}
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}