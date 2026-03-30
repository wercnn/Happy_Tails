import { C } from "../constants.js";

export const Input = ({ placeholder, style, icon }) => (
  <div style={{ position: "relative", ...style }}>
    {icon && (
      <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", fontSize: 15 }}>
        {icon}
      </span>
    )}
    <input
      placeholder={placeholder}
      style={{
        width: "100%",
        border: `1.5px solid ${C.border}`,
        borderRadius: 8,
        padding: icon ? "9px 12px 9px 34px" : "9px 12px",
        fontSize: 13,
        color: C.navy,
        background: C.white,
        boxSizing: "border-box",
        fontFamily: "inherit",
        outline: "none",
      }}
    />
  </div>
);

