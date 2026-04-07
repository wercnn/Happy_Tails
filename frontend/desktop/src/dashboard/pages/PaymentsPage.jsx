import { useState } from "react";
import { C } from "../constants.js";
import { Badge, StatusBadge } from "../components/badge/Badge.jsx";
import { Btn } from "../components/btn/Btn.jsx";
import { Card, Th, Td } from "../components/card/Card.jsx";
import { SectionHeader } from "../components/SectionHeader.jsx";

export default function PaymentsPage() {
  const [tab, setTab] = useState("transactions");

  const transactions = [
    { id: "#PAY-441", booking: "#HT-8798", payer: "Anna B.", amount: "£105.00", fee: "£5.25", net: "£99.75", date: "2 Apr", status: "completed", escrow: false },
    { id: "#PAY-440", booking: "#HT-8801", payer: "Sarah J.", amount: "£23.10", fee: "£1.16", net: "£21.94", date: "9 Apr", status: "pending", escrow: true },
    { id: "#PAY-439", booking: "#HT-8802", payer: "Mike T.", amount: "£48.00", fee: "£2.40", net: "£45.60", date: "12 Apr", status: "pending", escrow: true },
    { id: "#PAY-438", booking: "#HT-8797", payer: "Chris L.", amount: "£15.75", fee: "£0.00", net: "£0.00", date: "28 Mar", status: "refunded", escrow: false },
  ];

  const refunds = [
    { id: "#REF-119", booking: "#HT-8797", owner: "Sarah J.", minder: "Tom H.", amount: "£15.75", reason: "Minder no-show", submitted: "28 Mar", status: "open" },
    { id: "#REF-118", booking: "#HT-8782", owner: "Rachel K.", minder: "James W.", amount: "£34.00", reason: "Service not as described", submitted: "20 Mar", status: "resolved" },
    { id: "#REF-117", booking: "#HT-8770", owner: "Mike T.", minder: "Priya P.", amount: "£48.00", reason: "Booking cancelled", submitted: "15 Mar", status: "escalated" },
  ];

  return (
    <div>
      <SectionHeader title="Payments & Refunds" subtitle="Review transactions, escrow activity and refund requests." />

      {/* Revenue stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          ["💷", "Monthly Revenue", "£18,340", C.green],
          ["🔒", "In Escrow", "£4,820", C.blue],
          ["↩️", "Refunds Issued", "£218", C.red],
          ["📈", "Platform Fees", "£917", C.orange],
        ].map(([icon, lbl, val, col]) => (
          <Card key={lbl} style={{ padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.mid, textTransform: "uppercase", letterSpacing: 0.4 }}>{lbl}</span>
            </div>
            <p style={{ margin: 0, fontWeight: 800, color: col, fontSize: 22 }}>{val}</p>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, background: C.light, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[
          ["transactions", "Transactions"],
          ["refunds", "Refund Requests"],
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
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "transactions" && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Payment ID</Th>
                <Th>Booking</Th>
                <Th>Payer</Th>
                <Th>Amount</Th>
                <Th>Platform Fee</Th>
                <Th>Net Payout</Th>
                <Th>Date</Th>
                <Th>Escrow</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{t.id}</span>
                  </Td>
                  <Td>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>{t.booking}</span>
                  </Td>
                  <Td>{t.payer}</Td>
                  <Td>
                    <strong>{t.amount}</strong>
                  </Td>
                  <Td style={{ color: C.mid }}>{t.fee}</Td>
                  <Td>
                    <strong style={{ color: C.green }}>{t.net}</strong>
                  </Td>
                  <Td style={{ fontSize: 12 }}>{t.date}</Td>
                  <Td>
                    {t.escrow ? (
                      <Badge color={C.blue} bg={C.blueLight}>
                        🔒 Held
                      </Badge>
                    ) : (
                      <Badge color={C.green} bg={C.greenLight}>
                        Released
                      </Badge>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={t.status} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {tab === "refunds" && (
        <Card>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <Th>Refund ID</Th>
                <Th>Booking</Th>
                <Th>Owner</Th>
                <Th>Minder</Th>
                <Th>Amount</Th>
                <Th>Reason</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id}>
                  <Td>
                    <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{r.id}</span>
                  </Td>
                  <Td>
                    <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>{r.booking}</span>
                  </Td>
                  <Td>{r.owner}</Td>
                  <Td>{r.minder}</Td>
                  <Td>
                    <strong>{r.amount}</strong>
                  </Td>
                  <Td style={{ fontSize: 12 }}>{r.reason}</Td>
                  <Td style={{ fontSize: 12 }}>{r.submitted}</Td>
                  <Td>
                    <StatusBadge status={r.status} />
                  </Td>
                  <Td>
                    {r.status === "open" ? (
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="success" small>
                          Approve Refund
                        </Btn>
                        <Btn variant="danger" small>
                          Deny Refund
                        </Btn>
                        <Btn variant="outline" small>
                          Escalate
                        </Btn>
                      </div>
                    ) : (
                      <Btn variant="outline" small>
                        View
                      </Btn>
                    )}
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

