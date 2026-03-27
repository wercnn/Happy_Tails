import { useState } from "react";
import "./RoleSelect.css";

const roles = [
  {
    id: "owner",
    emoji: "🐶",
    title: "Pet Owner",
    description: "Find trusted minders for your furry family",
  },
  {
    id: "minder",
    emoji: "🏠",
    title: "Pet Minder",
    description: "Offer your services and grow your business",
  },
];

export default function HappyTailsRoleSelect() {
  const [selected, setSelected] = useState(null);

  return (
    <div className="mobile-stage">
      <div className="mobile-frame">
        <main className="role-screen">
          {/* Header */}
          <header className="role-header">
            <h1 className="role-brand-text">Happy Tails</h1>
          </header>

          {/* Body */}
          <section className="role-body">
            <h2 className="role-prompt">I am a...</h2>

            <div className="role-cards">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`role-card${selected === role.id ? " role-card--selected" : ""}`}
                  onClick={() => setSelected(role.id)}
                >
                  <span className="role-card-emoji" aria-hidden="true">
                    {role.emoji}
                  </span>
                  <div className="role-card-text">
                    <span className="role-card-title">{role.title}</span>
                    <span className="role-card-desc">{role.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="role-footer">
            <button className="role-back-button" onClick={() => alert("Navigate Back")}>
              ← Back
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}