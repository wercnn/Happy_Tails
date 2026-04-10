import { useState, useEffect } from "react";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { Input } from "../../components/input/Input.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./BookingsPage.css";

const API = "http://localhost:3000/api";

export default function BookingsPage({ user }) {
  const safeUser = user || {
    userID: "u-support-001",
    role: "support",
  };

  function headers() {
    return {
      "Content-Type": "application/json",
      "X-User-Id": safeUser.userID,
      "X-User-Role": safeUser.role,
    };
  }

  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ FETCH BOOKINGS
  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/bookings`, { headers: headers() });
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // ✅ FILTER
  const filtered =
    filter === "all"
      ? bookings
      : bookings.filter((b) => b.status?.toLowerCase() === filter);

  // ✅ SUMMARY (real counts)
  const summary = {
    total: bookings.length,
    confirmed: bookings.filter((b) => b.status === "confirmed").length,
    pending: bookings.filter((b) => b.status === "pending").length,
    cancelled: bookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div className="bookings-page">
      <SectionHeader
        title="Booking Management"
        subtitle="Live bookings from database"
        action={<Input placeholder="Search..." icon="🔍" />}
      />

      {/* FILTERS */}
      <div className="bookings-page__filters">
        {["all", "confirmed", "pending", "completed", "cancelled"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>

      {/* SUMMARY */}
      <div className="bookings-page__summary-grid">
        <Card>Total: {summary.total}</Card>
        <Card>Confirmed: {summary.confirmed}</Card>
        <Card>Pending: {summary.pending}</Card>
        <Card>Cancelled: {summary.cancelled}</Card>
      </div>

      {/* TABLE */}
      <Card>
        {loading ? (
          <p>Loading bookings...</p>
        ) : (
          <table className="bookings-page__table">
            <thead>
              <tr>
                <Th>ID</Th>
                <Th>Owner</Th>
                <Th>Minder</Th>
                <Th>Status</Th>
                <Th>Cost</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((b) => (
                <tr key={b.bookingID}>
                  <Td>{b.bookingID}</Td>
                  <Td>{b.ownerID}</Td>
                  <Td>{b.sitterID}</Td>
                  <Td>
                    <StatusBadge status={b.status?.toLowerCase()} />
                  </Td>
                  <Td>£{b.totalCost}</Td>
                  <Td>
                    <Btn onClick={() => setSelectedBooking(b)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* MODAL */}
      {selectedBooking && (
        <div
          className="bookings-page__overlay"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bookings-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{selectedBooking.bookingID}</h2>

            <p>Status: {selectedBooking.status}</p>
            <p>Owner: {selectedBooking.ownerID}</p>
            <p>Minder: {selectedBooking.sitterID}</p>
            <p>Cost: £{selectedBooking.totalCost}</p>

            <Btn onClick={() => setSelectedBooking(null)}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}