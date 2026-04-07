import { C } from "../../constants.js";
import "./Card.css";

export const Card = ({ children, style, className = "" }) => {
  const cardStyle = {
    "--card-bg": C.white,
    "--card-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <div className={`card ${className}`} style={cardStyle}>
      {children}
    </div>
  );
};

export const Th = ({ children, style, className = "" }) => {
  const thStyle = {
    "--th-color": C.mid,
    "--th-bg": C.light,
    "--th-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <th className={`table-th ${className}`} style={thStyle}>
      {children}
    </th>
  );
};

export const Td = ({ children, style, className = "" }) => {
  const tdStyle = {
    "--td-color": C.dark,
    "--td-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <td className={`table-td ${className}`} style={tdStyle}>
      {children}
    </td>
  );
};