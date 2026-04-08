import { useState } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { Input } from "../../components/input/Input.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./UsersPage.css";

export default function UsersPage() {
  const [tab, setTab] = useState("owners");
  const [selectedUser, setSelectedUser] = useState(null);

  const owners = [
    { id: "U001", name: "Sarah Johnson", email: "sarah@email.com", location: "Luton", pets: 2, bookings: 14, joined: "Jan 2025", status: "active", verification: "verified", type: "owner" },
    { id: "U002", name: "Mike Torres", email: "mike@email.com", location: "Luton", pets: 1, bookings: 8, joined: "Feb 2025", status: "active", verification: "verified", type: "owner" },
    { id: "U003", name: "Anna Brown", email: "anna@email.com", location: "Bedford", pets: 3, bookings: 21, joined: "Dec 2024", status: "active", verification: "verified", type: "owner" },
    { id: "U004", name: "Chris Lim", email: "chris@email.com", location: "St Albans", pets: 1, bookings: 3, joined: "Mar 2025", status: "inactive", verification: "unverified", type: "owner" },
    { id: "U005", name: "Rachel Kim", email: "rachel@email.com", location: "Luton", pets: 2, bookings: 7, joined: "Jan 2025", status: "active", verification: "verified", type: "owner" },
  ];

  const minders = [
    { id: "M001", name: "James Walker", email: "james@email.com", location: "Luton", services: 3, rating: 4.9, bookings: 87, joined: "Oct 2024", status: "active", verification: "verified", type: "minder" },
    { id: "M002", name: "Priya Patel", email: "priya@email.com", location: "Luton", services: 2, rating: 4.7, bookings: 54, joined: "Nov 2024", status: "active", verification: "verified", type: "minder" },
    { id: "M003", name: "Tom Hughes", email: "tom@email.com", location: "Bedford", services: 1, rating: 4.8, bookings: 32, joined: "Jan 2025", status: "active", verification: "verified", type: "minder" },
    { id: "M004", name: "Emma Reeves", email: "emma@email.com", location: "Luton", services: 4, rating: 0, bookings: 0, joined: "Mar 2025", status: "inactive", verification: "unverified", type: "minder" },
    { id: "M005", name: "Dan Foster", email: "dan@email.com", location: "Watford", services: 2, rating: 0, bookings: 0, joined: "Mar 2025", status: "inactive", verification: "unverified", type: "minder" },
  ];

  const pendingMinders = [
    { name: "Emma Reeves", submitted: "28 Mar 2026", doc: "Passport + DBS Check", exp: "2 years" },
    { name: "Dan Foster", submitted: "27 Mar 2026", doc: "Driving Licence", exp: "1 year" },
    { name: "Yuki Tanaka", submitted: "26 Mar 2026", doc: "Passport + References", exp: "4 years" },
  ];

  const tabs = [
    ["owners", "Pet Owners"],
    ["minders", "Pet Minders"],
    ["pending", "Pending Verification"],
  ];

  return (
    <div className="users-page">
      <SectionHeader
        title="User Management"
        subtitle="Review pet owner and pet minder accounts, verification status and account actions."
        action={<Input placeholder="Search users..." icon="🔍" className="users-page__search" />}
      />

      <div className="users-page__tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`users-page__tab-btn ${
              tab === key ? "users-page__tab-btn--active" : ""
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "owners" && (
        <Card>
          <table className="users-page__table">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Location</Th>
                <Th>Pets</Th>
                <Th>Bookings</Th>
                <Th>Joined</Th>
                <Th>Verification</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {owners.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <div className="users-page__person">
                      <Avatar name={u.name} size={34} />
                      <div className="users-page__person-meta">
                        <div className="users-page__person-name">{u.name}</div>
                        <div className="users-page__person-email">{u.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>📍 {u.location}</Td>
                  <Td>
                    {u.pets} pet{u.pets !== 1 ? "s" : ""}
                  </Td>
                  <Td>{u.bookings}</Td>
                  <Td>{u.joined}</Td>
                  <Td>
                    <StatusBadge status={u.verification} />
                  </Td>
                  <Td>
                    <StatusBadge status={u.status} />
                  </Td>
                  <Td>
                    <div className="users-page__actions">
                      <Btn variant="outline" small onClick={() => setSelectedUser(u)}>
                        View
                      </Btn>
                      <Btn variant="danger" small>
                        Suspend
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "minders" && (
        <Card>
          <table className="users-page__table">
            <thead>
              <tr>
                <Th>Minder</Th>
                <Th>Location</Th>
                <Th>Services</Th>
                <Th>Rating</Th>
                <Th>Bookings</Th>
                <Th>Verification</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {minders.map((m) => (
                <tr key={m.id}>
                  <Td>
                    <div className="users-page__person">
                      <Avatar name={m.name} size={34} color={C.blue} />
                      <div className="users-page__person-meta">
                        <div className="users-page__person-name">{m.name}</div>
                        <div className="users-page__person-email">{m.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>📍 {m.location}</Td>
                  <Td>{m.services}</Td>
                  <Td>{m.rating > 0 ? `⭐ ${m.rating}` : "—"}</Td>
                  <Td>{m.bookings}</Td>
                  <Td>
                    <StatusBadge status={m.verification} />
                  </Td>
                  <Td>
                    <StatusBadge status={m.status} />
                  </Td>
                  <Td>
                    <div className="users-page__actions">
                      <Btn variant="outline" small onClick={() => setSelectedUser(m)}>
                        View
                      </Btn>
                      <Btn variant="danger" small>
                        Suspend
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "pending" && (
        <div>
          <div className="users-page__notice">
            <span className="users-page__notice-icon">⚠️</span>
            <div className="users-page__notice-content">
              <strong className="users-page__notice-title">
                5 minders awaiting identity verification
              </strong>
              <p className="users-page__notice-text">
                Profiles remain hidden from pet owners until verified. Review submitted documents below.
              </p>
            </div>
          </div>

          <Card>
            <table className="users-page__table">
              <thead>
                <tr>
                  <Th>Minder</Th>
                  <Th>Submitted</Th>
                  <Th>Document Type</Th>
                  <Th>Experience</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pendingMinders.map((v) => (
                  <tr key={v.name}>
                    <Td>
                      <div className="users-page__person">
                        <Avatar name={v.name} size={34} color={C.yellow} />
                        <span className="users-page__pending-name">{v.name}</span>
                      </div>
                    </Td>
                    <Td>{v.submitted}</Td>
                    <Td>📄 {v.doc}</Td>
                    <Td>{v.exp}</Td>
                    <Td>
                      <div className="users-page__actions">
                        <Btn variant="success" small>
                          Verify
                        </Btn>
                        <Btn variant="danger" small>
                          Reject
                        </Btn>
                        <Btn variant="outline" small>
                          View Docs
                        </Btn>
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {selectedUser && (
        <div className="users-page__overlay" onClick={() => setSelectedUser(null)}>
          <div
            className="users-page__overlay-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="users-page__overlay-close"
              onClick={() => setSelectedUser(null)}
            >
              ✕
            </button>

            <div className="users-page__overlay-header">
              <Avatar
                name={selectedUser.name}
                size={72}
                color={selectedUser.type === "minder" ? C.blue : C.orange}
              />
              <div className="users-page__overlay-header-text">
                <h2 className="users-page__overlay-name">{selectedUser.name}</h2>
                <p className="users-page__overlay-email">{selectedUser.email}</p>
                <div className="users-page__overlay-badges">
                  <StatusBadge status={selectedUser.status} />
                  {selectedUser.verification && (
                    <StatusBadge status={selectedUser.verification} />
                  )}
                </div>
              </div>
            </div>

            <div className="users-page__overlay-grid">
              <div className="users-page__overlay-section">
                <h3 className="users-page__overlay-section-title">Profile Details</h3>
                <div className="users-page__overlay-list">
                  <div className="users-page__overlay-row">
                    <span>ID</span>
                    <strong>{selectedUser.id}</strong>
                  </div>
                  <div className="users-page__overlay-row">
                    <span>Type</span>
                    <strong>{selectedUser.type === "minder" ? "Pet Minder" : "Pet Owner"}</strong>
                  </div>
                  <div className="users-page__overlay-row">
                    <span>Location</span>
                    <strong>{selectedUser.location}</strong>
                  </div>
                  <div className="users-page__overlay-row">
                    <span>Joined</span>
                    <strong>{selectedUser.joined}</strong>
                  </div>
                </div>
              </div>

              <div className="users-page__overlay-section">
                <h3 className="users-page__overlay-section-title">Activity</h3>
                <div className="users-page__overlay-stats">
                  <div className="users-page__overlay-stat">
                    <span className="users-page__overlay-stat-label">Bookings</span>
                    <strong className="users-page__overlay-stat-value">
                      {selectedUser.bookings}
                    </strong>
                  </div>

                  {selectedUser.type === "owner" ? (
                    <div className="users-page__overlay-stat">
                      <span className="users-page__overlay-stat-label">Pets</span>
                      <strong className="users-page__overlay-stat-value">
                        {selectedUser.pets}
                      </strong>
                    </div>
                  ) : (
                    <>
                      <div className="users-page__overlay-stat">
                        <span className="users-page__overlay-stat-label">Services</span>
                        <strong className="users-page__overlay-stat-value">
                          {selectedUser.services}
                        </strong>
                      </div>
                      <div className="users-page__overlay-stat">
                        <span className="users-page__overlay-stat-label">Rating</span>
                        <strong className="users-page__overlay-stat-value">
                          {selectedUser.rating > 0 ? `⭐ ${selectedUser.rating}` : "—"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="users-page__overlay-actions">
              <Btn variant="outline">Message User</Btn>
              <Btn variant="outline">View Activity</Btn>
              <Btn variant="danger">Suspend Account</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}