import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OwnerHome.css";

const API_BASE = "http://localhost:3000";

const SERVICE_NAMES = {
  "st-walk": "Dog Walking",
  "st-board": "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const SERVICE_EMOJI = {
  "st-walk": "🚶",
  "st-board": "🏠",
  "st-daycare": "🌞",
};

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userID") || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatTimeOnly(dateStr) {
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDateOnly(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getCreatedMinuteKey(createdAt) {
  if (!createdAt) return "no-created-at";
  const d = toDate(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;
}

function groupBookings(bookings) {
  const groups = new Map();

  for (const b of bookings) {
    const key = [
      b.ownerID,
      b.sitterID,
      b.petID,
      b.serviceTypeID,
      String(b.status || "").toLowerCase(),
      b.ownerNotes || "",
      getCreatedMinuteKey(b.createdAt),
    ].join("|");

    if (!groups.has(key)) {
      groups.set(key, {
        groupKey: key,
        bookingIDs: [],
        bookings: [],
        bookingID: b.bookingID,
        serviceTypeID: b.serviceTypeID,
        status: String(b.status || "").toLowerCase(),
        startTime: b.startTime,
        endTime: b.endTime,
        createdAt: b.createdAt,
        totalCost: 0,
      });
    }

    const group = groups.get(key);
    group.bookingIDs.push(b.bookingID);
    group.bookings.push(b);
    group.totalCost += Number(b.totalCost || 0);

    const currentStart = toDate(group.startTime);
    const nextStart = toDate(b.startTime);
    if (nextStart < currentStart) {
      group.startTime = b.startTime;
      group.endTime = b.endTime;
      group.bookingID = b.bookingID;
    }
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      dates: group.bookings
        .map((b) => b.startTime)
        .sort((a, b) => toDate(a) - toDate(b)),
    }))
    .sort((a, b) => toDate(b.createdAt || b.startTime) - toDate(a.createdAt || a.startTime));
}

function getRecentBookingDateText(group) {
  if (group.dates.length === 1) {
    return formatDateOnly(group.dates[0]);
  }

  return `${group.dates.length} dates: ${group.dates.map(formatDateOnly).join(", ")}`;
}

function getStatusLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s === "accepted") return "confirmed";
  return s;
}

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
      const lastName = localStorage.getItem("lastName") || "";
      setOwnerName(`${firstName} ${lastName}`.trim() || "Owner");

      try {
        const res = await fetch(`${API_BASE}/api/pets`, {
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

      try {
        const res = await fetch(`${API_BASE}/api/bookings`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();

        if (res.ok) {
          const filtered = (Array.isArray(data) ? data : []).filter((b) =>
            ["pending", "accepted", "rejected"].includes(String(b.status || "").toLowerCase())
          );
          setBookings(filtered);
        }
      } catch (err) {
        console.error("Failed to load bookings:", err);
      } finally {
        setBookingsLoading(false);
      }
    };

    loadOwnerHomeData();
  }, []);

  const groupedRecentBookings = useMemo(() => {
    return groupBookings(bookings).slice(0, 3);
  }, [bookings]);

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

                {!bookingsLoading && groupedRecentBookings.length === 0 && (
                  <p className="home-empty-pets">No bookings yet</p>
                )}

                {!bookingsLoading &&
                  groupedRecentBookings.map((group) => (
                    <div key={group.groupKey} className="home-booking-card">
                      <span className="home-booking-avatar">
                        {SERVICE_EMOJI[group.serviceTypeID] || "🐾"}
                      </span>

                      <div className="home-booking-info">
                        <span className="home-booking-service">
                          {SERVICE_NAMES[group.serviceTypeID] || group.serviceTypeID}
                        </span>

                        <span className="home-booking-time">
                          {getRecentBookingDateText(group)}
                        </span>

                        <span className="home-booking-time">
                          {formatTimeOnly(group.startTime)}
                        </span>
                      </div>

                      <span
                        className={`home-booking-badge home-booking-badge--${String(group.status).toLowerCase()}`}
                      >
                        {getStatusLabel(group.status)}
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