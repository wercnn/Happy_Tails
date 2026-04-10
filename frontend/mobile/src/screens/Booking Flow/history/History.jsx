import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const API_BASE = "http://localhost:3000";

const SHOWN_STATUSES = ["pending", "accepted", "completed", "cancelled"];

const SERVICE_NAMES = {
  "st-walk": "Dog Walking",
  "st-board": "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const SERVICE_EMOJI = {
  "st-walk": "🚶",
  "st-board": "🏠",
  "st-daycare": "🐾",
};

const STATUS_STYLE = {
  pending: { cls: "bh-badge--pending", label: "pending" },
  accepted: { cls: "bh-badge--confirmed", label: "confirmed" },
  completed: { cls: "bh-badge--completed", label: "completed" },
  cancelled: { cls: "bh-badge--cancelled", label: "cancelled" },
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
  { value: "st-walk", label: "Dog Walking" },
  { value: "st-board", label: "Pet Boarding" },
  { value: "st-daycare", label: "Dog Daycare" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "next7days", label: "Next 7 Days" },
  { value: "thisMonth", label: "This Month" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-user-id": localStorage.getItem("userID") || "",
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

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatDateOnly(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateFull(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTimeOnly(dateStr) {
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function isWithinNext7Days(dateStr) {
  const now = new Date();
  const date = toDate(dateStr);
  const end = new Date();
  end.setDate(now.getDate() + 7);
  return date >= now && date <= end;
}

function isThisMonth(dateStr) {
  const date = toDate(dateStr);
  const now = new Date();
  return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
}

function getCreatedMinuteKey(createdAt) {
  if (!createdAt) return "no-created-at";
  const d = toDate(createdAt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
    .sort((a, b) => toDate(b.startTime) - toDate(a.startTime));
}

export default function HappyTailsBookingHistory() {
  const navigate = useNavigate();
  const [activeNav, setActiveNav] = useState("bookings");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [serviceFilter, setServiceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  const activeFilterCount = [
    serviceFilter !== "all",
    statusFilter !== "all",
    dateFilter !== "all",
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

      setBookings(
        Array.isArray(data)
          ? data.filter((b) => SHOWN_STATUSES.includes(String(b.status).toLowerCase()))
          : []
      );
    } catch (err) {
      setError(err.message || "Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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
        break;
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const status = String(b.status || "").toLowerCase();

      if (serviceFilter !== "all" && b.serviceTypeID !== serviceFilter) return false;
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (dateFilter === "next7days" && !isWithinNext7Days(b.startTime)) return false;
      if (dateFilter === "thisMonth" && !isThisMonth(b.startTime)) return false;

      return true;
    });
  }, [bookings, serviceFilter, statusFilter, dateFilter]);

  const groupedCards = useMemo(() => groupBookings(filteredBookings), [filteredBookings]);

  const groupedByStatus = useMemo(() => {
    return {
      pending: groupedCards.filter((g) => g.status === "pending"),
      accepted: groupedCards.filter((g) => g.status === "accepted"),
      completed: groupedCards.filter((g) => g.status === "completed"),
      cancelled: groupedCards.filter((g) => g.status === "cancelled"),
    };
  }, [groupedCards]);

  const renderSection = (title, apiStatus, items) => (
    <section className="bh-section" key={apiStatus}>
      <h2 className="bh-section-title">{title}</h2>

      {items.length > 0 ? (
        <div className="bh-section-list">
          {items.map((group) => {
            const { cls, label } = STATUS_STYLE[group.status] || {};
            const serviceLabel =
              SERVICE_NAMES[group.serviceTypeID] || group.serviceTypeID || "Service";

            return (
              <button
                key={group.groupKey}
                className="bh-card"
                onClick={() =>
                  navigate("/ownerBooking", {
                    state: { booking: group.bookings[0], bookings: group.bookings, grouped: true },
                  })
                }
                type="button"
              >
                <span className="bh-card-avatar">
                  {SERVICE_EMOJI[group.serviceTypeID] || "🐾"}
                </span>

                <div className="bh-card-info">
                  <span className="bh-card-service">{serviceLabel}</span>

                  <span className="bh-card-date">
                    {group.dates.length === 1
                      ? formatDateFull(group.dates[0])
                      : `${group.dates.length} dates: ${group.dates.map(formatDateOnly).join(", ")}`}
                  </span>

                  <span className="bh-card-meta">
                    {formatTimeOnly(group.startTime)} · £{Number(group.totalCost || 0).toFixed(2)}
                  </span>
                </div>

                <span className={`bh-badge ${cls || ""}`}>{label || group.status}</span>
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
              {error && <p className="bh-empty">{error}</p>}

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
                      {renderSection("Pending", "pending", groupedByStatus.pending)}
                      {renderSection("Confirmed", "accepted", groupedByStatus.accepted)}
                      {renderSection("Completed", "completed", groupedByStatus.completed)}
                      {renderSection("Cancelled", "cancelled", groupedByStatus.cancelled)}
                    </>
                  ) : (
                    renderSection(
                      STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter,
                      statusFilter,
                      groupedCards.filter((g) => g.status === statusFilter)
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
                type="button"
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