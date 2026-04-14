import { useEffect, useState } from "react";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { Input } from "../../components/input/Input.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./BookingsPage.css";

const API_BASE = "http://localhost:3000";
const API_HEADERS = {
  "Content-Type": "application/json",
  "X-User-Id": "u-support-001",
  "X-User-Role": "support",
};

function formatDate(isoString) {
  if (!isoString) return "N/A";
  return new Date(isoString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatCost(amount) {
  if (amount == null) return "N/A";
  return `£${Number(amount).toFixed(2)}`;
}

function formatPaymentStatus(escrow) {
  if (!escrow) return "Unpaid";
  const map = { Holding: "Held in escrow", Released: "Released", Refunded: "Refunded" };
  return map[escrow] ?? escrow;
}

const FILTERS = ["all", "confirmed", "pending", "completed", "cancelled"];

export default function BookingsPage({ searchQuery = "" }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (searchQuery) setSearch(searchQuery);
  }, [searchQuery]);
  const [bookings, setBookings] = useState(null);   // null = loading
  const [stats, setStats] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // bookingID currently being actioned
  const [error, setError] = useState("");

  const [interveneBooking, setInterveneBooking] = useState(null);
  const [interveneAction, setInterveneAction] = useState(null); // 'cancel' | 'change-status'
  const [interveneStatus, setInterveneStatus] = useState("confirmed");
  const [interveneLoading, setInterveneLoading] = useState(false);
  const [interveneError, setInterveneError] = useState("");

  const fetchBookings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/all`, { headers: API_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch bookings");
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
      setBookings([]);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/stats`, { headers: API_HEADERS });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to fetch stats");
      setStats(data);
    } catch (err) {
      console.error("Booking stats error:", err.message);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, []);

  const handleCancel = async (bookingID) => {
    setActionLoading(bookingID);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/admin/bookings/${bookingID}/cancel`, {
        method: "PATCH",
        headers: API_HEADERS,
        body: JSON.stringify({ cancellationReason: "Cancelled by support" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to cancel booking");
      if (selectedBooking?.bookingID === bookingID) setSelectedBooking(null);
      await Promise.all([fetchBookings(), fetchStats()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const openIntervene = (booking) => {
    setInterveneBooking(booking);
    setInterveneAction(null);
    setInterveneStatus("confirmed");
    setInterveneError("");
  };

  const closeIntervene = () => {
    setInterveneBooking(null);
    setInterveneAction(null);
    setInterveneError("");
  };

  const handleInterveneSubmit = async () => {
    if (!interveneAction) {
      setInterveneError("Please select an action.");
      return;
    }
    setInterveneLoading(true);
    setInterveneError("");
    try {
      if (interveneAction === "cancel") {
        const res = await fetch(
          `${API_BASE}/api/admin/bookings/${interveneBooking.bookingID}/cancel`,
          {
            method: "PATCH",
            headers: API_HEADERS,
            body: JSON.stringify({ cancellationReason: "Cancelled by support intervention" }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to cancel booking");
      } else if (interveneAction === "change-status") {
        const res = await fetch(
          `${API_BASE}/api/admin/bookings/${interveneBooking.bookingID}/status`,
          {
            method: "PATCH",
            headers: API_HEADERS,
            body: JSON.stringify({ status: interveneStatus }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to update status");
      }
      if (selectedBooking?.bookingID === interveneBooking.bookingID) setSelectedBooking(null);
      closeIntervene();
      await Promise.all([fetchBookings(), fetchStats()]);
    } catch (err) {
      setInterveneError(err.message);
    } finally {
      setInterveneLoading(false);
    }
  };

  const filtered = (bookings ?? []).filter((b) => {
    const matchStatus = filter === "all" || b.status?.toLowerCase() === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      b.ownerName?.toLowerCase().includes(q) ||
      b.minderName?.toLowerCase().includes(q) ||
      b.petName?.toLowerCase().includes(q) ||
      b.serviceName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const summaryCards = [
    { icon: "📋", label: "Total",     value: stats?.total     ?? "—", iconClass: "bookings-page__summary-icon--navy",   valueClass: "bookings-page__summary-value--navy"   },
    { icon: "✅", label: "Confirmed", value: stats?.confirmed ?? "—", iconClass: "bookings-page__summary-icon--green",  valueClass: "bookings-page__summary-value--green"  },
    { icon: "⏳", label: "Pending",   value: stats?.pending   ?? "—", iconClass: "bookings-page__summary-icon--orange", valueClass: "bookings-page__summary-value--orange" },
    { icon: "❌", label: "Cancelled", value: stats?.cancelled ?? "—", iconClass: "bookings-page__summary-icon--red",    valueClass: "bookings-page__summary-value--red"    },
  ];

  return (
    <div className="bookings-page">
      <SectionHeader
        title="Booking Management"
        subtitle="Monitor booking activity and step in when customer support intervention is needed."
        action={
          <Input
            placeholder="Search bookings..."
            icon="🔍"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bookings-page__search"
          />
        }
      />

      {error && (
        <Card style={{ marginBottom: 16, padding: "12px 16px", color: "#b91c1c", fontSize: 13 }}>
          {error}
        </Card>
      )}

      <div className="bookings-page__filters">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`bookings-page__filter-btn ${filter === f ? "bookings-page__filter-btn--active" : ""}`}
          >
            {f === "all" ? "All Bookings" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="bookings-page__summary-grid">
        {summaryCards.map((item) => (
          <Card key={item.label} className="bookings-page__summary-card-shell">
            <div className="bookings-page__summary-card">
              <div className={`bookings-page__summary-icon ${item.iconClass}`}>{item.icon}</div>
              <div className="bookings-page__summary-content">
                <p className="bookings-page__summary-label">{item.label}</p>
                <p className={`bookings-page__summary-value ${item.valueClass}`}>{item.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        {bookings === null ? (
          <div style={{ padding: 18 }}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 18, color: "#6b7280", fontSize: 13 }}>No bookings found.</div>
        ) : (
          <table className="bookings-page__table">
            <thead>
              <tr>
                <Th>Booking ID</Th>
                <Th>Pet Owner</Th>
                <Th>Pet Minder</Th>
                <Th>Pet</Th>
                <Th>Service</Th>
                <Th>Date</Th>
                <Th>Cost</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const isActioning = actionLoading === b.bookingID;
                const status = b.status?.toLowerCase() ?? "";
                const canCancel = ["pending", "confirmed"].includes(status);
                return (
                  <tr key={b.bookingID}>
                    <Td>
                      <span className="bookings-page__booking-id">
                        #{b.bookingID.slice(0, 6).toUpperCase()}
                      </span>
                    </Td>
                    <Td>{b.ownerName}</Td>
                    <Td>{b.minderName}</Td>
                    <Td>🐾 {b.petName}</Td>
                    <Td className="bookings-page__cell-small">
                      {b.serviceDuration
                        ? `${b.serviceName} (${b.serviceDuration} min)`
                        : b.serviceName}
                    </Td>
                    <Td className="bookings-page__cell-small">{formatDate(b.startTime)}</Td>
                    <Td>
                      <strong className="bookings-page__cost">{formatCost(b.totalCost)}</strong>
                    </Td>
                    <Td>
                      <StatusBadge status={status} />
                    </Td>
                    <Td>
                      <div className="bookings-page__actions">
                        <Btn variant="outline" small onClick={() => setSelectedBooking(b)}>
                          View
                        </Btn>
                        <Btn
                          variant="outline"
                          small
                          onClick={() => openIntervene(b)}
                        >
                          Intervene
                        </Btn>
                        {canCancel && (
                          <Btn
                            variant="danger"
                            small
                            disabled={isActioning}
                            onClick={() => handleCancel(b.bookingID)}
                          >
                            {isActioning ? "..." : "Cancel"}
                          </Btn>
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

      {interveneBooking && (
        <div className="bookings-page__overlay" onClick={closeIntervene}>
          <div
            className="bookings-page__overlay-card bookings-page__intervene-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="bookings-page__overlay-close"
              onClick={closeIntervene}
            >
              ✕
            </button>

            <div className="bookings-page__intervene-header">
              <p className="bookings-page__overlay-id">
                #{interveneBooking.bookingID.slice(0, 6).toUpperCase()}
              </p>
              <h2 className="bookings-page__intervene-title">Intervene on Booking</h2>
              <p className="bookings-page__intervene-subtitle">
                {interveneBooking.serviceName} &middot; {interveneBooking.ownerName} → {interveneBooking.minderName}
              </p>
              <div style={{ marginTop: 10 }}>
                <StatusBadge status={interveneBooking.status?.toLowerCase()} />
              </div>
            </div>

            <p className="bookings-page__intervene-section-label">Select an action</p>

            <div className="bookings-page__intervene-options">
              {(() => {
                const isCancelDisabled = ["completed", "cancelled"].includes(
                  interveneBooking.status?.toLowerCase()
                );
                return (
                  <>
                    <button
                      type="button"
                      className={`bookings-page__intervene-option${interveneAction === "cancel" ? " bookings-page__intervene-option--selected" : ""}${isCancelDisabled ? " bookings-page__intervene-option--disabled" : ""}`}
                      onClick={() => !isCancelDisabled && setInterveneAction("cancel")}
                      disabled={isCancelDisabled}
                    >
                      <span className="bookings-page__intervene-option-icon">❌</span>
                      <div>
                        <p className="bookings-page__intervene-option-title">Cancel Booking</p>
                        <p className="bookings-page__intervene-option-desc">
                          Immediately cancel this booking and free the slot.
                          {isCancelDisabled && " (Not available for this status)"}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`bookings-page__intervene-option${interveneAction === "change-status" ? " bookings-page__intervene-option--selected" : ""}`}
                      onClick={() => setInterveneAction("change-status")}
                    >
                      <span className="bookings-page__intervene-option-icon">🔄</span>
                      <div>
                        <p className="bookings-page__intervene-option-title">Change Status</p>
                        <p className="bookings-page__intervene-option-desc">
                          Manually override the booking status to any value.
                        </p>
                      </div>
                    </button>
                  </>
                );
              })()}
            </div>

            {interveneAction === "change-status" && (
              <div className="bookings-page__intervene-status-row">
                <label
                  className="bookings-page__intervene-status-label"
                  htmlFor="intervene-status-select"
                >
                  New Status
                </label>
                <select
                  id="intervene-status-select"
                  className="bookings-page__intervene-status-select"
                  value={interveneStatus}
                  onChange={(e) => setInterveneStatus(e.target.value)}
                >
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            )}

            {interveneError && (
              <p className="bookings-page__intervene-error">{interveneError}</p>
            )}

            <div className="bookings-page__intervene-footer">
              <Btn variant="outline" onClick={closeIntervene} disabled={interveneLoading}>
                Close
              </Btn>
              <Btn
                variant="danger"
                onClick={handleInterveneSubmit}
                disabled={!interveneAction || interveneLoading}
              >
                {interveneLoading ? "Applying..." : "Apply Action"}
              </Btn>
            </div>
          </div>
        </div>
      )}

      {selectedBooking && (
        <div className="bookings-page__overlay" onClick={() => setSelectedBooking(null)}>
          <div
            className="bookings-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="bookings-page__overlay-close"
              onClick={() => setSelectedBooking(null)}
            >
              ✕
            </button>

            <div className="bookings-page__overlay-header">
              <div className="bookings-page__overlay-header-main">
                <p className="bookings-page__overlay-id">
                  #{selectedBooking.bookingID.slice(0, 6).toUpperCase()}
                </p>
                <h2 className="bookings-page__overlay-title">{selectedBooking.serviceName}</h2>
                <p className="bookings-page__overlay-subtitle">
                  {formatDate(selectedBooking.startTime)}
                  {selectedBooking.locationCity ? ` · ${selectedBooking.locationCity}` : ""}
                </p>
                <div className="bookings-page__overlay-badges">
                  <StatusBadge status={selectedBooking.status?.toLowerCase()} />
                </div>
              </div>
            </div>

            <div className="bookings-page__overlay-grid">
              <div className="bookings-page__overlay-section">
                <h3 className="bookings-page__overlay-section-title">Booking Details</h3>
                <div className="bookings-page__overlay-list">
                  {[
                    ["Pet Owner",  selectedBooking.ownerName],
                    ["Pet Minder", selectedBooking.minderName],
                    ["Pet",        selectedBooking.petName],
                    ["Duration",   selectedBooking.serviceDuration ? `${selectedBooking.serviceDuration} min` : "N/A"],
                    ["Cost",       formatCost(selectedBooking.totalCost)],
                    ["Payment",    formatPaymentStatus(selectedBooking.paymentEscrow)],
                  ].map(([label, value]) => (
                    <div key={label} className="bookings-page__overlay-row">
                      <span>{label}</span>
                      <strong>{value}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bookings-page__overlay-section">
                <h3 className="bookings-page__overlay-section-title">Support Notes</h3>
                <div className="bookings-page__overlay-note-box">
                  <p className="bookings-page__overlay-note-text">
                    {selectedBooking.ownerNotes || "No notes provided."}
                  </p>
                </div>
                <div className="bookings-page__overlay-stats">
                  <div className="bookings-page__overlay-stat">
                    <span className="bookings-page__overlay-stat-label">Status</span>
                    <strong className="bookings-page__overlay-stat-value">
                      {selectedBooking.status}
                    </strong>
                  </div>
                  <div className="bookings-page__overlay-stat">
                    <span className="bookings-page__overlay-stat-label">Service</span>
                    <strong className="bookings-page__overlay-stat-value">
                      {selectedBooking.serviceName}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            <div className="bookings-page__overlay-actions">
              <Btn variant="outline">Message Owner</Btn>
              <Btn variant="outline">Message Minder</Btn>
              <Btn variant="outline">View Payment</Btn>
              {["pending", "confirmed"].includes(selectedBooking.status?.toLowerCase()) && (
                <Btn
                  variant="danger"
                  disabled={actionLoading === selectedBooking.bookingID}
                  onClick={() => handleCancel(selectedBooking.bookingID)}
                >
                  {actionLoading === selectedBooking.bookingID ? "Cancelling..." : "Cancel Booking"}
                </Btn>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
