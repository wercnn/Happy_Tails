import { useState, useEffect } from "react";
import { C } from "../../constants.js";
import { Badge, StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";
import "./PaymentsPage.css";

const API = "http://localhost:3000/api";

export default function PaymentsPage({ user }) {
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

  function fmt(amount) {
    return `£${Number(amount || 0).toFixed(2)}`;
  }

  function formatDate(iso) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-GB");
  }

  const [tab, setTab] = useState("transactions");
  const [payments, setPayments] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);

  useEffect(() => {
    fetchPayments();
    fetchDisputes();
  }, []);

  async function fetchPayments() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/payments`, { headers: headers() });
      const data = await res.json();
      setPayments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDisputes() {
    try {
      const res = await fetch(`${API}/disputes`, { headers: headers() });
      const data = await res.json();
      setDisputes(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleRelease(id) {
    await fetch(`${API}/payments/${id}/release`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchPayments();
  }

  async function handleApproveRefund(paymentID, disputeID) {
    await fetch(`${API}/payments/${paymentID}/refund`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchPayments();
    fetchDisputes();
    setSelectedRefund(null);
  }

  async function handleDenyRefund(disputeID) {
    await fetch(`${API}/disputes/${disputeID}/resolve`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchDisputes();
    setSelectedRefund(null);
  }

  async function handleEscalate(disputeID) {
    await fetch(`${API}/disputes/${disputeID}/escalate`, {
      method: "PATCH",
      headers: headers(),
    });
    fetchDisputes();
    setSelectedRefund(null);
  }

  const refunds = disputes.filter((d) => d.isRefundRequested);

  return (
    <div className="payments-page">
      <SectionHeader title="Payments & Refunds" />

      <div className="payments-page__tabs">
        <button onClick={() => setTab("transactions")}>Transactions</button>
        <button onClick={() => setTab("refunds")}>Refunds</button>
      </div>

      {loading && <p>Loading...</p>}

      {tab === "transactions" && (
        <Card>
          <table>
            <tbody>
              {payments.map((p) => (
                <tr key={p.paymentID}>
                  <Td>{p.paymentID}</Td>
                  <Td>{p.bookingID}</Td>
                  <Td>{fmt(p.amount)}</Td>
                  <Td>{fmt(p.platformFee)}</Td>
                  <Td>{formatDate(p.paidAt)}</Td>
                  <Td>
                    <StatusBadge status={p.paymentStatus?.toLowerCase()} />
                  </Td>
                  <Td>
                    {p.escrowStatus === "Holding" && (
                      <Btn onClick={() => handleRelease(p.paymentID)}>
                        Release
                      </Btn>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "refunds" && (
        <Card>
          <table>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.disputeID}>
                  <Td>{r.disputeID}</Td>
                  <Td>{r.bookingID}</Td>
                  <Td>{fmt(r.paymentAmount)}</Td>
                  <Td>{r.reason}</Td>
                  <Td>
                    <StatusBadge status={r.status?.toLowerCase()} />
                  </Td>
                  <Td>
                    <Btn onClick={() => setSelectedRefund(r)}>View</Btn>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {selectedRefund && (
        <div onClick={() => setSelectedRefund(null)}>
          <div onClick={(e) => e.stopPropagation()}>
            <h3>{selectedRefund.disputeID}</h3>
            <p>{selectedRefund.reason}</p>

            <Btn onClick={() => handleApproveRefund(selectedRefund.paymentID, selectedRefund.disputeID)}>
              Approve
            </Btn>
            <Btn onClick={() => handleDenyRefund(selectedRefund.disputeID)}>
              Deny
            </Btn>
            <Btn onClick={() => handleEscalate(selectedRefund.disputeID)}>
              Escalate
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}