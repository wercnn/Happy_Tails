import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const API_BASE = "http://localhost:3000";

// Statuses shown on this screen (API value → display label)
const SHOWN_STATUSES = ["accepted", "completed", "cancelled"];

const SERVICE_NAMES = {
  "st-walk":    "Dog Walking",
  "st-board":   "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const SERVICE_EMOJI = {
  "st-walk":    "🚶",
  "st-board":   "🏠",
  "st-daycare": "🐾",
};

// API returns "accepted"; the UI treats it as "confirmed"
const STATUS_STYLE = {
  accepted:  { cls: "bh-badge--confirmed", label: "confirmed" },
  completed: { cls: "bh-badge--completed", label: "completed" },
  cancelled: { cls: "bh-badge--cancelled", label: "cancelled" },
};

const NAV = [
  { id: "home",     emoji: "🏠", label: "Home" },
  { id: "pets",     emoji: "🐾", label: "My Pets" },
  { id: "search",   emoji: "🔍", label: "Search" },
  { id: "bookings", emoji: "📋", label: "Bookings" },
  { id: "profile",  emoji: "👤", label: "Profile" },
];

const SERVICE_OPTIONS = [
  { value: "all",       label: "All Services" },
  { value: "st-walk",   label: "Dog Walking" },
  { value: "st-board",  label: "Pet Boarding" },
  { value: "st-daycare",label: "Dog Daycare" },
];

const STATUS_OPTIONS = [
  { value: "all",      label: "All Statuses" },
  { value: "accepted", label: "Confirmed" },
  { value: "completed",label: "Completed" },
  { value: "cancelled",label: "Cancelled" },
];

const DATE_OPTIONS = [
  { value: "all",       label: "All Dates" },
  { value: "next7days", label: "Next 7 Days" },
  { value: "thisMonth", label: "This Month" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id":   localStorage.getItem("userID")   || "",
    "x-user-role": localStorage.getItem("userRole") || "",
  };
}

function CustomFilterDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedOption = options.find((o) => o.value === value) || options[0];
  const isActive = value !== "all";

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!dropdownRef.current?.contains(e.target)) setOpen(false);
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
              onClick={() => { onChange(option.value); setOpen(false); }}
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

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [dateFilter, setDateFilter]       = useState("all");
  const [showFilters, setShowFilters]     = useState(false);

  const activeFilterCount = [
    serviceFilter !== "all",
    statusFilter  !== "all",
    dateFilter    !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setServiceFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/bookings`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to fetch bookings (${res.status})`);
      const data = await res.json();
      // Keep only the three statuses relevant to this screen
      setBookings(data.filter((b) => SHOWN_STATUSES.includes(b.status)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "home":     navigate("/ownerDash");    break;
      case "pets":     navigate("/ownerPets");    break;
      case "search":   navigate("/ownerSearch");  break;
      case "bookings": navigate("/ownerBooking"); break;
      case "profile":  navigate("/profile");      break;
      default: break;
    }
  };

  const isWithinNext7Days = (dateStr) => {
    const now  = new Date();
    const date = new Date(dateStr.replace(" ", "T"));
    const end  = new Date();
    end.setDate(now.getDate() + 7);
    return date >= now && date <= end;
  };

  const isThisMonth = (dateStr) => {
    const date = new Date(dateStr.replace(" ", "T"));
    const now  = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (serviceFilter !== "all" && b.serviceTypeID !== serviceFilter) return false;
      if (statusFilter  !== "all" && b.status        !== statusFilter)  return false;
      if (dateFilter === "next7days" && !isWithinNext7Days(b.startTime)) return false;
      if (dateFilter === "thisMonth" && !isThisMonth(b.startTime))       return false;
      return true;
    });
  }, [bookings, serviceFilter, statusFilter, dateFilter]);

  const groupedBookings = {
    accepted:  filteredBookings.filter((b) => b.status === "accepted"),
    completed: filteredBookings.filter((b) => b.status === "completed"),
    cancelled: filteredBookings.filter((b) => b.status === "cancelled"),
  };

  const formatDate = (dateStr) =>
    new Date(dateStr.replace(" ", "T")).toLocaleString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });

  const renderSection = (title, apiStatus, items) => (
    <section className="bh-section" key={apiStatus}>
      <h2 className="bh-section-title">{title}</h2>
      {items.length > 0 ? (
        <div className="bh-section-list">
          {items.map((b) => {
            const { cls, label } = STATUS_STYLE[b.status] || {};
            return (
              <button
                key={b.bookingID}
                className="bh-card"
                onClick={() => navigate("/ownerBooking", { state: { booking: b } })}
              >
                <span className="bh-card-avatar">
                  {SERVICE_EMOJI[b.serviceTypeID] || "🐾"}
                </span>
                <div className="bh-card-info">
                  <span className="bh-card-service">
                    {SERVICE_NAMES[b.serviceTypeID] || b.serviceTypeID}
                  </span>
                  <span className="bh-card-date">{formatDate(b.startTime)}</span>
                  {b.totalCost != null && (
                    <span className="bh-card-meta">
                      £{Number(b.totalCost).toFixed(2)}
                    </span>
                  )}
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

              {loading && <p className="bh-empty">Loading...</p>}
              {error   && <p className="bh-empty">{error}</p>}

              {!loading && !error && (
                <>
                  <div className="bh-filter-dropdown">
                    <button
                      type="button"
                      className={`bh-filter-toggle${showFilters ? " bh-filter-toggle--open" : ""}${activeFilterCount > 0 ? " bh-filter-toggle--active" : ""}`}
                      onClick={() => setShowFilters((prev) => !prev)}
                    >
                      <span className="bh-filter-toggle-text">
                        Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                      </span>
                      <span className="bh-filter-toggle-arrow">{showFilters ? "⌃" : "⌄"}</span>
                    </button>

                    {showFilters && (
                      <div className="bh-filters-panel">
                        <div className="bh-filters-top">
                          <h2 className="bh-filters-title">Filter Bookings</h2>
                          <button
                            type="button"
                            className={`bh-clear-filters-btn${activeFilterCount > 0 ? " bh-clear-filters-btn--active" : ""}`}
                            onClick={clearFilters}
                            disabled={activeFilterCount === 0}
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
                      {renderSection("Confirmed", "accepted",  groupedBookings.accepted)}
                      {renderSection("Completed", "completed", groupedBookings.completed)}
                      {renderSection("Cancelled", "cancelled", groupedBookings.cancelled)}
                    </>
                  ) : (
                    renderSection(
                      STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter,
                      statusFilter,
                      filteredBookings
                    )
                  )}
                </>
              )}

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
