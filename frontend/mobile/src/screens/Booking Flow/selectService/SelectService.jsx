import { useState } from "react";
import "./SelectService.css";

const SERVICES = [
  { id: 1, emoji: "🚶", name: "Dog Walking (30 min)", price: "£15",      unit: "" },
  { id: 2, emoji: "🚶", name: "Dog Walking (60 min)", price: "£22",      unit: "" },
  { id: 3, emoji: "🏠", name: "Overnight Boarding",   price: "£35",      unit: "/night" },
];

export default function HappyTailsSelectService() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <div className="ss-screen">

          {/* Header */}
          <header className="ss-header">
            <button className="ss-back" onClick={() => alert("Go back")}>←</button>
            <h1 className="ss-title">Select Service</h1>
          </header>

          {/* Body */}
          <div className="ss-scroll">
            <div className="ss-body">

              <p className="ss-subtitle">
                Choose a service from <strong>James Walker</strong>
              </p>

              <div className="ss-list">
                {SERVICES.map((svc) => (
                  <button
                    key={svc.id}
                    className={`ss-card${selected === svc.id ? " ss-card--selected" : ""}`}
                    onClick={() => setSelected(svc.id)}
                  >
                    <span className="ss-card-emoji">{svc.emoji}</span>
                    <div className="ss-card-info">
                      <span className="ss-card-name">{svc.name}</span>
                      <span className="ss-card-price">{svc.price}{svc.unit}</span>
                    </div>
                    <span className={`ss-radio${selected === svc.id ? " ss-radio--active" : ""}`} />
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* Footer */}
          <div className="ss-footer">
            <button
              className={`ss-continue-btn${!selected ? " ss-continue-btn--disabled" : ""}`}
              onClick={() => selected ? alert("Continuing to booking…") : null}
              disabled={!selected}
            >
              CONTINUE →
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}