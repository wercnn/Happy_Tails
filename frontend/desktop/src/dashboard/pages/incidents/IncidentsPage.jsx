import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./IncidentsPage.css";

const API = "http://localhost:3000/api";

export default function IncidentsPage({ user }) {
  // ✅ SAFE USER
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

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB");
  }

  function formatType(type) {
    return type?.replace(/([A-Z])/g, " $1").trim() || "—";
  }

  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchIncidents();
  }, []);

  async function fetchIncidents() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/reports/incidents`, {
        headers: headers(),
      });
      const data = await res.json();
      setIncidents(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleEscalate(id) {
    await fetch(`${API}/reports/incidents/${id}/escalate`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchIncidents();
  }

  async function handleResolve(id) {
    await fetch(`${API}/reports/incidents/${id}/resolve`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchIncidents();
  }

  return (
    <div className="incidents-page">
      <SectionHeader title="Incidents" />

      {loading && <p>Loading...</p>}

      <Card>
        <table>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Type</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>

          <tbody>
            {incidents.map((i) => (
              <tr key={i.incidentID}>
                <Td>{i.incidentID}</Td>
                <Td>{formatType(i.incidentType)}</Td>
                <Td>
                  <StatusBadge status={i.status?.toLowerCase()} />
                </Td>
                <Td>
                  <Btn onClick={() => setSelected(i)}>View</Btn>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {selected && (
        <div onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>{selected.incidentID}</h3>
            <p>{selected.description}</p>

            <Btn onClick={() => handleEscalate(selected.incidentID)}>
              Escalate
            </Btn>
            <Btn onClick={() => handleResolve(selected.incidentID)}>
              Resolve
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}