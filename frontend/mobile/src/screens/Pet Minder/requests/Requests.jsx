import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Requests.css";

const API_BASE = "http://localhost:3000";

const SERVICE_NAMES = {
  "st-walk":    "Dog Walking",
  "st-board":   "Pet Boarding",
  "st-daycare": "Dog Daycare",
};

const STATUS_CLASS = {
  pending:   "br-badge--pending",
  accepted:  "br-badge--confirmed",
  rejected:  "br-badge--awaiting",
  cancelled: "br-badge--awaiting",
  completed: "br-badge--inprogress",
};

const NAV = [
  { id: "dashboard",    emoji: "🏠", label: "Dashboard" },
  { id: "services",     emoji: "⚙️", label: "Services" },
  { id: "availability", emoji: "📅", label: "Availability" },
  { id: "requests",     emoji: "📬", label: "Requests" },
  { id: "profile",      emoji: "👤", label: "Profile" },
];

const SERVICE_OPTIONS = [
  { value: "all",       label: "All Services" },
  { value: "st-walk",   label: "Dog Walking" },
  { value: "st-board",  label: "Pet Boarding" },
  { value: "st-daycare",label: "Dog Daycare" },
];

const STATUS_OPTIONS = [
  { value: "all",      label: "All Statuses" },
  { value: "pending",  label: "Pending" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const DATE_OPTIONS = [
  { value: "all",      label: "All Dates" },
  { value: "next7days",label: "Next 7 Days" },
];

function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id":   localStorage.getItem("userID")   || "",
    "X-User-Role": localStorage.getItem("userRole") || "",
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

export default function HappyTailsBookingRequests() {
  const navigate = useNavigate();
  const [bookings, setBookings]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeNav, setActiveNav]     = useState("requests");
  const [actingOn, setActingOn]       = useState(null); // bookingID being accepted/rejected

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
      setBookings(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleAction = async (bookingID, action) => {
    const endpoint = action === "accept" ? "accept" : "reject";
    setActingOn(bookingID);
    try {
      const res = await fetch(`${API_BASE}/api/bookings/${bookingID}/${endpoint}`, {
        method: "PATCH",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed to ${action} (${res.status})`);
      }
      await fetchBookings();
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setActingOn(null);
    }
  };

  const handleCardClick = (booking) => {
    navigate("/acceptReject", { state: { booking } });
  };

  const handleNavClick = (id) => {
    setActiveNav(id);
    switch (id) {
      case "dashboard":    navigate("/mindDash");         break;
      case "services":     navigate("/mindService");      break;
      case "availability": navigate("/mindAvailability"); break;
      case "requests":     navigate("/mindRequests");     break;
      case "profile":      navigate("/profile");          break;
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

  const formatDate = (dateStr) =>
    new Date(dateStr.replace(" ", "T")).toLocaleString("en-GB", {
      day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
    });

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (serviceFilter !== "all" && b.serviceTypeID !== serviceFilter) return false;
      if (statusFilter  !== "all" && b.status        !== statusFilter)  return false;
      if (dateFilter === "next7days" && !isWithinNext7Days(b.startTime)) return false;
      return true;
    });
  }, [bookings, serviceFilter, statusFilter, dateFilter]);

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
              {error   && <p className="br-empty">{error}</p>}

              {!loading && !error && filteredBookings.map((b) => (
                <div key={b.bookingID} className="br-card">
                  <div className="br-card-top">
                    <button
                      type="button"
                      className="br-card-avatar-btn"
                      onClick={() => handleCardClick(b)}
                    >
                      <span className="br-card-avatar">🐾</span>
                    </button>

                    <button
                      type="button"
                      className="br-card-service-btn"
                      onClick={() => handleCardClick(b)}
                    >
                      <span className="br-card-service">
                        {SERVICE_NAMES[b.serviceTypeID] || b.serviceTypeID}
                      </span>
                    </button>

                    <span className={`br-badge ${STATUS_CLASS[b.status] || ""}`}>
                      {b.status}
                    </span>
                  </div>

                  <div className="br-card-details">
                    <span className="br-detail">
                      📅 {formatDate(b.startTime)}
                    </span>
                    {b.ownerNotes && (
                      <span className="br-detail">📝 {b.ownerNotes}</span>
                    )}
                    <span className="br-detail">
                      💰 £{Number(b.totalCost).toFixed(2)}
                    </span>
                  </div>

                  {b.status === "pending" && (
                    <div className="br-card-actions">
                      <button
                        className="br-accept-btn"
                        onClick={() => handleAction(b.bookingID, "accept")}
                        disabled={actingOn === b.bookingID}
                      >
                        ✓ Accept
                      </button>
                      <button
                        className="br-decline-btn"
                        onClick={() => handleAction(b.bookingID, "decline")}
                        disabled={actingOn === b.bookingID}
                      >
                        ✕ Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {!loading && !error && filteredBookings.length === 0 && (
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
