import { C } from "../constants.js";

export const SectionHeader = ({ title, subtitle, action }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 20,
    }}
  >
    <div>
      <h2 style={{ margin: 0, color: C.navy, fontSize: 20, fontWeight: 800 }}>{title}</h2>
      {subtitle && <p style={{ margin: "4px 0 0", color: C.mid, fontSize: 13 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

