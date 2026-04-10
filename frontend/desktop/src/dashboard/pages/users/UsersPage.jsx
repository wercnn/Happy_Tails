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

export default function UsersPage({ user }) {
  // ✅ fallback user (VERY IMPORTANT)
  const safeUser = user || {
    userID: "u-support-001",
    role: "support",
  };

  function authHeaders() {
    return {
      "Content-Type": "application/json",
      "X-User-Id": safeUser.userID,
      "X-User-Role": safeUser.role,
    };
  }

  const [tab, setTab] = useState("owners");
  const [owners, setOwners] = useState([]);
  const [minders, setMinders] = useState([]);
  const [pending, setPending] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const tabs = [
    ["owners", "Pet Owners"],
    ["minders", "Pet Minders"],
    ["pending", "Pending Verification"],
  ];

  useEffect(() => {
    setSelectedUser(null);

    if (tab === "owners") fetchOwners();
    else if (tab === "minders") fetchMinders();
    else if (tab === "pending") fetchPending();
  }, [tab]);

  async function fetchOwners() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/users?role=owner`, { headers: authHeaders() });
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
      const res = await fetch(`${API}/users?role=minder`, { headers: authHeaders() });
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
      const res = await fetch(`${API}/minders/pending`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPending(data);
    } catch (e) {
      setError(e.message || "Failed to load pending");
    } finally {
      setLoading(false);
    }
  }

  async function handleViewUser(userID) {
    try {
      const res = await fetch(`${API}/users/${userID}`, { headers: authHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelectedUser(data);
    } catch (e) {
      alert(e.message || "Failed to load user");
    }
  }

  async function handleSuspend(userID, currentStatus) {
    const newStatus = currentStatus === "Suspended" ? "Active" : "Suspended";

    try {
      const res = await fetch(`${API}/users/${userID}/suspend`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const update = (list) =>
        list.map((u) =>
          u.userID === userID ? { ...u, status: newStatus } : u
        );

      setOwners((prev) => update(prev));
      setMinders((prev) => update(prev));

      if (selectedUser?.userID === userID) {
        setSelectedUser({ ...selectedUser, status: newStatus });
      }
    } catch (e) {
      alert(e.message || "Failed to update status");
    }
  }

  async function handleVerify(sitterID) {
    try {
      await fetch(`${API}/minders/${sitterID}/verify`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      setPending((prev) => prev.filter((m) => m.sitterID !== sitterID));
    } catch {
      alert("Failed to verify");
    }
  }

  async function handleReject(sitterID) {
    try {
      await fetch(`${API}/minders/${sitterID}/reject`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      setPending((prev) => prev.filter((m) => m.sitterID !== sitterID));
    } catch {
      alert("Failed to reject");
    }
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB");
  }

  function filter(list) {
    if (!search) return list;
    return list.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
    );
  }

  return (
    <div className="users-page">
      <SectionHeader
        title="User Management"
        subtitle="Manage users"
        action={
          <Input
            placeholder="Search users..."
            icon="🔍"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        }
      />

      <div className="users-page__tabs">
        {tabs.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && tab === "owners" && (
        <Card>
          <table>
            <tbody>
              {filter(owners).map((u) => (
                <tr key={u.userID}>
                  <Td>{u.firstName} {u.lastName}</Td>
                  <Td>{u.city}</Td>
                  <Td>{formatDate(u.createdAt)}</Td>
                  <Td><StatusBadge status={u.status?.toLowerCase()} /></Td>
                  <Td>
                    <Btn onClick={() => handleViewUser(u.userID)}>View</Btn>
                    <Btn onClick={() => handleSuspend(u.userID, u.status)}>Toggle</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && tab === "minders" && (
        <Card>
          <table>
            <tbody>
              {filter(minders).map((m) => (
                <tr key={m.userID}>
                  <Td>{m.firstName} {m.lastName}</Td>
                  <Td>{m.city}</Td>
                  <Td>{formatDate(m.createdAt)}</Td>
                  <Td><StatusBadge status={m.status?.toLowerCase()} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {!loading && tab === "pending" && (
        <Card>
          {pending.map((p) => (
            <div key={p.sitterID}>
              {p.firstName} {p.lastName}
              <Btn onClick={() => handleVerify(p.sitterID)}>✔</Btn>
              <Btn onClick={() => handleReject(p.sitterID)}>✖</Btn>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}