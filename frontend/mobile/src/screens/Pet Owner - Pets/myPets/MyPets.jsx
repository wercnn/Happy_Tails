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
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPets = async () => {
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
        console.error("Failed to load pets:", err);
        setError("Server error. Please try again.");
      }
    };

    loadPets();
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

  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        (pet.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pet.breed || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (pet.species || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "All" || pet.species === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [pets, searchQuery, activeFilter]);

  const petToDelete =
    pets.find((pet) => (pet.petID || pet.id) === deletePetId) || null;

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

  const handleDeletePet = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/pets/${deletePetId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": localStorage.getItem("userID") || "",
          "x-user-role": localStorage.getItem("userRole") || "",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to delete pet.");
        return;
      }

      const updatedPets = pets.filter(
        (pet) => (pet.petID || pet.id) !== deletePetId
      );
      setPets(updatedPets);

      if (openPetId === deletePetId) {
        setOpenPetId(null);
      }

      setDeletePetId(null);
    } catch (err) {
      console.error("Failed to delete pet:", err);
      setError("Server error. Please try again.");
    }
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

              {error && <p className="mypets-empty">{error}</p>}

              {filteredPets.map((pet) => {
                const petId = pet.petID || pet.id;

                return (
                  <div
                    key={petId}
                    className="mypets-card"
                    onClick={() => navigate("/petProfile", { state: { pet } })}
                  >
                    <div className="mypets-card-actions-top">
                      <button
                        className="mypets-edit-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/addPet", { state: { pet } });
                        }}
                        aria-label={`Edit ${pet.name}`}
                      >
                        ✎
                      </button>

                      <button
                        className="mypets-delete-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeletePet(petId);
                        }}
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
                          getPetEmoji(pet.species)
                        )}
                      </span>

                      <div className="mypets-info">
                        <span className="mypets-name">{pet.name}</span>
                        <span className="mypets-meta">
                          {pet.breed} · {pet.age} yrs
                        </span>
                      </div>
                    </div>

                    <button
                      className="mypets-summary-toggle"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePetSummary(petId);
                      }}
                    >
                      <span>Quick Summary</span>
                      <span
                        className={`mypets-summary-arrow${openPetId === petId ? " mypets-summary-arrow--open" : ""}`}
                      >
                        ⌄
                      </span>
                    </button>

                    {openPetId === petId && (
                      <div
                        className="mypets-summary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mypets-summary-row">
                          <span className="mypets-summary-label">Species:</span>
                          <span className="mypets-summary-value">
                            {pet.species || "Not added"}
                          </span>
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
                          <span className="mypets-summary-value">
                            {pet.routines || pet.notes || "No notes added"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!error && filteredPets.length === 0 && (
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
            <div
              className="mypets-delete-overlay"
              onClick={() => setDeletePetId(null)}
            >
              <div
                className="mypets-delete-modal"
                onClick={(e) => e.stopPropagation()}
              >
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