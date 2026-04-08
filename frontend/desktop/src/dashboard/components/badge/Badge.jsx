import { C } from "../../constants.js";
import "./Badge.css";

export const Badge = ({ color, bg, children, style }) => {
  const badgeStyle = {
    "--badge-bg": bg,
    "--badge-color": color,
    ...style,
  };

  return (
    <span className="badge" style={badgeStyle}>
      {children}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const map = {
    confirmed: [C.green, C.greenLight],
    completed: [C.blue, C.blueLight],
    pending: [C.orange, C.orangeLight],
    cancelled: [C.red, C.redLight],
    active: [C.green, C.greenLight],
    inactive: [C.mid, C.light],
    verified: [C.green, C.greenLight],
    unverified: [C.yellow, C.yellowLight],
    open: [C.orange, C.orangeLight],
    resolved: [C.green, C.greenLight],
    escalated: [C.red, C.redLight],
    approved: [C.green, C.greenLight],
    flagged: [C.red, C.redLight],
  };

  const [col, bg] = map[status] || [C.mid, C.light];

  return (
    <Badge color={col} bg={bg}>
      {status}
    </Badge>
  );
};