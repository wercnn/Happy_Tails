import { useState } from "react";
import LoginPage from "./login/LoginPage";
import Dashboard from "./dashboard/Dashboard.jsx";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <Dashboard user={user} onLogout={() => setUser(null)} />;
}
