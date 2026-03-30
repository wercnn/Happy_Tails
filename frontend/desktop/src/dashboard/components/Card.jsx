import { C } from "../constants.js";

export const Card = ({ children, style }) => (
  <div
    style={{
      background: C.white,
      borderRadius: 14,
      border: `1px solid ${C.border}`,
      boxShadow: "0 2px 12px rgba(26,42,74,0.06)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Th = ({ children, style }) => (
  <th
    style={{
      padding: "10px 14px",
      fontWeight: 700,
      fontSize: 11,
      color: C.mid,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      textAlign: "left",
      background: C.light,
      borderBottom: `1px solid ${C.border}`,
      ...style,
    }}
  >
    {children}
  </th>
);

export const Td = ({ children, style }) => (
  <td
    style={{
      padding: "12px 14px",
      fontSize: 13,
      color: C.dark,
      borderBottom: `1px solid ${C.border}`,
      verticalAlign: "middle",
      ...style,
    }}
  >
    {children}
  </td>
);

