import { C } from "../../constants.js";
import "./Card.css";

export const Card = ({ children, style }) => {
  const cardStyle = {
    "--card-bg": C.white,
    "--card-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <div className="card" style={cardStyle}>
      {children}
    </div>
  );
};

export const Th = ({ children, style }) => {
  const thStyle = {
    "--th-color": C.mid,
    "--th-bg": C.light,
    "--th-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <th className="table-th" style={thStyle}>
      {children}
    </th>
  );
};

export const Td = ({ children, style }) => {
  const tdStyle = {
    "--td-color": C.dark,
    "--td-border": `1px solid ${C.border}`,
    ...style,
  };

  return (
    <td className="table-td" style={tdStyle}>
      {children}
    </td>
  );
};