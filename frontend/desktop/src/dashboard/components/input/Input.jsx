import { C } from "../../constants.js";
import "./Input.css";

export const Input = ({
  placeholder,
  style,
  icon,
  className = "",
  ...props
}) => {
  const inputStyle = {
    "--input-border": C.border,
    "--input-text": C.navy,
    "--input-bg": C.white,
    "--input-padding": icon ? "9px 12px 9px 34px" : "9px 12px",
    ...style,
  };

  return (
    <div className={`input-field ${className}`} style={inputStyle}>
      {icon && <span className="input-field__icon">{icon}</span>}
      <input
        className="input-field__control"
        placeholder={placeholder}
        {...props}
      />
    </div>
  );
};