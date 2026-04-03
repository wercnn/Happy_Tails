import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Requests.css";

const INITIAL_REQUESTS = [
  {
    id: 1,
    icon: "🐾",
    service: "Dog Walking (60 mins)",
    serviceType: "walking",
    status: "pending",
    petType: "dog",
    petEmoji: "🐶",
    pet: "Buddy",
    owner: "Sarah J.",
    date: "2026-04-09T09:00:00",
  },
  {
    id: 2,
    icon: "🐾",
    service: "Dog Walk (1 hour)",
    serviceType: "walking",
    status: "awaiting",
    petType: "dog",
    petEmoji: "🐕",
    pet: "Max",
    owner: "Emily R.",
    date: "2026-04-12T14:00:00",
  },
  {
    id: 3,
    icon: "🐈‍⬛",
    service: "Pet Walk (60 min)",
    serviceType: "walking",
    status: "in progress",
    petType: "cat",
    petEmoji: "🐈",
    pet: "Charlie",
    owner: "Anna K.",
    date: "2026-04-15T07:30:00",
  },
];

const STATUS_CLASS = {
  pending: "br-badge--pending",
  awaiting: "br-badge--awaiting",
  "in progress": "br-badge--inprogress",
  confirmed: "br-badge--confirmed",
};

const NAV = [
  { id: "dashboard", emoji: "🏠", label: "Dashboard" },
  { id: "services", emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests", emoji: "📬", label: "Requests" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "walking", label: "Walking" },
  { value: "sitting", label: "Pet Sitting" },
  { value: "feeding", label: "Feeding" },
  { value: "grooming", label: "Grooming" },
];

const PET_OPTIONS = [
  { value: "all", label: "All Pets" },
  { value: "dog", label: "Dogs" },
  { value: "cat", label: "Cats" },
  { value: "other", label: "Other" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "next7days", label: "Next 7 Days" },
];

function CustomFilterDropdown({
  label,
  value,
  options,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((option) => option.value === value) || options[0];

  const isActive = value !== "all";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      className={`br-custom-filter${open ? " br-custom-filter--open" : ""}${isActive ? " br-custom-filter--active" : ""}`}
    >
      <span className="br-custom-filter-label">{label}</span>

      <button
        type="button"
        className="br-custom-filter-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="br-custom-filter-value">{selectedOption.label}</span>
        <span className="br-custom-filter-chevron">{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div className="br-custom-filter-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`br-custom-filter-option${value === option.value ? " br-custom-filter-option--selected" : ""}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HappyTailsBookingRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState(INITIAL_REQUESTS);
  const [activeNav, setActiveNav] = useState("requests");

  const [serviceFilter, setServiceFilter] = useState("all");
  const [petFilter, setPetFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    serviceFilter !== "all",
    petFilter !== "all",
    dateFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setServiceFilter("all");
    setPetFilter("all");
    setDateFilter("all");
  };

  const handleAction = (id, action) => {
    if (action === "accept") {
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r))
      );
    } else {
      setRequests((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const handleNavClick = (id) => {
    setActiveNav(id);

    switch (id) {
      case "dashboard":
        navigate("/mindDash");
        break;
      case "services":
        navigate("/mindService");
        break;
      case "availability":
        navigate("/mindAvailability");
        break;
      case "requests":
        navigate("/mindRequests");
        break;
      case "profile":
        navigate("/mindProfile");
        break;
      default:
        alert("Placeholder route");
        break;
    }
  };

  const isWithinNext7Days = (dateString) => {
    const now = new Date();
    const requestDate = new Date(dateString);
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return requestDate >= now && requestDate <= nextWeek;
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesService =
        serviceFilter === "all" || r.serviceType === serviceFilter;

      const matchesPet =
        petFilter === "all" || r.petType === petFilter;

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "next7days" && isWithinNext7Days(r.date));

      return matchesService && matchesPet && matchesDate;
    });
  }, [requests, serviceFilter, petFilter, dateFilter]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="br-screen">
          <header className="br-header">
            <h1 className="br-title">Booking Requests</h1>
          </header>

          <div className="br-scroll">
            <div className="br-body">
              <div className="br-filter-dropdown">
                <button
                  type="button"
                  className={`br-filter-toggle${showFilters ? " br-filter-toggle--open" : ""}${hasActiveFilters ? " br-filter-toggle--active" : ""}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <span className="br-filter-toggle-text">
                    Filters{hasActiveFilters ? ` (${activeFilterCount})` : ""}
                  </span>
                  <span className="br-filter-toggle-arrow">
                    {showFilters ? "⌃" : "⌄"}
                  </span>
                </button>

                {showFilters && (
                  <div className="br-filters-panel">
                    <div className="br-filters-top">
                      <h2 className="br-filters-title">Filter Requests</h2>

                      <button
                        type="button"
                        className={`br-clear-filters-btn${hasActiveFilters ? " br-clear-filters-btn--active" : ""}`}
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                      >
                        Clear Filters
                      </button>
                    </div>

                    <div className="br-filters">
                      <CustomFilterDropdown
                        label="Service"
                        value={serviceFilter}
                        options={SERVICE_OPTIONS}
                        onChange={setServiceFilter}
                      />

                      <CustomFilterDropdown
                        label="Pet Type"
                        value={petFilter}
                        options={PET_OPTIONS}
                        onChange={setPetFilter}
                      />

                      <CustomFilterDropdown
                        label="Date"
                        value={dateFilter}
                        options={DATE_OPTIONS}
                        onChange={setDateFilter}
                      />
                    </div>
                  </div>
                )}
              </div>

              {filteredRequests.map((r) => (
                <div key={r.id} className="br-card">
                  <div className="br-card-top">
                    <span className="br-card-avatar">{r.icon}</span>
                    <span className="br-card-service">{r.service}</span>
                    <span className={`br-badge ${STATUS_CLASS[r.status] || ""}`}>
                      {r.status}
                    </span>
                  </div>

                  <div className="br-card-details">
                    <span className="br-detail">
                      {r.petEmoji} {r.pet} · {r.owner}
                    </span>
                    <span className="br-detail">📅 {formatDate(r.date)}</span>
                  </div>

                  <div className="br-card-actions">
                    <button
                      className="br-accept-btn"
                      onClick={() => handleAction(r.id, "accept")}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="br-decline-btn"
                      onClick={() => handleAction(r.id, "decline")}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>
              ))}

              {filteredRequests.length === 0 && (
                <p className="br-empty">No booking requests match these filters</p>
              )}
            </div>
          </div>

          <nav className="br-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`br-nav-item${activeNav === item.id ? " br-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="br-nav-emoji">{item.emoji}</span>
                <span className="br-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}