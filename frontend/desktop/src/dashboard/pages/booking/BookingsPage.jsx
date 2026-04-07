import { useState } from "react";
import { C } from "../../constants.js";
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

  const pageVars = {
    "--bookings-text-muted": C.mid,
    "--bookings-text-dark": C.dark,
    "--bookings-text-navy": C.navy,
    "--bookings-text-orange": C.orange,
    "--bookings-white": C.white,
    "--bookings-border": C.border,
  };

  const summaryCards = [
    ["📋", "Total", "387", C.navy],
    ["✅", "Confirmed", "198", C.green],
    ["⏳", "Pending", "83", C.orange],
    ["❌", "Cancelled", "26", C.red],
  ];

  return (
    <div className="bookings-page" style={pageVars}>
      <SectionHeader
        title="Booking Management"
        subtitle="Monitor booking activity and step in when customer support intervention is needed."
        action={<Input placeholder="Search bookings..." icon="🔍" style={{ width: 240 }} />}
      />

      <div className="bookings-page__filters">
        {filters.map((f) => {
          const isActive = filter === f;

          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`bookings-page__filter-btn ${isActive ? "bookings-page__filter-btn--active" : ""}`}
              style={{
                "--bookings-filter-border": isActive ? C.orange : C.border,
                "--bookings-filter-bg": isActive ? C.orange : C.white,
                "--bookings-filter-color": isActive ? C.white : C.dark,
              }}
            >
              {f === "all" ? "All Bookings" : f}
            </button>
          );
        })}
      </div>

      <div className="bookings-page__summary-grid">
        {summaryCards.map(([icon, lbl, val, col]) => (
          <Card
            key={lbl}
            style={{ padding: "14px 16px" }}
          >
            <div className="bookings-page__summary-card">
              <div
                className="bookings-page__summary-icon"
                style={{ "--bookings-summary-icon-bg": `${col}18` }}
              >
                {icon}
              </div>
              <div className="bookings-page__summary-content">
                <p className="bookings-page__summary-label">{lbl}</p>
                <p
                  className="bookings-page__summary-value"
                  style={{ "--bookings-summary-value-color": col }}
                >
                  {val}
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
                <Td style={{ fontSize: 12 }}>{b.service}</Td>
                <Td style={{ fontSize: 12 }}>{b.date}</Td>
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