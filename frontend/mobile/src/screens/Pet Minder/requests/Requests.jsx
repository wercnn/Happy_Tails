import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Requests.css";

const API_BASE = "http://localhost:3000";

const SERVICE_NAMES = {
  "st-walk": "Dog Walking",
  "st-board": "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const STATUS_CLASS = {
  pending: "br-badge--pending",
  accepted: "br-badge--confirmed",
  rejected: "br-badge--awaiting",
  cancelled: "br-badge--awaiting",
  completed: "br-badge--inprogress",
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
  { value: "st-walk", label: "Dog Walking" },
  { value: "st-board", label: "Pet Boarding" },
  { value: "st-daycare", label: "Dog Daycare" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const DATE_OPTIONS = [
  { value: "all", label: "All Dates" },
  { value: "next7days", label: "Next 7 Days" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": localStorage.getItem("userID") || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
  };
}

function toDate(dateStr) {
  return new Date(String(dateStr).replace(" ", "T"));
}

function formatDate(dateStr) {
  return toDate(dateStr).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatShortDate(dateStr) {
  return toDate(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(dateStr) {
  return toDate(dateStr).toLocaleTimeString("en-GB", {
    hour: "numeric",
    minute: "2-digit",
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

function getServiceLabel(item) {
  return item.serviceName || SERVICE_NAMES[item.serviceTypeID] || item.serviceTypeID || "Service";
}

function getOwnerName(item) {
  const full = [item.ownerFirstName, item.ownerLastName].filter(Boolean).join(" ").trim();
  return full || item.ownerName || "Pet owner";
}

function getPetLabel(item) {
  return item.petName || item.pet || "Pet";
}

function isWithinNext7Days(dateStr) {
  const now = new Date();
  const date = toDate(dateStr);
  const end = new Date();
  end.setDate(now.getDate() + 7);
  return date >= now && date <= end;
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
        ownerID: b.ownerID,
        sitterID: b.sitterID,
        petID: b.petID,
        serviceTypeID: b.serviceTypeID,
        serviceName: b.serviceName,
        petName: b.petName,
        ownerFirstName: b.ownerFirstName,
        ownerLastName: b.ownerLastName,
        ownerNotes: b.ownerNotes || "",
        status: String(b.status || "").toLowerCase(),
        createdAt: b.createdAt,
        startTime: b.startTime,
        endTime: b.endTime,
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
    .sort((a, b) => toDate(b.startTime) - toDate(a.startTime));
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
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNav, setActiveNav] = useState("requests");

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
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCardClick = (requestGroup) => {
    navigate("/minderDetails", { state: { requestGroup } });
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

      return true;
    });
  }, [bookings, serviceFilter, statusFilter, dateFilter]);

  const groupedBookings = useMemo(() => groupBookings(filteredBookings), [filteredBookings]);

  const groupedByStatus = useMemo(() => {
    return {
      pending: groupedBookings.filter((g) => g.status === "pending"),
      accepted: groupedBookings.filter((g) => g.status === "accepted"),
      rejected: groupedBookings.filter((g) => g.status === "rejected"),
    };
  }, [groupedBookings]);

  const renderSection = (title, groups) => (
    <section className="br-section" key={title}>
      <h2 className="br-section-title">{title}</h2>

      {groups.length === 0 ? (
        <p className="br-empty">No {title.toLowerCase()} requests</p>
      ) : (
        groups.map((group) => (
          <div key={group.groupKey} className="br-card">
            <div className="br-card-top">
              <button
                type="button"
                className="br-card-avatar-btn"
                onClick={() => handleCardClick(group)}
              >
                <span className="br-card-avatar">🐾</span>
              </button>

              <button
                type="button"
                className="br-card-service-btn"
                onClick={() => handleCardClick(group)}
              >
                <span className="br-card-service">{getServiceLabel(group)}</span>
              </button>

              <span className={`br-badge ${STATUS_CLASS[group.status] || ""}`}>
                {group.status}
              </span>
            </div>

            <div className="br-card-details">
              <span className="br-detail">👤 {getOwnerName(group)}</span>
              <span className="br-detail">🐶 {getPetLabel(group)}</span>
              <span className="br-detail">
                📅 {group.dates.length === 1
                  ? formatDate(group.dates[0])
                  : `${group.dates.length} dates: ${group.dates.map((d) => formatShortDate(d)).join(", ")}`}
              </span>
              <span className="br-detail">⏰ {formatTime(group.startTime)}</span>
              {group.ownerNotes && (
                <span className="br-detail">📝 {group.ownerNotes}</span>
              )}
              <span className="br-detail">💰 £{Number(group.totalCost).toFixed(2)}</span>
            </div>

            <div className="br-card-actions">
              <button
                className="br-accept-btn"
                onClick={() => handleCardClick(group)}
                type="button"
              >
                Details
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  );

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
                  className={`br-filter-toggle${showFilters ? " br-filter-toggle--open" : ""}${activeFilterCount > 0 ? " br-filter-toggle--active" : ""}`}
                  onClick={() => setShowFilters((prev) => !prev)}
                >
                  <span className="br-filter-toggle-text">
                    Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
                  </span>
                  <span className="br-filter-toggle-arrow">{showFilters ? "⌃" : "⌄"}</span>
                </button>

                {showFilters && (
                  <div className="br-filters-panel">
                    <div className="br-filters-top">
                      <h2 className="br-filters-title">Filter Requests</h2>
                      <button
                        type="button"
                        className={`br-clear-filters-btn${activeFilterCount > 0 ? " br-clear-filters-btn--active" : ""}`}
                        onClick={clearFilters}
                        disabled={activeFilterCount === 0}
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

              {loading && <p className="br-empty">Loading...</p>}
              {error && <p className="br-empty">{error}</p>}

              {!loading && !error && (
                <>
                  {statusFilter === "all" ? (
                    <>
                      {renderSection("Pending", groupedByStatus.pending)}
                      {renderSection("Accepted", groupedByStatus.accepted)}
                      {renderSection("Rejected", groupedByStatus.rejected)}
                    </>
                  ) : (
                    renderSection(
                      STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || statusFilter,
                      groupedBookings.filter((g) => g.status === statusFilter)
                    )
                  )}
                </>
              )}
            </div>
          </div>

          <nav className="br-nav">
            {NAV.map((item) => (
              <button
                key={item.id}
                className={`br-nav-item${activeNav === item.id ? " br-nav-item--active" : ""}`}
                onClick={() => handleNavClick(item.id)}
                type="button"
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