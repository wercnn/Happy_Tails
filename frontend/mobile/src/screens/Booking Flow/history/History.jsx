import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./History.css";

const API_BASE = "http://localhost:3000";

const SHOWN_STATUSES = ["pending", "accepted", "completed", "cancelled"];

const SERVICE_NAMES = {
  "st-walk": "Pet Walking",
  "st-board": "Pet Boarding",
  "st-daycare": "Pet Daycare",
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
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getOwnerSelectedTimeLabel(booking) {
  return booking?.selectedTime || null;
}

function formatSelectedTimeLabel(timeLabel) {
  if (!timeLabel || typeof timeLabel !== "string") return "";

  const [timePart, meridiem] = timeLabel.trim().split(" ");
  if (!timePart || !meridiem) return timeLabel;

  let [hours, minutes] = timePart.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeLabel;

  if (meridiem.toUpperCase() === "PM" && hours !== 12) hours += 12;
  if (meridiem.toUpperCase() === "AM" && hours === 12) hours = 0;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDisplayedBookingTime(group) {
  if (group?.selectedTime) {
    return formatSelectedTimeLabel(group.selectedTime);
  }

  return formatTimeOnly(group.startTime);
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

function getCreatedGroupKey(createdAt) {
  if (!createdAt) return "no-created-at";
  return String(createdAt);
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
      getCreatedGroupKey(b.createdAt),
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
        subtotal: 0,
        selectedTime: getOwnerSelectedTimeLabel(b),
      });
    }

    const group = groups.get(key);

    if (!group.bookingIDs.includes(b.bookingID)) {
      group.bookingIDs.push(b.bookingID);
      group.bookings.push(b);
      group.subtotal += Number(b.totalCost || 0);

      if (!group.selectedTime && getOwnerSelectedTimeLabel(b)) {
        group.selectedTime = getOwnerSelectedTimeLabel(b);
      }

      const currentStart = toDate(group.startTime);
      const nextStart = toDate(b.startTime);
      if (nextStart < currentStart) {
        group.startTime = b.startTime;
        group.bookingID = b.bookingID;
      }
    }
  }

  return [...groups.values()]
    .map((group) => {
      const uniqueBookings = group.bookings
        .filter((b, index, arr) => arr.findIndex((x) => x.bookingID === b.bookingID) === index)
        .sort((a, b) => toDate(a.startTime) - toDate(b.startTime));

      const subtotal = Number(group.subtotal || 0);
      const platformFee = Number((subtotal * 0.05).toFixed(2));
      const total = Number((subtotal + platformFee).toFixed(2));

      return {
        ...group,
        subtotal,
        platformFee,
        total,
        dates: [
          ...new Map(
            uniqueBookings.map((b) => [String(b.startTime).slice(0, 10), b.startTime])
          ).values(),
        ],
      };
    })
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

  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewedBookingIDs, setReviewedBookingIDs] = useState(new Set());

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

  const openReview = (group) => {
    setReviewTarget(group);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment("");
    setReviewError("");
  };

  const closeReview = () => {
    setReviewTarget(null);
    setReviewRating(0);
    setReviewHover(0);
    setReviewComment("");
    setReviewError("");
  };

  const fetchMyReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/reviews/mine`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviewedBookingIDs(new Set(data.map((r) => r.bookingID)));
      }
    } catch {
      // non-critical — silently ignore
    }
  }, []);

  const handleReviewSubmit = async () => {
    if (reviewRating === 0 || !reviewTarget) return;
    setReviewSubmitting(true);
    setReviewError("");

    try {
      const res = await fetch(`${API_BASE}/api/reviews`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          bookingID: reviewTarget.bookingID,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to submit review");

      setReviewedBookingIDs((prev) => new Set([...prev, reviewTarget.bookingID]));
      closeReview();
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitting(false);
    }
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
    fetchMyReviews();
  }, [fetchBookings, fetchMyReviews]);

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
              <div key={group.groupKey} className="bh-card">
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
                    {getDisplayedBookingTime(group)} · £{Number(group.total || 0).toFixed(2)}
                  </span>
                </div>

                <span className={`bh-badge ${cls || ""}`}>{label || group.status}</span>

                <div className="bh-card-actions">
                  <button
                    className="bh-card-btn bh-card-btn--details"
                    onClick={() =>
                      navigate("/ownerBookingDetails", {
                        state: { booking: group.bookings[0], bookings: group.bookings, grouped: true },
                      })
                    }
                    type="button"
                  >
                    View Details
                  </button>

                  <button
                    className="bh-card-btn bh-card-btn--dispute"
                    onClick={() =>
                      navigate("/raiseDispute", {
                        state: { booking: group.bookings[0], bookings: group.bookings, grouped: true },
                      })
                    }
                    type="button"
                  >
                    Raise Dispute
                  </button>

                  {group.status === "completed" && (
                    reviewedBookingIDs.has(group.bookingID) ? (
                      <button
                        className="bh-card-btn bh-card-btn--reviewed"
                        type="button"
                        disabled
                      >
                        ⭐ Reviewed
                      </button>
                    ) : (
                      <button
                        className="bh-card-btn bh-card-btn--review"
                        onClick={() => openReview(group)}
                        type="button"
                      >
                        ⭐ Leave a Review
                      </button>
                    )
                  )}
                </div>
              </div>
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

          {reviewTarget && (
            <div className="bh-review-overlay" onClick={closeReview}>
              <div className="bh-review-sheet" onClick={(e) => e.stopPropagation()}>
                <div className="bh-review-handle" />

                <h2 className="bh-review-title">Leave a Review</h2>
                <p className="bh-review-subtitle">
                  {SERVICE_NAMES[reviewTarget.serviceTypeID] || "Service"}
                </p>

                <div className="bh-review-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`bh-review-star${star <= (reviewHover || reviewRating) ? " bh-review-star--filled" : ""}`}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHover(star)}
                      onMouseLeave={() => setReviewHover(0)}
                    >
                      ★
                    </button>
                  ))}
                </div>

                {reviewRating > 0 && (
                  <p className="bh-review-rating-label">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][reviewRating]}
                  </p>
                )}

                <textarea
                  className="bh-review-textarea"
                  placeholder="Share your experience with this minder... (optional)"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                />

                {reviewError && (
                  <p className="bh-review-error">{reviewError}</p>
                )}

                <div className="bh-review-actions">
                  <button
                    className="bh-review-btn bh-review-btn--cancel"
                    onClick={closeReview}
                    type="button"
                    disabled={reviewSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    className="bh-review-btn bh-review-btn--submit"
                    onClick={handleReviewSubmit}
                    type="button"
                    disabled={reviewRating === 0 || reviewSubmitting}
                  >
                    {reviewSubmitting ? "Submitting…" : "Submit Review"}
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