import { C } from "../../constants.js";
import { Card } from "../card/Card.jsx";
import "./StatCard.css";

export const StatCard = ({ icon, label, value, delta, deltaUp, color }) => {
  const statCardStyle = {
    "--stat-card-label-color": C.mid,
    "--stat-card-value-color": C.navy,
    "--stat-card-delta-color": deltaUp ? C.green : C.red,
    "--stat-card-icon-bg": `${color || C.orange}18`,
  };

  return (
    <Card style={{ padding: "18px 20px" }}>
      <div className="stat-card" style={statCardStyle}>
        <div className="stat-card__content">
          <p className="stat-card__label">{label}</p>
          <p className="stat-card__value">{value}</p>

          {delta && (
            <p className="stat-card__delta">
              {deltaUp ? "↑" : "↓"} {delta} this month
            </p>
          )}
        </div>

        <div className="stat-card__icon">
          {icon}
        </div>
      </div>
    </Card>
  );
};