import "./RoleSelect.css";
import { useNavigate } from "react-router-dom";

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

export default function RoleSelect() {
  const navigate = useNavigate();

  const handleRoleSelect = (roleId) => {
    localStorage.setItem("userRole", roleId);

    if (roleId === "owner") {
      navigate("/ownerReg");
    } else if (roleId === "minder") {
      navigate("/minderReg");
    }
  };

  return (
    <div className="welcome-stage">
      <div className="welcome-frame">
        <main className="role-screen">
          <header className="role-header">
            <h1 className="role-brand-text">Happy Tails</h1>
          </header>

          <section className="role-body">
            <h2 className="role-prompt">I am a...</h2>

            <div className="role-cards">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className="role-card"
                  onClick={() => handleRoleSelect(role.id)}
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

          <footer className="role-footer">
            <button className="role-back-button" onClick={() => navigate("/")}>
              ← Back
            </button>
          </footer>
        </main>
      </div>
    </div>
  );
}