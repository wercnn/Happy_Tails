import { C } from "../constants.js";
import { Card } from "./card/Card.jsx";

export const StatCard = ({ icon, label, value, delta, deltaUp, color }) => (
  <Card style={{ padding: "18px 20px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 700,
            color: C.mid,
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </p>
        <p style={{ margin: "6px 0 0", fontSize: 26, fontWeight: 800, color: C.navy }}>{value}</p>
        {delta && (
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700, color: deltaUp ? C.green : C.red }}>
            {deltaUp ? "↑" : "↓"} {delta} this month
          </p>
        )}
      </div>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: (color || C.orange) + "18",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 22,
        }}
      >
        {icon}
      </div>
    </div>
  </Card>
);

