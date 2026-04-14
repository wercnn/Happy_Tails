import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Avatar } from "../../components/avatar/Avatar.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { Input } from "../../components/input/Input.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./UsersPage.css";

const API = "http://localhost:3000/api";

function authHeaders(user) {
  return {
    "Content-Type": "application/json",
    "X-User-Id": user.userID,
    "X-User-Role": user.role,
  };
}

export default function UsersPage({ user, searchQuery = "" }) {
  const [tab, setTab] = useState("owners");
  const [owners, setOwners] = useState([]);
  const [minders, setMinders] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Sync global search query into local search state
  useEffect(() => {
    if (searchQuery) setSearch(searchQuery);
  }, [searchQuery]);

  const tabs = [
    ["owners", "Pet Owners"],
    ["minders", "Pet Minders"],
    ["pending", "Pending Verification"],
  ];

  useEffect(() => {
    if (tab === "owners") fetchOwners();
    else if (tab === "minders") fetchMinders();
    else if (tab === "pending") fetchPending();
  }, [tab]);

  async function fetchOwners() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/users?role=owner`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOwners(data);
    } catch (e) {
      setError(e.message || "Failed to load owners");
    } finally {
      setLoading(false);
    }
  }

  async function fetchMinders() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/users?role=minder`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMinders(data);
    } catch (e) {
      setError(e.message || "Failed to load minders");
    } finally {
      setLoading(false);
    }
  }

  async function fetchPending() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/minders/pending`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending(data);
    } catch (e) {
      setError(e.message || "Failed to load pending verifications");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewUser(userID) {
    try {
      const res = await fetch(`${API}/users/${userID}`, { headers: authHeaders(user) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedUser(data);
    } catch (e) {
      alert(e.message || "Failed to load user details");
    }
  }

  async function handleSuspend(userID, currentStatus) {
    const newStatus = currentStatus === "Suspended" ? "Active" : "Suspended";
    try {
      const res = await fetch(`${API}/users/${userID}/suspend`, {
        method: "PATCH",
        headers: authHeaders(user),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // Update local state
      const update = (list) =>
        list.map((u) => (u.userID === userID ? { ...u, status: newStatus } : u));
      setOwners(update);
      setMinders(update);
      if (selectedUser?.userID === userID) setSelectedUser({ ...selectedUser, status: newStatus });
    } catch (e) {
      alert(e.message || "Failed to update user status");
    }
  }

  async function handleActivate(userID) {
    const newStatus = "Active";
    try {
      const res = await fetch(`${API}/users/${userID}/suspend`, {
        method: "PATCH",
        headers: authHeaders(user),
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const update = (list) =>
        list.map((u) => (u.userID === userID ? { ...u, status: newStatus } : u));
      setOwners(update);
      setMinders(update);
      if (selectedUser?.userID === userID) setSelectedUser({ ...selectedUser, status: newStatus });
    } catch (e) {
      alert(e.message || "Failed to activate user");
    }
  }

  async function handleVerify(sitterID) {
    try {
      const res = await fetch(`${API}/minders/${sitterID}/verify`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending((prev) => prev.filter((m) => m.sitterID !== sitterID));
    } catch (e) {
      alert(e.message || "Failed to verify minder");
    }
  }

  async function handleReject(sitterID) {
    try {
      const res = await fetch(`${API}/minders/${sitterID}/reject`, {
        method: "PATCH",
        headers: authHeaders(user),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending((prev) => prev.filter((m) => m.sitterID !== sitterID));
    } catch (e) {
      alert(e.message || "Failed to reject minder");
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  }

  function filterBySearch(list) {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter(
      (u) =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
    );
  }

  return (
    <div className="users-page">
      <SectionHeader
        title="User Management"
        subtitle="Review pet owner and pet minder accounts, verification status and account actions."
        action={
          <Input
            placeholder="Search users..."
            icon="🔍"
            className="users-page__search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <div className="users-page__tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`users-page__tab-btn ${tab === key ? "users-page__tab-btn--active" : ""}`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <p style={{ color: C.red, padding: "12px 0" }}>⚠️ {error}</p>
      )}

      {loading && <p style={{ color: C.mid, padding: "12px 0" }}>Loading...</p>}

      {!loading && tab === "owners" && (
        <Card>
          <table className="users-page__table">
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Location</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filterBySearch(owners).map((u) => (
                <tr key={u.userID}>
                  <Td>
                    <div className="users-page__person">
                      <Avatar name={`${u.firstName} ${u.lastName}`} size={34} />
                      <div className="users-page__person-meta">
                        <div className="users-page__person-name">{u.firstName} {u.lastName}</div>
                        <div className="users-page__person-email">{u.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>📍 {u.city || "—"}</Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td><StatusBadge status={u.status?.toLowerCase()} /></Td>
                  <Td>
                    <div className="users-page__actions">
                      <Btn variant="outline" small onClick={() => handleViewUser(u.userID)}>View</Btn>
                      {u.status === "Inactive" && (
                        <Btn
                          variant="success"
                          small
                          onClick={() => handleActivate(u.userID)}
                        >
                          Activate
                        </Btn>
                      )}
                      <Btn
                        variant="danger"
                        small
                        onClick={() => handleSuspend(u.userID, u.status)}
                      >
                        {u.status === "Suspended" ? "Reactivate" : "Suspend"}
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
              {filterBySearch(owners).length === 0 && (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: C.mid }}>No owners found.</Td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && tab === "minders" && (
        <Card>
          <table className="users-page__table">
            <thead>
              <tr>
                <Th>Minder</Th>
                <Th>Location</Th>
                <Th>Joined</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filterBySearch(minders).map((m) => (
                <tr key={m.userID}>
                  <Td>
                    <div className="users-page__person">
                      <Avatar name={`${m.firstName} ${m.lastName}`} size={34} color={C.blue} />
                      <div className="users-page__person-meta">
                        <div className="users-page__person-name">{m.firstName} {m.lastName}</div>
                        <div className="users-page__person-email">{m.email}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>📍 {m.city || "—"}</Td>
                  <Td>{formatDate(m.createdAt)}</Td>
                  <Td><StatusBadge status={m.status?.toLowerCase()} /></Td>
                  <Td>
                    <div className="users-page__actions">
                      <Btn variant="outline" small onClick={() => handleViewUser(m.userID)}>View</Btn>
                      {m.status === "Inactive" && (
                        <Btn
                          variant="success"
                          small
                          onClick={() => handleActivate(m.userID)}
                        >
                          Activate
                        </Btn>
                      )}
                      <Btn
                        variant="danger"
                        small
                        onClick={() => handleSuspend(m.userID, m.status)}
                      >
                        {m.status === "Suspended" ? "Reactivate" : "Suspend"}
                      </Btn>
                    </div>
                  </Td>
                </tr>
              ))}
              {filterBySearch(minders).length === 0 && (
                <tr><Td colSpan={5} style={{ textAlign: "center", color: C.mid }}>No minders found.</Td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && tab === "pending" && (
        <div>
          {pending.length > 0 && (
            <div className="users-page__notice">
              <span className="users-page__notice-icon">⚠️</span>
              <div className="users-page__notice-content">
                <strong className="users-page__notice-title">
                  {pending.length} minder{pending.length !== 1 ? "s" : ""} awaiting identity verification
                </strong>
                <p className="users-page__notice-text">
                  Profiles remain hidden from pet owners until verified. Review submitted documents below.
                </p>
              </div>
            </div>
          )}

          <Card>
            <table className="users-page__table">
              <thead>
                <tr>
                  <Th>Minder</Th>
                  <Th>Submitted</Th>
                  <Th>Experience</Th>
                  <Th>Verification Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {pending.map((v) => (
                  <tr key={v.sitterID}>
                    <Td>
                      <div className="users-page__person">
                        <Avatar name={`${v.firstName} ${v.lastName}`} size={34} color={C.yellow} />
                        <div className="users-page__person-meta">
                          <div className="users-page__person-name">{v.firstName} {v.lastName}</div>
                          <div className="users-page__person-email">{v.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{formatDate(v.submittedAt)}</Td>
                    <Td>{v.experienceYears} yr{v.experienceYears !== 1 ? "s" : ""}</Td>
                    <Td><StatusBadge status={v.verificationStatus?.toLowerCase()} /></Td>
                    <Td>
                      <div className="users-page__actions">
                        <Btn variant="success" small onClick={() => handleVerify(v.sitterID)}>Verify</Btn>
                        <Btn variant="danger" small onClick={() => handleReject(v.sitterID)}>Reject</Btn>
                        {v.documentURL && (
                          <Btn variant="outline" small onClick={() => window.open(v.documentURL, "_blank")}>View Docs</Btn>
                        )}
                      </div>
                    </Td>
                  </tr>
                ))}
                {pending.length === 0 && (
                  <tr><Td colSpan={5} style={{ textAlign: "center", color: C.mid }}>No pending verifications.</Td></tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}

      {selectedUser && (
        <div className="users-page__overlay" onClick={() => setSelectedUser(null)}>
          <div className="users-page__overlay-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="users-page__overlay-close" onClick={() => setSelectedUser(null)}>✕</button>

            <div className="users-page__overlay-header">
              <Avatar
                name={`${selectedUser.firstName} ${selectedUser.lastName}`}
                size={72}
                color={selectedUser.role === "minder" ? C.blue : C.orange}
              />
              <div className="users-page__overlay-header-text">
                <h2 className="users-page__overlay-name">{selectedUser.firstName} {selectedUser.lastName}</h2>
                <p className="users-page__overlay-email">{selectedUser.email}</p>
                <div className="users-page__overlay-badges">
                  <StatusBadge status={selectedUser.status?.toLowerCase()} />
                </div>
              </div>
            </div>

            <div className="users-page__overlay-grid">
              <div className="users-page__overlay-section">
                <h3 className="users-page__overlay-section-title">Profile Details</h3>
                <div className="users-page__overlay-list">
                  {[
                    ["Role", selectedUser.role === "minder" ? "Pet Minder" : "Pet Owner"],
                    ["City", selectedUser.city || "—"],
                    ["Postcode", selectedUser.postcode || "—"],
                    ["Phone", selectedUser.phoneNumber || "—"],
                    ["Joined", formatDate(selectedUser.createdAt)],
                  ].map(([k, v]) => (
                    <div key={k} className="users-page__overlay-row">
                      <span>{k}</span>
                      <strong>{v}</strong>
                    </div>
                  ))}
                </div>
              </div>

              <div className="users-page__overlay-section">
                <h3 className="users-page__overlay-section-title">Activity</h3>
                <div className="users-page__overlay-stats">
                  <div className="users-page__overlay-stat">
                    <span className="users-page__overlay-stat-label">Bookings</span>
                    <strong className="users-page__overlay-stat-value">
                      {selectedUser.recentBookings?.length ?? "—"}
                    </strong>
                  </div>
                  {selectedUser.role === "owner" && (
                    <div className="users-page__overlay-stat">
                      <span className="users-page__overlay-stat-label">Pets</span>
                      <strong className="users-page__overlay-stat-value">
                        {selectedUser.pets?.length ?? "—"}
                      </strong>
                    </div>
                  )}
                  {selectedUser.role === "minder" && (
                    <>
                      <div className="users-page__overlay-stat">
                        <span className="users-page__overlay-stat-label">Services</span>
                        <strong className="users-page__overlay-stat-value">
                          {selectedUser.services?.length ?? "—"}
                        </strong>
                      </div>
                      <div className="users-page__overlay-stat">
                        <span className="users-page__overlay-stat-label">Rating</span>
                        <strong className="users-page__overlay-stat-value">
                          {selectedUser.ratingAvg > 0 ? `⭐ ${selectedUser.ratingAvg}` : "—"}
                        </strong>
                      </div>
                    </>
                  )}
                </div>

                {selectedUser.role === "minder" && selectedUser.verification && (
                  <div style={{ marginTop: 12 }}>
                    <p style={{ fontSize: 12, color: C.mid, marginBottom: 4 }}>Verification</p>
                    <StatusBadge status={selectedUser.verification.status?.toLowerCase()} />
                  </div>
                )}
              </div>
            </div>

            <div className="users-page__overlay-actions">
              {selectedUser.status === "Inactive" && (
                <Btn
                  variant="success"
                  onClick={() => {
                    handleActivate(selectedUser.userID);
                    setSelectedUser(null);
                  }}
                >
                  Activate Account
                </Btn>
              )}
              <Btn
                variant="danger"
                onClick={() => {
                  handleSuspend(selectedUser.userID, selectedUser.status);
                  setSelectedUser(null);
                }}
              >
                {selectedUser.status === "Suspended" ? "Reactivate Account" : "Suspend Account"}
              </Btn>
              <Btn variant="outline" onClick={() => setSelectedUser(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
