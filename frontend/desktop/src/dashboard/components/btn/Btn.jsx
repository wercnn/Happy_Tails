import { C } from "../../constants.js";
import "./Btn.css";

export const Btn = ({
  children,
  variant = "primary",
  onClick,
  small,
  style,
}) => {
  const buttonStyle = {
    "--btn-font-size": small ? "11px" : "13px",
    "--btn-padding":
      variant === "outline"
        ? small
          ? "5px 11px"
          : "9px 17px"
        : small
        ? "6px 12px"
        : "10px 18px",
    "--btn-bg":
      {
        primary: C.orange,
        outline: C.white,
        danger: C.redLight,
        success: C.greenLight,
        ghost: "transparent",
      }[variant] || C.orange,
    "--btn-color":
      {
        primary: C.white,
        outline: C.navy,
        danger: C.red,
        success: C.green,
        ghost: C.orange,
      }[variant] || C.white,
    "--btn-border":
      variant === "outline" ? `1.5px solid ${C.border}` : "none",
    ...style,
  };

  return (
    <button
      className={`btn btn--${variant} ${small ? "btn--small" : ""}`}
      style={buttonStyle}
      onClick={onClick}
    >
      {children}
    </button>
  );
};