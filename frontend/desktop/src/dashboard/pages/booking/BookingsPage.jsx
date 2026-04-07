import { useState } from "react";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { Input } from "../../components/input/Input.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./BookingsPage.css";

export default function BookingsPage() {
  const [filter, setFilter] = useState("all");

  const bookings = [
    { id: "#HT-8801", owner: "Sarah J.", minder: "James W.", pet: "Buddy", service: "Dog Walking (60 min)", date: "9 Apr 2026", cost: "£23.10", status: "confirmed" },
    { id: "#HT-8802", owner: "Mike T.", minder: "Priya P.", pet: "Whiskers", service: "Pet Sitting", date: "12 Apr 2026", cost: "£48.00", status: "pending" },
    { id: "#HT-8798", owner: "Anna B.", minder: "James W.", pet: "Max", service: "Home Boarding", date: "2 Apr 2026", cost: "£105.00", status: "completed" },
    { id: "#HT-8797", owner: "Chris L.", minder: "Tom H.", pet: "Luna", service: "Dog Walking (30 min)", date: "28 Mar 2026", cost: "£15.75", status: "cancelled" },
    { id: "#HT-8800", owner: "Rachel K.", minder: "Emma R.", pet: "Mochi", service: "Day Care", date: "5 Apr 2026", cost: "£34.50", status: "confirmed" },
  ];

  const filters = ["all", "confirmed", "pending", "completed", "cancelled"];
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  const summaryCards = [
    {
      icon: "📋",
      label: "Total",
      value: "387",
      iconClass: "bookings-page__summary-icon--navy",
      valueClass: "bookings-page__summary-value--navy",
    },
    {
      icon: "✅",
      label: "Confirmed",
      value: "198",
      iconClass: "bookings-page__summary-icon--green",
      valueClass: "bookings-page__summary-value--green",
    },
    {
      icon: "⏳",
      label: "Pending",
      value: "83",
      iconClass: "bookings-page__summary-icon--orange",
      valueClass: "bookings-page__summary-value--orange",
    },
    {
      icon: "❌",
      label: "Cancelled",
      value: "26",
      iconClass: "bookings-page__summary-icon--red",
      valueClass: "bookings-page__summary-value--red",
    },
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
            className="bookings-page__search"
          />
        }
      />

      <div className="bookings-page__filters">
        {filters.map((f) => {
          const isActive = filter === f;

          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`bookings-page__filter-btn ${
                isActive ? "bookings-page__filter-btn--active" : ""
              }`}
            >
              {f === "all" ? "All Bookings" : f}
            </button>
          );
        })}
      </div>

      <div className="bookings-page__summary-grid">
        {summaryCards.map((item) => (
          <Card key={item.label} className="bookings-page__summary-card-shell">
            <div className="bookings-page__summary-card">
              <div className={`bookings-page__summary-icon ${item.iconClass}`}>
                {item.icon}
              </div>

              <div className="bookings-page__summary-content">
                <p className="bookings-page__summary-label">{item.label}</p>
                <p className={`bookings-page__summary-value ${item.valueClass}`}>
                  {item.value}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
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
            {filtered.map((b) => (
              <tr key={b.id}>
                <Td>
                  <span className="bookings-page__booking-id">{b.id}</span>
                </Td>
                <Td>{b.owner}</Td>
                <Td>{b.minder}</Td>
                <Td>🐾 {b.pet}</Td>
                <Td className="bookings-page__cell-small">{b.service}</Td>
                <Td className="bookings-page__cell-small">{b.date}</Td>
                <Td>
                  <strong className="bookings-page__cost">{b.cost}</strong>
                </Td>
                <Td>
                  <StatusBadge status={b.status} />
                </Td>
                <Td>
                  <div className="bookings-page__actions">
                    <Btn variant="outline" small>
                      View
                    </Btn>
                    <Btn variant="outline" small>
                      Intervene
                    </Btn>
                    {b.status === "pending" && (
                      <Btn variant="danger" small>
                        Cancel
                      </Btn>
                    )}
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}