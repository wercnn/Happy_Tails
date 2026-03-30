import { useState } from "react";
import { C } from "../constants.js";
import { StatusBadge } from "../components/Badge.jsx";
import { Avatar } from "../components/Avatar.jsx";
import { Btn } from "../components/Btn.jsx";
import { Card, Th, Td } from "../components/Card.jsx";
import { Input } from "../components/Input.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function UsersPage() {
  const [tab, setTab] = useState("owners");

  const owners = [
    { id: "U001", name: "Sarah Johnson", email: "sarah@email.com", location: "Luton", pets: 2, bookings: 14, joined: "Jan 2025", status: "active" },
    { id: "U002", name: "Mike Torres", email: "mike@email.com", location: "Luton", pets: 1, bookings: 8, joined: "Feb 2025", status: "active" },
    { id: "U003", name: "Anna Brown", email: "anna@email.com", location: "Bedford", pets: 3, bookings: 21, joined: "Dec 2024", status: "active" },
    { id: "U004", name: "Chris Lim", email: "chris@email.com", location: "St Albans", pets: 1, bookings: 3, joined: "Mar 2025", status: "inactive" },
    { id: "U005", name: "Rachel Kim", email: "rachel@email.com", location: "Luton", pets: 2, bookings: 7, joined: "Jan 2025", status: "active" },
  ];

  const minders = [
    { id: "M001", name: "James Walker", email: "james@email.com", location: "Luton", services: 3, rating: 4.9, bookings: 87, joined: "Oct 2024", status: "active", verification: "verified" },
    { id: "M002", name: "Priya Patel", email: "priya@email.com", location: "Luton", services: 2, rating: 4.7, bookings: 54, joined: "Nov 2024", status: "active", verification: "verified" },
    { id: "M003", name: "Tom Hughes", email: "tom@email.com", location: "Bedford", services: 1, rating: 4.8, bookings: 32, joined: "Jan 2025", status: "active", verification: "verified" },
    { id: "M004", name: "Emma Reeves", email: "emma@email.com", location: "Luton", services: 4, rating: 0, bookings: 0, joined: "Mar 2025", status: "inactive", verification: "unverified" },
    { id: "M005", name: "Dan Foster", email: "dan@email.com", location: "Watford", services: 2, rating: 0, bookings: 0, joined: "Mar 2025", status: "inactive", verification: "unverified" },
  ];

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle="Manage pet owners, minders and identity verifications"
        action={<Input placeholder="Search users..." icon="🔍" style={{ width: 240 }} />}
      />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.light, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          ["owners", "🐶 Pet Owners"],
          ["minders", "🏠 Pet Minders"],
          ["pending", "🕵️ Pending Verification"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              fontFamily: "inherit",
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.navy : C.mid,
              boxShadow: tab === k ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
              transition: "all 0.15s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "owners" && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Location</Th>
                <Th>Pets</Th>
                <Th>Bookings</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {owners.map((u) => (
                <tr key={u.id}>
                  <Td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={u.name} size={34} />
                      <div>
                        <div style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: C.mid }}>{u.email}</div>
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
                    <StatusBadge status={u.status} />
                  </Td>
                  <Td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="outline" small>
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
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={m.name} size={34} color={C.blue} />
                      <div>
                        <div style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: C.mid }}>{m.email}</div>
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
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="outline" small>
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
          <div
            style={{
              marginBottom: 16,
              padding: 16,
              display: "flex",
              gap: 12,
              alignItems: "center",
              background: C.orangeLight,
              border: `1.5px solid ${C.orange}`,
              borderRadius: 12,
              boxShadow: "0 2px 12px rgba(26,42,74,0.06)",
            }}
          >
            <span style={{ fontSize: 22 }}>⚠️</span>
            <div>
              <strong style={{ color: C.navy, fontSize: 13 }}>5 minders awaiting identity verification</strong>
              <p style={{ margin: 0, fontSize: 12, color: C.dark }}>
                Profiles remain hidden from pet owners until verified. Review submitted documents below.
              </p>
            </div>
          </div>

          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                {[
                  { name: "Emma Reeves", submitted: "28 Mar 2026", doc: "Passport + DBS Check", exp: "2 years" },
                  { name: "Dan Foster", submitted: "27 Mar 2026", doc: "Driving Licence", exp: "1 year" },
                  { name: "Yuki Tanaka", submitted: "26 Mar 2026", doc: "Passport + References", exp: "4 years" },
                ].map((v) => (
                  <tr key={v.name}>
                    <Td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={v.name} size={34} color={C.yellow} />
                        <span style={{ fontWeight: 700, color: C.navy, fontSize: 13 }}>{v.name}</span>
                      </div>
                    </Td>
                    <Td>{v.submitted}</Td>
                    <Td>📄 {v.doc}</Td>
                    <Td>{v.exp}</Td>
                    <Td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="success" small>
                          ✓ Approve
                        </Btn>
                        <Btn variant="danger" small>
                          ✗ Reject
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
    </div>
  );
}

