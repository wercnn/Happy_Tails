import { C } from "../constants.js";

export const Btn = ({ children, variant = "primary", onClick, small, style }) => {
  const base = {
    border: "none",
    borderRadius: 8,
    fontWeight: 700,
    fontSize: small ? 11 : 13,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: 0.3,
    transition: "opacity 0.15s",
  };

  const variants = {
    primary: { background: C.orange, color: C.white, padding: small ? "6px 12px" : "10px 18px" },
    outline: { background: C.white, color: C.navy, padding: small ? "5px 11px" : "9px 17px", border: `1.5px solid ${C.border}` },
    danger: { background: C.redLight, color: C.red, padding: small ? "6px 12px" : "10px 18px" },
    success: { background: C.greenLight, color: C.green, padding: small ? "6px 12px" : "10px 18px" },
    ghost: { background: "transparent", color: C.orange, padding: small ? "6px 12px" : "10px 18px" },
  };

  return (
    <button style={{ ...base, ...variants[variant], ...style }} onClick={onClick}>
      {children}
    </button>
  );
};

