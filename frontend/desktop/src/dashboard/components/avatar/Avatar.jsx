import { C } from "../../constants.js";
import "./Avatar.css";

export const Avatar = ({ name, icon, size = 36, color = C.orange }) => {
  const avatarStyle = {
    "--avatar-size": `${size}px`,
    "--avatar-bg": `${color}22`,
    "--avatar-color": color,
    "--avatar-font-size": `${icon ? size * 0.5 : size * 0.38}px`,
  };

  return (
    <div className="avatar" style={avatarStyle}>
      {icon || name?.charAt(0)}
    </div>
  );
};