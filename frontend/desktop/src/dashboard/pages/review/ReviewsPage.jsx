import { C } from "../../constants.js";
import { StatusBadge } from "../../components/badge/Badge.jsx";
import { Btn } from "../../components/btn/Btn.jsx";
import { Card, Th, Td } from "../../components/card/Card.jsx";
import { SectionHeader } from "../../components/sectionHeader/SectionHeader.jsx";

export default function ReviewsPage() {
  const reviews = [
    { id: "#RV-291", owner: "Sarah J.", minder: "James W.", rating: 5, text: "James is absolutely fantastic with Buddy. So reliable!", booking: "#HT-8798", date: "3 Apr", status: "approved" },
    { id: "#RV-290", owner: "Mike T.", minder: "Priya P.", rating: 4, text: "Great service, good communication throughout.", booking: "#HT-8780", date: "1 Apr", status: "approved" },
    { id: "#RV-281", owner: "Chris L.", minder: "Tom H.", rating: 1, text: "This minder is a complete fraud and lied about [abusive]", booking: "#HT-8797", date: "29 Mar", status: "flagged" },
    { id: "#RV-285", owner: "Anna B.", minder: "James W.", rating: 5, text: "Buddy was so happy when I came back. Would absolutely book again.", booking: "#HT-8770", date: "25 Mar", status: "approved" },
  ];

  return (
    <div>
      <SectionHeader title="Reviews & Ratings" subtitle="Moderate platform reviews and manage flagged content (RQ17, 50, 51)" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          ["⭐", "Avg. Rating", "4.7", C.yellow],
          ["✅", "Approved", "284", C.green],
          ["🚩", "Flagged", "7", C.red],
          ["⏳", "Pending", "12", C.orange],
        ].map(([icon, lbl, val, col]) => (
          <Card key={lbl} style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: col + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              {icon}
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: C.mid, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4 }}>{lbl}</p>
              <p style={{ margin: "2px 0 0", fontWeight: 800, color: col, fontSize: 20 }}>{val}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <Th>ID</Th>
              <Th>Owner</Th>
              <Th>Minder</Th>
              <Th>Rating</Th>
              <Th>Review</Th>
              <Th>Booking</Th>
              <Th>Date</Th>
              <Th>Status</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} style={{ background: r.status === "flagged" ? "#FFFBF0" : "transparent" }}>
                <Td>
                  <span style={{ fontWeight: 800, color: C.orange, fontSize: 12 }}>{r.id}</span>
                </Td>
                <Td>{r.owner}</Td>
                <Td>{r.minder}</Td>
                <Td>{"⭐".repeat(r.rating)}</Td>
                <Td style={{ maxWidth: 200, fontSize: 12 }}>
                  <span
                    style={{
                      display: "block",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      color: r.status === "flagged" ? C.red : C.dark,
                    }}
                  >
                    {r.text}
                  </span>
                </Td>
                <Td>
                  <span style={{ color: C.blue, fontWeight: 700, fontSize: 12 }}>{r.booking}</span>
                </Td>
                <Td style={{ fontSize: 12 }}>{r.date}</Td>
                <Td>
                  <StatusBadge status={r.status} />
                </Td>
                <Td>
                  {r.status === "flagged" ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="success" small>
                        Approve
                      </Btn>
                      <Btn variant="danger" small>
                        Remove
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
    </div>
  );
}

