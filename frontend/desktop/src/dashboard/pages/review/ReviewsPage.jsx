import { useEffect, useState } from "react";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./ReviewsPage.css";

const API_BASE = "http://localhost:3000";
const API_HEADERS = {
  "Content-Type": "application/json",
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

const FILTERS = ["all", "Pending", "Flagged", "Approved", "Removed"];

function formatDate(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderStars(rating) {
  return "⭐".repeat(Math.min(Math.max(Number(rating) || 0, 0), 5));
}

export default function ReviewsPage({ searchQuery = "" }) {
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState(null);   // null = loading
  const [stats, setStats] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // reviewID being actioned
  const [error, setError] = useState("");

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/reviews`, { headers: API_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch reviews");
      setReviews(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setReviews([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/reviews/stats`, { headers: API_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch review stats");
      setStats(data);
    } catch (err) {
      console.error("Review stats error:", err.message);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, []);

  const handleApprove = async (reviewID) => {
    setActionLoading(reviewID);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/reviews/${reviewID}/approve`, {
        method: "PATCH",
        headers: API_HEADERS,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to approve review");
      if (selectedReview?.reviewID === reviewID) setSelectedReview(null);
      await Promise.all([fetchReviews(), fetchStats()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemove = async (reviewID) => {
    setActionLoading(reviewID);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/reviews/${reviewID}/remove`, {
        method: "PATCH",
        headers: API_HEADERS,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to remove review");
      if (selectedReview?.reviewID === reviewID) setSelectedReview(null);
      await Promise.all([fetchReviews(), fetchStats()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = (reviews ?? []).filter((r) => {
    const matchFilter = filter === "all" || r.status === filter;
    const matchSearch = !searchQuery || [
      r.ownerName,
      r.minderName,
      r.comment,
      r.reviewID,
      r.status,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  const needsAction = (status) => status === "Flagged" || status === "Pending";

  const statCards = [
    {
      icon: "⭐",
      label: "Avg. Rating",
      value: stats?.avgRating != null ? String(stats.avgRating) : "—",
      iconClass: "reviews-page__stat-icon-box--yellow",
      valueClass: "reviews-page__stat-value--yellow",
    },
    {
      icon: "✅",
      label: "Approved",
      value: stats?.approved ?? "—",
      iconClass: "reviews-page__stat-icon-box--green",
      valueClass: "reviews-page__stat-value--green",
    },
    {
      icon: "🚩",
      label: "Flagged",
      value: stats?.flagged ?? "—",
      iconClass: "reviews-page__stat-icon-box--red",
      valueClass: "reviews-page__stat-value--red",
    },
    {
      icon: "⏳",
      label: "Pending",
      value: stats?.pending ?? "—",
      iconClass: "reviews-page__stat-icon-box--orange",
      valueClass: "reviews-page__stat-value--orange",
    },
  ];

  return (
    <div className="reviews-page">
      <SectionHeader
        title="Reviews & Ratings"
        subtitle="Moderate platform reviews and manage flagged content"
      />

      {error && (
        <Card style={{ marginBottom: 16, padding: "12px 16px", color: "#b91c1c", fontSize: 13 }}>
          {error}
        </Card>
      )}

      <div className="reviews-page__stats-grid">
        {statCards.map((item) => (
          <Card key={item.label}>
            <div className="reviews-page__stat-card">
              <div className={`reviews-page__stat-icon-box ${item.iconClass}`}>
                {item.icon}
              </div>
              <div className="reviews-page__stat-content">
                <p className="reviews-page__stat-label">{item.label}</p>
                <p className={`reviews-page__stat-value ${item.valueClass}`}>{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="reviews-page__filters" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`bookings-page__filter-btn ${filter === f ? "bookings-page__filter-btn--active" : ""}`}
          >
            {f === "all" ? "All Reviews" : f}
          </button>
        ))}
      </div>

      <Card>
        {reviews === null ? (
          <div style={{ padding: 18 }}>Loading reviews...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 18, color: "#6b7280", fontSize: 13 }}>No reviews found.</div>
        ) : (
          <table className="reviews-page__table">
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Owner</Th>
                <Th>Minder</Th>
                <Th>Rating</Th>
                <Th>Review</Th>
                <Th>Booking</Th>
                <Th>Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((r) => {
                const isActioning = actionLoading === r.reviewID;
                const isFlaggedRow = r.status === "Flagged" || r.status === "Pending";
                return (
                  <tr
                    key={r.reviewID}
                    className={
                      r.status === "Flagged"
                        ? "reviews-page__row reviews-page__row--flagged"
                        : "reviews-page__row"
                    }
                  >
                    <Td>
                      <span className="reviews-page__id">
                        #{r.reviewID.slice(0, 6).toUpperCase()}
                      </span>
                    </Td>

                    <Td>{r.ownerName}</Td>
                    <Td>{r.minderName}</Td>

                    <Td>
                      <span className="reviews-page__rating">{renderStars(r.rating)}</span>
                    </Td>

                    <Td>
                      <span
                        className={
                          r.status === "Flagged"
                            ? "reviews-page__review-text reviews-page__review-text--flagged"
                            : "reviews-page__review-text"
                        }
                      >
                        {r.comment || "—"}
                      </span>
                    </Td>

                    <Td>
                      <span className="reviews-page__booking">
                        #{r.bookingID.slice(0, 6).toUpperCase()}
                      </span>
                    </Td>

                    <Td>
                      <span className="reviews-page__date">{formatDate(r.createdAt)}</span>
                    </Td>

                    <Td>
                      <StatusBadge status={r.status.toLowerCase()} />
                    </Td>

                    <Td>
                      <div className="reviews-page__actions">
                        <Btn
                          variant="outline"
                          small
                          onClick={() => setSelectedReview(r)}
                        >
                          View
                        </Btn>
                        {isFlaggedRow && (
                          <>
                            <Btn
                              variant="success"
                              small
                              disabled={isActioning}
                              onClick={() => handleApprove(r.reviewID)}
                            >
                              {isActioning ? "..." : "Accept"}
                            </Btn>
                            <Btn
                              variant="danger"
                              small
                              disabled={isActioning}
                              onClick={() => handleRemove(r.reviewID)}
                            >
                              {isActioning ? "..." : "Remove"}
                            </Btn>
                          </>
                        )}
                      </div>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {selectedReview && (
        <div
          className="reviews-page__overlay"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="reviews-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="reviews-page__overlay-close"
              onClick={() => setSelectedReview(null)}
            >
              ✕
            </button>

            <div className="reviews-page__overlay-header">
              <div className="reviews-page__overlay-header-main">
                <p className="reviews-page__overlay-id">
                  #{selectedReview.reviewID.slice(0, 6).toUpperCase()}
                </p>
                <h2 className="reviews-page__overlay-title">Review Details</h2>
                <p className="reviews-page__overlay-subtitle">
                  {formatDate(selectedReview.createdAt)} ·{" "}
                  #{selectedReview.bookingID.slice(0, 6).toUpperCase()}
                </p>
                <div className="reviews-page__overlay-badges">
                  <StatusBadge status={selectedReview.status.toLowerCase()} />
                </div>
              </div>
            </div>

            <div className="reviews-page__overlay-grid">
              <div className="reviews-page__overlay-section">
                <h3 className="reviews-page__overlay-section-title">Review Info</h3>
                <div className="reviews-page__overlay-list">
                  {[
                    ["Owner",   selectedReview.ownerName],
                    ["Minder",  selectedReview.minderName],
                    ["Booking", `#${selectedReview.bookingID.slice(0, 6).toUpperCase()}`],
                    ["Rating",  renderStars(selectedReview.rating)],
                    ["Date",    formatDate(selectedReview.createdAt)],
                  ].map(([label, value]) => (
                    <div key={label} className="reviews-page__overlay-row">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                  {selectedReview.flagReason && (
                    <div className="reviews-page__overlay-row">
                      <span>Flag Reason</span>
                      <strong style={{ color: "#b91c1c" }}>{selectedReview.flagReason}</strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="reviews-page__overlay-section">
                <h3 className="reviews-page__overlay-section-title">Review Text</h3>
                <div className="reviews-page__overlay-note-box">
                  <p
                    className={`reviews-page__overlay-note-text ${
                      selectedReview.status === "Flagged"
                        ? "reviews-page__overlay-note-text--flagged"
                        : ""
                    }`}
                  >
                    {selectedReview.comment || "No comment provided."}
                  </p>
                </div>

                <div className="reviews-page__overlay-stats">
                  <div className="reviews-page__overlay-stat">
                    <span className="reviews-page__overlay-stat-label">Status</span>
                    <strong className="reviews-page__overlay-stat-value">
                      {selectedReview.status}
                    </strong>
                  </div>
                  <div className="reviews-page__overlay-stat">
                    <span className="reviews-page__overlay-stat-label">Score</span>
                    <strong className="reviews-page__overlay-stat-value">
                      {selectedReview.rating}/5
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="reviews-page__overlay-actions">
              {needsAction(selectedReview.status) && (
                <>
                  <Btn
                    variant="success"
                    disabled={actionLoading === selectedReview.reviewID}
                    onClick={() => handleApprove(selectedReview.reviewID)}
                  >
                    {actionLoading === selectedReview.reviewID ? "Processing..." : "Accept Review"}
                  </Btn>
                  <Btn
                    variant="danger"
                    disabled={actionLoading === selectedReview.reviewID}
                    onClick={() => handleRemove(selectedReview.reviewID)}
                  >
                    {actionLoading === selectedReview.reviewID ? "Processing..." : "Remove Review"}
                  </Btn>
                </>
              )}
              <Btn variant="outline">View Booking</Btn>
              <Btn variant="outline">Contact User</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
