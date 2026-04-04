import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const BOOKINGS = [
  {
    id: 1,
    emoji: "🚶",
    service: "Dog Walking",
    serviceType: "walking",
    minder: "James Walker",
    date: "2026-04-09T09:00:00",
    status: "confirmed",
  },
  {
    id: 2,
    emoji: "🏠",
    service: "Pet Sitting",
    serviceType: "sitting",
    minder: "Priya Patel",
    date: "2026-04-02T14:00:00",
    status: "completed",
  },
  {
    id: 3,
    emoji: "🚶",
    service: "Dog Walking",
    serviceType: "walking",
    minder: "Tom Hughes",
    date: "2026-03-22T10:00:00",
    status: "cancelled",
  },
  {
    id: 4,
    emoji: "🐾",
    service: "Day Care",
    serviceType: "daycare",
    minder: "Aisha Khan",
    date: "2026-04-15T11:30:00",
    status: "confirmed",
  },
  {
    id: 5,
    emoji: "🏠",
    service: "Pet Sitting",
    serviceType: "sitting",
    minder: "Luke Evans",
    date: "2026-03-28T16:00:00",
    status: "completed",
  },
];

const STATUS_STYLE = {
  confirmed: { cls: "bh-badge--confirmed", label: "confirmed" },
  completed: { cls: "bh-badge--completed", label: "completed" },
  cancelled: { cls: "bh-badge--cancelled", label: "cancelled" },
  pending: { cls: "bh-badge--pending", label: "pending" },
};

const NAV = [
  { id: "home", emoji: "🏠", label: "Home" },
  { id: "pets", emoji: "🐾", label: "My Pets" },
  { id: "search", emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile", emoji: "👤", label: "Profile" },
];

const SERVICE_OPTIONS = [
  { value: "all", label: "All Services" },
  { value: "walking", label: "Dog Walking" },
  { value: "sitting", label: "Pet Sitting" },
  { value: "daycare", label: "Day Care" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "next7days", label: "Next 7 Days" },
  { value: "thisMonth", label: "This Month" },
];

function CustomFilterDropdown({ label, value, options, onChange }) {
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
      className={`bh-custom-filter${open ? " bh-custom-filter--open" : ""}${isActive ? " bh-custom-filter--active" : ""}`}
    >
      <span className="bh-custom-filter-label">{label}</span>

      <button
        type="button"
        className="bh-custom-filter-trigger"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="bh-custom-filter-value">{selectedOption.label}</span>
        <span className="bh-custom-filter-chevron">{open ? "⌃" : "⌄"}</span>
      </button>

      {open && (
        <div className="bh-custom-filter-menu">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`bh-custom-filter-option${value === option.value ? " bh-custom-filter-option--selected" : ""}`}
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

export default function HappyTailsBookingHistory() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("bookings");

  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    serviceFilter !== "all",
    statusFilter !== "all",
    dateFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  const clearFilters = () => {
    setServiceFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
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

  const isWithinNext7Days = (dateString) => {
    const now = new Date();
    const bookingDate = new Date(dateString);
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    return bookingDate >= now && bookingDate <= nextWeek;
  };

  const isThisMonth = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  };

  const filteredBookings = useMemo(() => {
    return BOOKINGS.filter((b) => {
      const matchesService =
        serviceFilter === "all" || b.serviceType === serviceFilter;

      const matchesStatus =
        statusFilter === "all" || b.status === statusFilter;

      const matchesDate =
        dateFilter === "all" ||
        (dateFilter === "next7days" && isWithinNext7Days(b.date)) ||
        (dateFilter === "thisMonth" && isThisMonth(b.date));

      return matchesService && matchesStatus && matchesDate;
    });
  }, [serviceFilter, statusFilter, dateFilter]);

  const groupedBookings = {
    confirmed: filteredBookings.filter((b) => b.status === "confirmed"),
    completed: filteredBookings.filter((b) => b.status === "completed"),
    cancelled: filteredBookings.filter((b) => b.status === "cancelled"),
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const renderSection = (title, items) => (
    <section className="bh-section" key={title}>
      <h2 className="bh-section-title">{title}</h2>

      {items.length > 0 ? (
        <div className="bh-section-list">
          {items.map((b) => {
            const { cls, label } = STATUS_STYLE[b.status] || STATUS_STYLE.pending;
            return (
              <button
                key={b.id}
                className="bh-card"
                onClick={() => alert(`View booking: ${b.service} with ${b.minder}`)}
              >
                <span className="bh-card-avatar">{b.emoji}</span>
                <div className="bh-card-info">
                  <span className="bh-card-service">{b.service}</span>
                  <span className="bh-card-meta">with {b.minder}</span>
                  <span className="bh-card-date">{formatDate(b.date)}</span>
                </div>
                <span className={`bh-badge ${cls}`}>{label}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="bh-empty">No {title.toLowerCase()} bookings</p>
      )}
    </section>
  );

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="bh-screen">
          <header className="bh-header">
            <h1 className="bh-title">Booking History</h1>
          </header>

          <div className="bh-scroll">
            <div className="bh-body">
              <div className="bh-filter-dropdown">
                <button
                  type="button"
                  className={`bh-filter-toggle${showFilters ? " bh-filter-toggle--open" : ""}${hasActiveFilters ? " bh-filter-toggle--active" : ""}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <span className="bh-filter-toggle-text">
                    Filters{hasActiveFilters ? ` (${activeFilterCount})` : ""}
                  </span>
                  <span className="bh-filter-toggle-arrow">
                    {showFilters ? "⌃" : "⌄"}
                  </span>
                </button>

                {showFilters && (
                  <div className="bh-filters-panel">
                    <div className="bh-filters-top">
                      <h2 className="bh-filters-title">Filter Bookings</h2>

                      <button
                        type="button"
                        className={`bh-clear-filters-btn${hasActiveFilters ? " bh-clear-filters-btn--active" : ""}`}
                        onClick={clearFilters}
                        disabled={!hasActiveFilters}
                      >
                        Clear Filters
                      </button>
                    </div>

                    <div className="bh-filters">
                      <CustomFilterDropdown
                        label="Service"
                        value={serviceFilter}
                        options={SERVICE_OPTIONS}
                        onChange={setServiceFilter}
                      />

                      <CustomFilterDropdown
                        label="Status"
                        value={statusFilter}
                        options={STATUS_OPTIONS}
                        onChange={setStatusFilter}
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

              {statusFilter === "all" ? (
                <>
                  {renderSection("Confirmed", groupedBookings.confirmed)}
                  {renderSection("Completed", groupedBookings.completed)}
                  {renderSection("Cancelled", groupedBookings.cancelled)}
                </>
              ) : statusFilter === "confirmed" ? (
                renderSection("Confirmed", groupedBookings.confirmed)
              ) : statusFilter === "completed" ? (
                renderSection("Completed", groupedBookings.completed)
              ) : statusFilter === "cancelled" ? (
                renderSection("Cancelled", groupedBookings.cancelled)
              ) : null}
            </div>
          </div>

          <nav className="bh-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`bh-nav-item${activeNav === item.id ? " bh-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
              >
                <span className="bh-nav-emoji">{item.emoji}</span>
                <span className="bh-nav-label">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}