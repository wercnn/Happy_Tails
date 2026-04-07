import { C } from "../../constants.js";
import "./SectionHeader.css";

export const SectionHeader = ({ title, subtitle, action }) => {
  const sectionHeaderStyle = {
    "--section-header-title-color": C.navy,
    "--section-header-subtitle-color": C.mid,
  };

  return (
    <div className="section-header" style={sectionHeaderStyle}>
      <div className="section-header__content">
        <h2 className="section-header__title">{title}</h2>
        {subtitle && (
          <p className="section-header__subtitle">{subtitle}</p>
        )}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  );
};