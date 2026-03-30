import { C } from "../constants.js";

export const Avatar = ({ name, icon, size = 36, color = C.orange }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: color + "22",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: icon ? size * 0.5 : size * 0.38,
      fontWeight: 800,
      color,
      flexShrink: 0,
    }}
  >
    {icon || name?.charAt(0)}
  </div>
);

